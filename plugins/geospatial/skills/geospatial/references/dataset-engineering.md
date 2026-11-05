# Dataset Engineering for Geospatial Machine Learning

## Purpose and boundary

Use this reference to design, construct, audit, version, and release datasets for geospatial classification, detection, segmentation, regression, and change analysis. Dataset engineering begins before acquisition and ends only when every derived sample remains traceable to its source and label decisions.

This reference does not replace `validation-and-leakage.md` or `spatial-statistics-and-validation.md`. Those references define validation estimands, structured resampling, and map-accuracy inference in greater depth.

## 1. Define the population and delivered decision

Write the intended population before collecting samples:

- geography, dates, seasons, events, sensors, providers, products, and processing versions;
- phenomenon, class ontology, continuous target, and spatial or temporal support;
- prediction unit: chip, pixel, object, polygon, parcel, scene, acquisition, or sequence;
- target output and minimum mapping unit;
- intended transfer: new locations, dates, sensors, conditions, or more samples from known sources;
- exclusions, review or abstention path, and error costs.

The dataset is a sample from this population. More chips do not widen geographic, temporal, sensor, or environmental coverage when they come from the same sources.

## 2. Create an immutable source manifest

Assign every source observation a stable identifier before tiling or augmentation. The manifest should link:

- source asset and collection identifiers;
- acquisition time and processing time;
- sensor, product, processing level, collection or baseline;
- bands, units, scale, offset, quality masks, NoData, and bit depth;
- CRS, transform, shape, footprint, GSD, resolution evidence, and resampling history;
- provider, access date, license, and redistribution constraints;
- source label, annotation, ancillary data, and their versions;
- parent region, scene, acquisition, survey, event, object, and time-series groups;
- split assignment and every derived sample identifier.

Do not use filenames as the only identity. Preserve the original query, filters, and excluded assets so the collection can be reconstructed or audited.

## 3. Separate data roles

Use distinct names and records for:

- **training data:** observations and labels used to fit model parameters;
- **training reference data:** higher-quality observations used to assess or improve training-label quality;
- **validation data:** observations used for model, preprocessing, threshold, checkpoint, and post-processing choices;
- **final test or map reference data:** untouched evidence used to assess the fixed system or map;
- **unlabeled deployment data:** observations used only when a declared transductive, semi-supervised, or monitoring design permits them.

One observation cannot provide independent evidence for two roles after its information has influenced model selection. If a role changes, version the split and revise the claim.

## 4. Write the annotation contract before labeling

The contract should state:

- operational definitions, inclusions, exclusions, confusers, and edge cases;
- whether labels are exhaustive and whether classes overlap or form a hierarchy;
- background, unknown, uncertain, ignore, unobservable, and not-reviewed meanings;
- spatial and temporal support of each label;
- object geometry, orientation convention, minimum visible fraction, truncation, occlusion, and crowd policy;
- rasterization grid and rule, boundary convention, connectivity, holes, and minimum mapping unit;
- continuous-target units, instrument or interpretation method, precision, censoring, and uncertainty;
- evidence layers an annotator may use;
- annotation tool, display scale, snapping, topology rules, and saved metadata;
- escalation, consensus, adjudication, and versioning procedure.

Pilot the contract on representative easy, hard, rare, boundary, and out-of-scope cases. Revise the instructions before bulk labeling; do not silently reinterpret earlier labels after the ontology changes.

## 5. Preserve measurement and label alignment

For each image-label pair, verify:

- CRS, datum, transform, pixel convention, and footprint;
- acquisition and label dates;
- relative alignment on stable features;
- above-ground displacement, terrain, off-nadir, and seasonal effects;
- source resolution and positional accuracy;
- label-to-grid rasterization and any resampling;
- whether the target was observable at the image resolution and quality.

A precise polygon from another date is not automatically an accurate pixel label. Mark temporal ambiguity, positional uncertainty, or unobservable targets rather than forcing them into background.

## 6. Design sampling for coverage and purpose

Training sampling and map-accuracy sampling have different objectives. Training may deliberately enrich rare classes or difficult conditions; population accuracy and area estimation require a suitable independent probability design.

For training, inspect coverage across:

- classes and target ranges;
- regions, environmental gradients, and settlement types;
- seasons, years, events, and acquisition conditions;
- sensors, products, resolutions, view geometry, and quality states;
- object size, density, orientation, context, and boundary complexity;
- confirmed negatives, confusers, and uncertain cases.

Record the source population, inclusion mechanism, exclusions, and any oversampling. Balanced minibatches do not make the underlying deployment prevalence balanced.

Use hard-negative mining only on training data. Version each mining round and inspect whether it concentrates annotation artifacts or mislabeled positives.

## 7. Build annotation quality control into production

Use layered checks:

### Deterministic checks

- valid class identifiers and required attributes;
- geometry validity, duplicate identifiers, empty shapes, and impossible coordinates;
- raster values, dimensions, NoData, and mask consistency;
- object size and target-range plausibility;
- date, sensor, footprint, and source-link completeness;
- forbidden train/validation/test group overlap.

### Human review

- blinded duplicate annotation on a representative sample;
- expert review of rare, ambiguous, high-impact, and disagreement cases;
- adjudication with a recorded reason rather than majority vote alone;
- periodic drift checks across annotators and production batches;
- visual overlays at native and task-relevant scales.

Agreement measures summarize consistency under the protocol; they do not prove correctness. Report the sampled cases, class mix, unit, and uncertainty rather than a context-free agreement number.

### Model-assisted review

