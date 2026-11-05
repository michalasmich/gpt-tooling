# Core Remote-Sensing and Learning Principles

## Purpose

Use this reference for every geospatial deep-learning or computer-vision task. It defines the shared reasoning layer before modality-specific guidance. Combine it with `optical.md`, `sar.md`, `drone-photogrammetry.md`, `hyperspectral.md`, or `lidar-point-clouds.md` once those references exist.

The governing principle is:

> A model receives a processed measurement produced by a sensor and processing chain, not direct access to the ground phenomenon.

## Evidence labels

- **Durable principle:** stable statistical, physical, or geometric reasoning.
- **Domain-specific guidance:** valid only for stated sensors, products, tasks, or conditions.
- **Dated implementation guidance:** useful historical practice that needs a current implementation source.
- **Requires current verification:** depends on changing products, models, software, missions, or evidence.
- **Superseded:** retained only to explain why it should not guide present work.

## 1. Start from the measurement chain

**Status: durable principle.**

Represent the system as:

```text
phenomenon
  -> propagation and atmosphere
  -> sensor measurement
  -> calibration and correction
  -> resampling, compositing, or fusion
  -> stored product
  -> dataset and labels
  -> model
  -> postprocessing
  -> delivered map or decision
```

Every stage can remove information, add uncertainty, or introduce shortcuts. A matching array shape, CRS, nominal band name, or pixel spacing does not establish physical or statistical compatibility.

Before modelling, identify for every input:

- physical quantity and units;
- sensor, acquisition and processing level;
- scale, offset, valid range, saturation and NoData encoding;
- spatial, spectral and temporal support;
- view, illumination and terrain conditions where material;
- geometric and radiometric corrections;
- resampling, mosaic, composite, fusion and compression history.

If the quantity or encoding cannot be established, do not make quantitative physical claims from it.

## 2. Distinguish spacing from observable detail

**Status: durable principle with modality-specific implementation.**

Ground sample distance describes sampling spacing. Effective resolution also depends on optics, detector footprint, motion, point-spread function, processing and resampling. Upsampling does not recover unmeasured detail.

Match spatial support to the target:

- determine the object sizes, boundary tolerances and context needed;
- compare effective resolution and modulation-transfer information when available;
- record every resampling operation;
- avoid interpreting an interpolated grid as a finer measurement;
- treat patch tokens and feature maps as representations, not pixel measurements.

## 3. Treat spectral and radiometric compatibility as empirical

**Status: durable principle; optical details are domain-specific.**

A band is a sensor-weighted measurement over wavelength, not a universal material property. Nominally similar bands can differ by spectral response, illumination, atmosphere, calibration and product processing. Indices and ratios inherit those differences and can be unstable when denominators are small.

Adding channels helps only when they contain target-relevant information and remain compatible at deployment. Cross-sensor harmonization, atmospheric correction and pan-sharpening are estimators with assumptions; validate their downstream consequences rather than assuming improvement.

Do not transfer reflected-optical equations unchanged to SAR, thermal, LiDAR or other measurement regimes.

## 4. Verify geometry using the actual data

**Status: durable principle.**

Metadata correctness is necessary but not sufficient. Inspect representative overlays and stable features to measure relative alignment.

Verify:

- CRS, axis order, affine transform, pixel origin, shape and footprint;
- horizontal and, where relevant, vertical datum;
- band-to-band, image-to-image and image-to-label alignment;
- terrain, off-nadir, relief-displacement and occlusion effects;
- source dates and geometry for elevation products and labels.

Derive acceptable registration error from object scale and task sensitivity. Do not import a universal pixel tolerance.

## 5. Preserve provenance

**Status: durable principle.**

Keep enough lineage to reproduce an input and diagnose a prediction:

- source asset and acquisition identifiers;
- sensor, provider, product, collection and processing baseline;
- bands, scale, offset, masks and quality flags;
- CRS, transform, resolution and resampling kernels;
- mosaic, composite, fusion and source-date information;
- chip grid, padding, normalization and split membership;
- model, checkpoint, software and postprocessing versions.

