# LiDAR and Geospatial Point-Cloud Engineering

## Purpose

Use this reference for airborne, UAV, terrestrial, mobile, and spaceborne lidar work, including terrain products and point-cloud deep learning. It connects measurement physics, coordinates, point attributes, preprocessing, tiling, model representation, validation, and delivery.

This reference does not rank architectures universally. The correct method depends on the measurement mode, target, scene scale, label support, deployment shift, and compute budget.

## Evidence status

- **Durable principle:** stable physical, geometric, statistical, or engineering reasoning.
- **Domain-specific guidance:** valid for a stated platform, product, or task.
- **Dated implementation guidance:** useful for reproducing an older workflow, but not a current default.
- **Requires current verification:** current products, standards, software, or architecture performance.
- **Superseded:** historical information that must not control new work.

## Start by identifying the measurement

Do not call every 3D dataset a generic point cloud. Establish these facts first:

1. Platform: spaceborne, aircraft, UAV, mobile, terrestrial, backpack, handheld, or derived photogrammetric cloud.
2. Detection: discrete return, full waveform, photon counting, or reconstructed image matching.
3. Observation support: footprint, scan geometry, pulse or photon sampling, point distribution, occlusion, and overlap.
4. Native coordinates: sensor, trajectory, projected, geodetic, ellipsoidal height, orthometric height, and units.
5. Attributes: intensity, return order, class and flags, scan angle, time, source ID, color, waveform, uncertainty, and extra bytes.
6. Processing state: raw trajectory/range, georeferenced points, classified points, terrain-normalized points, raster derivatives, or mission retrievals.
7. Prediction unit: point, voxel, cell, object, segment, footprint, profile, or scene.

The measurement unit controls the valid preprocessing, loss, split, and interpretation.

## Physical and geometric foundation

### Time-of-flight range

For an ideal pulsed monostatic lidar,

$$
R=\frac{ct}{2},
$$

where $t$ is round-trip travel time. This gives sensor-to-scatterer slant range. Map coordinates additionally require sensor position, attitude, lever arm, boresight, scan angle, timing synchronization, atmospheric correction where applicable, and reference-frame transformations.

**Decision rule:** separate range resolution, range precision, relative strip precision, and absolute geospatial accuracy. Do not infer final map accuracy from a sensor datasheet's nominal range precision.

### Return energy

Received amplitude depends on transmitted pulse, range, beam divergence, receiver aperture and field of view, atmosphere, wavelength, surface orientation, illuminated area, reflectance, scattering, detector response, and gain.

**Decision rule:** treat intensity as acquisition-dependent. Do not merge or learn across sensors, flight lines, ranges, or angles without inspecting and validating normalization.

### Observation support

Point density, pulse density, footprint, point spacing, and raster cell size are not interchangeable. Density can vary within a scene because of swath overlap, scan angle, range, trajectory, occlusion, or surface response.

**Decision rule:** characterize local support. Choose neighborhoods, voxels, and output cells from target size, density distribution, positional uncertainty, and required output, not one global density value.

## Coordinate and format controls

### Required invariants

Preserve and verify:

- horizontal CRS, datum realization, units, and epoch when relevant;
- vertical reference, vertical units, and geoid model;
- LAS version and point-data-record format;
- coordinate scale and offset;
- VLRs, EVLRs, waveform references, and extra-byte descriptors;
- GPS time convention, scan angle, point-source ID, and flags;
- original point identity or a reversible mapping after tiling or filtering.

Run a round-trip check after conversion: coordinate bounds, point count, CRS, attribute schema, classes and flags, return consistency, NoData or invalid values, and representative records.

### LAS version choice

ASPRS released LAS 1.4 R16 and LAS 1.5 R00 in 2025. LAS 1.4 remains widely deployed, while 1.5 is newer.

**Decision rule:** use the version required by the client, archive, governing specification, and supported toolchain. Verify read-write compatibility before adopting 1.5. A newer version is not useful if delivery or software silently loses fields.

### Classification is not truth

Class codes are processing outputs. Return order is acquisition metadata. Flags are not semantic classes.

**Decision rule:** record who or what produced labels, with which version and rules. Inspect ground, noise, overlap, water, bridge, and ignored-ground behavior. Do not train directly from vendor classes without a label-quality audit.

## Product-specific branches

### Airborne and UAV topographic lidar

1. Verify trajectory, strip alignment, boresight, swath overlap, CRS, vertical reference, and units.
2. Inspect density, scan angle, returns, intensity, gaps, noise, water, vegetation, steep terrain, and structures.
3. Treat ground classification and derived surfaces as model outputs.
4. Keep breaklines, water treatment, bridge handling, interpolation, and cell support with each terrain product.
5. When USGS 3DEP rules govern the project, use the current USGS Lidar Base Specification. Its quality levels are not universal ML hyperparameters.

### Terrestrial and mobile lidar

