# Training, Fine-Tuning, and Model Adaptation

## Purpose and boundary

Use this reference after the prediction task, inputs, labels, split, and evaluation protocol are defined. It guides training from random initialization and adaptation of pretrained models for classification, detection, and segmentation.

It does not prescribe one optimizer, schedule, batch size, epoch count, adapter rank, or architecture. It also does not replace `validation-and-leakage.md`, `vision-tasks.md`, `foundation-models.md`, or the modality references. Dataset construction and annotation design are treated separately.

## 1. Freeze the scientific comparison before training

Write down:

- delivered task and primary validation criterion;
- training, validation, and untouched final-test groups;
- input product, bands, units, scaling, masks, grid, GSD, and normalization;
- label version and ignore policy;
- inference and post-processing contract;
- candidate initialization and adaptation regimes;
- compute and tuning budget;
- stop condition for the study.

Fit normalization, sampling rules, thresholds, calibration, early stopping, and checkpoint selection without using the final test set. A training run is not comparable after the split, labels, inputs, or metric changed.

## 2. Use an adaptation ladder

Start with the simplest regime that can answer the question:

1. conventional supervised baseline trained from random initialization;
2. frozen pretrained encoder with a linear head or linear decoder;
3. frozen encoder with a small nonlinear task head;
4. linear-probe-then-fine-tune when preservation of pretrained features is a material concern;
5. parameter-efficient or partial adaptation;
6. full fine-tuning.

Not every project needs every rung. Retain at least one conventional supervised baseline and one low-capacity frozen baseline when claiming transfer benefit. Move upward only when the previous regime exposes a material limitation and labels, compute, and deployment evidence justify more capacity.

**Durable principle:** More trainable parameters increase adaptation capacity, not guaranteed generalization.

## 3. Audit transfer compatibility

Before loading a checkpoint, record:

- pretraining sensors, products, bands, band order, units, scaling, normalization, and masks;
- spatial resolution, effective resolution, patch size, temporal support, and geographic scope;
- pretraining objective and output representation;
- known pretraining dates, regions, and downstream-benchmark overlap;
- architecture, exact checkpoint revision, code revision, and license;
- positional encoding, input-size, channel-adaptation, and metadata requirements.

A tensor with the expected shape is not necessarily a compatible measurement. Do not silently duplicate, drop, average, reorder, or synthesize bands. Document and validate any channel adapter, interpolation, patch-embedding replacement, or positional-encoding resize.

Use the checkpoint's documented input transform as the first transfer baseline. Treat a different normalization or resolution as an experiment.

## 4. Define the objective and sampling population together

For parameters \(\theta\), a regularized empirical objective can be written

\[
\widehat{R}(\theta)=\frac{1}{n}\sum_{i=1}^{n}
\ell\!\left(f_{\theta}(x_i),y_i\right)+\lambda\Omega(\theta).
\]

The apparent objective also depends on which samples enter each minibatch. Oversampling, hard-negative mining, crop selection, class weighting, focal terms, and ignore masks change the effective training population or error emphasis.

- Use class or sample weighting only for a stated cost or imbalance problem.
- Record the sampler and the before/after class and object distribution.
- Do not interpret scores trained with reweighting as calibrated probabilities without held-out calibration evidence.
- Keep unlabeled or uncertain regions distinct from confirmed negatives.

Training losses are optimization tools. Select and report evaluation metrics from the delivered task, as specified in `vision-tasks.md`.

## 5. Make optimization auditable

A generic stochastic-gradient update is

\[
\theta_{t+1}=\theta_t-\eta_t\widehat{\nabla}_{\theta}
\widehat{R}_t(\theta_t),
\]

where the implemented update also depends on the optimizer, momentum or adaptive state, weight decay, schedule, gradient clipping, precision, and parameter groups.

Record:

- optimizer and every parameter-group learning rate;
- schedule, warm-up, and schedule unit;
- weight decay and excluded parameters;
- device batch size, device count, accumulation steps, and effective batch size;
- number of optimizer steps and samples seen, not only epochs;
- gradient clipping and mixed-precision settings;
- trainable and frozen modules, including normalization layers;
- checkpoint and stopping rule.

