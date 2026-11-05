# Synthetic Aperture Radar for Geospatial Deep Learning

## Purpose and boundary

Use this reference for SAR classification, segmentation, detection, regression, change detection, retrieval, polarimetry and interferometric tasks. Read it with `core-remote-sensing.md`, `workflow.md` and `validation-and-leakage.md`.

The source synthesis is based on van Zyl and Kim (2010), Hajnsek and Desnos (2021), Sandwell et al. (2025), and the current evidence cited in this reference.

SAR is a coherent, side-looking microwave measurement. Optical-image habits do not transfer automatically. Product selection, calibration, geometry, complex information, speckle and acquisition configuration are part of the model definition.

This reference covers durable principles and current evidence available on 4 November 2026. Exact mission products, processor baselines and software operations require current official documentation.

## 1. Define the SAR information the task needs

**Status: durable principle.**

Select the product from the required observable, not convenience.

| Task need | Usually required information | Product implications |
|---|---|---|
| Calibrated amplitude or intensity mapping | Backscatter with geometry and area normalization appropriate to terrain | Prefer documented RTC/NRB when suitable; preserve convention and masks |
| Fine target detection | Resolution, point-target response, geometry and calibrated amplitude | SLC or suitable GRD/RTC depending phase need and delivery grid |
| Polarimetric interpretation | Relative complex amplitude and phase among polarization channels | Calibrated complex polarimetric data or valid covariance/coherency products |
| Interferometry or coherence | Phase-preserving, precisely coregistered repeated acquisitions | Compatible SLC/CSLC products, precise orbits and interferometric metadata |
| Surface deformation | Interferometric phase plus topographic, atmospheric, orbital and tidal corrections | InSAR processing chain; amplitude imagery alone is insufficient |
| Temporal disturbance | Consistent calibrated time series with source-date and geometry control | RTC/NRB for amplitude change or CSLC/SLC for coherence/phase methods |
| Physical retrieval | Calibrated observable and acquisition variables supported by a scattering model | Preserve frequency, polarization, incidence, terrain and environmental context |

Do not discard complex phase, polarization relations or acquisition metadata and later claim a result that requires them.

## 2. Understand common product distinctions

### SLC versus GRD

**Status: durable principle; product details require current verification.**

- A single-look complex product retains complex I/Q values in slant-range/azimuth geometry and normally uses the available signal bandwidth.
- A ground-range detected product contains detected magnitude or power after multilooking and projection to ground range. It does not retain interferometric phase.
- Multilooking reduces speckle variability while reducing resolution and changing statistical support.
- Pixel spacing is not spatial resolution.

Sentinel-1's 2025 specification, for example, distinguishes SLC from multilooked detected GRD and publishes mode-specific resolution, spacing and looks. Record the mission's actual values rather than assuming “10 m Sentinel-1” describes all products.

### RTC, NRB and geocoded products

**Status: durable principle with product-specific implementation.**

Geometric terrain correction maps observations to a geographic grid. Radiometric terrain correction also normalizes terrain-induced variation in contributing area. These operations address different problems.

Record:

- backscatter convention, such as beta nought, sigma nought or gamma nought;
- ellipsoid or local-area reference;
- DEM identity, resolution, vertical datum and acquisition date;
- local incidence angle or normalization-area layers;
- layover, shadow and validity masks;
- output projection, spacing, resolution and resampling;
- processor and product version.

Use current CEOS Analysis Ready Data specifications or official mission documentation to interpret “analysis ready”; the label does not make all products numerically interchangeable.

### NISAR products

**Status: requires current verification.**

NISAR provides L-band and S-band observations and distinguishes focused range-Doppler, interferometric, geocoded SLC and covariance products. NASA reported provisional L-band release in July 2026. Record provisional/validated status, product version and product specification. Do not transfer Sentinel-1 C-band assumptions to NISAR L- or S-band data.

## 3. Preserve SAR measurement semantics

### Complex signal, amplitude and intensity

**Status: durable principle.**

An SLC sample can be written

$$
z=Ae^{i\phi}=I+iQ,
$$

with amplitude $A=|z|$ and intensity or power proportional to

$$
p=|z|^2=I^2+Q^2.
$$

Amplitude, intensity and complex I/Q are different inputs. State which is used.

### Linear and decibel domains

**Status: durable principle.**

For power-like backscatter $p>0$,

$$
p_{\mathrm{dB}}=10\log_{10}(p).
$$

For amplitude $A>0$, the equivalent convention is $20\log_{10}(A)$. Do not apply the wrong factor, take logarithms of invalid or nonpositive values, or mix linear and dB statistics without stating the transform.

