# Official Documentation Notes for Core EO Foundation Models

## Purpose and evidence boundary

This note records operational facts from the official model cards, repositories and framework documentation inspected on 4 November 2026. It complements the primary papers and the broader registry. Paper claims describe reported experiments; documentation defines the current executable interface. Neither proves suitability for a new sensor, geography or task.

No model weights were downloaded and no experiments were run. Repository update activity was checked only to confirm that the referenced interfaces were current at the search date.

## Documentation matrix

| Family | Executable input contract | Output and adaptation | Licence boundary observed |
|---|---|---|---|
| Prithvi-EO-2.0 | HLS-style Blue, Green, Red, Narrow NIR, SWIR 1 and SWIR 2; single or multiple chronological frames; optional time/location metadata for `_tl` variants | Transformer tokens including a CLS token; TerraTorch supplies segmentation/regression factories and decoder necks | GitHub code reports MIT; Hugging Face model card reports Apache-2.0 for the weights; recheck both at use time |
| TerraMind 1.0 | Named raw modalities including S2 L1C/L2A, RGB, S1 GRD/RTC, DEM and coordinates; tokenized LULC/NDVI need special care | Layer-wise tokens without a CLS token; fine-tuning, generation and Thinking-in-Modalities are distinct modes | Apache-2.0 repository and published open weights |
| Clay v1.5 | Sensor-specific bands plus wavelengths, normalization, GSD, latitude/longitude and time metadata | Vector or patch embeddings and MAE reconstruction; downstream heads are external | Apache-2.0 code and weights |
| AnySat | Named modality tensors, matching ground footprint, normalized values and day-of-year companions for time series | Tile, patch or dense features; patch size is expressed in metres | MIT repository and weights |
| Galileo | Structured space-time, spatial, temporal and static tensors with masks and month metadata | Global/local representations; utility constructs and normalizes the structured input | MIT repository; weights on GitHub/Hugging Face |
| Copernicus-FM | Sentinel-1 through Sentinel-5P spectral and non-spectral modalities with flexible metadata | Dynamic-hypernetwork encoder; separate global embedding product also released | Model/data stated as CC BY 4.0; repository contains mixed Apache, MIT and CC BY-NC components, so inspect the exact files used |
| DOFA | Image tensor with a centre wavelength in micrometres for every channel; documented examples cover S1, S2 and NAIP | Encoder features; downstream task head and fine-tuning are required | MIT repository; use matching code and checkpoint revisions |
| CROMA | Two-channel Sentinel-1, twelve-channel Sentinel-2 without the cirrus band, or both; default 120 × 120 pixels | Radar, optical and joint patch/global representations | MIT repository and public weights |

| TESSERA/GeoTessera | One year of Sentinel-1 and Sentinel-2 observations at each 10 m pixel, or precomputed annual embedding rasters | 128-dimensional pixel-wise embeddings; v2 students also expose nested 16/32/64/128-dimensional prefixes | MIT software; model weights and embeddings are CC0 according to the official repository |

## Prithvi-EO-2.0

### What the current release contains

The official model card lists Tiny-TL (5M), 100M-TL, 300M, 300M-TL, 600M and 600M-TL variants. The `_tl` suffix means that temporal and location embeddings are supported. Version 2 uses three-dimensional patch and positional embeddings over time, height and width. The TL variants add acquisition time and chip-centre location to encoder and decoder tokens through learned weights.

The models were pretrained on 4.2 million global time-series samples from NASA HLS v2 at 30 m using this six-band order:

1. Blue
2. Green
3. Red
4. Narrow NIR
5. SWIR 1
6. SWIR 2

The official reconstruction script expects chronological GeoTIFF inputs in reflectance units. `input_indices` maps those six channels when the source file contains extra channels. This reconstruction interface is not evidence that an arbitrary band set is pretrained.

### TerraTorch interface

Current registered names include `prithvi_eo_v1_100`, `prithvi_eo_v2_tiny_tl`, `prithvi_eo_v2_100_tl`, `prithvi_eo_v2_300`, `prithvi_eo_v2_600`, `prithvi_eo_v2_300_tl` and `prithvi_eo_v2_600_tl`.

TerraTorch can select a subset of pretrained bands or accept new band names. A new band receives randomly initialized patch-embedding weights. It must therefore be trained and validated; naming an unknown band does not create pretrained spectral knowledge. Multi-temporal use also requires an explicit frame count.

Backbone output is a list of token tensors shaped `[batch, token, embedding]`, including the CLS token. Dense decoders require token-to-image reshaping and suitable intermediate-layer selection. Layer indices differ between model sizes, so configurations are not interchangeable.

### Time and location metadata caution

The repository/model card describes day of year as 1–365, while the current TerraTorch interface documents temporal coordinates as year plus day of year 0–364. This is an observed documentation/interface discrepancy. Follow the installed TerraTorch version and its tests when constructing tensors, pin that version, and record the convention. Do not silently subtract or add one based on the paper alone.

