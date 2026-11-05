# Hyperspectral Remote Sensing and Geospatial Computer Vision

## Purpose

Use this reference to design hyperspectral workflows from the scientific question to a validated map, retrieval, detection, or abundance product. It combines imaging-spectroscopy physics, field-reference design, current EnMAP and EMIT semantics, spectral libraries, unmixing, spectral-spatial learning, and leakage control.

Read `core-remote-sensing.md` for shared measurement concepts, `workflow.md` for the project lifecycle, `validation-and-leakage.md` for general split discipline, `spatial-statistics-and-validation.md` for map or population inference, and `multimodal-fusion.md` when combining hyperspectral data with other modalities.

## Evidence labels

- **Durable principle:** stable physical, statistical, geometric, or measurement reasoning.
- **Domain-specific guidance:** valid within a stated sensor, material, surface, scale, or task.
- **Dated implementation guidance:** useful for reproducing a named historical workflow, not as a default.
- **Requires current verification:** check current products, software, checkpoints, or recent task evidence.
- **Superseded:** do not use for new work except to interpret legacy products.

## 1. Define the observable target and delivered product

**Durable principle.** Start with the decision and output, not the cube or architecture.

Record:

- the target material, class, trait, anomaly, abundance, or physical variable;
- whether the output is a pixel class, object, target score, endmember, abundance, continuous retrieval, uncertainty surface, or change product;
- the spatial and temporal support of the target;
- the smallest material fraction, object, or feature that matters operationally;
- whether evidence is expected from absorption shape, continuum, overall spectrum, spatial context, temporal behavior, or auxiliary data;
- deployment sensors, wavelength range, surfaces, atmospheres, seasons, regions, and product versions;
- the independent unit that must be held out to test the intended generalization.

**Decision boundary:** use classification when one semantic label per prediction unit answers the question. Use target detection when a known signature must be found against varied background. Use unmixing when constituent contributions are required and the mixing model is defensible. Use regression or inversion when the output is continuous. These outputs are not interchangeable.

## 2. Establish the measurement contract

**Durable principle.** A hyperspectral cube is a set of spatially and spectrally integrated measurements. For every dataset, identify:

- sensor, platform, acquisition identity, time, processing level, collection, and version;
- radiance, reflectance, apparent reflectance, or another quantity, with units;
- wavelength centers, spectral response functions or FWHM, sampling interval, and band order;
- scale, offset, valid range, fill value, saturation, uncertainty, and quality flags;
- spatial grid, GSD, point-spread or modulation-transfer information when available, CRS, transform, and resampling history;
- radiometric, spectral, atmospheric, geometric, smile, keystone, and bad-pixel corrections already applied.

Apply fill and defect masks to stored codes before scaling. Preserve original band identity when removing or reordering bands.

**Current EnMAP example, issue 1.9:** L1B and L1C are scaled at-sensor radiance; L1C is orthorectified. L2A is orthorectified surface reflectance stored as signed 16-bit values with scale 10000 and background -32768:

$$
\rho_k = \frac{DN_k}{10000}
$$

for valid pixels. Verify the current specification and land or water processing mode at project start.

## 3. Choose product level from the scientific question

### At-sensor radiance

Use radiance when the forward measurement model, atmospheric retrieval, custom correction, or sensor-level analysis is part of the question. This choice carries a larger calibration and atmospheric-modelling burden.

### Surface reflectance

Use the mission's supported surface-reflectance product as the simplest baseline for material comparison, cross-date analysis, or empirical surface retrieval when its assumptions cover the target. Surface reflectance remains an estimate conditioned on atmosphere, illumination, terrain, spectral calibration, priors, and processing version.

### Product-version boundary

**Requires current verification.** EMIT v1 and v2 are not exchangeable processing labels. Version 2 changes upstream radiometry and wavelengths, radiative transfer, statistical priors, uncertainty, atmospheric state, and spatial smoothing. Do not interpret a v1-v2 difference as surface change. Reprocess to one version or model the version boundary explicitly.

