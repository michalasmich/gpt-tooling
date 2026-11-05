# Earth-Observation Foundation-Model Registry, 2022-2026

## Purpose and scope

This is a decision-oriented registry, not a claim that every paper using the term *foundation model* has been found. The search was updated on 4 November 2026 and covered the PANGAEA implementation and paper, TorchGeo and TerraTorch model inventories, primary papers, official repositories and model cards, and recent survey catalogues. The broad catalogues were used for discovery; a model entered the practical registry only after a primary source or official release could be identified.

The registry includes an EO model or embedding product when it satisfies at least one of these conditions:

1. it is pretrained substantially on EO data and intended for reuse across multiple downstream tasks, sensors, regions, or resolutions;
2. it exposes a general reusable encoder or pretrained backbone with public code or weights;
3. it releases a general embedding product intended for downstream EO analysis.

Task-specific networks, datasets without a reusable model, generic natural-image models without EO adaptation, weather and climate forecasting models, planetary models, and tool-using agents are outside the core registry. Vision-language and generative systems are listed separately because their evidence and validation requirements differ from representation encoders.

## Evidence tiers

- **A — inspectable release:** primary paper or technical report plus public code and pretrained weights or embeddings.
- **B — research release:** primary paper and code, but weights, documentation, licensing, or reproducibility are incomplete or access-bounded.
- **C — compatibility baseline:** useful pretrained EO representation, but narrower than a contemporary general EO foundation model.
- **D — watchlist:** recent paper or announced model whose operational release or independent evaluation is not mature enough for a default recommendation.

Tier is about inspectability and engineering readiness, not scientific quality or benchmark rank.

## Broad engineering candidates

