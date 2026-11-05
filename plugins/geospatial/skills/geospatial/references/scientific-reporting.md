# Scientific Reporting for Geospatial Deep Learning

## Purpose

Use this reference when drafting or reviewing a paper, technical report, proposal or methods description. Its purpose is to make claims traceable to data, implementation and evidence. It is not a substitute for a venue's author instructions.

## 1. Separate facts, inferences and recommendations

**Status: durable principle.**

- **Observed fact:** directly established by inspected data, metadata, implementation, output or cited source.
- **Inference:** interpretation supported by observations and stated assumptions.
- **Recommendation:** proposed action based on evidence, constraints and tradeoffs.

Use language that preserves the distinction. Do not turn an architectural intention into an observed capability, an internal visualization into an explanation, or a benchmark result into operational performance.

## 2. Match the claim to the evidence

**Status: durable principle.**

Examples of defensible boundaries:

- A random within-scene split supports interpolation within shared scene context, not transfer to new regions.
- Performance on one sensor and geography supports that evaluated setting, not sensor-independent robustness.
- An ablation supports the isolated change, not every component of a bundled method.
- A visually coherent embedding or attention map does not establish physical meaning or causality.
- A generated image that looks realistic is not a calibrated sensor observation.
- A preprint, developer evaluation and independent peer-reviewed replication have different evidential weight.

Avoid `proves`, `guarantees`, `solves`, `understands`, `generalizes` and `state of the art` unless the design and comparison genuinely support the precise statement.

## 3. Report the complete measurement-to-decision chain

**Status: durable principle.**

### Study definition

- research question and operational motivation;
- target phenomenon and class or variable definition;
- study area, temporal period and intended population;
- output type, mapping unit and failure consequences.

### Data and measurements

- sensor, platform, product, collection and processing baseline;
- acquisition dates and selection query;
- bands, polarizations or returns and their physical meaning;
- units, scale, offset, valid range, masks and NoData;
- CRS, transform, spatial resolution and relevant spectral or temporal support;
- geometry, illumination, terrain and atmospheric information when material;
- source identifiers, licensing and access date.

### Reference data

- source, date, sampling design and operational definition;
- annotation process, annotator information and quality control;
- positional, thematic and temporal uncertainty;
- rasterization, matching and exclusion rules;
- meaning of background, unknown and unannotated regions.

### Processing

- calibration, correction, harmonization and masking;
- resampling kernels and output grids;
- mosaicking, compositing and fusion;
- chipping, overlap, padding and boundary handling;
- normalization and the data used to fit its statistics;
- augmentation and its label-preservation assumptions.

### Model and training

- architecture, checkpoint, pretraining source and license;
- input channels and tensor geometry;
- objective, class weighting, masks and reduction;
- trainable and frozen components;
- optimizer, schedule, batch construction, stopping and checkpoint selection;
- random seeds, software versions and relevant hardware;
- hyperparameter-selection procedure.

### Validation and delivery

- split unit, grouping, spatial or temporal separation and leakage controls;
- training, validation and test roles;
- baseline and ablation definitions;
- threshold, calibration and postprocessing selection;
- inference tiling and overlap merging;
- metric definitions, averaging, independent units and uncertainty;
- subgroup, spatial-error and failure-case analysis;
- final raster or vector validation.

## 4. Use equations only when they specify the implemented method

**Status: durable principle.**

An equation belongs in a paper when it removes ambiguity about a measurement conversion, objective, model component, decision rule or metric. Define every symbol, index, unit, mask and reduction needed to connect it to the implementation.

Do not include a generic equation merely to make the method appear rigorous. Check that:

- the formula matches the code and product documentation;
- constants, coefficients and units are those actually used;
- categorical and continuous cases are not conflated;
- loss weighting, ignored labels and reduction are explicit;
- approximations and boundary conditions are stated;
- the equation's assumptions are discussed when they affect interpretation.

Useful equation classes include:

- sensor-specific radiometric or geometric conversions;
- likelihood or task loss;
- regularization and complete training objective;
- fusion or similarity calculation;
- threshold or expected-loss decision rule;
- metric and object-matching definition;
- uncertainty or calibration quantity.