1. Verify registration and loop or control residuals before semantic modelling.
2. Expect range-dependent density, grazing incidence, occlusion, moving objects, and repeated surfaces.
3. Split by independent route, site, session, or survey unit before chunking.
4. Preserve scan/time/source identity when motion or viewpoint affects deployment.

### ICESat-2

- ATL03 V7 contains photon events, not a clean surface cloud.
- Heights are referenced to the WGS 84 ellipsoid; supplied geoid information is not already applied to each photon height.
- Signal-confidence, photon-weight, background, beam, segment, and quality fields affect selection.
- ATL08 V7 derives terrain and vegetation metrics using classified photons and estimated ground surfaces, primarily at 100 m support with some 20 m outputs.

**Decision rule:** record product version, beam, support, height reference, solar background, slope, quality, and known issues. Do not merge ATL03 photons or ATL08 metrics with airborne points as if they shared support and error structure.

### GEDI

- L2A contains footprint elevation and relative-height metrics from full waveforms.
- L2B contains canopy-cover and vertical-profile metrics.
- Metrics depend on beam, sensitivity, solar background, waveform modes, algorithm selection, terrain, cloud, and quality/degrade flags.

**Decision rule:** preserve footprint identity, selected algorithm, beam, sensitivity, flags, time, and version. Interpret relative heights as waveform-derived footprint metrics.

## Problem formulation

Before choosing a model, define:

- operational target and label ontology;
- unit of prediction and output geometry;
- independent grouping unit;
- deployment platform, geography, season, sensor, and density regime;
- inputs available at inference time;
- error costs by class, object, boundary, and location;
- final evaluation population;
- latency, memory, and file-delivery constraints.

Examples of distinct tasks:

- point-wise semantic segmentation;
- instance or panoptic segmentation;
- object detection;
- ground/non-ground classification;
- terrain, canopy, or building-height regression;
- registration or change detection;
- footprint-level biomass or structure retrieval.

Do not compare their metrics as one ranking.

## Preprocessing

### Coordinate normalization

Large map coordinates can create numerical-conditioning problems. For a tile origin $o$ and scale $s$,

$$
x'_i=\frac{x_i-o}{s}.
$$

Keep $o$, $s$, original CRS, and point mapping. Apply only reversible local coordinates for modelling; deliver predictions in the original geospatial frame.

### Height normalization

For estimated ground $g(x_i,y_i)$,

$$
h_i=z_i-g(x_i,y_i).
$$

Use normalized height when above-ground structure matters. Retain absolute elevation when terrain position carries legitimate signal. Validate the ground model by terrain regime. Fit or generate it without leaking information across evaluation partitions.

### Attribute handling

- Coordinates: retain geometry; normalize numerically without losing map coordinates.
- Intensity: inspect calibration, range, angle, sensor, and campaign effects before scaling.
- Return fields: validate consistency and distinguish emitted pulse from detected point.
- RGB or imagery: verify spatial, temporal, and occlusion alignment; record resampling.
- Normals and eigenfeatures: derive neighborhood scale from physical target and density; compute within allowed partitions.
- Missing attributes: use explicit masks or schema-aware branches. Do not silently fill missing values with valid-looking constants.

### Sampling and density

Choose the smallest method that preserves the target:

- random sampling for low-cost large-scene reduction when rare structures survive;
- grid or voxel sampling for controlled spatial support;
- farthest-point sampling when uniform coverage justifies its cost;
- radius neighborhoods for physical-scale locality;
- k-nearest neighbors when fixed neighbor count is more important than fixed physical support.

Test rare classes, thin objects, boundaries, and low-density areas. Density normalization can remove task signal or manufacture regularity.

## Tiling large scenes

### Split before tiling

Assign independent sites, acquisitions, routes, strips, corridors, or spatial blocks to train, validation, and final test before extracting chunks. Add a separation zone that covers model input support, preprocessing neighborhoods, augmentation, and label interpolation.

### Core plus halo

Use a context halo around each prediction core:

1. read points within core plus halo;
2. predict all required context;
3. retain outputs only for the core or blend documented overlaps;
4. map each prediction back to a unique original point or output cell;
5. check seams and missing or duplicated points.

Derive core and halo from receptive field, target size, density, memory, and post-processing. There is no universal tile size or overlap percentage.

## Representation choice

| Representation | Prefer when | Main risk |
|---|---|---|
| Raster or bird's-eye projection | Map-grid output and stable vertical projection | Occlusion and loss of vertical structure |
| Range image | Ordered rotating/mobile acquisition geometry | Sensor-specific topology and missing returns |
| Dense voxel | Small bounded volumes | Cubic memory and quantization |
| Sparse voxel | Large sparse scenes and mature sparse-convolution tooling | Voxel-size sensitivity and boundary quantization |
| Raw point network | Per-point geometry and flexible neighborhoods matter | Sampling and neighborhood cost |
| Graph network | Explicit relational structure adds value | Graph construction cost and scale sensitivity |
| Transformer or hybrid | Long-range context addresses a demonstrated limitation | Memory, compute, and protocol complexity |
| Multimodal model | Complementary aligned inputs exist at inference time | Misregistration, missing modality, and shortcut learning |

