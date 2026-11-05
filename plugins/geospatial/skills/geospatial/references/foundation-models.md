# Earth-Observation Foundation Models

## Purpose

Use this reference to decide whether and how to use a pretrained Earth-observation model. The scoped model registry is in `foundation-model-registry.md`. Detailed DINO, AlphaEarth Foundations and TESSERA guidance remains in `embeddings.md`.

The central rule is simple: choose a model from the measurement and task contract, then test it against a modest sensor-matched supervised baseline. Do not choose from model reputation or a single benchmark average.

Operational input, output and licence contracts for the core released families are recorded in `foundation-model-documentation.md`.

## What counts as a foundation model

For this library, an EO foundation model is a substantially pretrained model intended to produce reusable representations or outputs across multiple downstream tasks, sensors, regions, resolutions, or times. Large parameter count is neither necessary nor sufficient.

Keep four objects distinct:

1. **Encoder foundation model:** transforms imagery or time series into reusable features, such as CROMA, DOFA, AnySat or Galileo.
2. **Generative multimodal model:** encodes and generates modalities, such as TerraMind.
3. **Embedding product:** distributes precomputed vectors, such as AlphaEarth Foundations or TESSERA. TESSERA also releases its encoder and inference code, so one family can occupy both categories.
4. **Vision-language or conversational model:** aligns imagery and language or generates text, such as RemoteCLIP or GeoChat.

A dataset, a task-specific detector, an orchestration agent, or a generic natural-image backbone is not automatically an EO foundation model.

## Prithvi-EO decision guide

Prithvi-EO-2.0 belongs near the front of the shortlist when the project uses HLS-compatible multispectral imagery or comparable temporal surface-reflectance inputs. Its native pretraining contract is six HLS bands at 30 m—Blue, Green, Red, Narrow NIR, SWIR 1 and SWIR 2—over 4.2 million global time-series samples.

Use this selection order:

1. Start with Tiny-TL or 100M-TL when memory, iteration speed or deployment cost matters.
2. Compare it with a sensor-matched supervised baseline under the same split and tuning budget.
3. Move to 300M or 600M only when validation evidence shows that model capacity changes the project decision.
4. Use a TL variant only when time/location metadata are reliable or the missing-metadata case is explicitly tested.

Preserve chronological frame order, reflectance semantics and the six-band order. TerraTorch can introduce new band names, but their patch embeddings are randomly initialized; this is adaptation, not pretrained support. Current documentation also disagrees on whether day of year is 1–365 or 0–364. Follow and pin the installed TerraTorch interface, which currently documents 0–364, and record that convention with the experiment.

Prithvi's published transfer results do not establish universal superiority on VHR RGB, SAR, hyperspectral or differently calibrated imagery. Use DOFA, SMARTIES, CROMA, AnySat, Galileo, Clay or another sensor-matched candidate when its native input contract is closer.

**Label: domain-specific guidance.** Prithvi is a strong HLS/temporal prior, not a default for every geospatial raster.

## Selection workflow

### 1. Define the output before selecting the model

Record the target variable, task unit, spatial support, temporal support, acceptable latency, geographic deployment domain and required uncertainty output. A crop-type map, flood mask, biomass regression and image retrieval system require different evidence.

**Label: durable principle.** Model selection is conditional on the decision problem. There is no context-free best EO foundation model.

### 2. Write the input contract

Record:

- sensor and product level;
- bands, polarization or channels and their order;
- reflectance, backscatter, amplitude or digital-number semantics;
- scaling, offsets, normalization and NoData treatment;
- ground sample distance and effective support;
- acquisition dates, temporal length and missing observations;
- CRS, transform, co-registration accuracy and resampling history;
- chip footprint, pixel dimensions and metadata inputs.

Compare this contract with the model card and pretraining domain. Do not silently duplicate, drop or reorder bands. Do not present resampled pixels as new spatial information.

**Label: durable principle.** Input compatibility is part of the model, not a preprocessing detail.

### 3. Shortlist by native capability

Use the smallest shortlist that covers the actual constraint:

- **HLS multispectral time stacks:** Prithvi-EO is a natural candidate.
- **Aligned Sentinel-1 and Sentinel-2:** CROMA is a direct radar–optical candidate.
- **Variable spectral band sets:** DOFA, SMARTIES or Copernicus-FM are relevant candidates when wavelength metadata and sensor assumptions are satisfied.
- **Heterogeneous modalities, scales and resolutions:** AnySat or Galileo are candidates; TerraMind is relevant when generation or native multimodal encoding is genuinely needed.
- **General sensor-flexible embeddings with metadata:** Clay is a candidate.
- **Dense high-resolution RGB features:** DINOv3 satellite or Scale-MAE may be appropriate.
- **Pixel or parcel time series:** Presto or U-BARN may be more appropriate than a tiled image encoder.
- **Hyperspectral tasks:** SpectralGPT, HyperSIGMA or SpectralEarth models belong in the shortlist.
- **SAR target recognition:** SARATR-X or SAR-JEPA may be relevant, but their evidence does not establish broad scene-level SAR performance.
- **Text retrieval or zero-shot semantic matching:** RemoteCLIP-class models belong in a separate vision-language evaluation.
- **Annual 10 m embedding analysis without local encoder inference:** AlphaEarth Foundations and TESSERA are product candidates. TESSERA is especially relevant when an open Sentinel-1/Sentinel-2 encoder and non-Earth-Engine access matter.

**Label: domain-specific guidance.** These are shortlist rules, not guarantees.