## 4. Preserve spectral and spatial quality states

**Durable principle.** No-data, saturation, detector defects, striping, spectral smile, keystone, cloud, cirrus, haze, shadow, water, aerosol state, and deep atmospheric absorption are different conditions. Preserve separate masks or state variables when available.

Do not create one universal bad-band list for all sensors and scenes. Remove or downweight bands according to:

- documented product validity and uncertainty;
- target wavelength requirements;
- scene-specific SNR or artifacts;
- atmospheric absorption and correction stability;
- instrument configuration and processing version.

Record the removed wavelengths and reason. Fit any data-driven band rejection on training data only.

## 5. Match spectral references to the observation

**Durable principle.** A library spectrum needs material and measurement provenance: sample identity and state, purity, preparation, instrument, wavelength calibration, bandpass, geometry, illumination, atmosphere, processing, and library version.

When the target spectral response $r_k(\lambda)$ is available, compute a band-compatible reference from high-resolution spectrum $s(\lambda)$ as

$$
s_k = \frac{\int s(\lambda)r_k(\lambda)\,d\lambda}{\int r_k(\lambda)\,d\lambda}.
$$

This operation does not correct spatial mixing, atmosphere, directional reflectance, moisture, temperature, or scale. Treat library matching as a hypothesis to validate in scene conditions.

**Domain-specific guidance.** For vegetation, field and image spectra can differ because the image observes canopy structure, gaps, shadow, background, phenology, and multiple individuals. A leaf spectrum is not a canopy endmember by default.

## 6. Design surface-reference and field measurements

**Durable principle.** Field data are reference measurements with uncertainty, not error-free ground truth.

Before collection, specify:

- whether samples support calibration, model fitting, validation, or population inference;
- target population, sampling frame, strata, spatial design, plot size, and revisit schedule;
- instrument, foreoptic, field of view, height, angle, integration settings, wavelength calibration, and warm-up;
- white and dark reference procedure, panel identity and calibration, illumination stability checks, and repeated measurements;
- plot geometry, location uncertainty, time difference from imagery, surface condition, and aggregation rule;
- identifiers, metadata, quality checks, file structure, versions, backups, and access rules.

Match reference and image support. Derive any buffer or aggregation from the field of view, image spatial response, geolocation uncertainty, and surface heterogeneity. No universal plot-to-pixel ratio is justified.

## 7. Select spectral preprocessing by its physical purpose

### Calibration and atmospheric correction

Use product-supported correction as the baseline. A custom processor is justified only for a named limitation such as water, aerosols, adjacency, terrain, glint, or required cross-sensor consistency. Validate by wavelength, surface, and atmospheric condition.

### Smoothing and denoising

**Domain-specific guidance.** Smoothing can improve SNR but can attenuate narrow absorptions, shift extrema, and correlate errors. Select the method and scale from instrument sampling, expected feature width, and validation. Fit adaptive parameters on development data only.

### Continuum removal and derivatives

Use continuum removal or derivatives when absorption position, depth, or shape is the intended evidence. Record wavelength windows, continuum algorithm, derivative order, smoothing, and edge handling. Compare with the untransformed spectrum to ensure the target signal was not created by preprocessing.

### Normalization

Vector, area, standard-normal-variate, per-spectrum, and per-band normalizations remove different information. Do not apply per-pixel normalization when absolute reflectance magnitude is informative. Fit per-band statistics on valid training observations and reuse them unchanged.

## 8. Control dimensionality without leaking information

**Durable principle.** Many bands are correlated, while some are noisy or diagnostically narrow. Dimensionality reduction trades information, conditioning, compute, and interpretability.

Use the simplest method that addresses the limitation:

- physically selected bands or features when known absorptions control the task;
- PCA for variance-ordered linear compression;
- noise-aware transforms when a credible noise model is available;
- supervised feature selection when labels and sample size support it;
- learned encoders when a simpler representation demonstrably fails.

Fit PCA, noise covariance, feature selection, and learned preprocessing inside the training partition. Store the transform and band mapping. Variance retained is not task validity; evaluate the final product and preserve narrow target features.

