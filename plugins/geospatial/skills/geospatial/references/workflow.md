# Geospatial Deep-Learning Workflow

## Purpose

Use this reference to reason from problem definition to a delivered raster, vector layer or decision. It is a decision framework, not a fixed recipe. Numerical settings must come from product documentation, representative data, cited methods or validation—not invention.

## 1. Define the delivered result

**Status: durable principle.**

Before selecting data or a model, define:

- phenomenon and operational class definition;
- deployment geography, dates, seasons, sensors, providers and product versions;
- output type: score, raster mask, object inventory, polygon layer, continuous surface or change map;
- evaluation unit: pixel, object, polygon, scene, region, event or time series;
- minimum mapping unit, boundary tolerance, topology and positional requirements;
- error costs, review or abstention path and acceptable failure modes;
- intended generalization: new samples, acquisitions, dates, regions, sensors or providers.

This statement determines the data query, split, metrics, postprocessing and evidence required.

## 2. Audit candidate data

**Status: durable principle with modality-specific details.**

Inspect the real products and metadata. Record:

- physical quantity, units, scale, offset, valid range and saturation;
- bands or channels, spectral response and polarization where relevant;
- spatial, spectral and temporal support;
- acquisition and processing dates;
- CRS, transform, grid, resolution, vertical reference and extent;
- quality flags, NoData, cloud, shadow and other masks;
- processing level, collection, baseline, resampling and compression;
- licensing, access conditions and version stability.

Check representative imagery, histograms, masks, seamlines and metadata. Do not infer compatibility from filenames or nominal resolution.

## 3. Define the dataset population and query

**Status: durable principle.**

The catalog query is part of the scientific method. Save the geographical bounds, date range, product filters, quality criteria and asset identifiers. Explain exclusions and how they may change geography, season, class prevalence or acquisition conditions.

Create a manifest linking every sample to its source assets, labels, metadata groups and split. Preserve this identity through chipping and augmentation.

## 4. Verify geometry and alignment

**Status: durable principle.**

Before bulk processing:

1. verify grids, footprints and datums;
2. overlay image bands, dates, modalities and labels;
3. inspect stable features, boundaries, small objects, slopes and off-nadir structures;
4. measure relative error on representative samples;
5. decide whether the remaining error is acceptable for the target scale.

Do not solve a local distortion with an assumed global shift. If alignment is uncertain, record it as a limitation or model it explicitly.

## 5. Design labels and reference data

**Status: durable principle.**

Write the operational definition before annotation. Record label source, date, CRS, geometry, exclusions, confidence and whether absence means background, unknown or unannotated.

For rasterization, state the grid and rule such as center-inside or all-touched. Inspect thin and small objects because rasterization choices can dominate their labels. Separate uncertain regions from confirmed negatives.

Reference data have their own measurement and sampling error. Do not call them ground truth without qualification when that accuracy is not established.

## 6. Choose the split before feature fitting

**Status: durable principle.**

Split by the unit that represents the deployment claim: region, acquisition, date, sensor, provider, survey, event, object or another source group. Keep overlapping chips, repeated observations and derived products from the same source unit together when they would leak information.

Freeze and version the split before fitting normalization, PCA, feature selection, prototypes, thresholds or models. Use training data for parameters, validation data for choices and the final test set once for the fixed system.

Read `validation-and-leakage.md` for detailed rules.

## 7. Build preprocessing as a reproducible transform

**Status: durable principle.**

For each operation, record its input quantity, parameters, fitted state and output meaning.

- construct validity masks before applying scale and offset;
- exclude invalid observations from fitted statistics, loss and metrics;
- minimize resampling and combine geometric transforms where practical;
- select kernels according to categorical or continuous data and scale change;
- preserve native measurements for physical retrieval unless a transformation is validated;
- save normalization statistics and reuse them unchanged at inference;
- retain source-date and seam information for mosaics and composites.

Do not confuse a visual rendering with an analytic product.

## 8. Design tiling from context and output geometry

**Status: durable principle; numerical settings require validation.**

Choose chip size, stride, overlap and padding from:

- target and context scale;
- model receptive field or tokenization;
- output stride and memory limits;
- boundary behavior;
- object truncation and duplication risk;
- required ground coverage.

Overlapping chips increase sample count without equivalent independent information. At inference, combine compatible scores before thresholding and object counting. Document weighting, cropping, merging and duplicate-removal rules, then inspect tile seams.

## 9. Establish baselines

**Status: durable principle.**

Start with a complete, inspectable baseline. Depending on the task, include:

- a simple statistical or shallow predictor;
- a conventional CNN or task-standard architecture;
- individual-modality models before multimodal fusion;
- raw or engineered EO features before embeddings;
- prediction without optional postprocessing.

The baseline must use the same split and evaluation unit as the proposed system.

## 10. Select model and objective

**Status: durable principle; specific implementations require current verification.**

Match output distribution, loss and architecture to the target:

- regression requires an appropriate support and noise model;
- binary, multiclass and multilabel tasks require different output semantics;
- class weighting, focal terms, ignore masks and reductions change the objective;
- convolution, attention, sequence and graph structures encode different priors;
- patch size, receptive field and output stride must preserve required detail;
- transfer learning requires source-target compatibility tests.

Record the exact model, checkpoint, license, inputs, initialization, frozen or trainable components and adaptation method.

## 11. Verify the training pipeline

**Status: durable principle.**

Before expensive training:

1. inspect a small batch after every transformation;
2. verify tensor shapes, masks, targets and loss reduction;
3. confirm metrics on hand-checkable cases;
4. overfit a very small subset where appropriate;
5. inspect gradients or use a local gradient check for custom differentiable operations;
6. compare training and validation curves;
7. diagnose data, optimization, capacity and distribution shift separately.

Use augmentations only when their label and physical assumptions are defensible. Record random seeds and nondeterministic operations.

## 12. Select models without contaminating the test

**Status: durable principle.**

Architecture, learning schedule, augmentation, normalization, checkpoint, ensemble, threshold and postprocessing are all model-selection decisions. Make them using training and validation data. Track the configurations tried so repeated selection is visible.

Change one material factor at a time when estimating its effect. Use matched ablations rather than attributing an improvement to a bundle of changes.

## 13. Treat postprocessing as part of the system

**Status: durable principle.**

Thresholding, morphology, connectivity, minimum-area filtering, polygonization, simplification and overlap merging change the delivered prediction.

- tune parameters on validation data using the delivery objective;
- express spatial parameters in ground units where possible;
- define object matching before final evaluation;
- inspect merges, splits, holes, topology, duplicate objects and boundary displacement;
- preserve the CRS and transform through raster-to-vector conversion.

Never tune postprocessing on the final test set.

## 14. Evaluate and inspect the delivered artifact

**Status: durable principle.**

Report metrics at the unit that supports the claim. Add deployment-relevant strata such as region, acquisition, date, sensor, class rarity, object size, terrain or environmental regime.

Inspect the actual output for:

- spatial clusters of error;
- alignment and boundary failures;
- tile, mosaic and source-date seams;
- cloud, shadow and NoData behavior;
- small, thin, rare and ambiguous targets;
- object merges, splits, counts and topology;
- confidence and abstention behavior.

Aggregate metrics cannot replace mapped error inspection.

## 15. Package provenance for use and monitoring

**Status: durable principle.**

Save:

- data query, manifest and source identifiers;
- split version;
- preprocessing and fitted statistics;
- model configuration, checkpoint and software versions;
- validation-selected threshold and postprocessing;
- metric definitions and final evaluation outputs;
- known applicability limits and failure cases.

At deployment, compare sensor product versions, metadata ranges and representative inputs with training. Monitor changes in geography, season, acquisition geometry, processing baseline and class prevalence.

## Source boundary

This workflow fuses Corley (2026), Bishop (2006), Goodfellow et al. (2016), and Bishop and Bishop (2024). It provides shared reasoning only. Use `multimodal-fusion.md` when combining modalities; modality-specific preprocessing must still come from the relevant branch and current product documentation.
