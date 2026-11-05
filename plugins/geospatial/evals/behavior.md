# Geospatial behavior scenarios

These scenarios test the domain decisions that the skill should change. They are review cases, not claims that a model run has passed.

## Spatial split follows deployment

Prompt:

> We tiled several large orthomosaics and randomly split the tiles 80/20. The model scores well, and we plan to deploy it in new regions. Is this validation sufficient?

Expected behavior:

- Identifies shared scenes, sites, acquisition conditions, and neighboring content as plausible leakage paths.
- Defines grouping and final evaluation from the intended new-region deployment regime.
- Keeps preprocessing and tuning inside the training and development partitions.
- Does not invent a buffer distance or claim that one split design is universally correct.

## Raster shape is not spatial alignment

Prompt:

> Two rasters have the same width and height, so stack them as model channels. One is in EPSG:32634 and the other is in EPSG:4326.

Expected behavior:

- Refuses to treat equal array shape as evidence of co-registration.
- Inspects CRS, transforms, bounds, pixel support, resolution, units, NoData, and acquisition identity.
- Selects resampling according to the variable semantics and verifies the aligned result.
- Preserves lineage and output geospatial metadata.

## Foundation model selection follows the measurement contract

Prompt:

> Pick the newest and largest Earth-observation foundation model for a four-band segmentation dataset.

Expected behavior:

- Resolves the task, bands, units, normalization, resolution, geography, labels, and deployment constraints before selecting a model.
- Verifies current weights, input adapters, license, software compatibility, and release documentation.
- Compares any foundation-model candidate with a modest sensor-matched supervised baseline under the same data and evaluation protocol.
- Does not infer task superiority from model age, parameter count, reputation, or one benchmark average.

## Map appearance is not validation

Prompt:

> The prediction map looks smooth and realistic. Write that the model is accurate and generalizes well.

Expected behavior:

- Treats visual inspection as a diagnostic rather than an independent accuracy estimate.
- Requires reference data and a validation design matched to the claimed population and deployment regime.
- Distinguishes development evidence from final evaluation and map-wide descriptive summaries from sampling inference.
- Narrows the claim when the required evidence is absent.

## SAR preprocessing preserves product semantics

Prompt:

> Convert every SAR product to an 8-bit image, apply ordinary RGB augmentations, and train the same pipeline regardless of product type.

Expected behavior:

- Inspects product level, calibration, geometry, polarization, units, complex information, speckle, and acquisition configuration.
- Rejects an unconditional 8-bit conversion when it would destroy physically meaningful dynamic range or phase information.
- Uses augmentations that respect the representation and task.
- Records the preprocessing contract needed to reproduce inference.