Use out-of-sample predictions to rank likely issues. Separate potential wrong class, missing object, duplicate, geometry, boundary, and temporal mismatch cases. A reviewer, not the same fitted model, decides whether a label changes.

Store the original label, proposed issue, model and checkpoint, score, reviewer, decision, reason, and resulting version. Do not clean validation or test labels using predictions from a model evaluated on them without creating new independent evidence.

## 8. Preserve lineage through tiling and augmentation

Each derived record should retain:

- immutable parent asset and label identifiers;
- chip window in pixel and map coordinates;
- padding, resampling, scale, and preprocessing version;
- object clipping, visible fraction, ignore, and edge policy;
- augmentation seed and parameters when material;
- content hash or other integrity identifier where practical;
- split inherited from the parent group.

Split parent groups before generating overlapping chips or augmentations. Descendants of the same scene, object, polygon, acquisition, or time series must not cross partitions when that would leak information.

At inference, tiling and stitching define a separate production transform. Do not assume the training-chip dataset fully tests seam, truncation, or duplicate-merging behavior.

## 9. Construct splits from the generalization claim

First assign every record its dependence groups. Then create train, validation, and untouched test partitions at the group level.

- New-region claims require geographic groups and a justified separation design.
- New-time claims require dates, seasons, events, or acquisition groups.
- New-sensor or provider claims require those products to be held out.
- Repeated observations of one location remain linked unless the declared task explicitly permits history from that location.
- Mosaics, composites, and derived layers retain the identities of all contributing sources.

Check both identifier overlap and footprint/time overlap. A geographic boundary does not remove dependence from a shared acquisition, annotation polygon, mosaic, or upstream product.

Freeze and version the split before normalization, feature fitting, sampling based on model errors, threshold selection, or training. Read `validation-and-leakage.md` for the complete leakage audit.

## 10. Quantify dataset composition at independent units

Report counts at several levels:

- source scenes, acquisitions, regions, dates, surveys, events, and annotators;
- chips or patches;
- objects or polygons;
- valid pixels or area;
- classes, target ranges, quality states, and missingness.

Pixel or chip counts do not replace counts of independent source units. Include distributions of object size in pixels and ground units, label area, temporal gaps, GSD, valid fraction, and samples per parent group.

Map geographic, temporal, sensor, and class coverage. Use these diagnostics to identify absences; do not describe a dataset as representative without a defined population and evidence.

## 11. Version every material change

A new dataset version is required when changing:

- source assets, processing collection, preprocessing, or alignment;
- ontology, label interpretation, geometry, or rasterization;
- corrected, added, or removed labels;
- split assignments;
- file formats, encodings, NoData, or band order;
- license or redistribution terms.

Keep a changelog and machine-readable manifest. Preserve older versions needed to reproduce published results. Never overwrite raw imagery, original annotations, or a released split in place.

## 12. Publish a geospatial dataset card

The card should summarize:

1. purpose, creators, funding, owners, and contact;
2. intended and unsuitable uses;
3. target population and collection query;
4. sensors, products, dates, geography, resolution, units, and processing;
5. instances, labels, ontology, annotation protocol, and quality control;
6. sampling, exclusions, missingness, and known biases;
7. train, validation, and test design and generalization target;
8. file formats, CRS, NoData, manifests, and loading examples;
9. licenses, upstream terms, privacy, security, and redistribution limits;
10. known errors, limitations, maintenance, versioning, and deprecation.

Link the concise card to full manifests, annotation instructions, schemas, and quality reports. Documentation is evidence of process, not proof that the dataset is unbiased or fit for every use.

## 13. Task-specific dataset checks

### Classification

- Confirm chip support matches the label meaning.
- Separate single-label, multilabel, hierarchical, and unknown cases.
- Detect duplicate or near-duplicate source content across groups.
- Review model-ranked label issues with out-of-sample predictions.

### Detection and instance segmentation

- Define complete-instance, truncation, crowd, occlusion, and difficult policies.
- Audit missing objects and duplicates, not only wrong classes.
- Report object sizes, orientations, densities, and tile-edge frequency.
- Keep object identity through overlapping chips and stitching.

### Semantic segmentation

- Audit boundaries, thin structures, small regions, holes, topology, and ignore masks.
- Quantify class area at parent-scene and region levels, not only cropped pixels.
- Record rasterization and registration uncertainty.
- Do not convert unreviewed pixels to background.

### Regression and retrieval

- Preserve target units, support, instrument, calibration, uncertainty, and censoring.
- Separate missing, below-detection, invalid, and true zero values.
- Check target-range and environmental coverage by split.

### Change and time series

- Define event, transition, and no-change semantics and temporal tolerance.
- Preserve every contributing acquisition and mask.
- Prevent the same event, location sequence, or composite observation from leaking across splits.

## 14. Dataset readiness gate

Do not begin a consequential full training campaign until:

- source and label manifests are complete for a representative sample;
- physical quantities, grids, masks, and alignment were inspected;
- ontology and annotation instructions passed a pilot;
- deterministic and human quality checks were run;
- parent lineage and dependence groups exist;
- split overlap checks pass;
- composition and coverage diagnostics are reviewed;
- license and redistribution constraints are known;
- dataset version and card are recorded;
- a small end-to-end loading and visualization check succeeds.

## Source boundary

This reference fuses Roberts et al. (2017), Elmes et al. (2020), Gebru et al. (2021), Northcutt et al. (2021), Pushkarna et al. (2022), Schmitt et al. (2023), and the library's existing remote-sensing workflow, leakage, spatial-validation, and task references. Numerical tolerances, review rates, block sizes, and acceptance thresholds require project evidence.
