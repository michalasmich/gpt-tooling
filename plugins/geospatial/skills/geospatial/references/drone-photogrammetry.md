# Drone Photogrammetry and Orthophoto Computer Vision

## Purpose and boundary

Use this reference for drone image acquisition, structure from motion (SfM), multi-view stereo (MVS), orthomosaics, elevation products and computer vision on drone-derived imagery. Read it with `core-remote-sensing.md`, `workflow.md` and `validation-and-leakage.md`.

The source synthesis is based on Eltner et al. (2022), Carvajal-Ramirez et al. (2021), and the current evidence cited in this reference.

This reference covers durable principles and current evidence available on 4 November 2026. Aviation law, product standards and processing-software behavior require current official verification.

## 1. Define the deliverable before the flight

**Status: durable principle.**

Specify:

- target object or surface;
- required observable: appearance, position, height, volume, class, count or change;
- unit of prediction and minimum relevant feature size;
- required coverage and valid footprint;
- horizontal, vertical and temporal accuracy requirements;
- final product: native images, point cloud, mesh, DSM, DTM, orthomosaic or true orthophoto;
- deployment conditions and acceptable failure modes.

The deliverable determines the sensor, flight geometry, GSD, exposure, control, checkpoints and processing. Do not design from software defaults.

## 2. Select the representation from the task

| Task | Preferred source | Main caution |
|---|---|---|
| Image classification or detection | Native frames or orthomosaic, depending deployment | Native frames preserve views; mosaics add seams and reprojection |
| Map-space segmentation | Validated orthomosaic with provenance and masks | Pixel spacing is not effective resolution or positional accuracy |
| Height or volume | Validated point cloud/DSM/DTM/mesh | Surface definition, vegetation and occlusion determine meaning |
| Building or vertical-surface inspection | Oblique/convergent native images or 3D model | Nadir orthomosaics omit façades and hidden surfaces |
| Change detection | Independently validated, co-registered epochs | Processing differences can appear as change |
| Multispectral analysis | Calibrated bands with alignment and illumination records | Band misregistration and view-dependent response matter |

Do not use an orthomosaic merely because it is convenient. Use the product whose measurement semantics match inference-time data.

## 3. Distinguish GSD, resolution and accuracy

**Status: durable principle.**

For approximate nadir geometry, ground sampling distance is related to flying height above the surface $H$, physical pixel pitch $p$ and focal length $f$ by

$$
\mathrm{GSD}\approx\frac{H p}{f}.
$$

This describes projected sampling under simplifying assumptions. It does not establish:

- optical resolving power;
- motion-blur limit;
- reconstruction precision;
- map positional accuracy;
- the minimum object a model can reliably recognize.

Report source-image GSD, delivered grid spacing and independently measured positional accuracy separately.

## 4. Build a well-conditioned image network

**Status: durable principle.**

Plan the network so important surfaces have sufficient visibility, overlap, parallax, texture and viewpoint diversity. Consider:

- terrain relief and surface orientation;
- along-track and cross-track coverage;
- cross strips and oblique/convergent views;
- flight speed, shutter interval and motion blur;
- sun angle, shadows, wind and moving vegetation;
- height above the actual surface, not only take-off elevation;
- battery, safety and legal constraints.

No universal overlap or altitude applies. Select values from target scale, camera, terrain, expected matching difficulty and accuracy requirement. Validate a representative sample when conditions are uncertain.

## 5. Treat the camera as a measuring instrument

**Status: durable principle.**

Preserve camera model, lens, focus, aperture, shutter, ISO, image dimensions, exposure, timestamp and firmware. Geometric calibration includes focal length, principal point and distortion. Radiometric characterization may include dark signal, vignetting, exposure response and spectral response.

Rolling-shutter cameras expose rows at different times. Motion can violate the single-pose image model. Use a supported rolling-shutter model, suitable acquisition conditions or a global-shutter sensor when required by the accuracy target.

Self-calibration is only identifiable when image geometry contains enough information to separate camera parameters from scene shape. Parallel nadir imagery over low relief can produce parameter correlation and vertical doming. Cross strips, oblique views, control and stable camera settings strengthen the solution.

## 6. Understand the reconstruction chain

**Status: durable principle.**

The central perspective relation can be written as

$$
\mathbf{x}\sim\mathbf{K}\mathbf{R}(\mathbf{X}-\mathbf{C}),
$$

where $\mathbf{X}$ is an object-space point, $\mathbf{C}$ is the camera centre, $\mathbf{R}$ is orientation and $\mathbf{K}$ represents interior camera parameters.

A typical chain is:

```text
image quality control
→ feature detection and matching
→ outlier rejection
→ SfM and sparse reconstruction
→ bundle adjustment and georeferencing
→ MVS and dense reconstruction
→ surface/mesh generation
→ orthorectification and mosaicking
→ product validation
```

Each stage can change support, completeness and uncertainty. Record the software version and consequential settings.

## 7. Separate control from validation

**Status: durable principle.**

Ground control points constrain georeferencing or bundle adjustment. Checkpoints evaluate the result and must remain independent of calibration, adjustment, parameter selection and reruns.

For every control or checkpoint, preserve:

- stable identifier and role;
- coordinates, CRS and units;
- horizontal and vertical datum;
- survey method and uncertainty;
- marking and image-identification procedure;
- acquisition date and physical stability.

Distribute validation across the claimed domain: centre and edge, low and high relief, relevant surface types and weak geometry. Do not report control residuals as external accuracy.

## 8. Use RTK/PPK conditionally

**Status: domain-specific guidance requiring system validation.**

RTK/PPK image positions can improve block geometry and reduce field control. Performance depends on:

- GNSS solution status and reference frame;
- base/network corrections and baseline;
- camera-event timing;
- antenna-to-camera lever arm and boresight;
- camera calibration and flight geometry;
- software weighting and uncertainty fields.

“RTK drone” is not an accuracy specification. Maintain independent checkpoints whenever positional accuracy matters.

## 9. Know what each derived product represents

### Point cloud and mesh

Sparse and dense point clouds contain reconstructed visible surfaces. Density is not accuracy. A mesh interpolates and regularizes these samples and can bridge missing regions.

### DSM and DTM

A DSM represents visible top surfaces. A DTM represents estimated bare ground. Vegetation removal and object classification introduce method-dependent errors and NoData regions.

### Orthomosaic

An orthomosaic projects source imagery through estimated camera geometry onto a surface. It can contain:

- seamline and blending artifacts;
- duplicated or missing objects;
- leaning structures and occlusion;
- radiometric discontinuities;
- edge distortion and weak-overlap regions;
- errors inherited from camera poses and the surface model.

A true orthophoto explicitly handles visibility and occlusion using a suitable surface representation. It still requires validation.

## 10. Preserve radiometric meaning

**Status: durable principle with sensor-specific implementation.**

For quantitative reflectance or temperature, control sensor warm-up, exposure, illumination, calibration panels, downwelling sensor data, vignetting, band alignment and view-angle effects. RGB orthomosaics intended only for visual mapping have different evidence requirements from multispectral reflectance or thermal-temperature products.

Mosaicking may select pixels from different images and viewing conditions. Preserve source-image linkage when radiometric interpretation or uncertainty matters.

## 11. Diagnose uncertainty spatially

**Status: durable principle.**

Inspect more than a global RMSE:

- signed horizontal and vertical bias;
- median, spread and outliers;
- residual vectors and spatial trends;
- error by terrain, surface and distance to block edge;
- control versus independent checkpoint residuals;
- camera and tie-point geometry;
- gaps, interpolation and NoData;
- repeated-processing stability when stochastic behavior is material.

Use the accuracy metric and checkpoint design required by the applicable standard. Do not invent a fixed GSD-to-accuracy multiplier.

## 12. Construct CV datasets without leakage

**Status: durable principle.**

Define the independent entity before tiling. Usually it is a site, flight block, acquisition date, physical object group or survey campaign.

Keep together:

- overlapping native frames;
- orthomosaic tiles from one flight block;
- products reconstructed from the same images;
- repeated processing variants;
- neighbouring tiles sharing context or labels;
- repeated observations of the same object when identity transfer is not the deployment task.

Split first, then tile and fit preprocessing. Spatially separate folds when nearby terrain would make evaluation unrealistically easy. Preserve a final external site or campaign when the claim concerns geographic transfer.

## 13. Tile at the physical scale of the task

**Status: durable principle.**

Choose chip size, stride and context from:

- source resolution and effective spatial support;
- object-size distribution;
- required surrounding context;
- model receptive field;
- memory constraints;
- delivered-map requirements.

Convert pixels to physical units before comparing datasets. Overlap at inference can reduce edge artifacts, but duplicate predictions require one documented fusion rule. Mask invalid borders, seams and NoData instead of treating them as background.

## 14. Use geometry-aware augmentation

**Status: durable principle.**

Rotations and flips can be valid for map-space orthomosaics when orientation is irrelevant. They may be invalid for native oblique frames, shadow-direction tasks, façade views or orientation-dependent objects.

