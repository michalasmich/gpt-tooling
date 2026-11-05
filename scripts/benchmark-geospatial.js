#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
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
  if (config.schemaVersion !== 1 || !config.seed || !config.candidate?.model || !config.candidate?.reasoningEffort) {
    throw new Error("The pilot configuration is invalid.");
  }
  if (!Number.isInteger(config.candidate.repetitions) || config.candidate.repetitions < 1) {
    throw new Error("candidate.repetitions must be a positive integer.");
  }
  const scoring = config.judge?.validityScoring;
  if (!config.judge?.model || !config.judge?.reasoningEffort || !Number.isInteger(config.judge?.pairwiseOrderRepetitions) || config.judge.pairwiseOrderRepetitions < 2 || config.judge.pairwiseOrderRepetitions % 2 !== 0 || scoring?.minimum !== 0 || scoring?.maximum !== 3 || scoring?.passMinimumPerCriterion !== 2 || scoring?.criticalFailureVeto !== true || config.judge?.paperAlignmentAffectsValidity !== false) {
    throw new Error("The validity scoring contract is invalid.");
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
    if (item.stratum === "paper_challenge" && !item.paperReferenceId) {
      throw new Error(`The paper reference identifier is missing: ${item.id}.`);
    }
    if (item.stratum === "paper_challenge" && /ChangeCLIP|ControlNet|STDENet|HPMoE|semantic flow/i.test(item.prompt)) {
      throw new Error(`The paper challenge leaks a reference mechanism: ${item.id}.`);
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

function loadPaperDossiers(cases) {
  const text = fs.readFileSync(path.join(suiteRoot, "paper-reference-dossiers.md"), "utf8");
  const dossiers = {};
  for (const item of cases.filter((candidate) => candidate.stratum === "paper_challenge")) {
    const heading = `## \`${item.paperReferenceId}\``;
    const start = text.indexOf(heading);
    if (start < 0) throw new Error(`The paper reference dossier is missing: ${item.id}.`);
    const next = text.indexOf("\n## `", start + heading.length);
    dossiers[item.paperReferenceId] = text.slice(start, next < 0 ? text.length : next).trim();
  }
  return dossiers;
}

function stableKey(seed, value) {
  return crypto.createHash("sha256").update(`${seed}:${value}`).digest("hex");
}

function fileSha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function directorySha256(directory) {
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) files.push(target);
    }
  };
  visit(directory);
  const hash = crypto.createHash("sha256");
  for (const file of files.sort()) hash.update(path.relative(directory, file)).update("\0").update(fs.readFileSync(file));
  return hash.digest("hex");
}

function installedToolkitProvenance() {
  const cli = codexCommand();
  const raw = successful(cli.command, [...cli.prefix, "plugin", "list", "--available", "--json"]);
  const installed = JSON.parse(raw).installed || [];
  return toolkitPlugins.map((name) => {
    const plugin = installed.find((entry) => entry.name === name && entry.marketplaceName === "gpt-tooling");
    if (!plugin?.source?.path || !fs.existsSync(plugin.source.path)) throw new Error(`The installed ${name} plugin has no readable local source.`);
    return { pluginId: plugin.pluginId, version: plugin.version, sourcePath: plugin.source.path, sourceSha256: directorySha256(plugin.source.path) };
  });
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
  if (conditions[condition].core) {
    for (const name of toolkitPlugins) {
      fs.cpSync(path.join(root, "plugins", name, "skills", name), path.join(workspace, ".agents", "skills", name), { recursive: true });
    }
  }
  if (conditions[condition].geospatial) {
    fs.cpSync(skillSource, path.join(workspace, ".agents", "skills", "geospatial"), { recursive: true });
  }
  if (conditions[condition].core || conditions[condition].geospatial) {
    fs.writeFileSync(path.join(workspace, "AGENTS.md"), [
      "# Benchmark skill access",
      "",
      "The enabled benchmark skills are frozen under `.agents/skills/`; these copies are authoritative for this run.",
      "Read each applicable SKILL.md completely and only the references needed for the problem.",
      "The only permitted tool call is one file read at a time with `Get-Content -Raw -LiteralPath .agents\\skills\\<enabled-skill>\\<file>.md`.",
      "Do not inspect any other local file and do not use any other tool."
    ].join("\n"), "utf8");
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
  const items = [];
  const errors = [];
  for (const event of events) {
    if (event.type === "item.completed" && event.item?.type) {
      const type = event.item.type;
      items.push(event.item);
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
    items,
    errorCount: errors.length,
    completed: Boolean(completed)
  };
}

function allowedSkillRead(item, workspace, condition) {
  if (item.type !== "command_execution" || item.status !== "completed" || item.exit_code !== 0 || typeof item.command !== "string") return false;
  let command = item.command.trim();
  const wrapper = command.match(/^(?:"[^"]*(?:powershell|pwsh)\.exe"|\S*(?:powershell|pwsh)\.exe)\s+(?:-NoProfile\s+)?-Command\s+(['"])([^\r\n]*)\1$/i);
  if (wrapper) command = wrapper[2];
  const match = command.match(/^Get-Content\s+-Raw\s+-LiteralPath\s+([A-Za-z0-9._:\\/\-]+)$/i);
  if (!match) return false;
  const rawPath = match[1];
  const resolved = path.resolve(workspace, rawPath);
  const enabled = [
    ...(conditions[condition].core ? toolkitPlugins : []),
    ...(conditions[condition].geospatial ? ["geospatial"] : [])
  ];
  return resolved.toLowerCase().endsWith(".md") && enabled.some((name) => {
    const skillRoot = path.resolve(workspace, ".agents", "skills", name);
    return resolved.startsWith(`${skillRoot}${path.sep}`);
  });
}

