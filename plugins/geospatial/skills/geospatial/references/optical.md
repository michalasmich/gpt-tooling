# Optical Remote Sensing and Geospatial Computer Vision

## Purpose

Use this reference to design optical satellite and aerial computer-vision workflows from product ingestion to delivered maps. It fuses measurement principles, current product semantics and focused method evidence. It does not prescribe one architecture or one preprocessing chain for every task.

Read `core-remote-sensing.md` for shared measurement concepts, `workflow.md` for the general project lifecycle, `validation-and-leakage.md` for split discipline, and `spatial-statistics-and-validation.md` when the delivered map supports area or population inference.

## Evidence labels

- **Durable principle:** stable physical, statistical or geometric reasoning.
- **Domain-specific guidance:** valid within the stated sensor, product, surface or task.
- **Dated implementation guidance:** useful for reproducing a named historical method, not as a default.
- **Requires current verification:** check current official documentation or recent task evidence.
- **Superseded:** do not use for new work except to interpret legacy products.

## 1. Define the delivered task first

**Durable principle.** Define the output, prediction unit, deployment domain and failure cost before choosing data or models.

Record:

- the target as an operational rule, including uncertain and excluded cases;
- whether the output is a scene class, pixel mask, instance, oriented box, polygon, continuous surface or change event;
- the minimum object or mapping unit in ground units;
- required positional, boundary, count, area or topology behavior;
- deployment sensors, providers, product levels, regions, seasons and acquisition geometries;
- the independent unit that must be held out to test the intended generalization.

The target controls the imagery, label geometry, tiling, split, model family, post-processing and metrics. A benchmark label format should not silently redefine the operational product.

## 2. Establish what every pixel value means

**Durable principle.** Treat the image as a processed measurement. Identify, per band:

- sensor and spectral response;
- DN, radiance, TOA reflectance, surface reflectance, NBAR or display value;
- scale, offset, units, valid range, fill value and saturation behavior;
- native grid, ground sample distance and known resampling;
- processing collection or baseline and source acquisition identity.

Apply validity masks to stored codes before scaling when the fill code could transform into a plausible number. Do not clip negative reflectance estimates or values above one merely to fit a display range. Investigate them using product semantics and QA.

**Current product examples, requiring version verification:**

- Landsat 8-9 Collection 2 Level-2 surface reflectance uses `rho = 0.0000275 * DN - 0.2`, with fill value 0.
- Sentinel-2 Level-2A uses band-specific `BOA_ADD_OFFSET` and `QUANTIFICATION_VALUE`; historical `DN / 10000` code is unsafe across processing baselines.
- HLS v2.0 is a derived 30 m, harmonized NBAR product rather than native Landsat or Sentinel-2 surface reflectance.

## 3. Preserve masks and provenance as model inputs to the workflow

**Durable principle.** No-data, saturation, cloud, cirrus, cloud shadow, terrain shadow, snow-ice, water, aerosol quality and incomplete processing are different states. Preserve them separately when the product provides them.

At minimum, store the asset identifier, product version, acquisition time, processing time, sensor, baseline, CRS, transform, shape, native resolution, scale and offset, resampling history, QA interpretation, and any source-date or seam map.

**Domain-specific guidance.** A mask is an algorithmic estimate. Bright roofs, desert, snow, ice, haze, thin cloud, water, wetland, burned areas and terrain shadow create systematic confusions. Inspect masks in the target geography and season. Choose any threshold or dilation from the operational error cost and development evidence, then freeze it before final evaluation.

## 4. Select the physical correction level needed by the question

### Radiometric and atmospheric correction

**Durable principle.** TOA reflectance normalizes first-order solar illumination but retains atmospheric effects. Surface reflectance is an atmospheric model output with assumptions and uncertainty.

Use the mission's operational surface-reflectance product as the simplest baseline when it covers the sensor and application. Consider another processor only for a named limitation such as water, extreme aerosol, high latitude, adjacency or a cross-sensor consistency requirement. Validate by band, surface and atmospheric condition. ACIX-II does not identify a universal winner.

### BRDF and illumination geometry

**Durable principle.** Surface reflectance remains directional. Compare or normalize sun and view geometry when the expected geometry shift could affect the task. HLS NBAR is useful for compatible time series, but it changes the observations through a model with fixed coefficients.