Brightness and colour changes must preserve the task's radiometric meaning. Geometric warps can alter scale and shape. Synthetic blur, compression or super-resolution should be justified by deployment conditions and checked for geometric bias.

## 15. Choose the simplest model that answers the task

**Status: durable principle.**

Begin with a conventional task baseline using validated inputs. Escalate only when it addresses a demonstrated limitation:

1. RGB image or orthomosaic baseline;
2. appropriate pretrained encoder;
3. elevation or multispectral fusion when aligned complementary information exists;
4. multi-view or 3D modelling when single-view projection loses necessary geometry;
5. temporal modelling when the target depends on sequence rather than one epoch.

Foundation-model or super-resolution claims require comparison under the same split and source product. Visual sharpness is not added spatial information.

## 16. Handle time series and change explicitly

**Status: durable principle.**

Across epochs, control:

- camera and lens state;
- height, view geometry and GSD;
- illumination, season and surface motion;
- control/reference frame;
- reconstruction software and settings;
- DSM/DTM definition and grid;
- orthomosaic seamlines and valid footprint.

Estimate co-registration error and the combined detection limit before declaring change. Keep all epochs from the same site together during model splitting unless the deployment regime explicitly tests forecasting at known sites.

## 17. Validate the delivered product

**Status: durable principle.**

Match validation to the claim:

- **Position:** independent checkpoints or reference surfaces.
- **Elevation/volume:** vertical residuals, surface completeness and bias by cover type.
- **Orthomosaic:** position, seams, occlusion, radiometry and valid footprint.
- **Classification/segmentation:** class metrics plus spatially independent transfer.
- **Detection/counting:** object-level matching, localization and duplicate handling.
- **Change:** stable-area residuals, co-registration and minimum detectable change.

An accurate model cannot repair an invalid geospatial reference product. Validate the photogrammetric product before and separately from the CV model.

## 18. Decision framework

### Prefer native frames when

- deployment receives individual frames;
- multi-view information is useful;
- mosaicking artifacts would corrupt labels;
- oblique or vertical surfaces matter.

### Prefer an orthomosaic when

- inference and delivery are map-based;
- the target lies on a representable surface;
- geometry, seams and valid footprint have been checked;
- one controlled grid is operationally useful.

### Add elevation when

- height is complementary to appearance;
- DSM/DTM semantics match the target;
- imagery and elevation are aligned and contemporaneous;
- missing and low-quality elevation are handled explicitly.

### Re-plan acquisition rather than increase model complexity when

- important surfaces are invisible;
- blur, saturation or weak texture prevents matching;
- image geometry cannot constrain calibration;
- reference control is absent or unreliable;
- the target is below effective resolution.

## 19. Paper and project reporting checklist

Report:

1. platform, sensor, lens, shutter type and image format;
2. dates, time, illumination, weather and wind where relevant;
3. flight geometry, height definition, speed and planned/achieved coverage;
4. source GSD, effective resolution and delivered grid spacing separately;
5. camera calibration strategy and parameters held fixed or estimated;
6. GNSS/IMU, RTK/PPK, timing, lever-arm and reference-frame details;
7. control and checkpoint survey, roles, distribution, CRS, datum and uncertainty;
8. SfM/MVS software, version, consequential settings and filtering;
9. product definition: cloud, mesh, DSM, DTM, orthomosaic or true orthophoto;
10. seamline, occlusion, interpolation, NoData and valid-footprint handling;
11. label source, date, support and alignment procedure;
12. split grouping, buffer/separation, tiling, overlap and seeds;
13. model, checkpoint, pretraining, augmentation and postprocessing;
14. positional, semantic and delivered-product validation;
15. limits across sites, cameras, flights, seasons and processing versions.

## 20. Primary sources

- Eltner, A., et al., eds. (2022). *UAVs for the Environmental Sciences: Methods and Applications*. https://doi.org/10.53186/1028514
- Carvajal-Ramírez, F., Agüera-Vega, F., and Martínez-Carricondo, P., eds. (2021). *UAV Photogrammetry and Remote Sensing*. https://doi.org/10.3390/books978-3-0365-1453-6
- ASPRS (2024). *Positional Accuracy Standards for Digital Geospatial Data*, Edition 2, Version 2. https://www.asprs.org/Main/Main/Standards/Positional-Accuracy-Standards.aspx
- OpenDroneMap documentation. https://docs.opendronemap.org/

## Evidence boundary

The local books establish the measurement workflow and applied failure modes. ASPRS governs current accuracy reporting where applicable. OpenDroneMap documentation supplies changing implementation semantics for that software. Recent studies support conditional decisions but do not justify universal acquisition parameters, accuracy claims or model choices.
