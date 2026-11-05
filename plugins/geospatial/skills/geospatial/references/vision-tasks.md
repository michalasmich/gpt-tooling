# Classification, Detection, and Segmentation for Earth Observation

## Purpose and boundary

Use this reference to choose and specify the computer-vision task before selecting an architecture. It covers image or patch classification, object detection, semantic segmentation, instance segmentation, and the evaluation consequences of each choice.

It does not choose a current model, prescribe a training recipe, or replace `workflow.md`, `validation-and-leakage.md`, or modality-specific references. Architecture selection, fine-tuning, and dataset engineering are separate evidence phases.

## 1. Start from the delivered artifact

Choose the least complex output that contains the information the user needs.

| Required artifact | Appropriate starting task | Information not supplied |
|---|---|---|
| One or more labels for a defined image, parcel, or patch | Classification | Object locations and boundaries |
| Object locations, classes, scores, and counts | Detection | Exact outlines |
| Exhaustive per-pixel or per-cell class map | Semantic segmentation | Identity of touching objects |
| Individual objects with exact masks | Instance segmentation | Exhaustive labeling of uncountable background unless added explicitly |
| Exhaustive scene labels plus identities for countable objects | Panoptic segmentation | Nothing beyond the declared class and instance taxonomy |

Before modelling, state the prediction unit, spatial support, class ontology, unknown/ignore policy, minimum target size, positional or boundary tolerance, and delivery geometry.

**Durable principle:** Architecture follows the output contract.

## 2. Classification

### Define the unit and label semantics

A class attached to a whole image chip can mean scene type, dominant land cover, object presence, or a parcel attribute. These are different targets. Record whether labels are single-label, multilabel, hierarchical, mutually exclusive, exhaustive, or allowed to be unknown.

Chip size and placement define the evidence and context available to the model. A label is invalid when its semantic support does not match the chip, parcel, or time represented by the input.

### Loss and prediction

For mutually exclusive classes, cross-entropy is commonly written

\[
\mathcal{L}_{\mathrm{CE}}=-\sum_{c=1}^{C} y_c\log p_c.
\]

This objective does not make the reported probabilities calibrated and does not specify an operational decision threshold. Multilabel problems require independent target semantics rather than forcing classes into a softmax.

### Evaluate the decision actually needed

Use a confusion matrix and class-wise measures. Choose macro, micro, prevalence-weighted, or cost-sensitive summaries according to the target population and decision. Overall accuracy alone can conceal rare-class failure. If probabilities drive risk or prioritization, evaluate discrimination and calibration separately on representative held-out data.

**Domain-specific guidance:** Report results by geography, acquisition, season, sensor, resolution, and other deployment strata when these may shift.

## 3. Object detection

### Choose the object representation

- Use axis-aligned boxes when they localize targets adequately and wasted background does not materially affect matching.
- Use oriented boxes when arbitrary rotation, density, or elongated geometry makes axis-aligned boxes ambiguous.
- Use points or centers only when the delivery and matching tolerance support them.
- Use masks or polygons when exact shape, area, adjacency, or boundary is required; this becomes an instance-segmentation or vector-delineation problem.

Do not silently convert between representations. Conversion changes localization error and may change which predictions match.

### Keep error components visible

A detector predicts a class score and geometry for each candidate object. A generic objective is

\[
\mathcal{L}=\lambda_{\mathrm{cls}}\mathcal{L}_{\mathrm{cls}}
+\lambda_{\mathrm{loc}}\mathcal{L}_{\mathrm{loc}}.
\]

The two terms address different errors. Diagnose false classes, missed objects, poor localization, duplicate predictions, merges, and false background responses separately.

### Declare matching and averaging

For regions \(A\) and \(B\),

\[
\operatorname{IoU}(A,B)=\frac{|A\cap B|}{|A\cup B|}.
\]

A detection result is incomplete without:

- geometry used for matching;
- localization criterion and threshold or threshold range;
- one-to-one assignment rule;
- handling of ignored, truncated, difficult, and crowd objects;
- duplicate handling;
- confidence sweep and interpolation convention;
- class, image, and threshold averaging;
- object-size and density strata where relevant.

Precision-recall and average precision summarize this declared protocol. They do not justify its thresholds. Select any operating score threshold on validation data using the delivery costs, then report held-out performance at that operating point as well as ranking performance.

### Treat small and dense objects as a distinct regime

Define smallness in ground and image terms: physical size, GSD, pixel extent after all resampling, and effective resolution. Dataset-relative bins alone do not establish operational resolvability.

Inspect recall and localization by size, density, orientation, contrast, truncation, and distance to tile edge. Large-image tiling must preserve object identity through clipping, padding, overlap, score combination, and cross-tile duplicate merging.