| Family | Main input contract | Distinguishing role | Evidence | Tier |
|---|---|---|---|---|
| [Prithvi-EO 1.0/2.0](https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M) | HLS multispectral temporal imagery | NASA–IBM masked-autoencoder family; strong candidate when the target input matches HLS bands, calibration and temporal support | Official model card, weights and TerraTorch integration | A |
| [TerraMind 1.0](https://github.com/IBM/terramind) | Sentinel-1/2, DEM, NDVI, land cover, captions and coordinates | Any-to-any multimodal encoder–decoder; supports encoding, generation and Thinking-in-Modalities | ICCV 2025 paper, Apache-2.0 code and weights, TerraTorch integration | A |
| [Clay v1.5](https://clay-foundation.github.io/model/) | Multisensor imagery plus wavelength, GSD, location and time metadata | Sensor-flexible MAE/DINO-style representation model with documented embedding and fine-tuning workflows | Official documentation, Apache-2.0 code and weights | A |
| [AnySat](https://github.com/gastruc/AnySat) | Heterogeneous optical, SAR and temporal EO at varied GSD and footprint | JEPA with scale-adaptive encoders; designed for variable resolution, scale and modality combinations | CVPR 2025 paper, MIT code and weights | A |
| [Galileo](https://github.com/nasaharvest/galileo) | Multispectral, SAR, elevation, weather, labels and temporal inputs | Flexible global/local self-supervision for both imagery and pixel time series | ICML 2025 paper, official code and released models | A |
| [Copernicus-FM](https://github.com/zhu-xlab/Copernicus-FM) | Sentinel-1 through Sentinel-5P plus metadata | Dynamic hypernetwork intended to span spectral and non-spectral Copernicus missions | ICCV 2025 paper, code, models and benchmark release | A |
| [DOFA](https://github.com/zhu-xlab/DOFA) | Variable-band optical, SAR, aerial and hyperspectral imagery with wavelengths | Wavelength-conditioned dynamic patch embedding for differing channel counts | Primary paper, MIT code and weights; TorchGeo implementation | A |
| [CROMA](https://github.com/antofuller/CROMA) | Sentinel-1, Sentinel-2, or their aligned pair | Separate radar/optical encoders plus fused representation using contrastive and masked reconstruction objectives | NeurIPS 2023 paper, code and checkpoints; PANGAEA implementation | A |
| [SkySense family](https://github.com/Bili-Sakura/SkySense-transformers) | High-resolution optical, multispectral and SAR | Multimodal EO representation family; later SkySense++ adds semantic supervision and V2 uses a unified backbone | CVPR 2024, Nature Machine Intelligence 2025 and ICCV 2025 papers; released code/weights vary by version | A/B |
| [SMARTIES](https://github.com/gsumbul/SMARTIES) | Flexible optical, SAR, HLS, Planet and VHR band combinations | Spectrum-aware projection and reconstruction with cross-sensor token mixup | ICCV 2025 paper, Apache-2.0 code and ViT-B/L weights | A |
| [MMEarth](https://github.com/vishalned/MMEarth) | Multimodal global EO patches and derived environmental variables | Multimodal dataset and multi-pretext MAE representation model across twelve modalities | ECCV 2024 paper, dataset and code | A/B |
| [msGFM](https://github.com/boranhan/Geospatial_Foundation_Models) | RGB, multispectral, SAR and other sensor inputs | Multisensor model with sensor-specific tokenization and shared representation learning | CVPR 2024 paper and official code | A/B |
| [SatlasPretrain/SatlasNet](https://github.com/allenai/satlaspretrain_models) | Sentinel-2 and NAIP, including temporal imagery | Large supervised multi-task pretraining; useful backbone and temporal aggregation baseline | Official code/weights and PANGAEA implementation | A |
| [Scale-MAE](https://github.com/bair-climate-initiative/scale-mae) | Mainly RGB aerial/satellite imagery with ground sample distance | Scale-aware positional encoding for multiresolution imagery | ICCV 2023 paper, code and weights; TorchGeo/PANGAEA support | A |
| [SatMAE family](https://github.com/sustainlab-group/SatMAE) | Temporal and multispectral satellite imagery | MAE adapted to spectral groups and time | NeurIPS 2022 paper, code and weights; TorchGeo support | A |
| [SSL4EO-S12 backbones](https://github.com/zhu-xlab/SSL4EO-S12) | Sentinel-1 and Sentinel-2 | DINO, MoCo, MAE and data2vec checkpoints trained on a global multimodal, multitemporal corpus | Dataset paper, public checkpoints, TorchGeo and PANGAEA support | A/C |
| [GFM-Swin](https://openaccess.thecvf.com/content/ICCV2023/html/Mendieta_Towards_Geospatial_Foundation_Models_via_Continual_Pretraining_ICCV_2023_paper.html) | Optical EO imagery | Continual pretraining of a general vision backbone on geospatial data | ICCV 2023 paper and PANGAEA implementation | B/C |

## Specialist and compatibility families

| Family | Specialization | Use boundary | Evidence | Tier |
|---|---|---|---|---|
| [Presto](https://github.com/nasaharvest/presto) | Pixel-level multisensor time series | Strong candidate for temporal point or parcel prediction; not a dense-image encoder | Official code and weights | A |
| [U-BARN](https://github.com/irisdum/ssl_ubarn) | Sentinel-2 image time series | Spatiotemporal representation learning; input and task scope are narrower than multimodal generalist models | JSTARS 2024 paper and official code | B/C |
| [SeCo](https://github.com/ServiceNow/seasonal-contrast) | Seasonal Sentinel-2 | Useful contrastive pretraining baseline; fixed sensor and older representation design | Primary paper and public weights; TorchGeo support | A/C |
| [SpectralGPT](https://github.com/danfenghong/IEEE_TPAMI_SpectralGPT) | Multispectral and hyperspectral imagery | Spectral MAE suited to spectral transfer; requires sensor/band compatibility checks | TPAMI paper, code/weights and PANGAEA implementation | A |
| [HyperSIGMA](https://github.com/WHU-Sigma/HyperSIGMA) | Hyperspectral imagery | Spatial–spectral hyperspectral representation family rather than a general EO model | Primary paper and public code/weights | A/B |
| [SpectralEarth models](https://github.com/AABNassim/spectral_earth) | EnMAP-scale hyperspectral imagery | Hyperspectral pretraining corpus and backbones; SpectralEarth-FM multimodal extension remains recent | TGRS 2025 paper, code/data; 2026 multimodal paper is a watch item | A/D |
| [SAR-JEPA](https://github.com/waterdisappear/SAR-JEPA) | SAR automatic target recognition | SAR-specific SSL method designed around speckle and small targets; not evidence of broad scene-level SAR transfer | ISPRS JPRS 2024 paper and official code | B/C |
| [SARATR-X](https://github.com/waterdisappear/SARATR-X) | SAR target classification and detection | Target-recognition foundation model; gated or request-based weights and task scope limit general EO use | TIP 2025 paper and official repository | B |
| [RingMo](https://arxiv.org/abs/2207.12315) | Optical/SAR remote-sensing imagery | Historically important masked-image-model family; release and version access should be checked before selection | TGRS 2022 paper; later proprietary/large variants differ materially | B/C |
| [USat](https://github.com/stanfordmlgroup/USat) | Variable-band satellite imagery | Band-set-aware MAE based on Satlas data; useful for flexible spectral combinations | Primary paper and public implementation | B |

## Embedding and transfer products

| Product/family | What is actually available | Boundary | Tier |
|---|---|---|---|
| [AlphaEarth Foundations Satellite Embedding](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL) | Annual 10 m, 64-dimensional embedding rasters in Earth Engine | A precomputed product, not a downloadable encoder; annual support and product-version semantics govern use | A |
| [TESSERA/GeoTessera](https://geotessera.org/) | Annual 10 m, 128-dimensional pixel-wise embeddings from Sentinel-1 and Sentinel-2 time series; open inference code, weights and cloud-hosted Zarr/GeoTIFF access | Use one `(dataset_version, dataset_variant)` pair throughout; v1.1/`dclimate` is the stable default, while v2 products remain beta despite released v2 inference code and weights | A/D |
| [DINOv3 satellite models](https://github.com/facebookresearch/dinov3) | EO-pretrained RGB image encoders and dense features | High-resolution RGB orthophoto domain; not inherently multispectral or SAR-aware | A |
| [RemoteCLIP](https://github.com/ChenDelong1999/RemoteCLIP) | EO image–text encoder checkpoints | Useful for retrieval, zero-shot semantics and as a visual encoder; text alignment does not guarantee calibrated EO measurement | A |
| [SatCLIP](https://github.com/microsoft/satclip) | Location encoder aligned to satellite-image representations | Encodes geographic coordinates rather than arbitrary input imagery; use for location-aware transfer, not pixel mapping by itself | A |

## Adjacent systems, not interchangeable with encoder FMs

- **Vision-language encoders:** RS5M/GeoRSCLIP, SkyCLIP and DOFA-CLIP. These may support retrieval and zero-shot classification, but prompt sensitivity, vocabulary coverage and geographic bias require separate validation.
- **Conversational multimodal models:** GeoChat, EarthGPT, H2RSVLM, LHRS-Bot, Falcon, TerraScope and Earth-OneVision. These generate language or reason over imagery; fluent answers are not measurement evidence.
- **Generative EO models:** DiffusionSat, MetaEarth variants, CRS-Diff, TerraMind's generation mode and GeoCore-9B. Generated imagery or modalities are hypotheses or model outputs, never substitute observations without validation.
- **Agents:** systems that call maps, models or external tools are workflow orchestrators, not pretrained EO representation models.
- **2026 watchlist:** RAMEN, THOR, FLORO, SIGMAE, RingMoE and SpectralEarth-FM have relevant primary reports, but their release completeness, independent comparison and operational stability must be rechecked at selection time.

## Books and source strategy

No mature textbook found in this search provides a current, technically complete treatment of EO foundation models through 2026. The field changes too quickly for a book to be the model registry. Use the existing remote-sensing, probability, optimization and deep-learning books for durable principles, then use:

1. primary model papers for architecture and claimed capability;
2. official code, weights, model cards and licences for the executable input contract;
3. PANGAEA, GEO-Bench-2 and task-specific independent studies for comparative evidence;
4. current surveys only for discovery and taxonomy.

Survey tables are not proof that a model is downloadable, correctly licensed, reproducible, or suitable for a task.

## Local source inventory and integrity

| Local source | Evidence role | Pages | SHA-256 |
|---|---|---:|---|
| `huang-et-al-2025-rsfm-survey.pdf` | Broad discovery taxonomy through early 2025 | 29 | `7FAC992A91C456B68ED50C08D79EE1C2FD3D68BA094CA70D1610060B06F115E5` |
| `marsocci-et-al-2026-pangaea.pdf` | Independent benchmark design and comparative evidence | 47 | `10DAD05101E21168AFB941903DAA64BDEFE5CE487AC94881E226DEBFCD750708` |
| `jakubik-et-al-2025-terramind.pdf` | TerraMind architecture, modalities and reported experiments | 12 | `CD04DEBC05B978A7E5CC004232D37DCE3B5454BA7A6CD119055AE35A3C362B1D` |
| `wang-et-al-2025-copernicus-fm.pdf` | Copernicus-FM architecture, pretraining corpus and benchmark | 12 | `DE14ED41D70A920606EC201FB72F5AF2BD27B87D007B5973723C173DC6103BD0` |
| `tseng-et-al-2025-galileo.pdf` | Galileo flexible modality and scale design | 21 | `AAAA74590713BA39CFDCB4528D7D48B20AA14381EC8FCD509AD197277629FBB1` |
| `astruc-et-al-2025-anysat.pdf` | AnySat architecture and transfer evidence | 11 | `D39DF8552978A2F8A0770954AC299F2BE387FAC7DF4CBE042EF97DFCBAB980F7` |
| `szwarcman-et-al-2024-prithvi-eo-2.pdf` | Prithvi-EO-2.0 architecture, HLS pretraining and reported transfer evidence | 34 | `7BBC7A7BBC3A380D7D5F914A19D6B30687831001F3D9F5A6EB655304043F0ACF` |
| `feng-et-al-2026-tessera.pdf` | TESSERA v1 architecture, S1/S2 temporal embedding method and reported transfer evidence | 14 | `80240C5F199E581417CF0F9D7FD610B7C555C243844AC96F1EFB9EDDD197D93C` |
| `feng-et-al-2026-tessera-v2.pdf` | TESSERA v2 scaling, distillation and Matryoshka embedding evidence; arXiv preprint | 48 | `F8924B5CCA82F3DD39C61E6F599CC18CEEB5021D7E80B722F42EC2E0448A6080` |

All nine PDFs passed `pdfinfo`, text extraction and representative-page rendering. The Copernicus-FM PDF produced recoverable PDF syntax warnings during extraction but rendered and yielded readable text; use the official CVF copy if re-downloading. TESSERA v2 produced non-fatal local font warnings during rendering, but its first page rendered correctly and the extracted text was readable.

## Important evidence limits

- PANGAEA shows that pretrained GFMs do not consistently beat supervised baselines across tasks and that ranking changes with the dataset, label fraction, modality, resolution and adaptation protocol.
- Model authors' benchmark results establish performance only under the reported preprocessing, splits, heads, tuning and compute.
- Availability changes. Recheck weights, licence, dependencies and model-card preprocessing immediately before implementation.
- This registry is a scoped snapshot. A new model should be added only when it changes a real selection decision, not merely because it uses the label *foundation model*.
