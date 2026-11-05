# Validation, Leakage and Decision Assessment

## Purpose

Use this reference whenever a geospatial model, preprocessing choice, embedding, fusion method or delivered map is evaluated. Validation must support the stated deployment claim; a high score under an easier split is evidence for the easier problem only.

## 1. State the generalization claim first

**Status: durable principle.**

Specify what must be new at deployment:

- pixels or chips from known source scenes;
- objects within known regions;
- acquisitions or dates;
- seasons or environmental regimes;
- geographical regions;
- sensors, providers or processing baselines;
- surveys, events or projects.

The held-out unit must match that claim. Random pixel or chip splits usually estimate interpolation within shared spatial and acquisition context, not transfer to new regions or times.

## 2. Identify dependence before splitting

**Status: durable principle.**

Potential dependence includes:

- spatial autocorrelation and nearby context;
- overlapping chips or receptive fields;
- repeated observations of the same location or object;
- common source scenes, flight lines, mosaics or composites;
- shared annotation polygons or annotators;
- shared sensor, provider, processing baseline or survey;
- derived products made from the same source measurement;
- augmentation descendants of one sample.

Group dependent records so they cannot cross partitions. When a spatial buffer is needed, derive it from the phenomenon, sampling design, feature context and deployment claim; do not invent a universal distance.

## 3. Preserve train, validation and test roles

**Status: durable principle.**

- **Training:** fit model parameters and all learned preprocessing.
- **Validation:** select architectures, hyperparameters, checkpoints, features, thresholds and postprocessing.
- **Test:** estimate performance for the fixed system after selection is complete.

Repeatedly consulting test performance turns the test set into selection data. If the test has been used for decisions, label it accordingly and obtain new untouched evidence for a final claim.

## 4. Fit every data-dependent transform inside training

**Status: durable principle.**

The following can leak held-out information:

- normalization and imputation statistics;
- PCA and other dimensionality reduction;
- feature selection and band selection;
- clustering, codebooks and prototypes;
- nearest-neighbour reference pools;
- class balancing based on global counts;
- calibration and threshold fitting;
- learned registration, harmonization or denoising;
- label-derived sampling rules;
- early stopping and checkpoint selection.

Fit them on training data, or on training plus validation only after the design is fixed and before evaluation on an untouched final test. Record the scope used for fitting.

## 5. Prevent geospatial leakage modes

**Status: domain-specific guidance derived from durable principles.**

Check explicitly for:

- neighboring pixels from one polygon in different partitions;
- overlapping or adjacent chips sharing scene context;
- the same acquisition in training and nominally held-out regions;
- temporal composites containing observations from evaluation dates;
- labels or ancillary layers derived from the target product;
- source-date, seamline or processing artifacts correlated with class;
- global normalization or feature reduction fitted before splitting;
- duplicate objects created by tiling;
- pretrained data overlap when benchmark memorization is plausible and documented information is available.

Spatial separation alone does not guarantee independence if source acquisition or processing spans the boundary.

## 6. Choose metrics from the decision and output

**Status: durable principle.**

Define the denominator, averaging, unit and aggregation for every metric.

- Pixel classification: confusion matrix, per-class precision and recall, IoU or Dice as appropriate.
- Object detection: matching rule, IoU or distance threshold, size strata, precision-recall and count error.
- Regression: error distribution, bias, scale-dependent error and uncertainty where relevant.
- Change detection: event, object or area metrics separated by change type and temporal support.
- Delivered vector data: geometry, boundary, topology, duplication and minimum-mapping-unit behavior.

Class imbalance makes overall accuracy insufficient. Pixel metrics can hide object merges, splits, count errors and boundary failures. Choose additional measures only when they answer an operational question.

## 7. Separate ranking, calibration and decisions

**Status: durable principle.**

Discrimination asks whether cases are ordered usefully. Calibration asks whether probabilities correspond to observed frequencies under the evaluated conditions. A decision rule combines predictions with costs and constraints.

- report probabilistic scores when probability quality is claimed;
- assess calibration on held-out data representative of use;
- select thresholds using validation data and stated costs or product objectives;
- include rejection or human review when its cost is preferable to uncertain automation;
- revalidate thresholds when prevalence or operating conditions change.

Calibration on one region or time does not establish calibration after distribution shift.

## 8. Quantify variability at an independent unit

**Status: durable principle.**

Thousands of correlated pixels do not constitute thousands of independent replications. Estimate variability across meaningful units such as regions, scenes, acquisitions, events or surveys.

Report:

- number of independent units and their sampling design;
- variation across those units;
- random seeds when training stochasticity is material;
- uncertainty method and its assumptions;
- missing or failed units and how they were handled.

Do not imply population-level precision from pixel-level resampling that ignores spatial dependence.

## 9. Use controlled comparisons

**Status: durable principle.**

For preprocessing, fusion or model changes, keep the footprint, labels, split and evaluation fixed while changing the factor under study. Report both the intended intermediate effect and the downstream task effect.

Essential comparisons include:

- simple baseline versus proposed method;
- each modality alone versus fusion;
- raw or engineered EO variables versus embeddings;
- native versus transformed or fused products when physical values matter;
- prediction before versus after postprocessing;
- frozen representation versus adaptation when transfer is claimed.

An ablation supports only the factor it isolates. A bundled pipeline comparison cannot identify which component caused the difference.

## 10. Test transfer directly

**Status: durable principle.**

When claiming transfer, evaluate the corresponding shift:

- region-to-region;
- year-to-year or season-to-season;
- sensor-to-sensor;
- provider-to-provider;
- processing-version-to-processing-version;
- resolution or scale change;
- label-policy or annotator change.

Stratify errors by relevant metadata and inspect maps. A pooled score can conceal systematic failure in a deployment subgroup.

## 11. Distinguish uncertainty sources

**Status: durable principle.**

State whether uncertainty represents observation noise, label ambiguity, parameter uncertainty, ensemble variation, posterior approximation or distribution shift. Validate the property actually claimed.

- softmax confidence is not automatically calibrated uncertainty;
- model ensembles estimate only variation represented by their members;
- Bayesian approximations remain conditional on model and prior assumptions;
- out-of-distribution detection needs genuinely shifted held-out cases;
- uncertainty without a decision policy may not improve operational outcomes.

## 12. Evaluate the final artifact

**Status: durable principle.**

Run final checks after thresholding, morphology, overlap merging, polygonization and simplification. Verify:

- CRS, transform and units;
- object matching, duplicates, merges and splits;
- boundaries, holes, self-intersections and shared topology;
- minimum-area and connectivity behavior;
- NoData and excluded regions;
- geographic patterns of error;
- reproducibility from recorded inputs and configuration.

The network output and delivered map are different evaluated systems when postprocessing changes the result.

## 13. Minimum validation record

For each reported result, retain:

1. target population and generalization claim;
2. split unit, grouping, buffers and fixed split identifiers;
3. preprocessing fit scope;
4. model-selection history and validation criterion;
5. untouched-test status;
6. metric definitions, averaging and evaluation unit;
7. independent sample counts and variability;
8. threshold, calibration and postprocessing selection;
9. subgroup and mapped-error inspection;
10. applicability limits and known leakage risks.

## Source boundary

This reference fuses the dependence, validation and decision principles in Corley (2026), Bishop (2006), Goodfellow et al. (2016), and Bishop and Bishop (2024). Use `spatial-statistics-and-validation.md` for spatial covariance, change of support, structured cross-validation, probability sampling, design-based map accuracy and area estimation.
