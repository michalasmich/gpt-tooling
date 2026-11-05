# Private paper reference dossiers

These dossiers support a separate, descriptive paper-alignment audit. Candidate models and the methodological-validity judge must receive only the corresponding prompt and problem-invariant rubric from `cases.json`. Paper alignment must not change validity scores, pass decisions or condition rankings. A published method is one reference solution, not ground truth.

## `changeclip-2024`: single-temporal supervision for domain-generalized change detection

### Source

Qiangang Du et al., *Single-temporal Supervised Remote Change Detection for Domain Generalization*, arXiv:2404.11326v2, 18 April 2024. Local source: `2404.11326v2.pdf`; SHA-256 `561672487672491745E7BC7BCB61E3254432C73185C72FCC8F3E3811360190F0`. This dossier intentionally freezes v2. As of 5 November 2026, the [arXiv record](https://arxiv.org/abs/2404.11326) lists v5, revised 1 June 2026, under the title *SCL: Towards Domain Generalization via Single-Temporal Multimodal Contrastive Learning for Remote Sensing Change Detection* and identifies CVPRW 2026 in the comments.

### Problem diagnosed by the paper

Paired, pixel-labelled bi-temporal change data are expensive and scarce. Supervised detectors tend to specialize to one dataset. Earlier single-date strategies can create pairs by matching unrelated images, which produces geometrically impossible transitions. Simple augmentations represent radiometric nuisance but not object-level semantic change. A globally pretrained vision-language model also lacks the dense region and pixel alignment required for change segmentation.

### Reference solution

The paper combines two ideas:

1. A CLIP-based bi-temporal model adapts global pretraining to dense prediction. It uses a feature pyramid, semantic segmentation heads, a binary change head, local visual-patch alignment and pixel-to-text context alignment. A dynamic text-vision context module uses cross-attention and lightweight adapters to condition text representations on image content.
2. A controlled single-date training strategy creates pseudo-pairs through masked, class-directed inpainting. It uses segmentation masks and text prompts to alter selected objects while retaining spatial correspondence. Because the generator performed poorly on small buildings, the implementation used generative editing for larger land-cover targets and simpler radiometric transformations for buildings.

### Evidence reported

Models were evaluated under three separate source-training regimes: single-date xView2 imagery, the paired SECOND dataset, and a generated dataset derived from xView2. LEVIR-CD and WHU-CD were used as unseen evaluation domains. The paper compared several existing change detectors under the same source-to-target setting and reported F1, IoU and overall accuracy. Component ablations separately added text-vision alignment, dynamic context optimization and generated training data. The reported ablation improved when all three were combined.

### Limitations

- The paper calls the generated transitions close to the natural distribution, but it does not establish this with an independent realism or shortcut test.
- Target benchmark sets were merged for evaluation, and the boundary between untouched evaluation and target-informed method development is not fully demonstrated.
- The ablation evidence is based on target benchmark performance, which can become development evidence if repeatedly consulted.
- No repeated-run uncertainty or broad sensor-level external validation is reported.
- The generative method has category-dependent failure modes.

These limitations constrain the paper-alignment interpretation. They do not justify penalizing a valid alternative that uses stricter source-only development, synthetic-artifact audits, real-pair validation or target-domain lockout.

## `stdenet-2026`: fine-grained cropland change detection

### Source

Ruina Zhao et al., *A spatiotemporal difference-enhancement network with semantic flow alignment for fine-grained cropland change detection*, ISPRS Journal of Photogrammetry and Remote Sensing 243 (2027) 49-74, accepted 21 October 2026, DOI: 10.1016/j.isprsjprs.2026.10.037. Local source: `A-spatiotemporal-difference-enhancement-network-wi_2027_ISPRS-Journal-of-Pho.pdf`; SHA-256 `FB50DE87B725212292C73BA8EDCA900148217717ADA33A09FA3B5615B1C5BEFF`.

### Problem diagnosed by the paper

High-resolution cropland change detection suffers from two coupled problems. Phenology, illumination and radiometric differences create pseudo-changes, while cropland can resemble forest, grassland, water or bare soil. True changes can also be small, fragmented, linear and irregular. Simple temporal arithmetic has weak context and can amplify noise. Fixed interpolation during decoding can blur boundaries and misalign deep semantics with shallow spatial detail.

### Reference solution

STDENet uses a shared multiscale encoder and three modules:

1. Spatiotemporal dual-branch difference enhancement. The spatial branch combines cosine and absolute differences with local convolution, graph reasoning, channel attention and spatial attention. The temporal branch interleaves corresponding temporal channels and applies grouped dilated convolutions at several receptive fields. Their fusion uses global spatial structure to suppress background interference and local temporal responses to retain true changes.
2. Adaptive boundary awareness. Directional Sobel responses at 0, 45, 90 and 135 degrees receive learned weights and modulate shallow features.
3. Semantic flow-aligned decoding. Learned displacement fields warp higher-level difference features toward lower-level features before fusion, replacing purely fixed cross-resolution interpolation.

### Evidence reported

The method was evaluated on DYCD, CLCD and Hi-CNA. The paper compared 13 baselines and reported precision, recall, overall accuracy, F1 and IoU, plus boundary completeness, correctness and boundary F1. Ablations isolated the three main modules, spatial versus temporal difference branches, two- versus four-direction boundary support, decoder alternatives and different backbones. The full model reported IoU values of 72.43%, 70.04% and 77.26% on the three datasets. Efficiency was reported using parameters and FLOPs. Large-area inference examples covered different regions, sensors and crop structures.

### Limitations

- The dataset split descriptions do not establish spatial independence among patches originating from nearby source imagery.
- Training used one fixed seed, so stochastic stability is not quantified.
- Large-area transfer examples are mainly qualitative and do not by themselves validate geographic generalization.
- Validation is limited to high-resolution optical, bi-temporal and binary-change settings.
- Very small patches make boundary scores sensitive to a few pixels and annotation uncertainty.

These limitations constrain the paper-alignment interpretation. Physical source-image registration remains separate from the paper's learned feature alignment, and valid alternative boundary or decoder mechanisms must not lose validity credit.

## `hpmoe-2026`: multimodal semantic and height building change

### Source

Hao Liu et al., *Height-Prompt Mixture of Experts for multimodal 3D building change detection*, ISPRS Journal of Photogrammetry and Remote Sensing 243 (2027) 23-39, available online 7 October 2026, DOI: 10.1016/j.isprsjprs.2026.09.037. Local source: `Height-Prompt-Mixture-of-Experts-for-multim_2027_ISPRS-Journal-of-Photogramm.pdf`; SHA-256 `041BC416B5DBE4148B8B3C8716B37C935AA5D82E51F2C8BB68F040A5728C2113`.

### Problem diagnosed by the paper

Two-dimensional building change maps miss vertical modifications. DSMs provide metric geometry but contain noise, reconstruction artifacts and residual registration error. Treating them as grayscale imagery weakens height meaning. Height-change magnitudes are long-tailed, and small variations can be ambiguous. The system must therefore fuse optical texture with elevation structure while predicting both semantic change and continuous height difference.

### Reference solution

HPMoE has three main components:

1. A structural-prior branch derives coherent line and boundary support from optical gradients and elevated smooth-surface saliency from a median-filtered, morphological top-hat and local DSM roughness. These cues guide routing instead of serving as ordinary image channels.
2. A hierarchical sparse mixture of experts first routes features among topology-, instance- and context-aware groups, then selects specialized convolutional experts within each group.
3. A fine-grained decision mixture separates low- and high-variability experts. It predicts semantic classes and height change with separate routing factors, while change magnitude modulates gradient allocation. Semantic classification and height regression remain separate outputs at inference.

### Evidence reported

Experiments used Hi-BCD, 3DCD and synthetic SMARS data across six city subsets. Metrics included mIoU, F1, boundary F1, RMSE, MAE and RMSE within change regions. The paper compared multiple 2D and 3D change baselines, ablated structural priors, fusion experts and decision experts, and performed sensitivity checks for structural scale and expert routing. Twenty independent 3DCD runs were used for uncertainty summaries and comparison with ChangeFormer. Parameters, FLOPs, peak memory and training time were also reported.

### Limitations

- Public evaluation is concentrated in European cities and one synthetic benchmark.
- The expert system is tied to a ChangeFormer-based architecture and expert interpretability remains limited.
- Elevation estimates remain unstable in marginal-change regions.
- The method lacks explicit physical consistency constraints between semantic and height tasks.
- Small height differences near DSM and co-registration uncertainty should not automatically be interpreted as real building modification.

These limitations constrain the paper-alignment interpretation. A simpler model can be methodologically stronger if it preserves the measurement contract and the additional expert routing has not earned its complexity.

## `sdt-2026`: standing-dead-tree detectability

### Source

Wen Fan et al., *Assessing the detectability of standing dead trees in PlanetScope imagery*, ISPRS Journal of Photogrammetry and Remote Sensing 243 (2027) 34-48, available online 4 November 2026, DOI: 10.1016/j.isprsjprs.2026.10.048. Local source: `Assessing-the-detectability-of-standing-de_2027_ISPRS-Journal-of-Photogramme.pdf`; SHA-256 `7BADA7D9A879AC28BA155EEB5FAD1B7CD2DF97C6BF744DEC8666FA52E4115831`.

### Problem diagnosed by the paper

At 3 m resolution, isolated standing dead trees occupy fractions of pixels and mix with live canopy, shadows, grass and other backgrounds. A hard segmentation score alone cannot show when the signal is detectable. Fine UAV polygons provide reference detail but introduce a scale mismatch, partial labelling and possible residual displacement. Detectability must be characterized across pixel composition, neighborhood support, patch aggregation, plot context and ecological variation.

### Reference solution

The workflow uses calibrated PlanetScope surface reflectance and UAV-derived annotations for five classes. UAV polygons are rasterized both as dominant hard labels and fractional soft labels, while unlabelled regions remain ignored. In the paper's equations, annotated class fractions below 0.05 are removed, the retained fractions are renormalized, and their maximum becomes the Label Confidence Index. The index therefore measures dominance among retained annotated fractions, not absolute annotated coverage of the complete satellite pixel. Sites are split before overlapping tiles are created.

Seven deep segmentation models and a random-forest spectral baseline are compared. Continuous standing-dead-tree probability and hard detection rate are analysed against:

- subpixel dead-tree and live-tree fractions;
- local density in 3 by 3 and 5 by 5 neighborhoods;
- connected-patch area and aggregation;
- plot-level dominance and tree density;
- climate and latitude strata.

Multiple architectures test whether response transitions are properties of the imagery rather than one model. Patch overlap criteria and standard segmentation metrics complement the probability-response analysis.

### Evidence reported

The 154 sites were divided into 92 training, 39 validation and 23 test sites using geographic, ecological, density and patch-structure balancing. Deep models produced similar standing-dead-tree scores; HRNet was selected as the reference model for detailed analysis. Reported response transitions occurred around 70-80% subpixel dead-tree cover, 20-30% local density and patch areas above roughly 90-180 square metres. These values are empirical findings from this dataset, not universal thresholds. Model responses weakened with more live-tree competition and strengthened with spatial aggregation and plot dominance.

### Limitations

- Residual UAV-to-PlanetScope displacement was visually checked but not quantified using independent control points.
- Because the Label Confidence Index is computed after renormalizing retained annotated fractions, incomplete coverage can appear highly confident unless total annotated and unknown coverage are tracked separately.
- The dataset is geographically imbalanced, with sparse coverage in Asia and Africa.
- Single-date imagery cannot exploit temporal persistence or separate seasonal effects as well as a time series.
- A shared training objective does not establish each architecture's individually optimized maximum performance.
- The main text describes probability analysis and threshold sensitivity, but the calibration procedure and calibration metrics are not documented with enough detail to independently verify calibrated probabilities.
- Several subgroup sample sizes are small, so response boundaries require uncertainty and external confirmation.

These limitations constrain the paper-alignment interpretation. The reported transitions are descriptive results from this dataset, not universal operating thresholds or independently confirmed deployment rules.
