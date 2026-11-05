# Geospatial Embeddings: DINO, AlphaEarth Foundations, and TESSERA

> **Relationship to the wider model branch:** This reference gives detailed guidance for DINO-family encoders and the AlphaEarth Foundations and TESSERA embedding products. It is not a catalogue of all EO foundation models. Use `foundation-models.md` for model selection and `foundation-model-registry.md` for the scoped registry.

## Purpose and evidence boundary

This branch supports decisions about learned representations for remote-sensing and aerial imagery. It covers the DINO family of vision encoders, the AlphaEarth Foundations (AEF) Satellite Embedding dataset, and TESSERA/GeoTessera. It does not assume that an embedding is physically meaningful, geographically transferable, or better than calibrated source imagery without task-specific evidence.

The evidence search was run on 4 November 2026. It covered primary model papers, official documentation, publisher and venue pages, arXiv, Crossref/OpenAlex discovery, and targeted searches of leading remote-sensing venues. Application literature was restricted to work published or posted from 1 January 2025 through 4 November 2026 that explicitly used DINO-family, AEF, or TESSERA representations for an Earth-observation, aerial, environmental, or geospatial task. Grounding DINO was excluded because it is a different open-vocabulary detector rather than the DINO self-supervised representation family.

The search is a reproducible scoping review, not proof that every global publication was indexed. Publication status is retained because a peer-reviewed journal article, conference paper, workshop paper, and preprint do not carry the same evidential weight.

### Search protocol

- **Date searched:** 4 November 2026.
- **Publication window:** 1 January 2025 through 4 November 2026.
- **Discovery sources:** Crossref and OpenAlex; web discovery; arXiv; official publisher, venue, model, and dataset pages; targeted searches of IEEE TGRS, ISPRS, *Remote Sensing*, *Sensors*, and *Remote Sensing Applications: Society and Environment*.
- **Query families:** `("AlphaEarth" OR "AlphaEarth Foundations" OR "Satellite Embedding") AND (remote sensing OR geospatial OR Earth observation)`, `(TESSERA OR GeoTessera) AND (remote sensing OR geospatial OR Earth observation)`, and `(DINO OR DINOv2 OR DINOv3) AND (remote sensing OR satellite OR aerial OR SAR OR Earth observation OR geospatial)`, followed by task terms such as `change detection`, `segmentation`, `classification`, `regression`, `biomass`, and `captioning`.
- **Included:** work that actually uses an AEF, TESSERA, or DINO-family representation in an Earth-observation, aerial, environmental, or geospatial experiment.
- **Excluded:** papers that only cite the models, non-geospatial applications, duplicate records, and Grounding DINO studies without DINO-family representation use.
- **Stopping rule:** searches stopped after repeated query and citation passes produced no new eligible higher-weight studies; newly posted or poorly indexed work may still be missing.
- **Screening depth:** full text or the primary publication page was inspected for the higher-weight studies below. Emerging records were screened by title and abstract unless stated otherwise.

## Three representation paradigms

### DINO-family encoders

DINO, DINOv2, and DINOv3 are models that transform an input image into a global token and a grid of patch-level features. The practitioner controls the imagery, date, preprocessing, chip size, resolution, model variant, layer, and aggregation. This flexibility also creates responsibility for domain mismatch, preprocessing compatibility, tiling, and feature extraction choices.

- DINO introduced self-distillation without labels using augmented views, a student network, and an exponentially averaged teacher. Its ViT features showed emergent semantic organization and dense localization (Caron et al., 2021).
- DINOv2 scaled curated pretraining and model size to produce general-purpose image- and pixel-level features. Its main pretraining corpus was dominated by ordinary imagery rather than calibrated multispectral Earth observation (Oquab et al., 2023/2024).
- DINOv3 added large-scale training and Gram anchoring to protect dense feature quality during long training. It includes web-pretrained models and satellite-pretrained variants. The satellite model was trained on 493 million 0.6 m Maxar RGB orthophoto chips and was evaluated on canopy height, classification, segmentation, and detection tasks (Siméoni et al., 2025).

### AlphaEarth Foundations embedding fields

AEF is a geospatial embedding-field model. The public product is not a downloadable encoder. It is a collection of precomputed annual embedding rasters generated from multisensor time series and contextual information.

The public `GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL` product provides:

- global terrestrial and coastal coverage, subject to sensor coverage limits;
- one annual representation per year from 2017 through 2024 in the current public catalog;
- 10 m pixels in local UTM tiles;
- 64 dimensionless axes named `A00` through `A63`;
- unit-length vectors on a common embedding space across years;
- inputs learned from optical, SAR, elevation and other Earth-observation sources;
- dataset, model, processing-software, year, and UTM-zone metadata;
- CC BY 4.0 dataset licensing with a required attribution.

The released dataset was generated with AEF v2.1, while the 2025 paper evaluated v2.0. This version difference must be recorded when reproducing paper results or comparing later applications.

### TESSERA pixel-wise temporal embeddings

TESSERA learns one vector per 10 m pixel from a full year of irregular Sentinel-1 and Sentinel-2 observations. Unlike AEF, it releases the inference code and model weights as well as precomputed embeddings. GeoTessera provides the product-access layer through streamed Zarr data and georeferenced exports.

The stable default documented for new projects is TESSERA v1.1 with the `dclimate` variant. It provides 128-dimensional annual embeddings for 2017–2025. The legacy 1.0 line is frozen, and v2 embedding products remain experimental betas. TESSERA v2 adds compact distilled student encoders and nested Matryoshka prefixes of 16, 32, 64 or 128 dimensions.

Every `(dataset_version, dataset_variant)` pair is a different learned coordinate system. Do not train a model, fit PCA, build prototypes, or compute temporal distances across pairs. Preserve the version, variant, year, embedding depth, CRS, transform and source store with every derived artifact.

## What an embedding represents

An embedding is a learned coordinate vector. Its usefulness is relational: nearby vectors or a simple predictor may correspond to similar conditions relevant to the pretraining objective. An axis is not automatically a named physical variable.

For AEF, Google explicitly states that all 64 bands should normally be used together and are not independently interpretable. Element 84's visual observations that particular axes resemble water, vegetation, airports, or urban structure are useful hypotheses. They require independent, spatially separated validation before they can support a scientific interpretation.

For DINO, patch tokens represent the image through the encoder's training distribution, patch size, positional representation, layer, and input preprocessing. A visually coherent principal-component map does not establish calibrated semantic meaning.

For TESSERA, each vector summarizes a year of optical and radar observations at one pixel. Its axes are latent coordinates rather than named reflectance, backscatter or phenology variables. The representation can retain useful temporal structure without revealing the date or physical cause of a change.

## Core operations and equations

### Cosine similarity

$$
s(\mathbf{z}_i,\mathbf{z}_j)=
\frac{\mathbf{z}_i^\top\mathbf{z}_j}
{\lVert\mathbf{z}_i\rVert_2\lVert\mathbf{z}_j\rVert_2}
$$

For unit-length AEF vectors, cosine similarity equals the dot product. Similarity is relative to the learned representation. A threshold must be selected on validation data for the specific target and geography.

### Angular or cosine change

$$
d_{\cos}(t_1,t_2)=1-\mathbf{z}_{t_1}^{\top}\mathbf{z}_{t_2}
$$

For unit AEF vectors, this produces a continuous annual change-intensity measure. It does not identify the cause, date within the year, permanence, or class of change. Annual representations may suppress short-lived floods, fires, or construction phases.

### Linear probing

$$
\widehat{y}=g_{\mathbf{W},\mathbf{b}}(\mathbf{z})
$$

A linear classifier or regressor tests whether the target is accessible from frozen features through a simple decision surface. It is a representation evaluation, not evidence that fine-tuning or raw imagery cannot do better.

### Nearest-neighbour prediction

$$
\widehat{y}(\mathbf{z})=y_{i^*},
\qquad
i^*=\arg\max_i s(\mathbf{z},\mathbf{z}_i)
$$

Nearest-neighbour use requires decisions about spatial sampling, class imbalance, distance, number of neighbours, aggregation, and rejection of unfamiliar cases. Spatially adjacent reference samples can inflate apparent performance.

## Decision framework

| Decision factor | AlphaEarth Foundations | TESSERA/GeoTessera |
|---|---|---|
| Public representation | Annual 64-dimensional vectors | Annual 128-dimensional vectors; v2 also offers 16/32/64-dimensional prefixes |
| Main public inputs | Multisensor EO sources used by a non-public encoder | Sentinel-1 and Sentinel-2 annual time series |
| Access | Google Earth Engine embedding product | Streamed Zarr, GeoTIFF/legacy NPY export, or local inference |
| Encoder availability | Not public | Code and weights released |
| Stable choice at the review date | Satellite Embedding V1 product generated with AEF v2.1 | v1.1/`dclimate`; v2 embeddings remain beta |
| Main operational constraint | Earth Engine and product lifecycle | Never mix version/variant pairs |