## 9. Choose the model family from the required evidence

### Spectral baselines

Begin with a credible spectral baseline such as regularized linear or logistic models, partial least squares for a suitable continuous target, random forest, support-vector machine, or a shallow spectral network. The exact baseline depends on output and sample size.

### Spectral-spatial models

Use spatial context when neighborhood structure materially helps distinguish the target. Convolutions, morphological features, attention, and spectral-spatial transformers encode different locality and capacity assumptions. Their benefit must be measured under spatially honest splits.

### Pretrained and foundation models

**Requires current verification.** Before using a checkpoint, verify:

- wavelength range, band locations and ordering;
- radiance or reflectance semantics, scaling, normalization, and masks;
- spatial resolution and patch support;
- pretraining sensors, regions, dates, and possible overlap with evaluation data;
- license, official implementation, model version, and inference requirements.

Treat band interpolation, spectral projection, missing-band handling, and resolution adaptation as experiments. Keep a simpler baseline under the same split.

**Decision boundary:** add model complexity only for a demonstrated limitation such as nonlinear spectral shape, missing spatial context, domain shift, label scarcity, or multimodal evidence. A recent architecture is not a scientific reason.

## 10. Formulate unmixing explicitly

For pixel spectrum $y_i\in\mathbb{R}^{L}$, endmember matrix $M\in\mathbb{R}^{L\times p}$, abundance vector $a_i$, and residual $n_i$, the linear mixture model is

$$
y_i = Ma_i+n_i,
$$

usually with abundance non-negativity and sum-to-one constraints:

$$
a_i\geq0,\qquad \mathbf{1}^Ta_i=1.
$$

**Durable principle.** These constraints and coefficients have physical meaning only when the mixing process and preprocessing support them. Areal linear mixing is a useful baseline when subpixel materials are spatially separate. Multiple scattering, intimate mixtures, layered media, and variable endmembers can violate it.

Before unmixing, define:

- the operational meaning and number of endmembers;
- whether endmembers come from the image, a library, field data, or a joint model;
- pure-pixel, minimum-volume, sparsity, independence, variability, and spatial assumptions;
- abundance constraints and whether coefficients represent area, contribution, or another quantity;
- noise and model-discrepancy treatment.

Validate endmember identity and abundance against independent mixtures or reference observations. Reconstruction error alone cannot establish physical correctness.

Use nonlinear or variability-aware unmixing only when physical reasoning or residual evidence shows a material limitation of the linear baseline. Record sensitivity to endmember choice and model family.

## 11. Prevent hyperspectral-specific leakage

**Durable principle.** Split independent source units before extracting pixels or patches.

Random labelled pixels from one scene are usually not an independent test because:

1. neighboring pixels are spatially autocorrelated;
2. spectral-spatial patches can overlap across train and test;
3. preprocessing, endmembers, PCA, normalization, or pseudo-labels can use the full cube;
4. repeated field spectra or pixels can share the same plant, plot, flight line, or acquisition;
5. benchmark scenes can appear in pretraining data.

Required controls:

- group by site, acquisition, scene, flight line, field campaign, plot, organism, or product according to the claimed generalization;
- assign groups before patch extraction and augmentation;
- create a spatial exclusion region that prevents the complete input footprint from crossing partitions;
- fit preprocessing, endmembers, feature selection, calibration, and thresholds on training or development data only;
- keep final held-out acquisitions or sites outside all model and workflow selection.

A spatially disjoint split within one scene is a minimum control, not evidence of cross-region or cross-sensor transfer.

## 12. Treat tiling and spatial context as part of the model

Choose patch and tile size from the target's ground scale, required context, spatial response, model stride, memory, and deployment scene. Report both pixels and ground units.

If using overlapping inference:

- merge compatible scores or predictions before final thresholding when practical;
- define edge padding and spectral-spatial normalization behavior;
- inspect seams, truncated structures, and duplicated detections;
- evaluate the final mosaic or vector product.