The log transform compresses dynamic range and changes the noise distribution. Choose the model domain by validation and physical meaning, not display appearance.

### Polarimetric scattering

**Status: durable principle.**

In a linear polarization basis,

$$
\mathbf{S}=
\begin{bmatrix}
S_{hh} & S_{hv}\\
S_{vh} & S_{vv}
\end{bmatrix}.
$$

State transmit/receive order, basis, look direction, reciprocity assumption and calibration. Covariance or coherency matrices summarize second-order complex statistics over a specified support; they are not merely stacks of independent bands.

## 4. Handle geometry before modelling

**Status: durable principle.**

Side-looking geometry creates foreshortening, layover and shadow.

- Foreshortening compresses slopes facing the sensor.
- Layover mixes or reverses range ordering; one map pixel may not represent one separable surface.
- Shadow contains no direct measurement of the hidden surface.

Terrain correction can relocate and normalize measured returns but cannot create missing information or fully separate layover mixtures. Mask or model affected areas according to the task. Evaluate mountainous and flat terrain separately when relevant.

Ascending and descending acquisitions illuminate geometry differently. Orbit direction is not an interchangeable augmentation.

## 5. Treat speckle as part of coherent imaging

**Status: durable principle.**

Speckle arises from coherent interference among unresolved scatterers. Its distribution depends on the data representation, number of looks, scene heterogeneity and processing.

For homogeneous intensity data, a commonly used diagnostic is the equivalent number of looks

$$
\mathrm{ENL}=\frac{\mu^2}{\sigma^2},
$$

where $\mu$ and $\sigma^2$ are local intensity mean and variance under the estimator's assumptions. ENL is not a universal image-quality score and can be misleading in textured or heterogeneous regions.

### Filtering decision

Do not despeckle automatically. Compare:

1. the documented native or analysis-ready product;
2. multilooking at task-relevant support;
3. a justified speckle filter;
4. a model designed to learn from the native statistics.

Assess boundary preservation, point targets, radiometric bias, polarimetric matrix validity and downstream performance. “Cleaner-looking” imagery is not sufficient evidence.

Recent learned despeckling work continues to report domain gaps, oversmoothing and the absence of truly speckle-free reference SAR. Synthetic optical-to-speckle pairs therefore require transfer validation on real SAR.

## 6. Calibrate and normalize deliberately

**Status: durable principle with product-specific implementation.**

A processing sequence may include orbit updates, border- or thermal-noise handling, radiometric calibration, multilooking, terrain normalization and geocoding. The correct sequence and applicability depend on mission, product type and processor baseline.

- Follow official product documentation rather than a generic copied recipe.
- Do not repeat a correction already applied by the delivered product.
- Preserve calibration/noise vectors and quality annotations when working from lower-level products.
- Record the backscatter convention before and after terrain normalization.
- Validate DEM alignment and terrain masks.
- Combine geometric mapping into as few interpolation passes as practical.
- Retain linear values for operations whose physical/statistical definition requires them; use dB only when appropriate.

## 7. Build consistent time series

**Status: durable principle.**

For amplitude time series, control:

- frequency band, mode, polarization and product type;
- relative orbit, look direction and incidence-angle distribution;
- calibration and processing baseline;
- terrain normalization, grid and resampling;
- acquisition time, season and environmental state;
- border, noise, shadow, layover and validity masks.

Do not infer physical change from a difference until acquisition and processing changes are excluded or modelled.

### Interferometric coherence

For coregistered complex samples $z_1$ and $z_2$, local complex coherence is estimated as

$$
\gamma=
\frac{\mathbb{E}[z_1z_2^*]}
{\sqrt{\mathbb{E}[|z_1|^2]\mathbb{E}[|z_2|^2]}}.
$$

The finite-window estimate depends on support and filtering. Decorrelation can reflect temporal change, spatial baseline, volume scattering, noise, misregistration or processing—not one unique cause.

The interferometric phase contains multiple contributions:

```text
Earth geometry + topography + deformation + orbit error
+ ionosphere + troposphere + tides + noise
```

Isolating deformation is a correction and inference problem. A neural network does not remove these components unless its design and validation establish that behavior.

For a stated phase and displacement sign convention, the deformation contribution is commonly related to line-of-sight displacement by

$$
\phi_{\mathrm{def}}=-\frac{4\pi}{\lambda}d_{\mathrm{LOS}}.
$$

InSAR observes one projected component, not a three-dimensional displacement vector. Report the look vector, reference acquisition, spatial reference, sign convention, unwrapping method and corrections. Use ascending/descending geometry, GNSS or explicit physical constraints when multiple displacement components are required.

