# Multimodal Remote-Sensing Fusion

## Purpose

Use this branch when combining optical, SAR, thermal, hyperspectral, LiDAR, elevation, maps, weather, text or learned embeddings. Fusion is justified only when complementary evidence improves the delivered decision under realistic data availability and cost.

## 1. Define the role of each modality

**Status: durable principle.**

For every input, record:

- physical quantity, units and observation mechanism;
- platform, product level, processor and version;
- spatial, spectral and temporal support;
- geometry, viewing direction and valid-data mask;
- noise, saturation, artifacts and known failure modes;
- availability, latency, licensing and operational cost;
- hypothesized contribution to the target.

Do not call two arrays separate modalities merely because they have different filenames, and do not treat genuinely different measurements as interchangeable channels.

## 2. Establish whether fusion is necessary

**Status: durable principle.**

Create matched baselines using the same population, split and evaluation unit:

1. each modality alone;
2. the strongest operationally available modality;
3. simple concatenation or score averaging where valid;
4. the proposed learned fusion;
5. the proposed system with each modality removed.

Fusion adds value only if improvement survives these comparisons and the acquisition, preprocessing, compute and failure costs are acceptable. A larger network beating a smaller unimodal model does not isolate the value of the additional modality.

Name the intended product before choosing a method. Resolution enhancement, feature enrichment, reconstruction at missing dates, cross-modal transfer and downstream classification are different fusion problems with different reference evidence.

## 3. Align meaning before values

**Status: durable principle.**

Verify CRS, datum, transform, footprint, resolution, point-spread function, terrain displacement, acquisition time and spatial support. Measure residual alignment on representative stable features. A common grid is not proof that observations describe the same ground support.

Avoid resampling every modality to the finest grid and implying that all inputs gained that resolution. Record interpolation and masks. Where fine alignment is not defensible, use object-, region- or decision-level fusion, or architectures that model uncertainty in correspondence.

## 4. Treat time as part of alignment

**Status: durable principle.**

Define the allowable time difference from process dynamics and the target label. Optical and SAR observations separated by days may legitimately disagree because of change, crop development, moisture or disturbance. Do not train the model to call real temporal change a registration error.

For sequences, preserve acquisition time, missing steps and irregular intervals. Split repeated locations and shared source sequences together to prevent temporal and spatial leakage.

Spatiotemporal resolution enhancement is a reconstruction problem. Abrupt change, atmospheric differences and acquisition geometry propagate uncertainty into the fused product; visual continuity is not proof that change was reconstructed correctly.

## 5. Choose the simplest fusion level that matches the evidence

### Early or input-level fusion

Combine aligned variables before substantial feature extraction. It is simple and permits local cross-channel interaction, but is brittle to misregistration, scaling differences and missing inputs.

### Feature-level fusion

Use modality-specific encoders followed by concatenation, addition, gating, cross-attention or another interaction. This respects distinct input statistics and is the default candidate when fine interactions matter, but it adds capacity and can permit one modality to dominate.

### Decision-level fusion

Combine calibrated predictions from separate models. It supports independent preprocessing and graceful operation with subsets of modalities, but may miss fine cross-modal evidence.

### Hybrid fusion

Use multiple interaction levels only when controlled ablations show that one level is insufficient. Architectural complexity is not evidence of better fusion.

For imagery–point-cloud fusion, also choose the output support explicitly: attributes attached to points, image or voxel grids, object features, or separate decisions. Each representation discards and interpolates different information.

## 6. Preserve shared and modality-specific information

**Status: durable principle.**

Let modality encoders produce \(z_m=f_m(x_m)\) and a fusion operator produce

$$
z=F(z_1,\ldots,z_M; a_1,\ldots,a_M),
$$

where \(a_m\) represents availability or quality. Alignment losses can encourage compatible shared structure; reconstruction or separate branches can retain modality-specific information. Excessive alignment may remove useful differences. Inspect representation and performance ablations rather than assuming a shared latent space is beneficial.

## 7. Diagnose modality dominance and negative transfer

**Status: durable principle.**

