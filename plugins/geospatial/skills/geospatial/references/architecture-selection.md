# Architecture Selection for Geospatial Deep Learning

## Purpose and boundary

Use this reference to choose a model family, input support, decoder or head, and adaptation regime for a defined geospatial task. The output is a defensible experiment shortlist and selection rule, not a permanent ranking of architectures.

Architecture selection begins after the target, data, split, and operational constraints are defined. A newer or larger model is not evidence of a better project decision.

## 1. Freeze the problem before naming models

Record:

- task: classification, detection, instance segmentation, semantic segmentation, regression, retrieval, change, or sequence prediction;
- prediction and action unit: pixel, chip, object, parcel, scene, acquisition, trajectory, or region;
- target definition, ontology, units, support, minimum mapping unit, and reference uncertainty;
- required transfer across geography, time, sensor, resolution, or quality state;
- input modalities, bands, polarizations, timestamps, ancillary variables, and missing-data patterns;
- output geometry, calibration, uncertainty, or abstention requirements;
- training and inference hardware, memory, latency, throughput, storage, energy, and software constraints;
- license, weight availability, maintenance, and reproducibility requirements.

An architecture that cannot consume the measurement correctly or deliver the required unit is ineligible regardless of benchmark score.

## 2. Derive spatial and temporal support from the target

Connect model input to physical scale:

- object size in pixels and ground units;
- context needed to distinguish the target from confusers;
- label support and positional uncertainty;
- sensor point-spread function and effective resolution;
- temporal duration, cadence, seasonal phase, and acceptable gaps;
- expected displacement, parallax, orientation, and registration error.

Choose chip size, pyramid levels, output stride, and temporal window from these properties. Larger chips provide more context but reduce batch size, increase padding and seam effects, and can include irrelevant geographic cues. Finer output stride consumes memory and does not recover information absent from the measurement.

Check effective support through the complete network and tiling pipeline. The nominal receptive field is not evidence that the model uses all context effectively.

## 3. Establish a conventional baseline first

The baseline must be strong enough to answer the task:

- classification: a maintained convolutional backbone with a simple head;
- semantic segmentation: a U-Net- or feature-pyramid-style encoder-decoder;
- detection: a maintained one-stage detector with feature pyramids;
- instance segmentation: a maintained detector-mask pipeline;
- regression: a suitable convolutional or tabular-spatial baseline with the correct output support;
- time series: a per-date encoder with simple temporal pooling or a compact recurrent or attention head;
- multimodal fusion: modality-specific preprocessing with late or decision-level fusion;
- embeddings or foundation models: frozen embeddings with a linear or shallow task head.

Use a simple non-deep or linear reference when it can answer the task. Its purpose is to show whether the complex model earns its cost, not to satisfy a ritual.

Configure the baseline correctly: normalization, patch size, loss, augmentation, sampler, schedule, inference tiling, postprocessing, and matching can dominate an under-tuned comparison.

## 4. Shortlist by named limitations

Add one candidate family only when it addresses a specific baseline limitation.

| Observed or required limitation | Candidate change to test | Evidence required |
|---|---|---|
| Context exceeds practical convolutional support | Hierarchical transformer, larger-window model, or multiscale context module | Target improvement without unacceptable memory or tiling cost |
| Very small or multiscale objects | Higher-resolution features, feature pyramid, tiling change, or scale-aware head | Size-stratified detection or segmentation improvement |
| Arbitrary object orientation matters | Rotation augmentation, oriented boxes, or equivariant model | Oriented-task metric and false-duplicate improvement |
| Thin structures or precise boundaries matter | Higher-resolution decoder, boundary-aware objective, or topology-aware postprocessing | Boundary or topology guardrail improvement |
| Long temporal dependence matters | Temporal convolution, recurrent model, or temporal attention | Held-out time or event improvement over simple pooling |
| Several modalities contribute different evidence | Intermediate or cross-attention fusion | Gain over unimodal and late-fusion baselines under missing-modality tests |
| Labels are scarce | EO-pretrained encoder, embeddings, or foundation model | Label-fraction and target-domain comparison |
| Deployment is resource constrained | Smaller family, distillation, pruning, quantization, or lower resolution | Measured target-hardware latency, memory, energy, and task impact |

