# Geospatial tooling pilot

This benchmark compares three fixed conditions on two case strata. The pilot contains three general geospatial machine-learning design problems. The paper challenge contains four blind problems derived from published research. Each condition receives every prompt twice, producing 42 candidate runs.

| Condition | Plinth, Quire, Ponytail | Geospatial skill |
| --- | --- | --- |
| `no_gpt_tooling` | Disabled | Disabled |
| `core_tooling` | Enabled | Disabled |
| `geospatial_tooling` | Enabled | Loaded from the checked-out repository |

The baseline disables GPT Tooling only. Other user-environment components remain unchanged across conditions. The runner uses a repository-scoped copy of the geospatial skill for the full condition, so it does not replace the installed `gpt-tooling` marketplace.

## Cases for review

The complete prompts, critical failures and problem-specific rubrics are in [`cases.json`](cases.json).

| Stratum | Case |
| --- | --- |
| Pilot | Drone orthomosaic segmentation across new farms |
| Pilot | SAR ship detection under geographic and acquisition shift |
| Pilot | Multimodal land-change mapping for future events |
| Paper challenge | Change detection from single-date supervision under domain shift |
| Paper challenge | Fine-grained cropland change under phenological and boundary interference |
| Paper challenge | Multimodal 3D building change with metric height information |
| Paper challenge | Subpixel standing-dead-tree detectability from satellite imagery |

The private source basis for the four paper cases is in [`paper-reference-dossiers.md`](paper-reference-dossiers.md). It is used only for a separate paper-alignment audit and must not be shown to candidates or the validity judge.

Run the non-model checks first:

```bash
node scripts/benchmark-geospatial.js test
node scripts/benchmark-geospatial.js doctor
node scripts/benchmark-geospatial.js plan
```

After the cases and rubric are frozen, `node scripts/benchmark-geospatial.js run` executes the randomized schedule. It requires a clean worktree and writes resumable records under `dist/geospatial-benchmark/`. A resume preserves the original provenance and refuses any repository, CLI, configuration or installed-plugin-source mismatch; every run record stores that provenance hash. Each record also contains the final answer, raw JSONL trace, standard error, wall-clock duration, token usage, tool-event counts, condition, stratum, repetition and model. Web access and arbitrary local inspection are prohibited. Each enabled-tooling condition receives frozen repository copies of its skills and may issue only recorded, read-only `Get-Content -Raw -LiteralPath` calls for Markdown files inside those condition-specific skill roots. Every other tool event is a protocol violation.

After all candidate runs succeed, run the two judging stages in order:

```bash
node scripts/benchmark-geospatial.js judge-validity
node scripts/benchmark-geospatial.js audit-paper <validity-manifest-sha256>
```

These are substantial model jobs. With the current configuration, validity judging makes 42 absolute-grading calls and 84 order-reversed pairwise calls. The optional paper audit makes 24 additional calls. Each command requires a clean worktree and refuses to overwrite an existing result directory.

## Validity scoring

The validity judge is blind to condition and paper identity. It receives only the candidate prompt, its problem-invariant rubric, critical failures and the candidate answer. It must cite an answer passage or identify a specific omission for every score.

Each criterion has equal weight within its case and uses these anchors:

- `0`: absent, materially incorrect, or contradicts the requirement.
- `1`: recognizes the issue but gives no defensible method or evidence plan.
- `2`: materially correct and sufficiently concrete for the stated problem.
- `3`: strong treatment that anticipates the main failure mode and specifies evidence that can change a decision.

A critical failure is a veto only when the answer affirmatively endorses the invalid practice. Failure to mention an item lowers its criterion score but is not automatically a veto. A response passes when it has no critical-failure veto and every criterion scores at least `2`. Report the criterion mean and pass rate; do not use one to conceal failure on the other.

Pairwise validity comparisons use the same problem-invariant rubric, never the paper dossier, and reverse answer order to expose position effects. A project expert reviews a blind sample before the judge is used for the remaining outputs.

`judge-validity` runs in an isolated context with user configuration, rules, hooks, plugins, shell, browser, computer-use and multi-agent capabilities disabled. It records the rubric scores, cited evidence, veto decisions, pass status, token use and latency. It then writes a manifest and SHA-256 lock under `dist/geospatial-benchmark/validity/` and prints the hash. Preserve that printed hash outside the result directory. The paper dossiers are not loaded by this command.

## Paper-alignment audit

For the four paper-derived cases, a separate judge may compare an answer with the corresponding dossier after validity grading is locked. This audit describes whether the answer independently converged on the paper's diagnosis or mechanisms. It does not affect validity scores, pass decisions, pairwise winners or condition rankings. Disagreements between scientific validity and paper similarity are reported rather than resolved in favor of the paper.

`audit-paper` requires the separately preserved manifest hash. It verifies the current configuration, cases, candidate provenance, candidate-answer hashes, complete grading schedule, pair membership and every listed validity artifact before it loads the dossiers. It writes only descriptive convergence, divergence and valid-alternative records under `dist/geospatial-benchmark/paper-audit/`. The validity stage does not read this directory.

Report pilot and paper-challenge results separately, followed by the combined result. Report improvements, ties, regressions, token use and latency. The paper cases remain partially related to their source literature and the geospatial skill, so this seven-case study is exploratory. Add independently authored and held-out cases before making confirmatory claims about general geospatial expertise.