Metadata is optional only for TL models. Pretraining dropped metadata in a fraction of samples, but that does not prove equivalent performance without it. Current generic TerraTorch data modules do not directly provide the metadata interface; a custom dataset/data module is required.

### Selection boundary

Prithvi is a strong first candidate for HLS-compatible multispectral and temporal tasks. Its 30 m HLS pretraining is a prior, not proof of performance on very-high-resolution RGB, SAR, hyperspectral imagery or differently calibrated products. Compare the smallest adequate variant with a sensor-matched supervised baseline before scaling to 300M or 600M.

## TerraMind 1.0

TerraTorch documents raw patch embeddings for `S2L1C`, `S2L2A`, `RGB`, `S1GRD`, `S1RTC`, `DEM` and `Coordinates`. RGB pretraining used Sentinel-2 RGB values in the 0–255 range; generic photography should not be assumed compatible. LULC and NDVI use tokenized inputs and are marked for cautious fine-tuning. The model accepts named tensors in a dictionary and returns a list of layer outputs without a CLS token.

With multiple modalities, TerraTorch merges patch embeddings by mean by default; max and concatenation are alternatives. Concatenation changes decoder width and is not a drop-in setting. `modality_drop_rate` can expose the model to missing input modalities during downstream training, but deployment missingness still needs explicit validation.

Thinking-in-Modalities uses a frozen generator and works only with fully pretrained raw inputs using all expected bands. It does not support arbitrary new modalities or band subsets. A generated LULC, NDVI or sensor layer remains a model output, not an observation. Validate task benefit and error propagation separately from ordinary fine-tuning.

## Clay v1.5

Clay combines a dynamic wavelength-aware embedding block, GSD/location/time positional information, a ViT MAE and a DINOv2 teacher. The release documentation lists Sentinel-2, Landsat 8/9, Sentinel-1, NAIP, LINZ and MODIS as training sensors. Normalization and central wavelengths are runtime inputs; official values for known sensors live in the repository metadata file.

The documentation describes architectural support for varied image sizes and band counts, but the model card also records a 256-pixel configured input, 8-pixel patches and fixed training sensor specifications. Treat “any size/number of bands” as architectural flexibility, not validated equivalence. New sensors need correct units, wavelength metadata, normalization and transfer tests.

The model card states that training covered land and coastal water, sampled only a small part of the source archives, and excluded the poles, open ocean and volumetric ocean/atmosphere. These are deployment boundaries, not footnotes.

## AnySat

AnySat expects modality-specific tensors in documented shapes. Time-series modalities require a companion `<modality>_dates` tensor with day of year encoded 0–364. Inputs must be normalized using the relevant mean and standard deviation. All modalities in one example must describe the same ground footprint; matching only pixel dimensions is insufficient.

Patch size is expressed in metres and the official implementation requires a multiple of 10. Its recommendation to keep at most 1,024 patches per tile is an implementation/memory guideline, not a scientific scale rule. Outputs can be one tile vector, a patch grid or a dense grid tied to a named output modality. Select the output support to match the target before training a head.

## Galileo

Galileo does not accept a single generic image tensor as its complete abstraction. Its interface separates space-time, spatial, temporal and static variables and associates group masks plus month metadata with them. Mask values distinguish encoder-visible, ignored and decoder-query variables. The official construction utility can map known bands into this structure and apply pretraining normalization.

This flexibility makes Galileo relevant when the project truly needs image, pixel-time-series and auxiliary variables together. It also increases input-construction risk. Preserve the official band grouping, masks, normalization and temporal semantics rather than building tensors by position from memory.

## Copernicus-FM

The official release extends DOFA from surface-imaging sensors to eight Sentinel modalities across S1–S5P. It couples Copernicus-Pretrain, Copernicus-FM, Copernicus-Bench and a coarse 0.25-degree global embedding product. These are separate artifacts with different spatial support and uses.

The repository states Apache-2.0 for its code while warning that portions use MIT or CC BY-NC-4.0 material; model weights and newly curated data are stated as CC BY 4.0. Inspect the files and dependency chain used in a deliverable instead of assigning one licence to the whole ecosystem.

## DOFA

DOFA generates patch-embedding weights from the supplied centre wavelength of every channel. The official examples use micrometres, including 5.405 µm for both Sentinel-1 channels in the example interface. Channel count flexibility is conditional on correct wavelength metadata, scaling and normalization.

The repository warns that newer checkpoints require the matching newer dynamic-layer implementation. Pin checkpoint and code revisions together. Encoder logits from the pretrained backbone are not task predictions; a task head must be trained and validated.

## CROMA

The official usage path accepts Sentinel-1, Sentinel-2 or both. Its default contract is two radar channels and twelve optical channels with the cirrus band removed, at 120 × 120 pixels unless deliberately reconfigured. Outputs include modality-specific patch embeddings, global-average-pooled vectors and a joint radar–optical representation.