No universal HSI patch size, overlap, or buffer is justified. Larger patches can increase context and leakage risk simultaneously.

## 13. Validate the delivered scientific quantity

Select evaluation from the output and failure cost:

- classification: confusion matrix, class-wise errors, and an aggregate appropriate to the evaluated population;
- target detection: precision-recall or ROC under declared target and background sampling, plus false alarms per relevant area when operationally meaningful;
- abundance: bias, error, constraint violations, and performance across mixture fraction and endmember variability;
- continuous traits or concentrations: bias and error across range, surface, season, sensor, and scale, with reference uncertainty stated;
- spectra: wavelength-resolved residuals and checks at diagnostic absorption regions;
- spatial products: boundary, object, area, topology, or population-inference measures required by delivery;
- change: direct validation of transitions or trajectories after controlling processing-version and acquisition differences.

Stratify by sensor, product version, wavelength region, SNR or quality state, surface, material, abundance, region, season, atmosphere, spatial scale, and acquisition geometry when those conditions can reveal failure.

Do not infer physical validity from high classification accuracy, visual smoothness, reconstruction error, or random-pixel benchmark performance alone.

## 14. Handle transfer and harmonization as explicit experiments

**Durable principle.** Two hyperspectral sensors differ in wavelength sampling, response, SNR, spatial response, geometry, calibration, processing, and coverage. Interpolating both to a common wavelength grid does not make their measurements equivalent.

For cross-sensor transfer:

1. compare wavelength range and spectral responses;
2. convolve higher-resolution spectra where possible;
3. align physical quantity and correction level;
4. preserve sensor and product-version identity;
5. measure residual spectral and spatial differences on common targets;
6. train and evaluate with held-out sensors or acquisitions that match the claim.

Use fusion only when each modality adds evidence required by the target. See `multimodal-fusion.md` for alignment, missingness, and comparison rules.

## 15. Minimum reproducibility record

Retain:

- acquisition and product identifiers, processing level, collection, and version;
- wavelength centers, responses or FWHM, band order, quantity, units, scaling, fill, masks, uncertainty, and rejected bands;
- calibration and preprocessing software, versions, parameters, and fitted artifacts;
- CRS, transform, spatial response or GSD, resampling, and alignment checks;
- field or library references with sample, instrument, geometry, timing, purity, processing, and source version;
- target definition, label version, spatial support, uncertainty, and exclusions;
- split groups, spatial exclusion geometry, patch footprint, seed, and leakage audit;
- endmember source, mixing model, constraints, priors, optimization, and residual diagnostics;
- model or checkpoint, input adaptation, training configuration, code revision, environment, and artifact path;
- inference tiling, overlap, merge, threshold, post-processing, evaluated population, metrics, and denominators.

## Decision boundaries

- Use official L2 surface reflectance as the baseline when its assumptions cover the task; use radiance when a custom forward or atmospheric model is part of the question.
- Use a spectral library only after checking sample and measurement provenance and matching spectral response.
- Use a spectral model when pixel spectra answer the task; add spatial context only when it provides required evidence and can be evaluated without leakage.
- Use linear unmixing as the first physically credible mixture baseline; add nonlinear or variability-aware models for a demonstrated mechanism or residual failure.
- Treat field observations as uncertain reference measurements and match their spatial-temporal support to the image.
- Treat product version, sensor, and preprocessing as domain variables, not filenames.
- Use a current pretrained model only after verifying input semantics, provenance, license, and honest transfer evidence.

## Source boundary

This reference is fused from Brosinsky, Wilczok, and Foerster's HYPERedu course; Cavender-Bares, Gamon, and Townsend's plant-biodiversity volume; EnMAP issue 1.9; EMIT L2A v1 documentation and the v2 transition record; USGS Spectral Library Version 7; Bioucas-Dias et al. on unmixing; Feng et al. on leakage; and the current reviews by Li et al. and Hong et al. Consult the source-specific notes for provenance and limitations. Verify fast-moving product versions, software, checkpoints, and architecture evidence at project start.
