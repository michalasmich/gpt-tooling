---
name: geospatial
description: Guide evidence-grounded remote-sensing, Earth-observation, GIS, and geospatial computer-vision or machine-learning work. Use for optical, SAR, drone, hyperspectral, LiDAR, time-series, multimodal, embedding, foundation-model, dataset, training, validation, uncertainty, domain-adaptation, or scientific-reporting decisions whose spatial, temporal, sensor, or georeferencing semantics affect correctness. Do not use for ordinary non-spatial computer vision or generic data science.
---

# Geospatial

Apply domain-specific geospatial and Earth-observation judgment without replacing the user's scientific objective. Inspect the actual project artifacts before drawing conclusions. Separate observed facts, inferences, and recommendations.

## Establish the decision contract

Before making a consequential methodological choice, determine the parts that affect the answer:

- the task, prediction unit, output support, and decision the output must serve;
- the intended deployment geography, time period, sensor regime, and acceptable failure modes;
- the sensor, acquisition geometry, bands or channels, units, resolution, CRS, transform, NoData convention, bit depth, and temporal semantics;
- the label source, spatial and temporal support, uncertainty, class definition, and alignment with the imagery;
- the grouping units that can create leakage, including sites, scenes, flight lines, tiles, objects, dates, and derived products;
- the available compute, latency, memory, licensing, reproducibility, and delivery constraints.

Ask the user only for a consequential requirement that cannot be inferred or inspected. Do not invent thresholds, tolerances, split distances, or acceptance criteria.

## Protect the scientific and spatial contract

- Preserve CRS, transforms, resolution, units, NoData values, bit depth, acquisition identity, timestamps, and lineage through preprocessing and export.
- Verify co-registration, resampling behavior, support, and label alignment. Visual similarity is not proof of spatial alignment.
- Define splits before fitting preprocessing or selecting models. Keep spatially, temporally, or hierarchically related samples together when their separation would leak information.
- Fit preprocessing and tune decisions on training data only. Keep development evidence distinct from the final independent performance estimate.
- Treat tiles as computational units unless the target and deployment semantics make them valid independent sampling units.
- Match validation to the intended generalization regime. Random pixel or patch splits are not default evidence for geographic transfer.
- Prefer a conventional baseline and add complexity only for a named, material limitation supported by evidence.
- Verify current model releases, band contracts, normalization, licenses, APIs, weights, and software compatibility at project time.
- State when evidence is insufficient. Do not convert model confidence, embedding distance, or a visually plausible map into a validated scientific conclusion.

## Load references progressively

Read only the references that can change the current decision.

### End-to-end and physical foundations

- Read [workflow.md](references/workflow.md) for project framing, preprocessing, tiling, training, inference, mosaicking, and delivery.
- Read [core-remote-sensing.md](references/core-remote-sensing.md) for measurement physics, resolution, calibration, atmospheric effects, resampling, and sensor comparability.
- Read [mathematical-foundations.md](references/mathematical-foundations.md) when probability, optimization, linear algebra, or statistical assumptions govern the decision.

### Sensor and acquisition branches

- Read [optical.md](references/optical.md) for multispectral or optical satellite imagery.
- Read [sar.md](references/sar.md) for radar geometry, backscatter, speckle, polarimetry, interferometry, or SAR learning workflows.
- Read [drone-photogrammetry.md](references/drone-photogrammetry.md) for UAV imagery, orthomosaics, surface models, ground sampling distance, and photogrammetric products.
- Read [hyperspectral.md](references/hyperspectral.md) for high-dimensional spectra, spectral preprocessing, dimensionality reduction, and hyperspectral learning.
- Read [lidar-point-clouds.md](references/lidar-point-clouds.md) for point clouds, returns, terrain products, rasterization, and 3D learning.
- Read [time-series-and-change-detection.md](references/time-series-and-change-detection.md) for temporal compositing, trajectories, disturbances, and change attribution.

### Representations, models, and fusion

- Read [embeddings.md](references/embeddings.md) for DINO-family, AlphaEarth Foundations, TESSERA, and embedding-based workflows.
- Read [foundation-models.md](references/foundation-models.md) before selecting or fine-tuning an Earth-observation foundation model. Consult [foundation-model-registry.md](references/foundation-model-registry.md) and [foundation-model-documentation.md](references/foundation-model-documentation.md) only when comparing named model families or their released contracts.
- Read [multimodal-fusion.md](references/multimodal-fusion.md) when combining sensors, dates, resolutions, vector attributes, or learned representations.
- Read [architecture-selection.md](references/architecture-selection.md) when selecting model families, encoders, decoders, receptive fields, or resource-aware candidates.

### Data, training, transfer, and tasks

- Read [dataset-engineering.md](references/dataset-engineering.md) for sampling, annotation, label quality, documentation, and dataset versioning.
- Read [vision-tasks.md](references/vision-tasks.md) for classification, segmentation, detection, instance segmentation, and task-specific target construction.
- Read [training-and-adaptation.md](references/training-and-adaptation.md) for optimization, fine-tuning, augmentation, imbalance, and reproducibility.
- Read [domain-adaptation.md](references/domain-adaptation.md) for source-target shift, harmonization, supervised or unsupervised adaptation, and test-time adaptation.

### Evaluation, operational confidence, implementation, and reporting

- Read [validation-and-leakage.md](references/validation-and-leakage.md) whenever splits, model selection, cross-validation, holdouts, or leakage are material.
- Read [spatial-statistics-and-validation.md](references/spatial-statistics-and-validation.md) for map accuracy, spatial dependence, area estimation, sampling inference, and uncertainty at geographic support.
- Read [calibration-uncertainty-and-abstention.md](references/calibration-uncertainty-and-abstention.md) for calibration, distribution shift, out-of-distribution detection, selective prediction, or conformal methods.
- Read [python-geospatial-and-deep-learning-libraries.md](references/python-geospatial-and-deep-learning-libraries.md) when choosing or reviewing implementation libraries.
- Read [scientific-reporting.md](references/scientific-reporting.md) for papers, methods, equations, maps, figures, tables, limitations, and reproducibility records.

## Evidence and execution

Use current authoritative documentation for governed data and software semantics. For consequential scientific choices, use applicable peer-reviewed research and distinguish durable principles from domain-specific guidance, dated implementation advice, claims requiring current verification, and superseded guidance.

For implementation, validate a small representative sample before a bulk operation. Inspect numeric summaries and spatial outputs. Record the data version, split definition, seed, preprocessing, configuration, metrics, and artifact paths needed to reproduce a result. Report what was observed and what remains unverified.

## Composition

Plinth governs requirements, evidence quality, methodology, risk, and verification. Ponytail governs implementation economy. Quire governs natural-language expression and technical reporting. This skill supplies the geospatial domain semantics and routes to the relevant maintained references. Preserve the authority boundaries rather than copying the full instructions of another skill.