The README demonstration normalizes each channel using mean ± two standard deviations computed from the supplied tensor collection. Applying this independently to train, validation and test changes the mapping; computing it over all splits leaks evaluation-distribution information. For a controlled experiment, fit any data-derived normalization on the training split only or use fixed documented pretraining statistics, then keep it unchanged.

## TESSERA and GeoTessera

TESSERA converts a full year of irregular Sentinel-1 and Sentinel-2 observations into a learned vector for each 10 m pixel. GeoTessera is the access library for the published embedding products. It can stream points, regions and patches from cloud-hosted Zarr stores on their native UTM grids or export georeferenced GeoTIFFs. The current documentation requires Python 3.12 or later.

For new work, the documentation recommends version 1.1 with the `dclimate` variant. This is the complete global v1.1 Zarr run. The `cambridge` variant is a separate inference run and is the only v1.1 variant with legacy NPY tiles. Version 1.0 is frozen for reproduction. Version 2 embeddings are published as experimental beta variants, although v2 inference code, compact student checkpoints and the 2-billion-parameter teacher checkpoint are released.

Never combine features from different `(dataset_version, dataset_variant)` pairs. Their channel coordinates are learned independently, so a classifier, PCA transformation, cluster model, cosine comparison or prototype fitted on one pair is invalid on another. GeoTessera records the pair in metadata sidecars and GeoTIFF tags, but project records should retain it explicitly.

The v2 student models emit Matryoshka embeddings whose 16-, 32-, 64- and 128-dimensional prefixes are designed for separate use. The v2 paper reports that the 16-dimensional prefix retained about 92% of the 128-dimensional composite performance across its evaluated tasks. Treat this as author-reported, task-set-dependent evidence; select the stored depth using project validation rather than adopting 16 dimensions as a universal rule.

TESSERA is an annual representation, not a time-stamped observation. It is a relevant candidate for label-sparse annual land, vegetation and environmental mapping when 10 m support is sufficient. It is a poor substitute for calibrated source data when the target depends on exact event timing, physical reflectance or backscatter, subpixel structure, or sensor-specific uncertainty.

## Cross-model documentation rules

1. Pin the model, checkpoint, code and documentation revision together.
2. Treat band order, wavelengths, units, scaling, GSD, dates, metadata and normalization as part of the model.
3. Prefer official input constructors when available, but inspect what they normalize or infer.
4. Distinguish author-reported benchmark claims from independently reproduced results.
5. Test the smallest adequate released variant before a larger model.
6. Recheck licences immediately before redistribution or commercial use.
7. Preserve the original observations when a model generates auxiliary modalities.

## Sources inspected

- [Prithvi-EO-2.0 repository](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
- [Prithvi-EO-2.0 300M model card](https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M)
- [TerraTorch Prithvi documentation](https://github.com/torchgeo/terratorch/blob/main/docs/guide/prithvi_eo.md)
- [TerraMind repository](https://github.com/IBM/terramind)
- [TerraTorch TerraMind documentation](https://github.com/torchgeo/terratorch/blob/main/docs/guide/terramind.md)
- [Clay v1.5 model specification](https://github.com/Clay-foundation/model/blob/main/docs/release-notes/specification.md)
- [AnySat repository](https://github.com/gastruc/AnySat)
- [Galileo repository](https://github.com/nasaharvest/galileo)
- [Copernicus-FM repository](https://github.com/zhu-xlab/Copernicus-FM)
- [DOFA repository](https://github.com/zhu-xlab/DOFA)
- [CROMA repository](https://github.com/antofuller/CROMA)
- [TESSERA repository and model documentation](https://github.com/ucam-eo/tessera)
- [GeoTessera data-access documentation](https://geotessera.readthedocs.io/en/latest/)
- [TESSERA project site](https://geotessera.org/)

## Local Prithvi primary source

`szwarcman-et-al-2024-prithvi-eo-2.pdf` is the 34-page NASA-hosted technical report. SHA-256: `7BBC7A7BBC3A380D7D5F914A19D6B30687831001F3D9F5A6EB655304043F0ACF`. It passed metadata inspection, text extraction and representative-page rendering.

## Local TESSERA primary sources

`feng-et-al-2026-tessera.pdf` is the 14-page CVPR 2026 paper. SHA-256: `80240C5F199E581417CF0F9D7FD610B7C555C243844AC96F1EFB9EDDD197D93C`.

`feng-et-al-2026-tessera-v2.pdf` is the 48-page arXiv v2 preprint. SHA-256: `F8924B5CCA82F3DD39C61E6F599CC18CEEB5021D7E80B722F42EC2E0448A6080`.

Both passed metadata inspection, text extraction and representative first-page rendering. The v2 render emitted non-fatal local font warnings, but the page rendered correctly and the text remained readable.
