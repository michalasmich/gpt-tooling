# Geospatial tooling pilot

This benchmark compares three fixed conditions on two case strata. The pilot contains three general geospatial machine-learning design problems. The paper challenge contains four blind problems derived from published research. Each condition receives every prompt twice, producing 42 candidate runs.

| Condition | Plinth, Quire, Ponytail | Geospatial skill |
| --- | --- | --- |
| `no_gpt_tooling` | Disabled | Disabled |
| `core_tooling` | Enabled | Disabled |
| `geospatial_tooling` | Enabled | Loaded from the checked-out repository |

The baseline disables GPT Tooling only. Other user-environment components remain unchanged across conditions. The runner uses a repository-scoped copy of the geospatial skill for the full condition, so it does not replace the installed `gpt-tooling` marketplace.

## Cases for review

The complete prompts, critical failures and seven-item rubrics are in [`cases.json`](cases.json).

| Stratum | Case |
| --- | --- |
| Pilot | Drone orthomosaic segmentation across new farms |
| Pilot | SAR ship detection under geographic and acquisition shift |
| Pilot | Multimodal land-change mapping for future events |
| Paper challenge | Change detection from single-date supervision under domain shift |
| Paper challenge | Fine-grained cropland change under phenological and boundary interference |
| Paper challenge | Multimodal 3D building change with metric height information |
| Paper challenge | Subpixel standing-dead-tree detectability from satellite imagery |

The private judge basis for the four paper cases is in [`paper-reference-dossiers.md`](paper-reference-dossiers.md). Review it separately from candidate prompts to check whether each paper has been represented fairly.

Run the non-model checks first:

```bash
node scripts/benchmark-geospatial.js test
node scripts/benchmark-geospatial.js doctor
node scripts/benchmark-geospatial.js plan
```

After the cases and rubric are frozen, `node scripts/benchmark-geospatial.js run` executes the randomized schedule. It requires a clean worktree and writes resumable records under `dist/geospatial-benchmark/`. Each record contains the final answer, raw JSONL trace, standard error, wall-clock duration, token usage, tool-event counts, condition, stratum, repetition, model, and repository provenance. Candidate prompts prohibit web search and local-file inspection. A run that invokes external tools is recorded as a protocol violation and excluded.

Candidate answers must be graded blind to condition. Use both the case-specific absolute rubric and condition-pair comparisons with answer order reversed. For paper-derived cases, give the judge the corresponding entry from `paper-reference-dossiers.md`; never give it to candidates. Methodological validity is primary and similarity to the paper is secondary. Validate the judge against the project expert's assessment before expanding the benchmark. Report pilot and paper-challenge results separately, followed by the combined result. Report improvements, ties, regressions, token use and latency. Seven cases are still a workflow and signal-detection study, not evidence of general performance.