### Choose AEF when

- the target is related to annual surface condition or multi-year change;
- 10 m spatial support is sufficient;
- a global, analysis-ready multisensor representation is valuable;
- labels are sparse and a lightweight downstream model is desirable;
- the study can operate within the released years or obtain custom embeddings;
- dependence on Google's model and product lifecycle is acceptable.

### Choose TESSERA when

- the target is related to annual Sentinel-1/Sentinel-2 temporal behaviour;
- 10 m pixel support is sufficient;
- open weights and local inference are important;
- cloud-streamed or georeferenced precomputed embeddings reduce preprocessing cost;
- a downstream model can be trained and validated within one fixed version and variant;
- within-year event timing and calibrated sensor quantities are not required outputs.

### Choose a DINO encoder when

- the project needs image-date-specific or sub-annual features;
- sub-10 m aerial or satellite detail is important;
- the imagery is RGB or can be adapted without losing required information;
- patch-level dense features are needed for segmentation, matching, retrieval, or change detection;
- the model must run locally or on project-controlled imagery;
- the project can validate the mismatch between natural-image or Maxar-RGB pretraining and its sensors.

### Use calibrated source imagery alongside embeddings when

- the target depends on a physical spectral, thermal, or radar quantity;
- exact event timing matters;
- cloud, snow, flooding, fire, or another transient may be smoothed by annual summarization;
- the embedding product cannot represent the needed spatial resolution or band information;
- interpretability or traceability to measurement units is required;
- the task may benefit from complementary raw observations and embeddings.

## Extraction and modelling choices

### DINO

Record the model family and exact checkpoint, pretraining domain, license, input channels, radiometric conversion, resizing, normalization, patch size, chip dimensions, layer, class or register tokens, dense-token grid, feature aggregation, overlap, boundary handling, and whether the encoder is frozen, adapted, or fine-tuned.

Do not resize imagery solely to meet a model input size without recording the resulting ground sampling distance and spatial support. DINO patch tokens are not pixel measurements. Upsampling their feature grid does not restore lost boundaries or small objects.

Compare at least:

1. a simple task-specific baseline;
2. frozen embeddings with a linear or shallow head;
3. parameter-efficient adaptation when label volume supports it;
4. full fine-tuning only when its added compute and overfitting risk are justified.

### AlphaEarth

Preserve `MODEL_VERSION`, `DATASET_VERSION`, `PROCESSING_SOFTWARE_VERSION`, `UTM_ZONE`, temporal properties, source tile identity, projection, and scale. Avoid silently mosaicking to a one-degree default projection. Explicitly set the analysis CRS and 10 m scale or process native UTM tiles.

Use all 64 axes for ordinary downstream modelling unless a feature-reduction experiment is fitted on training data and validated out of sample. AEF vectors are already unit-normalized; automatic z-scoring or renormalization changes their documented geometry and should be justified experimentally.

### TESSERA

Prefer the stable v1.1/`dclimate` Zarr product for new analyses that need complete published coverage. Use a v2 beta only when its added capability is required and the project can tolerate a changing product. Select a single published embedding depth and validate it; the v2 paper's reported storage-performance trade-off is not a task-independent rule.

For local inference, pin the model checkpoint, code revision, Sentinel band order, normalization, orbit handling, masks, temporal sampling and quantization settings. Do not transfer preprocessing conventions between v1.1, v2 students and the v2 teacher. For downloaded products, retain GeoTessera's dataset metadata and GeoTIFF tags.

## Leakage and validation

- Split by the intended unit of generalization: region, acquisition, year, sensor, survey, or event.
- Fit PCA, clustering, prototypes, feature selection, normalization, thresholds, and downstream models on training data only.
- Keep spatial buffers or grouped source units where nearby pixels share labels, imagery, embedding context, or processing artifacts.
- Do not sample neighbouring pixels from the same polygon into both training and test sets.
- Test transfer across geography and time explicitly. Random pixel splits mainly measure interpolation within the same spatial context.
- Compare against raw or engineered EO features. Embeddings do not universally improve performance; recent crop and air-quality studies report cases where conventional predictors remain competitive or better.
- Evaluate by deployment-relevant strata, including geography, year, class rarity, object size, sensor coverage, and environmental regime.
- For change detection, separate permanent change, seasonal variability, transient events, registration effects, and product-version changes.
- Validate the delivered raster, objects, or estimates rather than only a feature-space visualization.

## Failure modes