function candidateProtocolViolation(trace, condition, workspace) {
  return trace.items.some((item) => {
    if (["reasoning", "agent_message"].includes(item.type)) return false;
    return !allowedSkillRead(item, workspace, condition);
  });
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
    installedCoreTooling: installedToolkitProvenance(),
    caseCount: cases.length,
    candidateModel: config.candidate.model,
    reasoningEffort: config.candidate.reasoningEffort
  };
}

function candidateArtifacts(config, cases) {
  const provenancePath = path.join(outputRoot, "provenance.json");
  if (!fs.existsSync(provenancePath)) throw new Error("Run the candidate benchmark before judging it.");
  const candidateProvenance = readJson(provenancePath);
  const provenanceSha256 = fileSha256(provenancePath);
  if (candidateProvenance.configSha256 !== fileSha256(path.join(suiteRoot, "config.json")) || candidateProvenance.casesSha256 !== fileSha256(path.join(suiteRoot, "cases.json"))) {
    throw new Error("The candidate provenance does not match the current benchmark configuration and cases.");
  }
  return schedule(config, cases).map((planned) => {
    const directory = path.join(outputRoot, "runs", planned.id);
    const recordPath = path.join(directory, "record.json");
    const answerPath = path.join(directory, "answer.md");
    if (!fs.existsSync(recordPath) || !fs.existsSync(answerPath)) throw new Error(`The candidate output is incomplete: ${planned.id}.`);
    const record = readJson(recordPath);
    if (!eligibleCandidateRecord(record, provenanceSha256)) throw new Error(`The candidate output is not eligible: ${planned.id}.`);
    return {
      ...planned,
      blindId: stableKey(config.seed, planned.id).slice(0, 16),
      answerPath,
      answerSha256: fileSha256(answerPath),
      answer: fs.readFileSync(answerPath, "utf8").trim()
    };
  });
}

function eligibleCandidateRecord(record, provenanceSha256) {
  return record.exitCode === 0 && record.trace?.completed === true && record.protocolViolation === false && record.provenanceSha256 === provenanceSha256;
}

function comparisonSchedule(config, cases, candidates) {
  const pairs = [];
  const conditionNames = Object.keys(conditions);
  for (const item of cases) {
    for (let repetition = 1; repetition <= config.candidate.repetitions; repetition += 1) {
      for (let left = 0; left < conditionNames.length; left += 1) {
        for (let right = left + 1; right < conditionNames.length; right += 1) {
          const first = candidates.find((entry) => entry.caseId === item.id && entry.repetition === repetition && entry.condition === conditionNames[left]);
          const second = candidates.find((entry) => entry.caseId === item.id && entry.repetition === repetition && entry.condition === conditionNames[right]);
          for (let order = 1; order <= config.judge.pairwiseOrderRepetitions; order += 1) {
            const [answerA, answerB] = order % 2 ? [first, second] : [second, first];
            pairs.push({
              pairId: `${item.id}__r${repetition}__${left}-${right}__o${order}`,
              item,
              repetition,
              order,
              answerA,
              answerB
            });
          }
        }
      }
    }
  }
  return pairs;
}

function judgeSchema(item) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["criteria", "criticalFailures", "summary"],
    properties: {
      criteria: {
        type: "array",
        minItems: item.criteria.length,
        maxItems: item.criteria.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["criterionId", "score", "evidence"],
          properties: {
            criterionId: { type: "string", enum: item.criteria.map((criterion) => criterion.id) },
            score: { type: "integer", minimum: 0, maximum: 3 },
            evidence: { type: "string", minLength: 1 }
          }
        }
      },
      criticalFailures: {
        type: "array",
        minItems: item.criticalFailures.length,
        maxItems: item.criticalFailures.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["failureIndex", "triggered", "evidence"],
          properties: {
            failureIndex: { type: "integer", minimum: 0, maximum: item.criticalFailures.length - 1 },
            triggered: { type: "boolean" },
            evidence: { type: "string", minLength: 1 }
          }
        }
      },
      summary: { type: "string", minLength: 1 }
    }
  };
}