Measure performance with each modality alone, removed, corrupted and shuffled. Inspect per-modality gradients, gates or attention only as diagnostics—not as proof of causal use. A model can ignore a weak modality, exploit registration artifacts or use one sensor as a geographic identifier.

If fusion underperforms the best unimodal baseline, first check alignment, label timing, normalization, capacity imbalance and data quality. Do not add a more elaborate fusion block before identifying the limitation.

## 8. Design for missing, noisy and stale inputs

**Status: durable principle.**

List deployment states such as cloud-obscured optical imagery, unavailable SAR acquisition, sparse LiDAR coverage, corrupted bands or delayed auxiliary data. Train on missingness patterns only when they are plausible, and provide explicit availability masks.

Evaluate:

- all modalities present and valid;
- each modality absent;
- plausible combinations absent;
- degraded quality at observed levels;
- asynchronous or stale inputs;
- contradictory evidence.

Do not silently replace a missing modality with zeros unless zero cannot be a valid measurement and the model receives an explicit mask. Synthetic modality reconstruction must be evaluated through the downstream decision and uncertainty, not only visual similarity.

## 9. Keep preprocessing modality-aware

**Status: durable principle.**

Use sensor-appropriate calibration, normalization, masking and augmentation. Fit learned statistics within training partitions. Preserve SAR product semantics, optical reflectance and masks, elevation datum, LiDAR density and hyperspectral band identity.

An augmentation is valid only if its effect is consistent across modalities and labels. A spatial transform must be applied coherently; a radiometric transform may be appropriate for one sensor and invalid for another.

## 10. Use embeddings as measurements with provenance

**Status: durable principle.**

Record embedding model, checkpoint, training corpus, date, spatial support, preprocessing and frozen/adapted status. Compare embeddings with raw or engineered inputs and test whether fusion adds information beyond the embedding alone. Read `embeddings.md` for DINO and AlphaEarth-specific guidance.

## 11. Validate the deployment system

**Status: durable principle.**

Group shared locations, scenes, acquisitions and derived products across splits. Evaluate new regions, seasons, sensors and processing versions when claimed. Report performance by modality availability and quality state, not only a pooled complete-data score.

Calibrate probabilities for the deployed input states. Uncertainty should increase or trigger abstention when key evidence is missing or contradictory. Evaluate the final postprocessed map using `spatial-statistics-and-validation.md` when population map accuracy or area is claimed.

## 12. Modality-specific cautions

- **Optical + SAR:** distinct physics and terrain geometry make pixel correspondence difficult; cloud-free optical and SAR may still observe different surface conditions.
- **Optical + LiDAR/DSM:** vertical structures are displaced differently in off-nadir imagery; rasterized height and imagery may not share object boundaries.
- **Hyperspectral + LiDAR:** spectral mixtures and 3D structure are complementary, but band selection, point density and support must be retained.
- **Thermal + optical:** temperature, emissivity, illumination and acquisition time differ; colorizing thermal data does not make it optical.
- **Imagery + maps/text:** maps and reports can be stale, generalized or derived from the target; audit provenance and label leakage.

## 13. Minimum reporting record

1. role and physical meaning of every modality;
2. product versions, acquisition times and matching rule;
3. native and model-grid support, registration method and residual error;
4. masks, missingness and quality indicators;
5. modality-specific preprocessing and fitted-statistic scope;
6. fusion level, parameters and objective;
7. unimodal, simple-fusion and removal baselines;
8. complete, missing, noisy and stale-input results;
9. split groups and pretrained-corpus overlap audit;
10. calibration, uncertainty, abstention and final-map assessment;
11. compute, latency, data-access and operational costs;
12. applicability limits and observed negative transfer.

## Source boundary

This branch combines Ghamisi et al. (2019), Hong et al. (2021), accessible evidence from Camps-Valls et al. (2021), Saha (2025), the scope of Pun and Zhang (2026), and primary evidence from CROMA, SkySense, M3LEO, RobSense, the 2025 sensor-failure benchmark and SkySense V2. The commercial books were not fully accessible; task-specific current verification remains required.