## 5. Describe probability and uncertainty precisely

**Status: durable principle.**

State:

- random variables and conditioning information;
- assumed output distribution or likelihood;
- prior or regularization where relevant;
- whether parameter uncertainty is represented;
- approximation or sampling method;
- calibration procedure and evaluation population;
- how uncertainty changes the decision, such as abstention or review.

Do not call an uncalibrated score a probability. Do not call predictive entropy epistemic uncertainty without the required model and evidence. A Bayesian formulation remains conditional on its likelihood, prior and model adequacy.

## 6. Report comparisons fairly

**Status: durable principle.**

Comparisons must use the same data partitions, evaluation units and information access unless the difference is the subject of study. Report:

- exact baseline implementation and tuning effort;
- pretrained data or external information;
- compute or parameter differences when relevant;
- mean and variation over meaningful independent units or seeds;
- negative and mixed results;
- whether improvements persist across regions, dates, classes and object sizes.

Do not describe a weakly tuned baseline as evidence that a new component is necessary.

## 7. Present results at the level of the claim

**Status: durable principle.**

- Give exact denominators and sample units.
- Report class-specific results when imbalance matters.
- Include map- or object-level measures for delivered mapping products.
- Report bias as well as aggregate error for regression.
- Show geographic or temporal variation when transfer is claimed.
- Distinguish statistical variability from practical importance.
- Show representative failures selected by a stated method, not only attractive examples.

Tables and figures should answer a question. Captions must state what was measured, on which split and with which aggregation.

## 8. Write limitations as decision boundaries

**Status: durable principle.**

A useful limitation states:

1. what was not established;
2. why the design cannot establish it;
3. where the result may therefore fail;
4. what evidence would be needed to extend the claim.

Material limitations can include geography, season, sensor, processing baseline, label uncertainty, spatial support, sample dependence, rare classes, temporal resolution, provider dependence and incomplete external validation.

Avoid generic limitation paragraphs that do not alter interpretation.

## 9. Preserve reproducibility without claiming impossible determinism

**Status: durable principle.**

Record:

- data and label versions or immutable identifiers;
- query and split definitions;
- configuration and fitted preprocessing state;
- model and checkpoint hashes where practical;
- random seeds and nondeterministic operations;
- software and relevant hardware versions;
- metric and postprocessing implementation;
- output artifact paths and licensing constraints.

If data or services are proprietary, mutable or inaccessible, state what can and cannot be reproduced. Do not claim reproducibility from a code repository alone.

## 10. Apply evidence-age labels

Use these labels internally when building the skill and when deciding whether a claim needs new research:

| Label | Meaning | Use |
|---|---|---|
| Durable principle | Stable physical, statistical or geometric reasoning | Retain unless contradicted by a stronger foundational correction |
| Domain-specific guidance | Depends on modality, product, geography or task | State its boundary and supporting evidence |
| Dated implementation guidance | Tool, architecture or recipe may have aged | Verify against current official documentation and research |
| Requires current verification | Product, model, software, mission or evidence changes rapidly | Search current primary sources before consequential use |
| Superseded | Better evidence or practice has replaced it | Do not recommend; retain only when historical context helps |

Older sources can remain authoritative for durable principles. Newer publication date does not by itself make a method more correct.

## 11. Final review questions

Before delivery, verify:

1. Does every major claim have direct evidence or a clearly marked inference?
2. Does the split support the stated generalization?
3. Are sensor quantities, geometry and processing described correctly?
4. Are equations identical in meaning to the implementation?
5. Were all learned choices made without final-test information?
6. Are thresholds and postprocessing part of the reported method?
7. Are metrics defined at the correct evaluation unit?
8. Are negative evidence and failure cases visible?
9. Are limitations specific enough to constrain use?
10. Could another researcher reconstruct the measurement-to-decision chain?

## Source boundary

This reference fuses reporting implications from Corley (2026), Bishop (2006), Goodfellow et al. (2016), and Bishop and Bishop (2024). It does not replace current venue instructions, sensor documentation, reporting standards or primary literature for the specific scientific claim.