function pairwiseSchema(item) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["criteria", "winner", "evidence"],
    properties: {
      criteria: {
        type: "array",
        minItems: item.criteria.length,
        maxItems: item.criteria.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["criterionId", "winner", "evidence"],
          properties: {
            criterionId: { type: "string", enum: item.criteria.map((criterion) => criterion.id) },
            winner: { type: "string", enum: ["A", "B", "tie"] },
            evidence: { type: "string", minLength: 1 }
          }
        }
      },
      winner: { type: "string", enum: ["A", "B", "tie"] },
      evidence: { type: "string", minLength: 1 }
    }
  };
}

function paperAuditSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["convergences", "divergences", "validAlternatives", "summary"],
    properties: {
      convergences: { type: "array", items: { type: "string" } },
      divergences: { type: "array", items: { type: "string" } },
      validAlternatives: { type: "array", items: { type: "string" } },
      summary: { type: "string", minLength: 1 }
    }
  };
}

function validateCompleteIds(entries, expected, field, label) {
  const actual = entries.map((entry) => entry[field]);
  if (actual.length !== expected.length || new Set(actual).size !== expected.length || expected.some((id) => !actual.includes(id))) {
    throw new Error(`The judge returned an invalid ${label} set.`);
  }
}

function judgeArguments(config, temporary, output, schemaPath) {
  return [
    "exec", "--json", "--ephemeral", "--skip-git-repo-check",
    "--ignore-user-config", "--ignore-rules", "--disable", "hooks", "--disable", "plugins",
    "--disable", "shell_tool", "--disable", "browser_use", "--disable", "browser_use_external",
    "--disable", "computer_use", "--disable", "multi_agent", "--disable", "apps",
    "--disable", "image_generation", "--disable", "code_mode", "--disable", "in_app_browser",
    "--disable", "in_app_local_automation",
    "--sandbox", "read-only", "--model", config.judge.model,
    "--config", `model_reasoning_effort=\"${config.judge.reasoningEffort}\"`,
    "--cd", temporary, "--output-last-message", output, "--output-schema", schemaPath
  ];
}