Do not transfer a learning rate unchanged between full fine-tuning, a new head, LoRA, and training from scratch. Their trainable parameter sets and gradient scales differ.

### Minimum numerical checks

Before a full run:

1. verify input ranges, masks, labels, and a forward pass on a representative batch;
2. confirm finite loss and gradients;
3. deliberately overfit a very small training subset when practical;
4. inspect predictions in the task's spatial context;
5. confirm validation inference uses the intended evaluation mode and fixed preprocessing.

Failure to overfit a small clean subset indicates an implementation, capacity, label, or optimization problem; it is not evidence that more training data are needed.

## 6. Choose checkpoints and stopping without test leakage

Training loss answers whether the optimizer fits the training objective. Validation performance answers which configuration to retain for the declared target. They need not move together.

- Choose the monitored validation quantity before the run.
- Define whether improvement means a minimum, maximum, or multi-objective rule.
- Express patience in validation events or optimizer steps and record it.
- Save the best selected checkpoint and, when useful for diagnosis, the final checkpoint.
- Keep the final test set untouched until the configuration and post-processing are frozen.

There is no universal patience or epoch count. Ensure that a regime has had a credible opportunity to converge before declaring it inferior. Pretrained and randomly initialized models may require different schedules.

## 7. Diagnose before adding complexity

### Training and validation both poor

Check label/input correctness, loss masking, trainable parameters, learning rate, normalization, model capacity, spatial support, and whether the target is observable. More regularization is not the default response to underfitting.

### Training improves while validation degrades

Check leakage first, then distribution mismatch, label noise, capacity, augmentation validity, regularization, checkpoint timing, and subgroup behavior. Early stopping can select a better point but does not explain the cause.

### Aggregate score improves but deployment strata fail

Inspect region, acquisition, sensor, season, resolution, object size, class, and quality state. A pooled validation improvement does not establish the requested geographic or temporal transfer.

### Runs vary materially by seed

Report repeated runs or uncertainty across independent units. Do not select the most favorable seed. Investigate unstable sampling, tiny validation sets, optimization sensitivity, and rare-class support.

## 8. Frozen features and linear probing

A linear probe asks whether the target is accessible through a simple decision surface in the frozen representation. It is a representation diagnostic, not a universal production model.

Keep the encoder in evaluation mode unless the experiment explicitly updates stateful normalization. Cache features only when deterministic transforms, storage, and augmentation choices make that equivalent to online extraction.

A weak linear probe can mean the representation lacks the target information, exposes it nonlinearly, uses the wrong layer or pooling, or is incompatible with the input. Test a small nonlinear head before concluding that full fine-tuning is required.

## 9. Partial and parameter-efficient adaptation

Partial tuning can update the last blocks, bias terms, normalization parameters, adapters, prompts, or low-rank updates. Each choice defines a different hypothesis class.

For LoRA, an adapted weight can be represented as

\[
W = W_0 + \frac{\alpha}{r}BA,
\]

with frozen \(W_0\), rank \(r\), scaling \(\alpha\), and trainable factors \(A\) and \(B\). Record target modules, rank, scaling, dropout, trainable biases, and whether adapters are merged for inference.

Parameter-efficient does not automatically mean compute-efficient. Frozen layers still participate in the forward pass, and activations may still dominate runtime. Measure:

- trainable and total parameters;
- peak accelerator memory;
- samples or pixels per second;
- wall time to the selected checkpoint;
- checkpoint storage;
- final inference latency after any adapter merge.

**Requires current verification:** Framework implementations and supported target modules change. Inspect the exact model and adaptation code used.

## 10. Full fine-tuning

Full fine-tuning is justified when the target requires feature changes that frozen or constrained adaptation cannot supply and the label volume and validation design can support the added capacity.

