#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const suiteRoot = path.join(root, "evals", "geospatial-pilot");
const outputRoot = path.join(root, "dist", "geospatial-benchmark");
const skillSource = path.join(root, "plugins", "geospatial", "skills", "geospatial");
const toolkitPlugins = ["plinth", "quire", "ponytail"];
const conditions = {
  no_gpt_tooling: { core: false, geospatial: false },
  core_tooling: { core: true, geospatial: false },
  geospatial_tooling: { core: true, geospatial: true }
};
const strata = ["pilot", "paper_challenge"];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 100 * 1024 * 1024,
    ...options
  });
  if (result.error) throw result.error;
  return result;
}

function successful(command, args, options) {
  const result = run(command, args, options);
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  return result.stdout.trim();
}

function codexCommand() {
  if (process.platform !== "win32") return { command: "codex", prefix: [] };
  const paths = successful("where.exe", ["codex"]).split(/\r?\n/).filter(Boolean);
  const powerShellShim = paths.filter((file) => /\.cmd$/i.test(file))
    .map((file) => file.replace(/\.cmd$/i, ".ps1"))
    .find((file) => fs.existsSync(file));
  if (powerShellShim) {
    return { command: "powershell.exe", prefix: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", powerShellShim] };
  }
  const executable = paths.find((file) => /\.(?:exe|com)$/i.test(file));
  if (executable) return { command: executable, prefix: [] };
  throw new Error("The Codex command could not be resolved.");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadSuite() {
  const config = readJson(path.join(suiteRoot, "config.json"));
  const cases = readJson(path.join(suiteRoot, "cases.json"));
  const paperReferences = fs.readFileSync(path.join(suiteRoot, "paper-reference-dossiers.md"), "utf8");
  if (config.schemaVersion !== 1 || !config.seed || !config.candidate?.model || !config.candidate?.reasoningEffort) {
    throw new Error("The pilot configuration is invalid.");
  }
  if (!Number.isInteger(config.candidate.repetitions) || config.candidate.repetitions < 1) {
    throw new Error("candidate.repetitions must be a positive integer.");
  }
  if (!Array.isArray(cases) || !cases.length) throw new Error("The pilot case list is empty.");
  const ids = new Set();
  for (const item of cases) {
    if (!item.id || ids.has(item.id) || !strata.includes(item.stratum) || !item.title || !item.prompt || !Array.isArray(item.criteria) || !item.criteria.length) {
      throw new Error(`The pilot case is invalid: ${item.id || "unnamed"}.`);
    }
    if (!Array.isArray(item.criticalFailures) || !item.criticalFailures.length) {
      throw new Error(`The benchmark case has no critical failures: ${item.id}.`);
    }
    if (item.stratum === "paper_challenge" && (!item.paperReferenceId || !paperReferences.includes(`## \`${item.paperReferenceId}\``))) {
      throw new Error(`The paper reference dossier is missing: ${item.id}.`);
    }
    const criterionIds = new Set();
    for (const criterion of item.criteria) {
      if (!criterion.id || criterionIds.has(criterion.id) || !criterion.description) {
        throw new Error(`A rubric criterion is invalid: ${item.id}.`);
      }
      criterionIds.add(criterion.id);
    }
    ids.add(item.id);
  }
  return { config, cases };
}

function stableKey(seed, value) {
  return crypto.createHash("sha256").update(`${seed}:${value}`).digest("hex");
}

function fileSha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function schedule(config, cases) {
  const runs = [];
  for (const item of cases) {
    for (const condition of Object.keys(conditions)) {
      for (let repetition = 1; repetition <= config.candidate.repetitions; repetition += 1) {
        const id = `${item.id}__${condition}__r${repetition}`;
        runs.push({ id, caseId: item.id, condition, repetition });
      }
    }
  }
  return runs.sort((a, b) => stableKey(config.seed, a.id).localeCompare(stableKey(config.seed, b.id)));
}

function pluginOverrides(condition) {
  const enabled = conditions[condition].core;
  return [...toolkitPlugins, "geospatial"].flatMap((name) => [
    "-c",
    `plugins.\"${name}@gpt-tooling\".enabled=${name === "geospatial" ? false : enabled}`
  ]);
}

function prepareWorkspace(condition) {
  const workspace = path.join(outputRoot, "workspaces", condition);
  fs.rmSync(workspace, { recursive: true, force: true });
  fs.mkdirSync(workspace, { recursive: true });
  if (conditions[condition].geospatial) {
    fs.cpSync(skillSource, path.join(workspace, ".agents", "skills", "geospatial"), { recursive: true });
  }
  return workspace;
}

function parseTrace(text) {
  const events = text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch { throw new Error(`Invalid JSONL at line ${index + 1}.`); }
  });
  const completed = [...events].reverse().find((event) => event.type === "turn.completed");
  const usage = completed?.usage || {};
  const tools = {};
  const errors = [];
  for (const event of events) {
    if (event.type === "item.completed" && event.item?.type) {
      const type = event.item.type;
      if (["command_execution", "mcp_tool_call", "web_search", "file_change"].includes(type)) {
        tools[type] = (tools[type] || 0) + 1;
      }
    }
    if (event.type === "error" || event.type === "turn.failed" || event.item?.status === "failed") errors.push(event);
  }
  return {
    eventCount: events.length,
    usage: {
      inputTokens: usage.input_tokens || 0,
      cachedInputTokens: usage.cached_input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      reasoningOutputTokens: usage.reasoning_output_tokens || 0
    },
    tools,
    errorCount: errors.length,
    completed: Boolean(completed)
  };
}

