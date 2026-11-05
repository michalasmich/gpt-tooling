# Calibration, Uncertainty, OOD Detection, and Abstention

## Purpose and boundary

Use this reference when model outputs influence review, intervention, mapping, or resource allocation. It defines how to evaluate probability quality, identify unsupported inputs, express predictive uncertainty, and defer decisions.

These controls do not repair an invalid target, a leaking split, poor reference data, sensor mismatch, or an unsuitable validation design. Establish those foundations first.

## 1. Start from the decision, not an uncertainty method

Write the delivered action and failure costs:

- What decision uses the output?
- Is a point prediction required, or can the system return a set, interval, flag, or no decision?
- What happens after deferral: human review, another sensor, field inspection, a safer model, or no action?
- Which errors are costly, and how costly is abstention?
- At what unit is action taken: pixel, object, parcel, scene, event, or region?
- Which deployment shifts must the system recognize or survive?

An uncertainty layer is useful only if it changes an action, interpretation, or evidence claim.

## 2. Keep five questions separate

### Discrimination or ranking

Does the score rank positive cases above negative cases, or easier cases above harder cases? AUROC, average precision, and ranking statistics answer versions of this question. They do not establish probability calibration.

### Calibration

For predictions assigned probability \(p\), does the event occur about a fraction \(p\) of the time in the evaluated population? Calibration is population- and condition-specific.

### Predictive uncertainty

How concentrated is the predictive distribution, set, or interval for this target? The output may combine observation noise, target ambiguity, label uncertainty, model uncertainty, and distribution shift. Do not claim that a scalar cleanly identifies one source unless the method and experiment establish that decomposition.

### Out-of-distribution detection

Does the input depart from the development distribution in a way that matters to model validity? OOD is not an intrinsic label on an image. It is defined relative to a reference population, representation, and operational failure mode.

### Selective action

Should the system accept the prediction, return a richer uncertainty object, or defer? This is a decision rule with a coverage-cost trade-off, not a property supplied by confidence alone.

## 3. Enumerate uncertainty sources in the EO chain

Record plausible uncertainty from:

- sensor noise, saturation, quantization, calibration, and geolocation;
- atmospheric correction, terrain correction, orthorectification, mosaicking, resampling, and cloud or shadow masking;
- spatial support, mixed pixels, point-spread function, scale mismatch, and temporal mismatch;
- reference measurement, interpretation, ontology, rasterization, positional error, and incomplete labels;
- finite or biased sampling across geography, time, sensor, quality, and target range;
- model specification, parameter estimation, optimization, and stochastic training;
- changed prevalence, covariates, conditional relationships, sensor products, or processing versions.

Preserve these sources in the data and method record. A model-derived entropy raster is not a substitute for sensor or reference uncertainty metadata.

## 4. Establish probability quality before thresholding

For classification, evaluate at least:

- a proper scoring rule such as negative log likelihood or Brier score;
- a reliability diagram or equivalent calibration curve;
- a declared scalar summary when useful, with its binning or estimation rule;
- sample counts and outcome prevalence for the evaluated population;
- task performance at the same operating conditions.

For multiclass or multilabel tasks, distinguish top-label confidence, classwise calibration, and calibration of all probabilities. A good top-label diagram does not establish classwise calibration.

Expected calibration error is a diagnostic, not a complete calibration certificate. It depends on bin construction, sample size, and aggregation. Do not compare values computed with different rules as though they were the same measurement.

For regression, use a proper probabilistic score when a predictive distribution exists. Check interval coverage and width across target range and relevant groups. Mean error alone does not assess uncertainty.

## 5. Use post-hoc calibration with clean lifecycle roles

The minimum classification baseline is scalar temperature scaling when all of these conditions hold:

- logits are available;
- a representative labeled calibration subset exists;
- model and preprocessing choices are already fixed;
- the calibrated probabilities will be used under sufficiently similar conditions.

Fit the temperature \(T>0\) on calibration data by minimizing negative log likelihood:

\[
\hat{p}(y=k\mid x)=\operatorname{softmax}(z(x)/T)_k.
\]

The scalar temperature preserves the class ordering. It does not improve discrimination or make shifted inputs safe.

Keep four roles separate:

1. training data fit model parameters;
2. validation data select model, preprocessing, and training decisions;
3. calibration data fit probability transforms, conformal quantiles, or decision thresholds;
4. final test data evaluate the frozen system.