### Topographic effects

**Domain-specific guidance.** In rugged terrain, test whether illumination angle, slope and aspect create class- or target-dependent bias. A topographic correction is justified when it improves a predefined validation criterion across representative terrain. Inspect faintly illuminated slopes and cast shadows for overcorrection.

No universal correction is established. Empirical methods can be local; physical methods require more inputs. Prefer the simplest established method that resolves the measured bias.

## 5. Match spatial and spectral support

**Durable principle.** Equal pixel spacing does not imply equal effective resolution. Compare point-spread behavior or modulation transfer information when available, native GSD, resampling, view angle and object size. Upsampling does not recover missing spatial information.

**Durable principle.** A band is a weighted spectral measurement. Bands with the same name can differ across sensors. Before transferring a model or computing a cross-sensor index, compare spectral response functions and preprocessing. Validate a bandpass adjustment for the materials and conditions in scope.

Use native grids when practical. When alignment is necessary:

- use nearest-neighbor or an explicit aggregation rule for categorical data;
- choose a continuous-image kernel for its blur, aliasing and ringing trade-off;
- combine geometric transformations into one interpolation pass when possible;
- record the target grid and every resampling operation;
- measure relative alignment on stable features rather than trusting matching metadata alone.

Derive acceptable registration error from object scale, boundary sensitivity and delivery tolerance. Thin objects and change maps can fail under offsets that are negligible for broad land-cover classes.

## 6. Treat harmonization, compositing and fusion as derived products

**Durable principle.** Harmonization changes measurements to improve comparability. It may combine atmospheric correction, co-registration, resampling, BRDF normalization, bandpass adjustment and filtering. Evaluate the complete chain and record observation loss.

Use HLS when a common 30 m Landsat-Sentinel time series serves the question. Use native products when native spatial detail, native bands or product-specific retrievals are essential. Do not mix HLS and native imagery without explicit source indicators and a controlled test.

Mosaics can contain seamlines, balancing and several acquisitions. Temporal composites can assign adjacent pixels to different dates, and a bandwise median may not be a physically observed spectrum. Preserve source dates or acquisition IDs where available and inspect prediction boundaries against seams.

Pan-sharpened values are estimates. Prefer native multispectral measurements for physical indices unless the method has been validated for that use.

## 7. Construct the dataset without leakage

**Durable principle.** Split independent source units before chipping or augmentation. The grouping unit should match the intended generalization: geography, acquisition, date, sensor, provider, mosaic, site or object identity.

Required controls:

1. Save the catalog query and exact asset identifiers.
2. Freeze train, validation and final-test source groups.
3. Prevent overlapping, adjacent or duplicate chips from crossing partitions.
4. Fit normalization, PCA, feature selection, thresholds and calibration on training or development data only.
5. Exclude invalid pixels from fitted statistics, loss and metrics.
6. Keep the final test outside architecture, preprocessing and post-processing selection.

For pretrained encoders, begin with the documented input bands, ordering, scale, normalization and spatial resolution. Treat any adaptation as an experiment.

## 8. Build labels at the delivered scale

**Durable principle.** Record label definition, source, date, CRS, geometry, confidence and exclusions. Distinguish confirmed background from unlabeled or uncertain regions.

Rasterization rules such as center-in-pixel and all-touched change small and thin objects. Off-nadir imagery can displace roofs and canopy relative to ground-referenced labels. Image and label dates can disagree. Inspect overlays by object size, class, terrain, view geometry and scene edge before training.

For object detection, decide whether horizontal boxes, oriented boxes, instance masks or polygons match delivery. DOTA supports oriented detection as a useful problem class; its 1,024-pixel crops and overlap are benchmark settings, not general prescriptions.

## 9. Tile with explicit context and merge rules

Choose training and inference tile size from the largest required context, smallest relevant object, model stride, memory and expected deployment scene. Do not infer statistical independence from the number of chips.

If inference uses overlap:

- merge compatible scores or logits before thresholding when practical;
- define how duplicate boxes, instances or polygons are matched and suppressed;
- inspect tile seams, truncated objects and border padding;
- report the final mosaic or vector product, not only per-tile metrics.

No universal overlap or crop size is justified. Express the choice in ground units and test nearby reasonable settings if it could change the conclusion.

