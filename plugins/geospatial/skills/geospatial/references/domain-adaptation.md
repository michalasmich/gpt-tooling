# Domain Adaptation for Earth Observation

## Purpose and boundary

Use this reference when a model developed in one domain must operate in another. A domain is a declared population of observations and targets, not merely a dataset name. In Earth observation, domains can differ by geography, season, sensor, platform, product, processing baseline, spatial support, resolution, target prevalence, or labeling process.

Domain adaptation can improve target performance when the source and target tasks are compatible and the allowed target data contain useful evidence. It cannot make an undefined target, changed ontology, unobservable phenomenon, or invalid measurement chain transferable.

## 1. Define source, target, and transfer claim

For every source and target domain, record:

- geography, dates, seasons, events, and environmental conditions;
- sensor, platform, bands or polarizations, spectral response, orbit, view geometry, and product;
- processing level, collection, calibration, correction, resampling, mosaicking, and quality masks;
- GSD, effective spatial resolution, point-spread function, temporal cadence, and spatial or temporal support;
- target definition, ontology, units, prevalence, reference source, and annotation process;
- prediction unit and intended action;
- data available during training, adaptation, validation, calibration, testing, and deployment.

State the claim precisely. Examples include transfer to a new region from the same sensor, a new sensor over known regions, a future season, a finer spatial support, or an unseen combination of several shifts. A single aggregate `cross-domain` score hides these different claims.

## 2. Name the learning setting from target access

Choose the setting before the method:

| Setting | Target access before final evaluation | Valid claim |
|---|---|---|
| Source-only transfer | None | Performance of the unchanged source-trained model |
| Domain generalization | No target-domain observations; multiple or varied source domains may be available | Generalization to an unseen domain drawn from the declared family |
| Unsupervised domain adaptation | Unlabeled target observations | Adaptation to that observed target population |
| Semi-supervised or supervised adaptation | Some labeled target observations | Transfer to target cases not used for fitting or selection |
| Source-free adaptation | Source model plus target observations; source data unavailable | Adaptation without revisiting source records |
| Test-time adaptation | Incoming unlabeled target batches during inference | Performance of a stateful online update policy |
| Continual adaptation | An ordered stream with recurring or evolving domains | Performance over the declared stream and forgetting behavior |

Using target imagery to select augmentations, normalization, checkpoints, features, stopping rules, or hyperparameters is target-domain access. It is not domain generalization.

## 3. Diagnose the shift before adapting

Distinguish at least these mechanisms:

### Measurement or covariate shift

The observation distribution changes. Examples include sensor spectral response, SAR incidence angle, atmospheric state, GSD, point-spread function, view geometry, season, illumination, or preprocessing. The target relationship may remain usable, but this must be tested.

### Prevalence or label shift

Class or target prevalence changes while class-conditional observation behavior may remain similar. Reweighting or prior correction can be relevant only when its assumptions are plausible and target prevalence can be estimated.

### Conditional or concept shift

The relationship between observations and targets changes. Examples include a changed ontology, phenology-target relationship, management practice, spatial support, or sensor observability. Feature alignment alone cannot generally solve this shift.

### Label-space shift

Source and target categories differ:

- **closed set:** the label spaces match;
- **partial:** target labels are a subset of source labels;
- **open set:** target contains unknown classes;
- **universal:** both domains can contain private classes.

Closed-set methods can force unknown target cases into known classes. If the target label space is uncertain, combine adaptation with explicit unknown detection, abstention, and label-space evaluation.

Several mechanisms can occur together. Record the evidence for each mechanism rather than assigning one generic domain-shift label.

## 4. Remove avoidable measurement mismatch first

Before learning an invariant representation, verify:

- CRS, datum, footprint, transform, and alignment;
- units, scale, offset, NoData, valid range, and bit depth;
- band or polarization meaning and ordering;
- radiometric or backscatter calibration and terrain or atmospheric correction;
- spectral response, point-spread function, GSD, and resampling history;
- temporal support, acquisition timing, and quality masks;
- label support, reference date, ontology, and rasterization.