- **Domain mismatch:** DINO features learned from natural RGB or 0.6 m Maxar imagery may not transfer to multispectral, SAR, thermal, drone, or substantially different resolution data.
- **Loss of physical meaning:** embeddings compress measurements into latent coordinates and cannot replace calibrated bands for every quantitative retrieval.
- **Annual temporal support:** public AEF and TESSERA layers cannot localize within-year events.
- **Spatial context leakage:** AEF, TESSERA and dense DINO features can contain shared spatial or source-data context across naive split boundaries.
- **Resolution mismatch:** 10 m AEF/TESSERA grids and a DINO patch grid impose different minimum observable supports.
- **Representation drift:** checkpoint, preprocessing, or AEF dataset-version changes can alter features even when labels and geography are unchanged.
- **Incompatible TESSERA releases:** different TESSERA versions or variants have non-interchangeable feature coordinates even when their geometry and channel count match.
- **Spurious interpretability:** a visually responsive axis or attention map is not a validated causal or physical explanation.
- **Provider dependency:** the AEF encoder and training code are not public; the released product depends on continuing Google production and access conditions.

## 2025-2026 application evidence

### Primary and higher-weight evidence reviewed

1. **AlphaEarth Foundations** (Brown et al., 2025, arXiv technical report). Introduces the model, training sources, architecture, 15 evaluations, low-shot transfer, change detection, biophysical regression, quantization, and global tiling. This is developer evidence rather than independent replication.
2. **DINOv3** (Siméoni et al., 2025, technical report). Includes a satellite-specific model and evaluation on canopy height, GEO-Bench, LoveDA, iSAID, and DIOR. This is developer evidence.
3. **TESSERA** (Feng et al., 2026, CVPR). Introduces pixel-wise annual Sentinel-1/Sentinel-2 embeddings, the self-supervised temporal training method, global products and lightweight downstream heads. This is peer-reviewed developer evidence.
4. **TESSERA v2** (Feng et al., 2026, arXiv preprint). Reports a 395-run scaling study, teacher-to-student distillation and Matryoshka embeddings. Its comparative and compression results remain preprint evidence.
5. **ChangeDINO** (Cheng and Hsu, 2026, ISPRS Annals). Uses frozen DINOv3 features in a Siamese optical building-change system and reports evaluation on four public benchmarks. https://doi.org/10.5194/isprs-annals-XI-3-2026-523-2026
6. **DistillSemiCD** (Xu et al., 2026, IEEE TGRS). Uses DINOv2-driven distillation for semisupervised remote-sensing change detection. Its contribution is task-specific distillation, not a general guarantee about frozen features. https://doi.org/10.1109/TGRS.2026.3711116
7. **Performance assessment of AlphaEarth embeddings for PM2.5** (2026, *Remote Sensing Applications: Society and Environment*). Reports high-resolution environmental mapping but also states that baseline predictors achieved higher predictive accuracy while AEF reduced systematic bias. This is important negative evidence against an embeddings-always-win rule. https://doi.org/10.1016/j.rsase.2026.101989
8. **Combining specialized Sentinel-2 time-series features with AEF for forest type mapping** (2026, ISPRS Annals). Treats AEF and task-specific time-series features as complementary rather than interchangeable. https://doi.org/10.5194/isprs-annals-XI-3-2026-117-2026
9. **Towards accessible smallholder crop classification in Senegal** (2026, peer-reviewed). Compares AEF and TESSERA with time-series and raw-data approaches; AEF is not uniformly superior. https://doi.org/10.1088/2976-601X/aea0b8
10. **DINOv3-PEFT road segmentation in SAR imagery** (2026, *Remote Sensing*). Demonstrates parameter-efficient adaptation to SAR, but the large optical-to-SAR domain shift makes dataset-specific validation essential. https://www.mdpi.com/2072-4292/18/7/973
11. **DINOv3 remote-sensing image captioning** (2026, *Remote Sensing*). Uses DINOv3 visual features with a Transformer-LSTM decoder; it supports captioning as an application category, not physical scene understanding. https://www.mdpi.com/2072-4292/18/6/846
12. **DINOv3 landslide mapping** (2026, *Sensors*). Evaluates semantic segmentation for mountainous landslides and illustrates the need for terrain- and geography-specific testing. https://www.mdpi.com/1424-8220/26/2/406
13. **ADVMSeg** (2026, *Remote Sensing*). Adapts a frozen DINOv3 backbone with spatial-frequency and sparse-refinement modules for high-resolution segmentation. https://www.mdpi.com/2072-4292/18/9/1295
14. **Dynamic-LoRA DINOv3 pasture biomass estimation** (2026, *Sensors*). Uses depth-dependent low-rank adaptation for multi-component biomass estimation. https://www.mdpi.com/1424-8220/26/16/5285