function executeJudge(config, prompt, schema, directory) {
  const cli = codexCommand();
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "geospatial-judge-"));
  const output = path.join(temporary, "output.json");
  const schemaPath = path.join(temporary, "schema.json");
  fs.writeFileSync(schemaPath, JSON.stringify(schema), "utf8");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "prompt.txt"), `${prompt}\n`, "utf8");
  const args = [...cli.prefix, ...judgeArguments(config, temporary, output, schemaPath)];
  const started = process.hrtime.bigint();
  const result = run(cli.command, args, { cwd: temporary, input: prompt, timeout: config.judge.timeoutMs });
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  fs.writeFileSync(path.join(directory, "trace.jsonl"), result.stdout || "", "utf8");
  fs.writeFileSync(path.join(directory, "stderr.txt"), result.stderr || "", "utf8");
  try {
    if (result.status !== 0 || !fs.existsSync(output)) throw new Error("The judge process failed.");
    const value = readJson(output);
    const trace = parseTrace(result.stdout || "");
    if (!trace.completed || trace.items.some((item) => !["reasoning", "agent_message"].includes(item.type))) {
      throw new Error("The judge did not complete cleanly or emitted a non-answer tool item.");
    }
    fs.writeFileSync(path.join(directory, "result.json"), `${JSON.stringify(value, null, 2)}\n`, "utf8");
    return { value, durationMs, trace };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function resumedJudge(directory, prompt) {
  for (const name of ["prompt.txt", "stderr.txt", "trace.jsonl", "result.json"]) {
    if (!fs.existsSync(path.join(directory, name))) throw new Error(`Incomplete judgment artifact: ${path.join(directory, name)}.`);
  }
  if (fs.readFileSync(path.join(directory, "prompt.txt"), "utf8") !== `${prompt}\n`) {
    throw new Error(`Existing judgment prompt does not match the current schedule: ${directory}.`);
  }
  const trace = parseTrace(fs.readFileSync(path.join(directory, "trace.jsonl"), "utf8"));
  if (!trace.completed || trace.items.some((item) => !["reasoning", "agent_message"].includes(item.type))) {
    throw new Error(`Existing judgment trace is incomplete or contains a non-answer tool item: ${directory}.`);
  }
  return { value: readJson(path.join(directory, "result.json")), trace };
}

function rubricText(item) {
  return item.criteria.map((criterion) => `- ${criterion.id}: ${criterion.description}`).join("\n");
}

function failuresText(item) {
  return item.criticalFailures.map((failure, index) => `- ${index}: ${failure}`).join("\n");
}

function validityPrompt(item, answer) {
  return [
    "Evaluate the anonymized answer for scientific and methodological validity. Do not infer its source or compare it with a publication.",
    "Score every criterion from 0 to 3 using these anchors: 0 absent, materially wrong, or contradictory; 1 recognizes the issue without a defensible method or evidence plan; 2 materially correct and concrete; 3 anticipates the main failure and specifies evidence that can change a decision.",
    "For every score, cite a passage from the answer or identify the specific omission. A critical failure is triggered only when the answer affirmatively endorses that practice; omission alone is not a veto.",
    "",
    `Problem:\n${item.prompt}`,
    "",
    `Criteria:\n${rubricText(item)}`,
    "",
    `Critical failures:\n${failuresText(item)}`,
    "",
    `Anonymized answer:\n${answer}`
  ].join("\n");
}

function pairwisePrompt(item, answerA, answerB) {
  return [
    "Compare two anonymized answers only for scientific and methodological validity under the supplied rubric. Do not infer their source or compare them with a publication.",
    "Choose A, B, or tie for every criterion and overall. Cite specific evidence or omissions. A tie is valid when no material difference is established.",
    "",
    `Problem:\n${item.prompt}`,
    "",
    `Criteria:\n${rubricText(item)}`,
    "",
    `Critical failures:\n${failuresText(item)}`,
    "",
    `Answer A:\n${answerA}`,
    "",
    `Answer B:\n${answerB}`
  ].join("\n");
}

function stableProvenance(value) {
  return JSON.stringify(Object.fromEntries(Object.entries(value).filter(([key]) => key !== "createdAt")));
}

function runCandidates() {
  const { config, cases } = loadSuite();
  if (successful("git", ["status", "--porcelain"])) throw new Error("Candidate runs require a clean worktree.");
  const cli = codexCommand();
  const runsRoot = path.join(outputRoot, "runs");
  const provenancePath = path.join(outputRoot, "provenance.json");
  const currentProvenance = provenance(config, cases);
  if (fs.existsSync(provenancePath)) {
    const existing = readJson(provenancePath);
    if (stableProvenance(existing) !== stableProvenance(currentProvenance)) throw new Error("Existing candidate outputs were created with different benchmark provenance.");
  } else {
    if (fs.existsSync(runsRoot) && fs.readdirSync(runsRoot).length) throw new Error("Candidate runs exist without provenance; refusing to mix outputs.");
    fs.mkdirSync(outputRoot, { recursive: true });
    fs.writeFileSync(provenancePath, `${JSON.stringify(currentProvenance, null, 2)}\n`);
  }
  const provenanceSha256 = fileSha256(provenancePath);
  const workspaces = Object.fromEntries(Object.keys(conditions).map((name) => [name, prepareWorkspace(name)]));
  fs.mkdirSync(runsRoot, { recursive: true });

  for (const planned of schedule(config, cases)) {
    const directory = path.join(runsRoot, planned.id);
    const recordPath = path.join(directory, "record.json");
    if (fs.existsSync(recordPath)) {
      const existing = readJson(recordPath);
      if (existing.provenanceSha256 !== provenanceSha256) throw new Error(`The candidate record has different provenance: ${planned.id}.`);
      if (!eligibleCandidateRecord(existing, provenanceSha256)) throw new Error(`The candidate record is incomplete or failed and must be archived before retry: ${planned.id}.`);
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
      "--config", "windows.sandbox=\"unelevated\"",
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
    const protocolViolation = trace.items ? candidateProtocolViolation(trace, planned.condition, workspaces[planned.condition]) : true;
    const record = {
      ...planned,
      title: item.title,
      stratum: item.stratum,
      startedAt: startedAt.toISOString(),
      durationMs,
      exitCode: result.status,
      timedOut: result.error?.code === "ETIMEDOUT",
      trace,
      protocolViolation,
      provenanceSha256
    };
    fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    process.stdout.write(`${result.status === 0 && trace.completed && !protocolViolation ? "DONE" : "FAIL"} ${planned.id}\n`);
    if (result.status !== 0 || !trace.completed || protocolViolation) {
      throw new Error(`Candidate run failed or violated the no-tools protocol: ${planned.id}. Resume after inspecting ${directory}.`);
    }
  }
}

function runValidityJudges() {
  const { config, cases } = loadSuite();
  if (successful("git", ["status", "--porcelain"])) throw new Error("Validity judging requires a clean worktree.");
  const candidates = candidateArtifacts(config, cases);
  const validityRoot = path.join(outputRoot, "validity");
  if (fs.existsSync(path.join(validityRoot, "manifest.json")) || fs.existsSync(path.join(validityRoot, "manifest.sha256"))) {
    throw new Error(`Locked validity outputs already exist: ${validityRoot}. Refusing to overwrite a grading record.`);
  }
  fs.mkdirSync(validityRoot, { recursive: true });
  const grades = [];
  const comparisons = [];

  for (const candidate of candidates) {
    const item = cases.find((entry) => entry.id === candidate.caseId);
    const directory = path.join(validityRoot, "individual", candidate.blindId);
    const gradePath = path.join(directory, "grade.json");
    if (fs.existsSync(directory)) {
      if (!fs.existsSync(gradePath)) throw new Error(`Incomplete validity grade must be archived before retry: ${directory}.`);
      const grade = readJson(gradePath);
      const resumed = resumedJudge(directory, validityPrompt(item, candidate.answer));
      validateCompleteIds(grade.criteria, item.criteria.map((criterion) => criterion.id), "criterionId", "criterion");
      validateCompleteIds(grade.criticalFailures, item.criticalFailures.map((_, index) => index), "failureIndex", "critical-failure");
      const veto = grade.criticalFailures.some((failure) => failure.triggered);
      const pass = !veto && grade.criteria.every((criterion) => criterion.score >= config.judge.validityScoring.passMinimumPerCriterion);
      if (grade.candidateId !== candidate.id || grade.blindId !== candidate.blindId || grade.caseId !== candidate.caseId || grade.answerSha256 !== candidate.answerSha256 || grade.veto !== veto || grade.pass !== pass || JSON.stringify(grade.criteria) !== JSON.stringify(resumed.value.criteria) || JSON.stringify(grade.criticalFailures) !== JSON.stringify(resumed.value.criticalFailures) || grade.summary !== resumed.value.summary || JSON.stringify(grade.usage) !== JSON.stringify(resumed.trace.usage)) {
        throw new Error(`Existing validity grade does not match the fixed schedule: ${gradePath}.`);
      }
      grades.push({ candidateId: candidate.id, file: path.relative(validityRoot, gradePath), sha256: fileSha256(gradePath) });
      process.stdout.write(`SKIP GRADED ${candidate.blindId}\n`);
      continue;
    }
    const judged = executeJudge(config, validityPrompt(item, candidate.answer), judgeSchema(item), directory);
    validateCompleteIds(judged.value.criteria, item.criteria.map((criterion) => criterion.id), "criterionId", "criterion");
    validateCompleteIds(judged.value.criticalFailures, item.criticalFailures.map((_, index) => index), "failureIndex", "critical-failure");
    const veto = judged.value.criticalFailures.some((failure) => failure.triggered);
    const pass = !veto && judged.value.criteria.every((criterion) => criterion.score >= config.judge.validityScoring.passMinimumPerCriterion);
    const grade = {
      candidateId: candidate.id,
      blindId: candidate.blindId,
      caseId: candidate.caseId,
      answerSha256: candidate.answerSha256,
      criteria: judged.value.criteria,
      criticalFailures: judged.value.criticalFailures,
      veto,
      pass,
      summary: judged.value.summary,
      durationMs: judged.durationMs,
      usage: judged.trace.usage
    };
    fs.writeFileSync(gradePath, `${JSON.stringify(grade, null, 2)}\n`, "utf8");
    grades.push({ candidateId: candidate.id, file: path.relative(validityRoot, gradePath), sha256: fileSha256(gradePath) });
    process.stdout.write(`GRADED ${candidate.blindId}\n`);
  }

  for (const planned of comparisonSchedule(config, cases, candidates)) {
    const directory = path.join(validityRoot, "pairwise", planned.pairId);
    const comparisonPath = path.join(directory, "comparison.json");
    if (fs.existsSync(directory)) {
      if (!fs.existsSync(comparisonPath)) throw new Error(`Incomplete pairwise judgment must be archived before retry: ${directory}.`);
      const comparison = readJson(comparisonPath);
      const resumed = resumedJudge(directory, pairwisePrompt(planned.item, planned.answerA.answer, planned.answerB.answer));
      validateCompleteIds(comparison.criteria, planned.item.criteria.map((criterion) => criterion.id), "criterionId", "pairwise criterion");
      if (comparison.pairId !== planned.pairId || comparison.caseId !== planned.item.id || comparison.repetition !== planned.repetition || comparison.order !== planned.order || comparison.answerA !== planned.answerA.id || comparison.answerB !== planned.answerB.id || JSON.stringify(comparison.criteria) !== JSON.stringify(resumed.value.criteria) || comparison.winner !== resumed.value.winner || comparison.evidence !== resumed.value.evidence || JSON.stringify(comparison.usage) !== JSON.stringify(resumed.trace.usage)) {
        throw new Error(`Existing pairwise judgment does not match the fixed schedule: ${comparisonPath}.`);
      }
      comparisons.push({ pairId: planned.pairId, file: path.relative(validityRoot, comparisonPath), sha256: fileSha256(comparisonPath) });
      process.stdout.write(`SKIP COMPARED ${planned.pairId}\n`);
      continue;
    }
    const judged = executeJudge(config, pairwisePrompt(planned.item, planned.answerA.answer, planned.answerB.answer), pairwiseSchema(planned.item), directory);
    validateCompleteIds(judged.value.criteria, planned.item.criteria.map((criterion) => criterion.id), "criterionId", "pairwise criterion");
    const comparison = {
      pairId: planned.pairId,
      caseId: planned.item.id,
      repetition: planned.repetition,
      order: planned.order,
      answerA: planned.answerA.id,
      answerB: planned.answerB.id,
      criteria: judged.value.criteria,
      winner: judged.value.winner,
      evidence: judged.value.evidence,
      durationMs: judged.durationMs,
      usage: judged.trace.usage
    };
    fs.writeFileSync(comparisonPath, `${JSON.stringify(comparison, null, 2)}\n`, "utf8");
    comparisons.push({ pairId: planned.pairId, file: path.relative(validityRoot, comparisonPath), sha256: fileSha256(comparisonPath) });
    process.stdout.write(`COMPARED ${planned.pairId}\n`);
  }

  const manifest = {
    schemaVersion: 1,
    lockedAt: new Date().toISOString(),
    judgeModel: config.judge.model,
    reasoningEffort: config.judge.reasoningEffort,
    configSha256: fileSha256(path.join(suiteRoot, "config.json")),
    casesSha256: fileSha256(path.join(suiteRoot, "cases.json")),
    candidateProvenanceSha256: fileSha256(path.join(outputRoot, "provenance.json")),
    grades,
    comparisons
  };
  const manifestPath = path.join(validityRoot, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const manifestHash = fileSha256(manifestPath);
  fs.writeFileSync(path.join(validityRoot, "manifest.sha256"), `${manifestHash}\n`, "utf8");
  process.stdout.write(`Validity results locked at ${manifestPath}.\nValidity manifest SHA-256: ${manifestHash}\n`);
}

function lockedValidity(config, cases, candidates, suppliedHash) {
  const directory = path.join(outputRoot, "validity");
  const manifestPath = path.join(directory, "manifest.json");
  const lockPath = path.join(directory, "manifest.sha256");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(lockPath)) throw new Error("A locked validity manifest is required before the paper audit.");
  const expected = fs.readFileSync(lockPath, "utf8").trim();
  const actual = fileSha256(manifestPath);
  if (!suppliedHash || suppliedHash !== actual || expected !== actual) throw new Error("The supplied validity-manifest hash or local lock does not match.");
  const manifest = readJson(manifestPath);
  if (manifest.configSha256 !== fileSha256(path.join(suiteRoot, "config.json")) || manifest.casesSha256 !== fileSha256(path.join(suiteRoot, "cases.json")) || manifest.candidateProvenanceSha256 !== fileSha256(path.join(outputRoot, "provenance.json"))) {
    throw new Error("The locked validity manifest does not match the current benchmark inputs.");
  }
  const expectedPairs = comparisonSchedule(config, cases, candidates);
  if (!Array.isArray(manifest.grades) || !Array.isArray(manifest.comparisons) || manifest.grades.length !== candidates.length || manifest.comparisons.length !== expectedPairs.length) {
    throw new Error("The locked validity manifest is incomplete.");
  }
  validateCompleteIds(manifest.grades, candidates.map((candidate) => candidate.id), "candidateId", "locked candidate");
  validateCompleteIds(manifest.comparisons, expectedPairs.map((pair) => pair.pairId), "pairId", "locked comparison");
  for (const artifact of [...manifest.grades, ...manifest.comparisons]) {
    const file = path.resolve(directory, artifact.file);
    if (!file.startsWith(`${path.resolve(directory)}${path.sep}`)) throw new Error(`A validity artifact path escapes its directory: ${artifact.file}.`);
    if (!fs.existsSync(file) || fileSha256(file) !== artifact.sha256) throw new Error(`A locked validity artifact changed: ${artifact.file}.`);
  }
  for (const candidate of candidates) {
    const artifact = manifest.grades.find((entry) => entry.candidateId === candidate.id);
    const grade = readJson(path.join(directory, artifact.file));
    if (grade.candidateId !== candidate.id || grade.answerSha256 !== candidate.answerSha256) throw new Error(`The candidate answer changed after validity grading: ${candidate.id}.`);
  }
  for (const planned of expectedPairs) {
    const artifact = manifest.comparisons.find((entry) => entry.pairId === planned.pairId);
    const comparison = readJson(path.join(directory, artifact.file));
    if (comparison.pairId !== planned.pairId || comparison.answerA !== planned.answerA.id || comparison.answerB !== planned.answerB.id) {
      throw new Error(`The locked pairwise comparison has invalid membership: ${planned.pairId}.`);
    }
  }
  return { manifest, sha256: actual };
}

function runPaperAudit(suppliedHash) {
  const { config, cases } = loadSuite();
  if (successful("git", ["status", "--porcelain"])) throw new Error("The paper audit requires a clean worktree.");
  const allCandidates = candidateArtifacts(config, cases);
  const validity = lockedValidity(config, cases, allCandidates, suppliedHash);
  const dossiers = loadPaperDossiers(cases);
  const candidates = allCandidates.filter((candidate) => cases.find((item) => item.id === candidate.caseId).stratum === "paper_challenge");
  const auditRoot = path.join(outputRoot, "paper-audit");
  if (fs.existsSync(auditRoot)) throw new Error(`Paper-audit outputs already exist: ${auditRoot}. Refusing to overwrite them.`);
  fs.mkdirSync(auditRoot, { recursive: true });
  const audits = [];
  for (const candidate of candidates) {
    const item = cases.find((entry) => entry.id === candidate.caseId);
    const prompt = [
      "Compare the anonymized answer with the paper dossier only to describe convergence and divergence. Do not rescore scientific validity, declare a winner, or treat the published method as ground truth. Record scientifically valid alternatives separately.",
      "",
      `Problem:\n${item.prompt}`,
      "",
      `Paper dossier:\n${dossiers[item.paperReferenceId]}`,
      "",
      `Anonymized answer:\n${candidate.answer}`
    ].join("\n");
    const directory = path.join(auditRoot, candidate.blindId);
    const judged = executeJudge(config, prompt, paperAuditSchema(), directory);
    const audit = {
      candidateId: candidate.id,
      blindId: candidate.blindId,
      caseId: candidate.caseId,
      paperReferenceId: item.paperReferenceId,
      answerSha256: candidate.answerSha256,
      validityManifestSha256: validity.sha256,
      ...judged.value,
      durationMs: judged.durationMs,
      usage: judged.trace.usage
    };
    const auditPath = path.join(directory, "audit.json");
    fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
    audits.push({ candidateId: candidate.id, file: path.relative(auditRoot, auditPath), sha256: fileSha256(auditPath) });
    process.stdout.write(`AUDITED ${candidate.blindId}\n`);
  }
  const manifestPath = path.join(auditRoot, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify({
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    validityManifestSha256: validity.sha256,
    dossierSha256: fileSha256(path.join(suiteRoot, "paper-reference-dossiers.md")),
    audits
  }, null, 2)}\n`, "utf8");
  process.stdout.write(`Paper-alignment audit written to ${manifestPath}.\n`);
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
  if (process.platform === "win32") {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "geospatial-sandbox-check-"));
    try {
      fs.writeFileSync(path.join(temporary, "probe.md"), "sandbox-ok\n", "utf8");
      const output = successful(cli.command, [...cli.prefix, "sandbox", "-P", ":read-only", "-c", "windows.sandbox=\"unelevated\"", "-C", temporary, "powershell.exe", "-NoProfile", "-Command", "Get-Content -Raw -LiteralPath probe.md"]);
      if (output.trim() !== "sandbox-ok") throw new Error("The Windows sandbox read probe returned unexpected output.");
      process.stdout.write("OK windows_unelevated_sandbox\n");
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
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
  const dossiers = loadPaperDossiers(cases);
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
  const resumeFixture = fs.mkdtempSync(path.join(os.tmpdir(), "geospatial-resume-test-"));
  try {
    fs.writeFileSync(path.join(resumeFixture, "prompt.txt"), "fixture\n", "utf8");
    fs.writeFileSync(path.join(resumeFixture, "stderr.txt"), "", "utf8");
    fs.writeFileSync(path.join(resumeFixture, "trace.jsonl"), [
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "{}" } }),
      JSON.stringify({ type: "turn.completed", usage: { input_tokens: 1, output_tokens: 1 } })
    ].join("\n"), "utf8");
    fs.writeFileSync(path.join(resumeFixture, "result.json"), "{}\n", "utf8");
    if (!resumedJudge(resumeFixture, "fixture").trace.completed) throw new Error("The resume validator rejected a complete fixture.");
  } finally {
    fs.rmSync(resumeFixture, { recursive: true, force: true });
  }
  const disabled = pluginOverrides("no_gpt_tooling").join(" ");
  const full = pluginOverrides("geospatial_tooling").join(" ");
  if (!disabled.includes('plinth@gpt-tooling".enabled=false') || !full.includes('plinth@gpt-tooling".enabled=true')) {
    throw new Error("The condition overrides are invalid.");
  }
  for (const item of cases) {
    const schema = judgeSchema(item);
    if (schema.properties.criteria.minItems !== item.criteria.length || pairwiseSchema(item).properties.criteria.maxItems !== item.criteria.length) {
      throw new Error(`The judge schema does not match the rubric: ${item.id}.`);
    }
    if (item.stratum === "paper_challenge" && !dossiers[item.paperReferenceId]) throw new Error(`The paper dossier is unavailable: ${item.id}.`);
  }
  if (!validityPrompt(cases[0], "fixture").includes("Anonymized answer:\nfixture")) throw new Error("The validity prompt is invalid.");
  const isolated = judgeArguments(config, "temporary", "output", "schema");
  if (isolated.includes("prompt")) throw new Error("The isolated judge puts prompt content on the command line.");
  for (const required of ["--ignore-user-config", "--ignore-rules", "hooks", "plugins", "shell_tool", "browser_use", "computer_use", "multi_agent", "code_mode", "--output-schema"]) {
    if (!isolated.includes(required)) throw new Error(`The isolated judge arguments omit ${required}.`);
  }
  if (isolated.includes("code_mode_host")) throw new Error("The isolated judge disables the code-mode host and causes a startup error.");
  validateCompleteIds(cases[0].criteria.map((criterion) => ({ criterionId: criterion.id })), cases[0].criteria.map((criterion) => criterion.id), "criterionId", "fixture criterion");
  const fixtureWorkspace = path.join(root, "fixture-workspace");
  const permittedRead = { type: "command_execution", status: "completed", exit_code: 0, command: "Get-Content -Raw -LiteralPath .agents\\skills\\geospatial\\SKILL.md" };
  if (!allowedSkillRead(permittedRead, fixtureWorkspace, "geospatial_tooling") || candidateProtocolViolation({ items: [permittedRead] }, "geospatial_tooling", fixtureWorkspace)) {
    throw new Error("The candidate protocol rejected a permitted skill read.");
  }
  const wrappedRead = { ...permittedRead, command: `"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '${permittedRead.command}'` };
  if (!allowedSkillRead(wrappedRead, fixtureWorkspace, "geospatial_tooling")) throw new Error("The candidate protocol rejected the Windows Codex shell wrapper.");
  const coreRead = { ...permittedRead, command: "Get-Content -Raw -LiteralPath .agents\\skills\\plinth\\SKILL.md" };
  if (!allowedSkillRead(coreRead, fixtureWorkspace, "core_tooling") || allowedSkillRead(permittedRead, fixtureWorkspace, "core_tooling")) {
    throw new Error("The candidate protocol does not enforce condition-specific skill roots.");
  }
  if (!candidateProtocolViolation({ items: [{ ...permittedRead, command: "Get-Content -Raw -LiteralPath ..\\secret.md" }] }, "geospatial_tooling", fixtureWorkspace)) {
    throw new Error("The candidate protocol accepted a read outside the skill directory.");
  }
  const mockCandidates = schedule(config, cases).map((item) => ({ ...item, answer: "fixture" }));
  const comparisons = comparisonSchedule(config, cases, mockCandidates);
  const expectedComparisons = cases.length * config.candidate.repetitions * 3 * config.judge.pairwiseOrderRepetitions;
  if (comparisons.length !== expectedComparisons || new Set(comparisons.map((item) => item.pairId)).size !== expectedComparisons) {
    throw new Error("The pairwise schedule is invalid.");
  }
  if (stableProvenance({ createdAt: "a", commit: "x" }) !== stableProvenance({ createdAt: "b", commit: "x" }) || stableProvenance({ createdAt: "a", commit: "x" }) === stableProvenance({ createdAt: "a", commit: "y" })) {
    throw new Error("The resume provenance comparison is invalid.");
  }
  const eligible = { exitCode: 0, trace: { completed: true }, protocolViolation: false, provenanceSha256: "fixture" };
  if (!eligibleCandidateRecord(eligible, "fixture") || eligibleCandidateRecord({ ...eligible, exitCode: 1 }, "fixture")) {
    throw new Error("The candidate resume eligibility check is invalid.");
  }
  process.stdout.write(`The geospatial benchmark checks passed (${expected} candidate runs planned).\n`);
}

const command = process.argv[2];
if (command === "test" && process.argv.length === 3) selfTest();
else if (command === "doctor" && process.argv.length === 3) doctor();
else if (command === "plan" && process.argv.length === 3) plan();
else if (command === "run" && process.argv.length === 3) runCandidates();
else if (command === "judge-validity" && process.argv.length === 3) runValidityJudges();
else if (command === "audit-paper" && process.argv.length === 4) runPaperAudit(process.argv[3]);
else {
  process.stderr.write("Usage: node scripts/benchmark-geospatial.js test | doctor | plan | run | judge-validity | audit-paper <validity-manifest-sha256>\n");
  process.exitCode = 2;
}