Use physically defensible harmonization when the products permit it. Do not ask a domain discriminator to hide a unit error, band swap, geolocation error, or processing-version mismatch.

Harmonization also changes information. Record any resampling, spectral transformation, filtering, normalization, or resolution degradation and validate its effect on the target.

## 5. Build leakage-safe domain partitions

Assign immutable domain and parent identifiers before tiling or augmentation. Keep dependent scenes, acquisitions, objects, time series, mosaics, and annotation sources together when crossing partitions would leak information.

Use distinct target roles:

- **target adaptation:** unlabeled or labeled observations allowed to update the model;
- **target validation:** labeled observations used for method, hyperparameter, stopping, or threshold choices;
- **target calibration:** observations used for probability or conformal calibration when required;
- **target final test:** untouched observations used only after the system is frozen.

An unlabeled target image can still leak deployment information through normalization, early stopping, model selection, pseudo-label filtering, or batch composition. Document every target-data touch.

For new-region claims, partition by independent geographic units. For future-time claims, respect temporal order. For new-sensor claims, hold out the sensor or product lineage. When the claim combines axes, the test must hold out the combination rather than one convenient axis.

## 6. Use the simplest adaptation ladder that addresses the shift

Evaluate methods in this order unless evidence justifies skipping a rung:

1. **Source-only baseline.** Establish the actual transfer gap.
2. **Measurement harmonization.** Correct known physical and product inconsistencies.
3. **Diverse-source training and declared augmentations.** Cover plausible variation without target access.
4. **Frozen representation or linear head.** Use when a suitable pretrained representation exists and target labels are limited.
5. **Supervised target fine-tuning.** Prefer this when representative target labels are available.
6. **Reweighting or discrepancy alignment.** Use when the shift and assumptions support it.
7. **Domain-adversarial alignment.** Use as a closed-set UDA baseline with target validation.
8. **Pseudo-label or self-training methods.** Add only with controls for confirmation bias and class collapse.
9. **Source-free or test-time adaptation.** Use only when source access is impossible or online updating is an operational requirement.

More complex adaptation must improve held-out target decisions enough to justify its data access, instability, compute, and maintenance.

## 7. Use supervised target evidence when it is available

Representative labeled target data directly measures the target relationship. Compare:

- training only on target labels;
- source initialization with a frozen encoder and target head;
- constrained adaptation such as partial unfreezing or parameter-efficient tuning;
- full fine-tuning;
- source-target mixed training when source retention matters.

Match optimization budget and selection protocol. Separate gains from pretrained representation, extra data, target access, and larger compute. Preserve the source-only result so the transfer gap remains visible.

Small target sets can be unrepresentative. Sample across the shift axes and independent target units instead of collecting many nearby pixels from one scene.

## 8. Use DANN as an alignment baseline, not proof of invariance

Domain-adversarial neural networks optimize a source task loss while a gradient-reversal branch discourages domain discrimination. This is appropriate to test when:

- source labels and unlabeled target observations are available together;
- source and target share the task and label space;
- the target shift is expected to preserve a useful common representation;
- a labeled target validation set can detect negative transfer.

Evaluate source-only and DANN under identical backbones, data, augmentation, compute, and target-validation rules. Inspect classwise target behavior, not only aggregate accuracy or a domain-classifier score.

Do not interpret domain confusion as proof that features are physically invariant, class-conditionally aligned, or safe. A representation can remove target information or align different classes while confusing the domain classifier.

## 9. Control pseudo-label and self-training feedback

Pseudo-label methods turn model predictions into training targets. Their main risk is confirmation bias: systematic errors become reinforced labels.

Required controls include:

- preserve raw predictions and original unlabeled records;
- select pseudo-label rules on development evidence only;
- monitor class and target-range composition;
- prevent one dominant class from absorbing the target set;
- keep uncertain, unknown, and unobservable cases out of forced labels;
- compare with no-adaptation and supervised-target baselines;
- evaluate several independent target groups;
- version each update round and retain rollback checkpoints.