Validation and calibration may share a development pool only under a declared nested or otherwise defensible design. Repeatedly choosing calibration methods from the same subset turns that subset into model-selection data.

## 6. Use an ensemble only when it earns its cost

A deep ensemble trains models independently and averages predictive distributions:

\[
\bar{p}(y\mid x)=\frac{1}{M}\sum_{m=1}^{M}p_m(y\mid x).
\]

Member disagreement can be a useful diagnostic. Start with the selected single model. Add an independently trained ensemble when probability quality or shifted-domain behavior is consequential and the added training, storage, and inference cost is acceptable.

Compare the single model and ensemble on:

- task performance;
- proper scores and calibration;
- risk-coverage behavior;
- named deployment shifts;
- latency, memory, energy, and operational complexity.

Do not assume that members are independent evidence. Shared data, architecture, initialization family, preprocessing, and optimization can produce correlated failures.

## 7. Define OOD by plausible deployment shifts

Create a shift register before selecting an OOD method. Relevant axes can include:

- new geographic or ecological region;
- new season, year, event, or temporal cadence;
- new sensor, platform, provider, orbit, view geometry, or spectral response;
- new processing level, collection, baseline, atmospheric correction, or resampling;
- new GSD, point-spread function, tiling, compression, or bit depth;
- cloud, haze, snow, shadow, saturation, missing bands, radio-frequency interference, or low signal-to-noise states;
- changed class prevalence, target range, ontology, or labeling process.

Build OOD evaluation sets from realistic known shifts and difficult in-distribution cases. Synthetic corruptions can characterize sensitivity but cannot replace target-domain evidence.

For each detector, report:

- the in-distribution and shifted populations;
- detection unit and score direction;
- AUROC or precision-recall measures when they answer the ranking question;
- false alarms at operationally relevant acceptance conditions;
- task error among accepted cases;
- coverage by shift type and important subgroup;
- failure examples and spatial distribution.

Maximum softmax probability is the minimum classifier baseline. It can be useful for ranking some errors and shifted cases, but a high value is not proof that an input is supported.

## 8. Evaluate abstention with risk and coverage

For a selection rule \(g(x)\in\{0,1\}\), define empirical coverage as

\[
\widehat{C}=\frac{1}{n}\sum_{i=1}^{n}g(x_i),
\]

and selective risk for loss \(\ell\) as

\[
\widehat{R}=\frac{\sum_{i=1}^{n}g(x_i)\,\ell(f(x_i),y_i)}{\sum_{i=1}^{n}g(x_i)},
\]

when at least one case is accepted.

Plot or tabulate the risk-coverage curve. Also report:

- total cases and accepted cases;
- risk among accepted cases;
- error and composition among deferred cases;
- coverage and risk by region, time, sensor, class, target range, and quality state;
- downstream review capacity and cost;
- the frozen threshold and data used to select it.

Choose the operating point from operational cost, required review capacity, or a defensible risk requirement. Do not invent a confidence cutoff such as 0.5, 0.9, or 0.95.

An abstention policy must define the fallback. A blank map cell, `unknown` class, human-review queue, and alternate model have different consequences.

## 9. Use conformal prediction for sets or intervals, with its assumption visible

Split conformal prediction uses a labeled calibration set to convert a fitted model's nonconformity scores into a quantile. For calibration size \(n\) and miscoverage level \(\alpha\), a common finite-sample quantile level is

\[
q=\frac{\lceil(n+1)(1-\alpha)\rceil}{n},
\]

subject to the implementation's quantile convention.

For classification with score \(s(x,y)=1-\hat{p}(y\mid x)\), include labels satisfying \(s(x,y)\leq \hat{q}\). For regression with absolute-residual scores, form an interval around the point prediction using the calibrated residual quantile.

Record:

- training, model-selection, calibration, and test partitions;
- nonconformity score and quantile convention;
- target \(\alpha\);
- empirical marginal coverage;
- set size, interval width, empty sets, and uninformative full sets;
- coverage and efficiency across material groups and shifts.

The finite-sample marginal coverage claim requires exchangeability between calibration and future cases. Spatial or temporal dependence and deployment shift can break this condition. Random pixels from one scene rarely provide convincing exchangeability for a new-region claim. Use parent-level spatial, temporal, or sensor grouping and evaluate on the actual transfer unit.