function provenance(config, cases) {
  return {
    createdAt: new Date().toISOString(),
    gitCommit: successful("git", ["rev-parse", "HEAD"]),
    codexVersion: (() => {
      const cli = codexCommand();
      return successful(cli.command, [...cli.prefix, "--version"]);
    })(),
    configSha256: fileSha256(path.join(suiteRoot, "config.json")),
    casesSha256: fileSha256(path.join(suiteRoot, "cases.json")),
    paperReferencesSha256: fileSha256(path.join(suiteRoot, "paper-reference-dossiers.md")),
    caseCount: cases.length,
    candidateModel: config.candidate.model,
    reasoningEffort: config.candidate.reasoningEffort
  };
}

function runCandidates() {
  const { config, cases } = loadSuite();
  if (successful("git", ["status", "--porcelain"])) throw new Error("Candidate runs require a clean worktree.");
  const cli = codexCommand();
  const workspaces = Object.fromEntries(Object.keys(conditions).map((name) => [name, prepareWorkspace(name)]));
  const runsRoot = path.join(outputRoot, "runs");
  fs.mkdirSync(runsRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, "provenance.json"), `${JSON.stringify(provenance(config, cases), null, 2)}\n`);

  for (const planned of schedule(config, cases)) {
    const directory = path.join(runsRoot, planned.id);
    const recordPath = path.join(directory, "record.json");
    if (fs.existsSync(recordPath)) {
      process.stdout.write(`SKIP ${planned.id}\n`);
      continue;
    }
    fs.mkdirSync(directory, { recursive: true });
    const item = cases.find((candidate) => candidate.id === planned.caseId);
    const answerPath = path.join(directory, "answer.md");
    const args = [
      ...cli.prefix,
      ...pluginOverrides(planned.condition),
      "exec",
      "--json",
      "--ephemeral",
      "--skip-git-repo-check",
      "--sandbox", "read-only",
      "--model", config.candidate.model,
      "--config", `model_reasoning_effort=\"${config.candidate.reasoningEffort}\"`,
      "--cd", workspaces[planned.condition],
      "--output-last-message", answerPath,
      item.prompt
    ];
    const startedAt = new Date();
    const started = process.hrtime.bigint();
    const result = run(cli.command, args, { cwd: workspaces[planned.condition], timeout: config.candidate.timeoutMs });
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    fs.writeFileSync(path.join(directory, "trace.jsonl"), result.stdout || "", "utf8");
    fs.writeFileSync(path.join(directory, "stderr.txt"), result.stderr || "", "utf8");
    let trace;
    try { trace = parseTrace(result.stdout || ""); }
    catch (error) { trace = { parseError: error.message, completed: false }; }
    const protocolViolation = ["command_execution", "mcp_tool_call", "web_search", "file_change"]
      .some((type) => trace.tools?.[type]);
    const record = {
      ...planned,
      title: item.title,
      stratum: item.stratum,
      startedAt: startedAt.toISOString(),
      durationMs,
      exitCode: result.status,
      timedOut: result.error?.code === "ETIMEDOUT",
      trace,
      protocolViolation
    };
    fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    process.stdout.write(`${result.status === 0 && trace.completed && !protocolViolation ? "DONE" : "FAIL"} ${planned.id}\n`);
    if (result.status !== 0 || !trace.completed || protocolViolation) {
      throw new Error(`Candidate run failed or violated the no-tools protocol: ${planned.id}. Resume after inspecting ${directory}.`);
    }
  }
}