A calibrated probability can support a selection rule under similar conditions. It does not prove that a pseudo-label is correct after shift.

## 10. Treat test-time adaptation as a stateful system

Test-time adaptation changes model state using incoming observations. Define:

- initial checkpoint and normalization state;
- parameters allowed to update;
- objective, optimizer, learning rate, and update frequency;
- batch construction and minimum batch diversity;
- whether updates reset per scene, region, orbit, or deployment;
- order of observations and handling of repeated cases;
- drift, collapse, and resource monitors;
- rollback and safe frozen-model fallback;
- whether predictions are emitted before or after each update.

Evaluate on ordered deployment-like streams. Randomly shuffling target data can hide order sensitivity and future information use. Report pre-adaptation, online, and post-adaptation performance, plus worst groups and forgetting where source or earlier-domain performance matters.

Entropy minimization is a baseline for compatible models and shifts. It can become confidently wrong. Use target-domain evidence before enabling state changes in production.

## 11. Match evaluation to the transfer claim

Report:

- source-domain and target-domain task metrics;
- the source-only transfer gap;
- absolute adaptation gain over source-only;
- target-only or supervised-target reference when labels permit it;
- class, target-range, region, season, sensor, resolution, and quality-state results;
- calibration and risk-coverage behavior when outputs drive decisions;
- compute, target-data volume, label count, latency, and model-state cost;
- negative transfer cases and the fraction of target units harmed;
- results across independent target domains when the claim is broader than one target.

A method adapted and tuned to one target domain supports a claim about that observed target population. It does not establish generalization to arbitrary unseen domains.

For segmentation and dense prediction, count independent scenes, regions, or acquisitions in addition to pixels. For detection, report size and density strata and evaluate missed objects, not only accepted boxes. For regression, preserve units and evaluate bias and error across target range.

## 12. Decide whether adaptation succeeded

Retain the adapted method only when it:

- improves the prespecified target decision metric on untouched target units;
- does not create unacceptable class, region, sensor, or quality failures;
- preserves required calibration or abstention behavior;
- has a reproducible target-access and update protocol;
- improves enough to justify added compute, state, data governance, and maintenance;
- remains within the declared label space and measurement semantics.

If adaptation does not materially beat source-only transfer, keep the simpler model and report the null result. If target labels reveal concept or label-space shift, revise the target, data, or decision rather than forcing alignment.

## 13. Minimum reproducibility record

Record:

- source and target definitions, versions, manifests, and split groups;
- target access by lifecycle stage;
- sensor and product metadata and all harmonization transforms;
- model, initialization, frozen and trainable parameters, and seed;
- source, target, alignment, and pseudo-label objectives and weights;
- batch composition, sampling, normalization, and update order;
- checkpoint selection and stopping rule;
- target validation, calibration, and final-test identities;
- metrics, subgroup results, uncertainty, compute, and artifact paths;
- rollback state and failure conditions for online adaptation.

## 14. Failure rules

- Do not call a method domain generalization after it used target observations for development.
- Do not align domains before verifying units, bands, grids, support, and label definitions.
- Do not assume matching marginal feature distributions means matching classes or targets.
- Do not use closed-set adaptation when target-private classes are plausible without unknown detection.
- Do not tune on the same target scenes used for final evaluation.
- Do not treat pseudo-label confidence as reference truth.
- Do not enable stateful test-time updates without an ordered-stream evaluation and rollback path.
- Do not claim broad unseen-domain robustness from adaptation to one known target.

## Source boundary

This reference fuses Ben-David et al. (2010), Ganin et al. (2016), Wang et al. (2021), Peng et al. (2022), Ma et al. (2024), and the library's dataset, validation, uncertainty, training, modality, and foundation-model references. Method rankings, adaptation weights, pseudo-label thresholds, batch sizes, and update schedules require target-domain evidence.