## 10. Choose the simplest credible model for the task

Start with a baseline that can answer the operational question:

- class-wise spectral or shallow models for tabular pixel features;
- a standard semantic-segmentation model for dense classes;
- a standard detector for object inventories;
- an oriented detector when orientation and tight boxes matter;
- a standard pretrained optical or geospatial encoder when data or transfer conditions justify it.

Increase complexity only for a demonstrated limitation such as missing context, small-object recall, orientation, boundary quality, multimodal input or domain shift. Keep data, split and evaluation fixed when attributing a gain to architecture.

**Requires current verification.** Architecture names, pretrained checkpoints and claimed rankings change quickly. Verify current primary papers, licenses, input semantics and official implementations at project start. Benchmark performance does not establish transfer to a new sensor, geography, resolution or label policy.

## 11. Use plausible augmentation and normalization

**Durable principle.** An augmentation should represent plausible deployment variation without changing the label semantics. Rotations and flips can be appropriate for nadir imagery when direction is irrelevant; they can be invalid when illumination, north orientation, scan direction or directional objects matter.

Color jitter does not reproduce calibrated atmospheric, BRDF, spectral-response or sensor changes. Test robustness on real held-out products containing the target variation.

Prefer fixed per-band statistics estimated from valid training pixels and saved with the model. Per-chip normalization can remove absolute radiometry and makes each prediction depend on neighboring chip content.

## 12. Make post-processing part of the evaluated system

Thresholds, connected components, morphology, minimum area, hole filling, polygonization, simplification and duplicate merging alter the delivered map. Select them on validation data using the delivery objective.

Express area and distance parameters in ground units. Record connectivity, score threshold, matching rule and polygon repair. A score threshold of 0.5 is not automatically meaningful, and ranking quality does not establish probability calibration.

## 13. Validate for the task and deployment domain

Use metrics that correspond to the delivered error:

- classification: confusion matrix, per-class user's and producer's accuracy, and an aggregate appropriate to the target population;
- semantic segmentation: class-wise overlap plus boundary or small-object measures when operationally relevant;
- detection: precision-recall under a declared matching rule, stratified by object size and density when relevant;
- instances and polygons: splits, merges, counts, boundary distance, area and topology as required;
- continuous retrieval: bias and error magnitude across the range and deployment strata, with reference uncertainty and support mismatch stated;
- change: direct assessment of events or transitions, not only the two input maps.

Report by relevant region, acquisition, sensor, season, surface type, illumination, object size and quality state when those variables can reveal deployment failure. Preserve denominators and account for masked or excluded observations.

Map accuracy and population area inference are different objectives. When estimating class area or uncertainty for a region, use a probability sample and design-based estimators from the spatial-validation branch.

## 14. Minimum reproducibility record

For each experiment and delivered model, retain:

- asset IDs, product collections or baselines, and retrieval query;
- band names and order, units, scaling, offsets and masks;
- CRS, transform, grid, resampling and alignment checks;
- label version, rasterization or geometry policy and exclusions;
- split file, grouping unit, seed and leakage checks;
- training configuration, code revision, environment and checkpoint;
- fitted normalization and any dimensionality reduction;
- inference tiling, overlap, merge and post-processing rules;
- metrics, matching rules, evaluated population and artifact paths.

## Decision boundaries

- Use TOA reflectance when the analysis specifically tolerates or models atmospheric variation; use surface reflectance for cross-date or quantitative land analysis when its assumptions are suitable.
- Use HLS for harmonized medium-resolution time series; use native products when native detail or native spectral measurements control the task.
- Apply topographic correction only after establishing a material terrain-related bias and validating the correction.
- Use oriented detection only when orientation or tight localization affects delivery; otherwise begin with the simpler geometry.
- Add a more complex model only after the measurement, label, split and baseline are credible.

## Source boundary

This reference is fused from Corley (2026), Knudby (2023), CEOS-ARD Surface Reflectance v5.0.1, current USGS Landsat and ESA Sentinel-2 product documents, NASA HLS v2.0, ACIX-II, Fmask 4.0, the HLS method paper, the topographic-correction review and DOTA. Consult the source-specific notes for provenance and limitations. Verify mission documentation and fast-moving architecture guidance at the date of each project.
