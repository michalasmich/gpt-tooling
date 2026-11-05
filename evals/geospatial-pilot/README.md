# Geospatial tooling pilot

This pilot compares three fixed conditions on three geospatial machine-learning design problems. Each condition receives the same prompt twice, producing 18 candidate runs.

| Condition | Plinth, Quire, Ponytail | Geospatial skill |
| --- | --- | --- |
| `no_gpt_tooling` | Disabled | Disabled |
| `core_tooling` | Enabled | Disabled |
| `geospatial_tooling` | Enabled | Loaded from the checked-out repository |

The baseline disables GPT Tooling only. Other user-environment components remain unchanged across conditions. The runner uses a repository-scoped copy of the geospatial skill for the full condition, so it does not replace the installed `gpt-tooling` marketplace.

Run the non-model checks first:

```bash
node scripts/benchmark-geospatial.js test
node scripts/benchmark-geospatial.js doctor
node scripts/benchmark-geospatial.js plan
```

After the cases and rubric are frozen, `node scripts/benchmark-geospatial.js run` executes the randomized schedule. It requires a clean worktree and writes resumable records under `dist/geospatial-benchmark/`. Each record contains the final answer, raw JSONL trace, standard error, wall-clock duration, token usage, tool-event counts, condition, repetition, model, and repository provenance.

Candidate answers must be graded blind to condition. Use both the case-specific absolute rubric and condition-pair comparisons with answer order reversed. Validate the judge against the project expert's assessment before expanding the benchmark. Report improvements, ties, regressions, token use, and latency. The three-case pilot is a workflow check, not evidence of general performance.