Keep every interferogram sharing an acquisition inside the same split. Acquisition networks create dependence even when image pairs or tiles have different identifiers. Preserve low-coherence masks, unwrapping connected components and loop-closure diagnostics because unwrapped phase is an algorithm-dependent estimate, not an error-free label.

## 8. Construct model inputs explicitly

**Status: durable principle.**

Possible representations include:

- calibrated linear intensity or amplitude;
- log-scaled or standardized backscatter;
- real and imaginary SLC components;
- magnitude with phase represented cyclically, such as sine and cosine;
- dual- or quad-polarization channels;
- covariance/coherency matrices or valid parameterizations;
- interferometric phase, coherence and baselines;
- local incidence angle, DEM-derived geometry and masks;
- physically motivated decompositions or indices.

Do not feed invalid pixels as ordinary zeros. Fit clipping and normalization on valid training data. Preserve enough metadata to reproduce channel meaning.

When using complex networks or matrix inputs, verify that transformations preserve phase and matrix constraints. When converting to three-channel images for RGB-pretrained models, document the mapping and compare against SAR-specific and simple baselines.

## 9. Choose augmentation from SAR physics

**Status: durable principle.**

An augmentation is valid only if it represents a deployment variation and preserves the label.

- Horizontal or vertical flips can reverse range/azimuth or look-direction semantics.
- Arbitrary rotation changes the relationship among target orientation, flight direction, illumination, layover and shadow.
- Generic additive Gaussian noise does not reproduce coherent speckle.
- Blur, resampling and synthetic speckle change resolution and statistics.
- Polarization-channel permutation is not generally valid.
- Phase perturbation can destroy interferometric meaning.

Validate augmentations on held-out acquisitions containing the intended variation.

## 10. Tile without inventing independence

**Status: durable principle.**

SAR artifacts, speckle and scene context extend across chips. Keep overlapping chips and chips from the same acquisition group together during splitting. Choose chip size from target/context scale, resolution, point-spread behavior and model receptive field.

At inference, inspect edge effects, burst/subswath boundaries, scene borders and overlap merges. Do not count overlapping chips as independent evidence.

## 11. Prevent SAR-specific leakage

**Status: durable principle.**

Group or hold out as required:

- source acquisition and relative orbit;
- repeat observations of the same location or target;
- burst, subswath, scene and mosaic lineage;
- platform, frequency, mode and polarization;
- processing baseline and terrain-correction product;
- simulated variants of one source target;
- nearby chips sharing clutter and acquisition artifacts.

SAR automatic-target-recognition datasets often contain multiple views of the same physical target or collection campaign. Random image splits can reward target/campaign recognition rather than class transfer.

## 12. Validate across the claimed domain

**Status: durable principle.**

Report results by relevant strata:

- platform and frequency band;
- polarization configuration;
- mode, resolution and number of looks;
- incidence angle and orbit direction;
- terrain, shadow and layover;
- sea state, vegetation state, season or moisture regime;
- target size, orientation and clutter;
- geography, acquisition and product version.

Compare:

1. calibrated source channels or established physical features;
2. conventional task baseline;
3. frozen pretrained representation;
4. parameter-efficient adaptation where justified;
5. full fine-tuning only when data and compute support it.

Evaluate probability calibration and abstention if confidence drives action.

## 13. Current deep-learning evidence

### Higher-weight peer-reviewed evidence

- **SUMMIT** (Du et al., 2025, *International Journal of Applied Earth Observation and Geoinformation*, DOI `10.1016/j.jag.2025.104624`) combines masked modelling with denoising and scattering-related auxiliary objectives. It supports testing SAR-specific pretraining objectives, not assuming their universal superiority.
- **SARCLIP** (2025, IEEE TGRS, DOI `10.1109/TGRS.2025.3630131`) evaluates SAR-language alignment on retrieval, zero-/few-shot classification, linear probing and counting. Caption construction and benchmark composition remain part of the evidence boundary.
- **SARCLIP multimodal framework** (2025/2026, ISPRS JPRS, DOI `10.1016/j.isprsjprs.2025.10.017`) uses a large SAR-caption corpus. Treat separately from the IEEE work and verify dataset overlap for downstream evaluation.
- **RobSense** (Do et al., CVPR 2025) studies multispectral-SAR, temporal and missing-modality adaptation. Its results support missing-modality-aware evaluation rather than an assumption that fusion is always available.
- **WV-Net** (2025, *Artificial Intelligence for the Earth Systems*) shows Sentinel-1 Wave Mode self-supervision can outperform natural-image pretraining on selected ocean tasks. Its source distribution is ocean WV imagery, so transfer to land modes is not established.
- **DG-SARFM** (Xu et al., 2026, ISPRS JPRS, DOI `10.1016/j.isprsjprs.2026.10.019`) explicitly incorporates denoising-guided reconstruction and contrastive objectives. Its million-scale paired denoised corpus makes the selected denoiser part of the learned prior.
- **DINOv3 parameter-efficient SAR road segmentation** (2026, *Remote Sensing* 18(7), 973) demonstrates optical-pretrained adaptation to a SAR task. It is task-specific evidence and does not establish general optical-to-SAR transfer.