Start with a credible simple baseline. Add complexity for a measured limitation, such as lost vertical structure, insufficient context, memory, boundary errors, or cross-domain robustness.

### Architecture evidence boundary

- KPConv demonstrates learnable local metric convolution on points. Kernel radius and subsampling remain scale-dependent.
- RandLA-Net demonstrates a practical large-scene efficiency strategy using random sampling and local aggregation. Check rare and thin structures.
- New transformer, foundation, multimodal, and open-vocabulary methods require current verification. Compare only under matched inputs, splits, class sets, supervision, and compute.

Benchmark leadership does not establish deployment fitness.

## Training lifecycle

### Prevent leakage

- Freeze train, validation, and final-test groups before tiling.
- Fit feature scaling, intensity normalization, PCA, codebooks, class weights, and learned preprocessing on training data only.
- Keep overlapping scans, duplicate objects, repeated routes, and temporally adjacent acquisitions together where independence requires it.
- Do not use the final test domain for architecture, threshold, or post-processing selection.
- If the final test changes development decisions repeatedly, reclassify it as development data.

### Augmentation

Use transformations that preserve the deployment semantics:

- rotations only when orientation is not operationally meaningful or when the rotation regime is realistic;
- scale changes only when physical size should vary;
- point dropout or density perturbation only within plausible acquisition variation;
- coordinate jitter within positional uncertainty;
- attribute perturbation within measured sensor variability.

Do not use generic image-style augmentation without checking 3D geometry, gravity, scan pattern, and physical units.

### Loss and sampling

Class imbalance can be handled through sampling, class-weighted objectives, focal variants, or two-stage designs. Select the method from operational error costs and label support. Report how sampling changes the effective training population. Do not infer calibrated probabilities from a class-weighted loss without calibration evidence.

## Evaluation

### Match the deployment regime

Use grouped or spatially separated validation that represents the intended generalization:

- new tiles in the same survey;
- new strips or routes;
- new site;
- new acquisition date;
- new sensor or platform;
- new geography or land-cover regime.

Name the regime explicitly. A random point split within one scene does not support a cross-site claim.

### Metrics need geometry and class context

For semantic segmentation, report per-class intersection over union, precision, recall, and an aggregate that matches the operational population. Add boundary, object, height, or surface metrics only when they answer a project decision.

Also inspect performance by:

- site and acquisition;
- density and range;
- scan angle or overlap;
- terrain and land cover;
- object size and boundary distance;
- sensor or platform;
- missing attributes and quality flags.

Point-weighted metrics can allow dense regions to dominate. Consider site-, tile-, area-, or object-level aggregation when it better represents deployment.

### Resource claims

Measure latency, throughput, and peak memory on the actual hardware, point count, precision, batching, and preprocessing. Published throughput is evidence for a reported setup, not a deployment guarantee.

## Post-processing and delivery

### Map back before cleaning

First restore predictions to original point IDs or the required output grid. Verify point count, uniqueness, CRS, and attribute alignment. Then apply only post-processing justified by target geometry or operational rules.

### Common post-processing

- neighborhood voting can reduce isolated errors but erase thin objects;
- connected components can enforce object support but fragment sparse classes;
- conditional random fields or graph smoothing add spatial consistency but can move boundaries;
- morphological operations apply naturally to rasterized outputs but inherit grid resolution;
- terrain constraints can correct impossible geometry but must not hide systematic model failure.

Tune post-processing on validation data. Report it as part of the model pipeline.

### Deliverable checks

- original CRS and vertical reference preserved;
- scale, offset, units, NoData, classes, flags, and extra attributes preserved;
- output point count and mapping accounted for;
- probabilities, uncertainty, and class semantics documented;
- tile seams, duplicates, gaps, and edge effects checked;
- data, model, configuration, split, seed, and processing versions recorded;
- visual maps, profiles, cross-sections, or 3D views inspected where relevant.

## Decision checklist

Before accepting a lidar or point-cloud pipeline, answer:

1. What physical event does each record represent?
2. Which reference frame and vertical datum define its coordinates?
3. What support, density, footprint, and occlusion pattern does the sensor provide?
4. Which fields are measured, which are derived, and which are labels?
5. What independent unit defines the split?
6. Can tiling, neighborhoods, or multimodal alignment cross that split?
7. Why does the selected representation match the target and scene scale?
8. What limitation justifies architecture complexity beyond the baseline?
9. Does evaluation represent the actual deployment shift?
10. Can every prediction be traced to its input measurement and processing version?

## Evidence boundaries and source notes

The source synthesis uses NOAA's *Lidar 101*, the available chapters of Wang et al. (2024), and the current evidence cited in this reference.

The full Shan and Toth (2018) book and the closed chapters of Wang et al. (2024) were not available and were not treated as reviewed. Current product behavior must be checked against the named mission and version. Current software support and model performance require verification at use time.