- Initialize the task head explicitly and record it.
- Consider separate learning rates for new and pretrained parameters as a candidate to validate.
- Track whether normalization statistics are frozen, updated, or replaced.
- Compare feature preservation and shifted-domain performance when deployment differs from downstream training.
- Retain the frozen result: full fine-tuning can improve, preserve, or degrade generalization.

Linear-probe-then-fine-tune is a useful candidate when a randomly initialized head could initially send destructive gradients through a useful encoder. It is not mandatory and still requires target validation.

## 11. Task-specific training consequences

### Classification

- Distinguish single-label, multilabel, and hierarchical objectives.
- Track class support and per-class validation behavior.
- Tune decision thresholds on validation data for multilabel or cost-sensitive use.
- Evaluate calibration separately if scores are used as probabilities.

### Detection

- Record positive/negative assignment, matching, localization and classification loss weights, and duplicate suppression.
- Stratify validation by object size, density, orientation, truncation, and tile edge.
- Small per-device batches make normalization behavior consequential; record it rather than importing a recipe silently.
- Compare stitched-image detections, not only training crops.

### Semantic and instance segmentation

- Record crop sampling, ignore mask, class weighting, boundary or instance terms, and output stride.
- Ensure crops do not make rare classes or small objects disappear from the effective training population.
- Evaluate full mosaics for seams, boundaries, merges, splits, holes, counts, and minimum-area behavior.
- Do not add an overlap or boundary loss without an observed error and a compatible label definition.

## 12. EO-specific augmentation and adaptation

An augmentation should represent plausible nuisance variation while preserving the label. Geometry, illumination, spectral response, atmospheric effects, speckle, viewing direction, relief displacement, resampling, and compression are not interchangeable perturbations.

- Preserve physical units and validity masks through augmentation.
- Validate rotations and flips when north, illumination, orbit direction, or object orientation carries meaning.
- Do not use generic color jitter as proof of cross-sensor or atmospheric robustness.
- Match augmentation magnitude to observed or defensible deployment variation.
- Evaluate real held-out sensors, regions, seasons, or acquisitions; synthetic augmentation does not replace this test.

## 13. Fair model and adaptation comparisons

Hold constant:

- split, label version, input information, preprocessing, and evaluation support;
- downstream head or decoder capacity when comparing representations;
- post-processing and inference tiling;
- validation objective and test protocol.

Make tuning effort visible. Equal hyperparameters are not always fair because regimes have different optimization needs, but an unbounded search for one candidate is also unfair. State search spaces, trials, seeds, compute, and selection rule.

Report target performance together with resource use. A small accuracy change may not justify a large increase in memory, training time, operational complexity, or inference cost.

## 14. Minimum training record

Retain:

- dataset and label versions, split file, grouping variables, and seed;
- model, checkpoint, pretraining provenance, license, and code revision;
- exact input transform, bands, order, scaling, normalization, masks, GSD, and chip size;
- initialized, frozen, and trainable modules;
- optimizer, parameter groups, schedule, batch construction, steps, precision, and clipping;
- sampler, loss terms, weights, ignore handling, and augmentation configuration;
- checkpoint selection, early stopping, calibration, thresholds, and post-processing;
- metrics by relevant strata and variability across runs or independent units;
- trainable parameters, peak memory, wall time, throughput, inference cost, and artifact paths.

## Decision summary

- Use random initialization as a real baseline, not a deliberately under-trained control.
- Use frozen probes to test representation accessibility and preserve them as transfer baselines.
- Use PEFT when adaptation capacity is needed but full tuning cost or feature distortion is material.
- Use full fine-tuning only when its added capacity improves the declared target under a fair validation design.
- Treat every adaptation choice as conditional on the sensor, task, label volume, domain shift, and deployment objective.

## Source boundary

This reference fuses Goodfellow, Bengio, and Courville (2016), Bishop and Bishop (2024), He et al. (2019), Kumar et al. (2022), Hu et al. (2022), PANGAEA, and Marti Escofet et al. (2025), with the library's existing workflow, leakage, foundation-model, embedding, and modality references. Study-specific results are evidence for comparisons to perform, not universal recipes.