### Emerging or preprint evidence

- Nereus-SAR-1 (2025) studies dynamic dataset curation over the Sentinel-1 WV archive.
- OPERA RTC-S1 disturbance mapping (2025) uses self-supervised temporal modelling on three disaster cases.
- SAR-KnowLIP and TerraFM (2025 preprints) explore SAR-language and SAR-optical foundation models.
- *On the Status of Foundation Models for SAR Imagery* (2025 preprint) reports promising transfer while emphasizing that general SAR foundation capability remains immature.
- A 2026 open review in *Science China Information Sciences* organizes SAR foundation models into visual, multimodal and generative families; use it for discovery, then inspect primary model papers.

The field is young and benchmark-heavy. Dataset identity, sensor/mode coverage, geographic separation, pretrained-data overlap, physical input semantics and operational cost remain common evidence gaps.

## 14. Decision framework

### Prefer documented RTC/NRB when

- the task uses amplitude/backscatter in map geometry;
- phase is unnecessary;
- terrain normalization and consistent tiling materially reduce preprocessing risk;
- the product's DEM, normalization convention, masks and version are acceptable.

### Prefer SLC/CSLC when

- phase, coherence, interferometry or fine complex structure is required;
- custom multilooking or focusing support is needed;
- the project can manage radar geometry, coregistration and data volume.

### Prefer calibrated polarimetric products when

- scattering relationships among channels are central;
- the acquisition provides the required polarization configuration;
- calibration and conventions are known;
- spatial averaging is chosen for the target scale.

### Use SAR-specific pretraining when

- source frequency, mode, product representation and task overlap are plausible;
- benchmark evidence includes the intended transfer axis;
- it beats a current task baseline under the same split;
- licensing and checkpoint provenance are acceptable.

### Do not use SAR alone when

- the target requires spectral or thermal quantities SAR does not measure;
- shadow or layover removes essential information;
- the required physical retrieval is non-identifiable under the available frequency/polarization/geometry;
- optical, elevation or in-situ data provide necessary complementary evidence.

## 15. Paper-writing checklist

Report:

1. mission, platform, frequency, mode, orbit direction and acquisition dates;
2. product type, processing baseline and access date;
3. polarization channels and complex/intensity representation;
4. backscatter convention, calibration, linear/dB transform and clipping;
5. orbit, noise, multilooking, filtering, terrain correction and geocoding;
6. DEM, local incidence, shadow/layover and validity masks;
7. resolution, pixel spacing, looks, chip size, stride and overlap;
8. split grouping by geography, acquisition, target and time;
9. model checkpoint, pretraining data, adaptation and channel mapping;
10. augmentation assumptions specific to range, azimuth and look direction;
11. threshold, postprocessing and delivered-product metrics;
12. transfer limits across frequency, geometry, sensor, terrain and environment.

## 16. Primary sources

- van Zyl, J., and Kim, Y. (2010). *Synthetic Aperture Radar Polarimetry*. JPL. https://descanso.jpl.nasa.gov/SciTechBook/series2/SAR_Polarimetry_compressed.pdf
- Hajnsek, I., and Desnos, Y.-L., eds. (2021). *Polarimetric Synthetic Aperture Radar: Principles and Application*. https://doi.org/10.1007/978-3-030-56504-6
- Sandwell, D. T., et al. (2025). *Satellite Radar Interferometry: Theory and Practice*. https://doi.org/10.1017/9781009606226
- Copernicus Sentinel-1 Product Specification, rev. 3.16, 2025. https://sentiwiki.copernicus.eu/web/s1-documents
- CEOS Analysis Ready Data, Combined SAR Product Family Specification v1.2, 2025. https://ceos.org/ard/
- NASA NISAR Science Users' Handbook, second edition, 2025. https://science.nasa.gov/mission/nisar/nisar-handbook/
- NASA/ASF OPERA and RTC product guidance. https://docs.asf.alaska.edu/datasets/using_ASF_data/

## Evidence boundary

The three local books establish SAR, polarimetric and InSAR foundations. Official Sentinel-1, NISAR, CEOS and ASF documentation supplies changing product semantics. Recent model papers show viable approaches but do not justify a universal architecture, preprocessing recipe or transfer claim.