Marginal coverage is not conditional coverage. A method can meet overall coverage while under-covering a rare class, geography, season, or target range. Report these group diagnostics as characterization unless the chosen method supplies a valid group-specific guarantee.

## 10. Apply task-specific uncertainty semantics

### Classification

- Distinguish predicted class, class probabilities, calibrated confidence, OOD score, and abstention flag.
- Evaluate classwise behavior when costs differ by class.
- Preserve `unknown`, `unobservable`, and `deferred` separately from ordinary classes.

### Detection and instance segmentation

- Separate class uncertainty, objectness, localization, duplicate matching, and missed-object uncertainty.
- Evaluate abstention at the action unit. Rejecting one low-score box does not express uncertainty about an entirely missed object.
- Match predictions and references before interpreting confidence; the matching rule is part of the evaluation.

### Semantic segmentation

- Pixel probabilities are spatially dependent. Pixel counts do not equal independent evidence.
- Evaluate object, region, boundary, and parent-scene behavior when those units drive decisions.
- Distinguish ambiguous boundaries and unobservable pixels from confident background.

### Regression and retrieval

- Preserve output units, support, reference uncertainty, censoring, and physical bounds.
- Report interval coverage and width across target range and environmental conditions.
- Check whether intervals widen under poor observation quality and unsupported conditions, but do not treat widening alone as validation.

### Change and time series

- Preserve uncertainty from every contributing acquisition and mask.
- Evaluate shifts in cadence, missing observations, season, event type, and sensor composition.
- Define whether abstention applies to a date, transition, event, pixel trajectory, or delivered change object.

## 11. Deliver uncertainty as a geospatial product

For every uncertainty, OOD, or abstention layer, preserve:

- CRS, transform, extent, pixel alignment, resolution, and spatial support;
- units, valid range, dtype, scale, offset, NoData, and masks;
- model, checkpoint, ensemble members, calibration version, and threshold version;
- source imagery, sensor, product, dates, processing baseline, and quality state;
- semantic definition of each band or field;
- whether the value is a probability, entropy, variance, interval bound, set size, OOD score, or decision flag;
- applicable population and known invalid conditions.

Do not call every auxiliary score `confidence`. Use a name that states what the value means.

## 12. Minimum operational workflow

1. Define the action, error costs, deferral path, and target population.
2. Freeze group-aware training, validation, calibration, and final-test roles.
3. Train the simplest credible task model and retain raw outputs.
4. Measure task performance, proper scores, and calibration in distribution.
5. Fit temperature scaling as the classification baseline when appropriate.
6. Evaluate named geographic, temporal, sensor, resolution, and quality shifts.
7. Add an ensemble, conformal layer, or specialized OOD method only for a demonstrated limitation.
8. Evaluate risk-coverage behavior and subgroup coverage.
9. Select and freeze the operating policy on development evidence.
10. Evaluate once on the untouched final population and release the complete geospatial metadata.

## 13. Minimum record for a defensible result

Record:

- dataset and split versions, dependence groups, and hashes where practical;
- model, weights, preprocessing, seed, and software environment;
- calibration method, calibration population, sample size, and fitted parameters;
- uncertainty or OOD method and score definition;
- abstention threshold, selection rule, and fallback action;
- task metrics, proper scores, calibration views, coverage, selective risk, and efficiency;
- results by declared shift and material subgroup;
- output artifact paths and geospatial metadata;
- limitations, invalid conditions, and remaining unverified deployment domains.

## 14. Failure rules

- Do not infer calibration from accuracy or AUROC.
- Do not infer OOD safety from calibrated in-distribution probabilities.
- Do not fit calibration transforms, conformal quantiles, or thresholds on final test data.
- Do not report a conformal guarantee without stating the exchangeability condition and coverage type.
- Do not treat ensemble disagreement as complete epistemic uncertainty.
- Do not tune an abstention threshold without specifying coverage, cost, and fallback.
- Do not summarize spatially dependent pixels as though they were independent cases.
- Do not transfer a calibration or abstention rule across sensors, regions, seasons, or product versions without validation.

## Source boundary

This reference fuses Guo et al. (2017), Lakshminarayanan et al. (2017), Hendrycks and Gimpel (2017), Geifman and El-Yaniv (2017), Ovadia et al. (2019), Singh et al. (2024), and the library's existing validation, spatial-statistics, dataset-engineering, and task references. Project thresholds, ensemble size, calibration-set size, target coverage, and acceptable deferral rate require operational requirements or project evidence.