### Emerging evidence and preprints

The following studies were identified and screened by title and abstract. They should be treated as provisional until full peer review, correction status, and complete methods are checked for the decision at hand:

- *Scalable Geospatial Data Generation Using AlphaEarth Foundations Model* (2025, arXiv/NeurIPS climate workshop).
- *First Experiences with the AlphaEarth Foundations Model: A Cosine Distance-Based Evaluation* (2025, conference paper).
- *Changes in Gaza: DINOv3-Powered Multi-Class Change Detection for Damage Assessment in Conflict Zones* (2025, arXiv).
- *Physically Interpretable AlphaEarth Foundation Model Embeddings Enable LLM-Based Land Surface Intelligence* (2026, arXiv and later journal record).
- *Slum Detection and Density Mapping with AlphaEarth Foundations* (2026, arXiv).
- *Extending Dynamic World Surface Water Mapping to Sentinel-1 with AlphaEarth Embeddings* (2026, arXiv).
- *Evaluating AlphaEarth Foundations Embeddings for Wildfire Susceptibility Mapping* (2026, arXiv).
- *Subsurface Property Mapping using Google AlphaEarth Foundations* (2026, arXiv).
- *Characterizing Brazilian Atlantic Forest Restoration Outcomes with Geospatial AlphaEarth Embeddings* (2026, arXiv).
- marine aquaculture, wind-turbine, rice-event, peatland carbon and groundwater, seagrass, wetland, urban-cooling, and forest-inventory AEF studies indexed during 2026. Several remain preprints, conference abstracts, SSRN manuscripts, or dataset deposits rather than completed peer-reviewed articles.
- DINOv3 open-vocabulary segmentation, SAR temporal change detection, multimodal segmentation, image change captioning, object detection, and additional parameter-efficient adaptation studies indexed during 2026.

The application literature is young and dominated by model adaptation studies. Independent multisite comparisons with fixed spatial splits, raw-data baselines, calibration analysis, and operational cost reporting remain limited.

## Paper-writing requirements

For any paper using embeddings, report:

1. model and dataset version, access date, license, and source;
2. input imagery, physical units, dates, spatial resolution, and preprocessing;
3. feature type, dimension, layer, token aggregation, normalization, and tiling;
4. split unit, spatial separation, temporal separation, and leakage checks;
5. downstream model, hyperparameters, class weighting, thresholds, and postprocessing;
6. raw-data and simple-baseline comparisons;
7. geographic, temporal, and sensor applicability;
8. uncertainty, failure cases, and whether the model was frozen or adapted;
9. exact task metrics, denominators, variability, and evaluation unit;
10. limitations caused by latent interpretability, spatial support, temporal support, and provider dependence.

## Primary references

- Brown, C. F., et al. (2025). *AlphaEarth Foundations: An embedding field model for accurate and efficient global mapping from sparse label data*. https://arxiv.org/abs/2507.22291
- Caron, M., et al. (2021). *Emerging Properties in Self-Supervised Vision Transformers*. ICCV. https://openaccess.thecvf.com/content/ICCV2021/html/Caron_Emerging_Properties_in_Self-Supervised_Vision_Transformers_ICCV_2021_paper.html
- Oquab, M., et al. (2023/2024). *DINOv2: Learning Robust Visual Features without Supervision*. https://arxiv.org/abs/2304.07193
- Siméoni, O., et al. (2025). *DINOv3*. https://arxiv.org/abs/2508.10104
- Feng, Z., et al. (2026). *TESSERA: Temporal Embeddings of Surface Spectra for Earth Representation and Analysis*. CVPR. https://openaccess.thecvf.com/content/CVPR2026/html/Feng_TESSERA_Temporal_Embeddings_of_Surface_Spectra_for_Earth_Representation_and_CVPR_2026_paper.html
- Feng, Z., et al. (2026). *TESSERA v2: Scaling Pixel-wise Earth Foundation Models*. arXiv preprint. https://arxiv.org/abs/2607.03949
- GeoTessera. *GeoTessera documentation*. https://geotessera.readthedocs.io/en/latest/
- Google Earth Engine. *Satellite Embedding V1 data catalog*. https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL
- Element 84. *Exploring AlphaEarth Embeddings*. https://element84.com/machine-learning/exploring-alphaearth-embeddings/