**Domain-specific guidance:** Validate oriented boxes and tile merging on the target annotation convention. Do not import a DOTA or COCO threshold as a scientific constant.

## 4. Segmentation

### Choose semantic, instance, or panoptic output deliberately

- Semantic segmentation predicts a class for each pixel or cell. It is appropriate for continuous or exhaustive surfaces such as land cover.
- Instance segmentation predicts a separate mask for each countable object. It is appropriate when identity, count, or per-object geometry matters.
- Panoptic segmentation combines exhaustive semantic labels with identities for countable classes. Use it only when both outputs are required.

Connected components applied to a semantic mask are a post-processing hypothesis, not automatically valid instance segmentation. Touching objects, holes, narrow connections, and threshold changes can alter counts.

### Separate loss from evaluation

Pixel cross-entropy can be written

\[
\mathcal{L}_{\mathrm{pixel}}=-\sum_{i}\sum_{c} y_{ic}\log p_{ic}.
\]

Class weighting, focal variants, overlap surrogates, boundary terms, or instance-aware losses address particular failure modes. Add one only when the label structure and observed error justify it. A training loss is not automatically the correct reporting metric.

For class \(c\),

\[
\operatorname{IoU}_c=\frac{TP_c}{TP_c+FP_c+FN_c}.
\]

Report class-wise results before aggregation. Add boundary distance or boundary overlap when positional accuracy matters; object-level splits, merges, counts, and area errors when instances matter; and topology measures only when the delivery requires topology. Pixel accuracy alone is usually dominated by large classes or background.

### Respect spatial support and label uncertainty

Mixed pixels, registration error, temporal mismatch, rasterization, annotator ambiguity, and minimum mapping units create structured uncertainty near boundaries and small objects. Define ignore or uncertainty policy before training. Do not relabel uncertainty as confirmed background.

**Domain-specific guidance:** Express tolerances and minimum areas in ground units, then relate them to the evaluated grid and GSD.

## 5. Task-selection decision rules

1. If only presence or scene type matters, begin with classification.
2. If location and count matter but exact outline does not, begin with detection.
3. If every cell needs a class and identity does not matter, use semantic segmentation.
4. If individual identity and shape matter, use instance segmentation.
5. If the user needs both exhaustive classes and object identities, consider panoptic segmentation.
6. If a simpler output cannot support the delivered decision, change the task before changing the architecture.

The same phenomenon may require different tasks at different spatial supports. A building can be an unresolved presence label in coarse imagery, a detected object in very-high-resolution imagery, or an instance polygon in an orthophoto. The sensor does not determine the task alone; resolvability and the delivered artifact do.

## 6. Geospatial implementation checks

For every task:

- preserve sensor, product, CRS, transform, GSD, resolution evidence, resampling history, units, NoData, acquisition identity, and label provenance;
- define train, validation, and final test groups from the intended spatial, temporal, sensor, or processing generalization target;
- fit preprocessing, calibration, thresholds, and post-processing on training or validation data only;
- keep chip and tile lineage so overlapping or related samples cannot cross splits unnoticed;
- inspect representative image-label overlays and predictions in the native geospatial context;
- evaluate the final stitched raster or vector product, not only isolated chips;
- report variation across independent geographic or acquisition units, not only pooled sample counts.

Detailed procedures remain in `workflow.md`, `validation-and-leakage.md`, and the modality references.

## 7. Architecture and currency boundary

The task taxonomy and evaluation principles are durable. Specific CNN, transformer, detector, decoder, loss, checkpoint, and foundation-model rankings are not. At project start, verify current primary papers, official implementations, input conventions, licenses, compute requirements, and evidence on comparable data.

Begin with a conventional baseline appropriate to the output. Add oriented geometry, multi-scale components, boundary objectives, instance heads, larger backbones, or foundation-model adaptation only for a named limitation demonstrated under the fixed split and evaluation protocol.

## 8. Minimum task record

Record:

- prediction unit and delivered geometry;
- ontology, unknown/ignore policy, and annotation version;
- sensor, product, bands, GSD, spatial support, and acquisition scope;
- object or boundary size distribution in pixels and ground units;
- split file, grouping variables, buffer rationale, and seed;
- loss terms and their weights;
- inference tiling, overlap, clipping, stitching, duplicate handling, and post-processing;
- matching, thresholds, averaging, calibration, and stratification rules;
- artifact paths for predictions, diagnostics, and final delivered maps.

## Source boundary

This reference is fused from Torralba, Isola, and Freeman (2024), Xia et al. (2018), Ma et al. (2019), Minaee et al. (2022), Zou et al. (2023), and Maier-Hein et al. (2024), together with the library's existing remote-sensing workflow and validation references. Consult the source notes for provenance and limitations. No source supplies universal thresholds or establishes current architecture superiority.