Do not add a transformer, foundation model, multimodal fusion block, or custom loss because it is current. State the limitation it is expected to solve.

## 5. Treat input representation as part of the architecture

Verify:

- band, polarization, and ancillary-variable semantics;
- physical units, scale, offset, normalization population, and missing-value handling;
- native versus resampled resolution and support;
- whether pretrained weights expect RGB, a fixed sensor, specific wavelengths, or temporal metadata;
- channel adaptation rule for incompatible inputs;
- positional encoding and geolocation assumptions;
- temporal ordering, cadence, masks, and acquisition metadata.

RGB weight inflation, band averaging, wavelength interpolation, learned input adapters, and missing-band tokens are different model assumptions. Compare them only when the measurement meaning remains defensible.

Never resize or resample imagery only to satisfy a model without recording the new pixel support and evaluating the consequence.

## 6. Match the family to the task

### Classification

Start with a maintained CNN and simple head. Add a vision transformer or EO-pretrained representation when context, label scarcity, or transfer evidence justifies it. Verify that the chip label is valid over the chip support and that the model is not exploiting border, mosaic, season, or location shortcuts.

### Object detection

Start with a maintained one-stage feature-pyramid detector. Add a two-stage detector when proposal refinement plausibly helps difficult localization or class imbalance. Add oriented boxes only when orientation is meaningful and the annotation/evaluation convention is stable.

Test object-size strata, density, truncation, tile edges, matching, and duplicate merging. A detector architecture cannot compensate for incomplete object labels.

### Semantic segmentation

Start with a conventional encoder-decoder using a patch and output stride matched to the target. Add hierarchical attention, multiscale context, or a foundation encoder only when the baseline misses required context or labels are scarce.

Evaluate parent scenes, boundaries, small regions, topology, seams, and empty cases. The encoder name alone does not define the segmentation system.

### Instance segmentation

Select the detection and mask components together. Test whether errors arise from missing proposals, class confusion, localization, mask boundaries, crowding, or duplicate suppression before changing the mask architecture.

### Regression and physical retrieval

Match the output distribution, units, bounds, spatial support, and uncertainty model. Compare a task-specific supervised baseline with pretrained features. Do not assume a classification-pretrained model preserves quantitative spectral or backscatter relationships.

### Change detection

Start with explicit co-registration and a simple paired-input or Siamese baseline. Compare early concatenation, feature differencing, and temporal fusion only after masks and acquisition semantics are correct. Test seasonal confusers, missing observations, registration error, and unchanged hard negatives.

### Time series

Begin with a simple per-date encoder and masked pooling or compact temporal head. Add temporal attention when irregular cadence, long context, or event timing creates a demonstrated limitation. Preserve timestamps and observation masks.

### Multimodal fusion

Establish unimodal baselines and late fusion first. Intermediate or cross-attention fusion must improve the declared decision and remain stable when a modality is missing, delayed, misregistered, or degraded.

### Embeddings and foundation models

Start with a frozen linear or shallow probe to test representation usefulness. Then compare constrained adaptation and full fine-tuning when label volume and compute justify them. Use only models whose sensor, modality, resolution, geography, temporal structure, license, and executable input contract fit the project.

## 7. Design a fair comparison

Hold constant where practical:

- dataset and group-aware split;
- source imagery, labels, masks, and valid evaluation population;
- preprocessing and physical units;
- input support or explicitly report why it differs;
- augmentation and sampling;
- optimization budget and checkpoint-selection rule;
- validation and final-test roles;
- inference tiling, overlap, stitching, and postprocessing;
- metric implementation and aggregation unit.

Some architectures require different learning rates, schedules, normalization, or input sizes. Give each a small, declared tuning budget sufficient for competent use. Do not give the favored model extensive tuning while leaving the baseline at defaults.

If several components change together, call the result a system comparison. Do not attribute the gain to the backbone without a focused ablation.

## 8. Select metrics from the delivered decision

Choose one selection criterion before inspecting candidate results. Add a guardrail only for a material blind spot.

Examples:

- classification: cost-weighted error or macro measure, with calibration as a guardrail when probabilities drive action;
- detection: an AP or operating-point measure matched to IoU, object sizes, and review capacity, with missed-small-object or false-alarm guardrails;
- segmentation: region overlap or task loss, with boundary, topology, or small-object guardrails when operationally important;
- regression: error or bias in physical units, with range and subgroup guardrails;
- selective systems: risk at required coverage or coverage at acceptable risk.

Report characterization metrics after selection, but do not turn every metric into a separate winner. Resolve conflicting metrics through the stated operational priority.

## 9. Measure resource behavior on the target system

Record:

- parameter count and checkpoint size;
- peak training and inference memory;
- latency and throughput at the deployed batch and tile sizes;
- preprocessing, transfer, stitching, and postprocessing time;
- training time, energy or compute budget when material;
- failure behavior for large scenes, variable shapes, missing modalities, and long sequences.

FLOPs and parameter count are proxies. Kernel support, memory traffic, precision, compiler, device, input shape, and batch size determine actual latency. Benchmark the complete pipeline on the intended hardware.

## 10. Use a staged experiment budget

### Stage A: interface and overfit check

For every candidate, verify shapes, bands, masks, units, loss, label encoding, and the ability to overfit a tiny training subset. Inspect predictions visually.

### Stage B: low-cost screening

Run the conventional baseline and a small number of candidates with a fixed, reduced development budget. Remove candidates that fail correctness, memory, latency, or show no plausible gain.

### Stage C: competent comparison

Train surviving candidates with the declared tuning budget and fixed validation protocol. Use multiple seeds only when stochastic variation could change the selection.

### Stage D: full-system evaluation

Freeze preprocessing, model, calibration, thresholds, tiling, and postprocessing. Evaluate once on untouched target units and measure target-hardware behavior.

Stop when the current choice meets the requirement and remaining candidates are unlikely to change the decision enough to justify their cost.

## 11. Decide whether complexity earned its place

Choose the simplest candidate that:

- meets the target metric and guardrails on independent units;
- fits memory, latency, throughput, and license constraints;
- preserves measurement and geospatial semantics;
- behaves acceptably under declared shifts and missing-data states;
- has a maintained, reproducible implementation;
- improves enough over the baseline to justify added operational burden.

When candidates are practically tied, prefer the smaller, faster, better-supported, and easier-to-debug system. Do not claim a universal best architecture from a project-specific tie.

## 12. Minimum architecture decision record

Record:

- task, action unit, target population, and error costs;
- dataset, split, sensor, product, bands, units, GSD, support, and label version;
- baseline limitation that motivated each additional candidate;
- model family, implementation, weight source, license, and input adapter;
- patch, temporal window, output stride, pyramid levels, and decoder or head;
- loss, sampler, augmentation, optimizer, schedule, seed, and stopping rule;
- inference tiling, overlap, stitching, thresholding, matching, and postprocessing;
- selection metric, guardrails, subgroup results, and uncertainty;
- target-hardware latency, throughput, memory, and artifact paths;
- selected system, rejected candidates, and the evidence that decided the choice.

## 13. Failure rules

- Do not select from benchmark rank without target-domain evidence.
- Do not compare backbones while silently changing input support, data, augmentation, schedule, or postprocessing.
- Do not attribute a system-level gain to one component without an ablation.
- Do not assume more parameters, finer input, or a foundation model improves the target decision.
- Do not use parameter count or FLOPs as a substitute for target-hardware measurement.
- Do not ignore tile seams, border truncation, duplicate merging, or output georeferencing.
- Do not tune candidates on final test regions, times, sensors, or scenes.
- Do not keep a complex candidate when its measured gain is immaterial to the requirement.

## Source boundary

This reference fuses Tan and Le (2019), He et al. (2019), Isensee et al. (2021), Maier-Hein et al. (2024), PANGAEA, and the library's task, modality, training, validation, uncertainty, domain-adaptation, embeddings, and foundation-model references. Model names are examples of established families, not current rankings. Exact architectures, input sizes, schedules, thresholds, and resource limits require project evidence and current implementation verification.