### 4. Establish baselines before expensive adaptation

At minimum compare:

1. a simple sensor-matched supervised baseline trained from scratch;
2. a frozen foundation-model encoder with a linear or shallow head;
3. partial or full fine-tuning only if the frozen result and available labels justify it.

Use identical spatial/temporal splits, label versions, evaluation support and metrics. Match tuning effort reasonably across models. A foundation model has not demonstrated value merely because it beats an ImageNet checkpoint under unequal tuning.

**Label: durable principle.** Pretraining is an empirical prior, not a substitute for a controlled baseline.

### 5. Validate transfer, not memorization

Separate train, validation and final test by the dependence structure that matters: site, scene, tile, acquisition campaign, geography or time. Keep overlapping chips and repeated observations of the same object together. Fit normalization, feature reduction, thresholds and calibration only on training data; use validation for model and operating-point choices; open the final test once.

Report both in-domain and relevant transfer tests, for example cross-region, cross-season, cross-year or cross-sensor. PANGAEA's evidence that model rank changes across tasks and that GFMs do not consistently beat supervised baselines makes this mandatory, not optional.

**Label: durable principle.** Random patch splits are not evidence of geographic generalization.

### 6. Test adaptation regimes in increasing cost order

Use this order unless evidence supports another:

1. frozen encoder and linear probe;
2. frozen encoder and small nonlinear head;
3. parameter-efficient or last-block tuning;
4. full fine-tuning.

Select learning rates and regularization on validation data. Track trainable parameters, GPU memory, wall time and inference cost. Full fine-tuning can improve, preserve or degrade performance depending on data volume, task and optimization; it is not the default proof of a stronger model.

**Label: durable principle.** Buy complexity only after the cheaper adaptation regime fails a documented requirement.

### 7. Preserve spatial and physical semantics during tiling

Derive tile footprint from the target scale and the model's input contract. Keep the model's required normalization and metadata. For dense prediction, validate overlap, padding, edge weighting and output resampling on complete scenes. Aggregate logits or calibrated probabilities consistently; avoid stitching hard labels when soft outputs are available.

Evaluate both chip-level metrics and the delivered map. Inspect seams, boundary truncation, small-object loss, geographic shifts and class-specific errors.

**Label: domain-specific guidance.** Patch inference is an implementation detail only until it changes the map; then it is part of the scientific method.

### 8. Treat multimodal missingness and alignment explicitly

For multimodal models, record spatial, temporal and support alignment for every modality. Train and test realistic missing-modality cases if deployment data can be absent or cloudy. Compare multimodal performance with each unimodal branch. A fused model that depends on a modality unavailable at inference is not operationally valid.

For TerraMind's generated modalities or Thinking-in-Modalities, preserve the distinction between observed and generated inputs. Evaluate whether generation improves the final task under held-out conditions and whether it introduces hallucinated structures or bias.

**Label: durable principle.** Generated or derived modalities do not acquire the evidential status of observations.

### 9. Calibrate and define failure behaviour

Assess reliability on spatially separated validation data. Where decisions have material cost, test calibration, selective prediction or abstention, and out-of-distribution indicators. Do not infer uncertainty from embedding distance or softmax confidence without validation.

Document known failure domains: unseen sensors, wavelength ranges, climates, land covers, resolutions, seasonal states, clouds, layover/shadow, and metadata gaps.

**Label: durable principle.** A model needs a defined failure policy, not only an average score.

### 10. Check operational and legal fit

Before implementation, verify the current:

- code and weight licence;
- training-data or product terms relevant to commercial or publication use;
- weight availability and checksum;
- framework, CUDA and dependency requirements;
- model size, memory, throughput and tiling cost;
- reproducible preprocessing and band metadata;
- maintenance status and version identifier.

Pin model and preprocessing versions. Archive the model card or configuration used. Model-family names are insufficient because later versions may change modalities, architecture, weights or licensing.

**Label: requires current verification.** Availability and licensing can change after this reference is written.

## Minimal evaluation record

For every foundation-model comparison, retain:

| Item | Required record |
|---|---|
| Data | source product, version, dates, geography, label version and exclusions |
| Split | grouping unit, seed, spatial/temporal separation and sample counts |
| Model | exact family, version, checkpoint, licence and checksum or immutable identifier |
| Input | bands/order, scaling, normalization, GSD, chip size, dates and metadata |
| Adaptation | frozen/partial/full, head, trainable parameters, optimizer and schedule |
| Selection | validation metric, search space and stopping rule |
| Evaluation | task-appropriate metrics, classwise results, confidence intervals when justified and map inspection |
| Compute | hardware, peak memory, wall time and inference throughput at stated tile size |
| Artifacts | configuration, logs, predictions, calibration object and output map paths |

## Claims that are not supportable without new evidence

- “Foundation models always outperform conventional supervised models.”
- “The largest model is the best model.”
- “Multimodal pretraining guarantees better fusion.”
- “A sensor-agnostic architecture makes sensor shift irrelevant.”
- “A high linear-probe score proves reliable full fine-tuning or geographic transfer.”
- “A generated modality is equivalent to a measurement.”
- “A visually coherent embedding axis has a physical interpretation.”
- “Zero-shot language performance is calibrated for scientific mapping.”

## Current evidence boundary

The registry is current to 4 November 2026. Use it to form a shortlist, not to freeze the field. Add or revise a family only when a primary source and operational release change an actual engineering choice. Recent watchlist models—RAMEN, THOR, FLORO, SIGMAE, RingMoE and SpectralEarth-FM—require current verification before recommendation.