function doctor() {
  const { config, cases } = loadSuite();
  const cli = codexCommand();
  const version = successful(cli.command, [...cli.prefix, "--version"]);
  if (!fs.existsSync(path.join(skillSource, "SKILL.md"))) throw new Error("The geospatial skill source is missing.");
  for (const [condition, definition] of Object.entries(conditions)) {
    const raw = successful(cli.command, [...cli.prefix, ...pluginOverrides(condition), "plugin", "list", "--available", "--json"]);
    const installed = JSON.parse(raw).installed || [];
    for (const name of toolkitPlugins) {
      const plugin = installed.find((entry) => entry.name === name && entry.marketplaceName === "gpt-tooling");
      if (!plugin) throw new Error(`${name}@gpt-tooling is not installed.`);
      if (Boolean(plugin.enabled) !== definition.core) {
        throw new Error(`${condition} set ${plugin.pluginId} enabled=${JSON.stringify(plugin.enabled)}; expected ${definition.core}.`);
      }
    }
    process.stdout.write(`OK ${condition}\n`);
  }
  const counts = Object.fromEntries(strata.map((stratum) => [stratum, cases.filter((item) => item.stratum === stratum).length]));
  process.stdout.write(`${version}; ${cases.length} cases (${counts.pilot} pilot, ${counts.paper_challenge} paper); ${schedule(config, cases).length} candidate runs.\n`);
}

function plan() {
  const { config, cases } = loadSuite();
  const runs = schedule(config, cases);
  for (const [index, item] of runs.entries()) process.stdout.write(`${String(index + 1).padStart(2, "0")} ${item.id}\n`);
  process.stdout.write(`${runs.length} candidate runs. No model calls were made.\n`);
}

function selfTest() {
  const { config, cases } = loadSuite();
  const runs = schedule(config, cases);
  const expected = cases.length * Object.keys(conditions).length * config.candidate.repetitions;
  if (runs.length !== expected || new Set(runs.map((item) => item.id)).size !== expected) throw new Error("The candidate schedule is invalid.");
  const fixture = [
    JSON.stringify({ type: "item.completed", item: { type: "command_execution", status: "completed" } }),
    JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, cached_input_tokens: 4, output_tokens: 3, reasoning_output_tokens: 2 } })
  ].join("\n");
  const parsed = parseTrace(fixture);
  if (!parsed.completed || parsed.usage.inputTokens !== 10 || parsed.tools.command_execution !== 1 || parsed.errorCount !== 0) {
    throw new Error("The trace parser rejected a known-good fixture.");
  }
  const disabled = pluginOverrides("no_gpt_tooling").join(" ");
  const full = pluginOverrides("geospatial_tooling").join(" ");
  if (!disabled.includes('plinth@gpt-tooling".enabled=false') || !full.includes('plinth@gpt-tooling".enabled=true')) {
    throw new Error("The condition overrides are invalid.");
  }
  process.stdout.write(`The geospatial benchmark checks passed (${expected} candidate runs planned).\n`);
}

const command = process.argv[2];
if (command === "test" && process.argv.length === 3) selfTest();
else if (command === "doctor" && process.argv.length === 3) doctor();
else if (command === "plan" && process.argv.length === 3) plan();
else if (command === "run" && process.argv.length === 3) runCandidates();
else {
  process.stderr.write("Usage: node scripts/benchmark-geospatial.js test | doctor | plan | run\n");
  process.exitCode = 2;
}