A product-version change is a possible distribution shift even if the geographical location and nominal product name remain unchanged.

## 6. Formulate learning as estimation under assumptions

**Status: durable principle.**

A fitted system depends on the target distribution, hypothesis class, objective, optimization and regularization. Training fit is not evidence of deployment performance.

Define:

- input and target variables;
- intended deployment population;
- output distribution or score semantics;
- operational loss and failure costs;
- admissible actions, including abstention when appropriate;
- assumptions about independence, stationarity and invariance.

Use an output and loss compatible with the target: continuous regression, binary classification, mutually exclusive classes, multilabel prediction or structured output are different statistical problems.

## 7. Keep inference separate from decisions

**Status: durable principle.**

Probability estimation or scoring is distinct from thresholding, filtering, object matching and operational action. The most probable class is not necessarily the lowest-cost action.

- select thresholds and rejection rules using validation data and stated consequences;
- distinguish discrimination from calibration;
- reassess decisions when prevalence, costs or acquisition conditions change;
- never treat `0.5` as a universal probability threshold;
- evaluate the delivered map after postprocessing, not only raw scores.

## 8. Choose architecture by inductive bias

**Status: durable principle; implementations require current verification.**

Architecture is a modelling assumption:

- convolution assumes useful local structure and shared rules;
- pooling and stride exchange localization for abstraction and compute;
- attention performs content-dependent aggregation and requires positional structure;
- graph networks depend on scientifically meaningful nodes and edges;
- sequence models impose assumptions about order, state and temporal dependence;
- pretrained representations assume transferable structure between source and target.

Check that receptive field, patch size, output stride, positional representation and boundary behavior fit the target. Attention weights and latent axes are not automatically explanations.

Current architectures, optimizers and recipes change rapidly. Use current primary sources and official implementation documentation for specific choices.

## 9. Treat preprocessing and regularization as assumptions

**Status: durable principle.**

Normalization, augmentation, denoising, harmonization, resampling and regularization alter the effective learning problem.

- fit learned preprocessing on valid training data only;
- preserve the state needed at inference;
- use augmentations only when they preserve labels and represent plausible deployment variation;
- test whether preprocessing removes useful signal or creates artifacts;
- do not claim robustness from an augmentation without held-out evidence containing the intended variation.

## 10. Use the simplest informative baseline

**Status: durable principle.**

Build the simplest complete pipeline that can test the data, labels, loss, metric and delivery path. Add complexity only for an observed limitation and retain the comparison needed to show whether it helped.

For representation learning, compare a suitable raw or engineered-data baseline. For fusion, compare each modality alone. For postprocessing, report the change from the unprocessed prediction.

## 11. Handle uncertainty according to its claim

**Status: durable principle.**

Distinguish:

- observation noise;
- ambiguity in the target or labels;
- parameter uncertainty from finite data;
- model misspecification;
- distribution shift;
- approximation error from inference or sampling.

A softmax output is not automatically calibrated epistemic uncertainty. Bayesian or ensemble methods do not protect against unmodelled shifts. State what the uncertainty estimate includes, validate it on held-out conditions and allow abstention when uncertainty must control action.

## 12. Source boundaries

This reference synthesizes:

- Isaac Corley, *First Principles of Geospatial Computer Vision* (2026): remote-sensing measurement and processing chain, primarily passive optical imagery.
- Christopher M. Bishop, *Pattern Recognition and Machine Learning* (2006): probability, decision theory, uncertainty and model comparison.
- Ian Goodfellow, Yoshua Bengio and Aaron Courville, *Deep Learning* (2016): generalization, optimization, regularization, CNNs and practical diagnosis.
- Christopher M. Bishop and Hugh Bishop, *Deep Learning: Foundations and Concepts* (2024): modern deep-learning foundations, transformers, GNNs, transfer and generative models.

These sources do not by themselves establish modality-specific SAR, LiDAR, hyperspectral or photogrammetric rules, current best architectures, or performance for a particular project.
