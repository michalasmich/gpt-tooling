# Earth-Observation Time Series and Change Detection

## Purpose

Use this branch for monitoring, anomaly detection, event detection, temporal classification, trajectory mapping and forecasting from repeated Earth observations. It covers optical and radar series; modality-specific measurement rules still come from `core-remote-sensing.md`, `sar.md` and the future optical branch.

## 1. Define the temporal decision first

**Status: durable principle.**

State:

- target process and population;
- whether the output is a state, transition, anomaly, event, trajectory or forecast;
- spatial support and minimum mappable unit;
- event start, persistence, recovery and timing tolerance;
- update frequency, acceptable delay and false-alarm cost;
- whether attribution of cause is required.

Detection establishes that observations changed under a stated rule. It does not by itself establish why they changed. Cause attribution needs independent evidence, a causal design or explicit competing explanations.

## 2. Build an observation ledger

**Status: durable principle.**

For every observation retain acquisition time, sensor/platform, product level and version, processing date, CRS, transform, resolution, footprint, units, valid-data flags, viewing geometry and source identity. Verify spatial alignment on stable features.

Name the temporal variable explicitly. It may be a calibrated physical variable, spectral index, thematic class, subpixel fraction, displacement or texture measure. These representations have different uncertainty and change semantics; a class label must not be modeled as though it were a continuous physical measurement.

Distinguish:

- **observation time:** when the sensor measured the surface;
- **availability time:** when the product became usable;
- **label time:** when the reference event or state was recorded;
- **decision time:** when the system must issue an output.

Using observations that were not available at decision time is operational leakage even if their acquisition dates precede the label.

## 3. Harmonize measurements before modelling dynamics

**Status: durable principle.**

Audit radiometric calibration, atmospheric or terrain correction, BRDF/view effects, spectral response, incidence angle, orbit direction, coregistration, resampling, masks and processing-version changes. A processing discontinuity can look like land change.

NASA HLS illustrates the required operations for Landsat/Sentinel-2: atmospheric correction, cloud/shadow masking, coregistration and common gridding, view-angle normalization and spectral bandpass adjustment. It is a product-specific solution, not proof that arbitrary optical products are interchangeable.

For SAR, retain orbit, incidence geometry, polarization, radiometric convention, terrain effects and speckle-processing history. Do not merge ascending and descending observations as equivalent timestamps without evidence.

## 4. Treat quality and missingness as data

**Status: durable principle.**

Cloud, shadow, snow, saturation, haze, layover, shadow, radio-frequency interference and invalid retrievals create structured missingness. Keep validity and quality masks with the observations. Report usable observation density through time and by region or class.

Do not fill long gaps by default. Interpolation assumes a temporal path and can erase abrupt events or invent smooth recovery. If gap filling is necessary, fit it within training partitions and validate downstream event timing and uncertainty, not only reconstruction error.

## 5. Choose temporal support from the process

**Status: durable principle.**

Compositing changes the estimand. A monthly median can reduce cloud contamination but may suppress short events and shift their apparent dates. Annual summaries suit slow trajectories but cannot support claims about within-year timing.

Use the shortest support that the data quality and required event timing can defend. Record the window, statistic, observation count and tie-breaking rule. Do not report precision finer than the observation and compositing support.

## 6. Represent trend, seasonality, events and noise explicitly

**Status: durable principle.**

A useful conceptual model is

$$
y(t)=T(t)+S(t)+E(t)+\varepsilon(t),
$$

where \(T(t)\) is long-term trajectory, \(S(t)\) is recurring seasonal structure, \(E(t)\) is event-related departure and \(\varepsilon(t)\) includes measurement and model error. The decomposition is not unique; choose it from process knowledge and sampling support.

For approximately periodic series, an interpretable baseline is harmonic regression:

$$
y(t)=\beta_0+\beta_1t+\sum_{k=1}^{K}\left[a_k\sin\left(\frac{2\pi kt}{P}\right)+b_k\cos\left(\frac{2\pi kt}{P}\right)\right]+\varepsilon(t).
$$

Select \(K\), period \(P\), robust fitting and breakpoint rules using training evidence and validation. Irregular agriculture, bimodal rainfall or changing phenology may violate a fixed harmonic model. Phenological thresholds are not universal: a season may cross a calendar year or occur more than once in one year. Fit and validate event definitions for the target ecosystem and sensor.

## 7. Distinguish change types

**Status: durable principle.**

Evaluate at least the types relevant to deployment:

- abrupt versus gradual;
- transient versus persistent;
- seasonal phase or amplitude change;
- disturbance versus recovery;
- state transition versus within-class condition change;
- isolated event versus repeated management cycle.

A two-date difference cannot reliably separate these types. Dense series may still alias events when valid observations are sparse.

Define recovery in terms of the measured variable. Return of an optical index or SAR response toward its previous value establishes spectral or microwave recovery, not necessarily recovery of biomass, species composition, structure or ecological function.

## 8. Start with transparent baselines

**Status: durable principle.**

Use matched data and splits to compare:

1. no-change or seasonal persistence baseline;
2. two-date difference or index threshold when scientifically valid;
3. harmonic, robust regression or change-point model;
4. trajectory segmentation such as BFAST, LandTrendr or CCDC where its observation regime fits;
5. conventional supervised temporal features;
6. learned sequence model;
7. pretrained temporal or multimodal encoder.

The classical methods are not mandatory production choices. They expose whether a learned model improves seasonality, trajectory, timing or noise handling rather than merely adding capacity.

## 9. Derive thresholds from the decision

**Status: durable principle.**

Do not import universal spectral-change, probability, persistence or connected-area thresholds. Estimate candidates on training data and select them on validation data against the declared cost of missed events, false alarms, detection delay and map fragmentation.

If monitoring repeatedly tests many pixels and dates, report the resulting false-alarm burden per area and time. A nominal per-observation significance level is not the operational system false-alarm rate.

## 10. Prevent temporal and spatial leakage

**Status: durable principle.**

Group observations that share location, source sequence, event or derived product. Prevent:

- random timestamp splits from the same trajectory;
- overlapping temporal windows across partitions;
- fitting normalization, composites, imputation or phenology on future/test observations;
- labels derived from the same imagery used as input;
- future observations entering a retrospective feature at prediction time;
- nearby tiles or the same event appearing in train and test;
- unexamined overlap with foundation-model pretraining data.

Choose the split that matches the claim: forward chaining for future deployment, leave-region-out for geographic transfer, leave-year/season/event-out for temporal transfer, and leave-sensor or processing-version-out for product transfer. Combine axes when the intended deployment requires both.

## 11. Use learned temporal models only for a named limitation

**Status: requires current verification.**

Temporal CNNs, recurrent networks, attention models and foundation encoders can model nonlinear spatiotemporal context and heterogeneous inputs. Add them when simpler models fail a documented requirement, such as complex phenology, multimodal asynchronous observations or transferable low-label representations.

For pretrained models, record checkpoint, corpus, dates, sensors, geography, spatial support and preprocessing. Compare frozen features, fine-tuning and a task-specific baseline under the same split. Benchmark breadth is not evidence of transfer to an untested sensor or event.

## 12. Validate events, timing and maps

**Status: durable principle.**

Match metrics to the output:

- state/class maps: class-wise precision, recall, F1, calibration and spatial error analysis;
- event detection: event precision/recall, false alarms per area-time, detection delay and missed-event rate;
- change date: signed and absolute timing error with the reference-date uncertainty;
- trajectories: error in magnitude, duration, slope and recovery;
- forecasting: strictly future holdout error and calibration by horizon.

Define how predicted and reference events are matched before evaluation. Report performance by region, season, sensor, observation density, event magnitude and quality state. Assess the final postprocessed map using `spatial-statistics-and-validation.md` when claiming population map accuracy or area.

## 13. Quantify uncertainty and permit abstention

**Status: durable principle.**

Uncertainty comes from measurement quality, missing observations, model fit, thresholding, event matching and reference-date ambiguity. Calibrate outputs for the deployment split. Permit “insufficient evidence” when observation density or quality cannot support the requested timing or class decision.

## 14. Minimum reporting record

1. target state, event or forecast and operational decision time;
2. sensors, products, versions, dates and spatial support;
3. harmonization, registration, masks and usable-observation density;
4. compositing, gap handling and fitted-statistic scope;
5. trend, seasonal and event assumptions;
6. split groups, temporal cutoffs and pretrained-corpus audit;
7. baselines, model, thresholds and selection data;
8. event-matching rule, timing tolerance and reference uncertainty;
9. class, event, timing, false-alarm and calibration results;
10. performance by region, season, sensor, quality and observation density;
11. latency, compute, update frequency and abstention behavior;
12. applicability limits and whether attribution was or was not established.

## Source boundary

This branch combines the complete Kuenzer, Dech and Wagner (2015) book; the complete open-access Cardille et al. (2024) book; bounded official evidence for Canty (2025), including his complete SAR change-detection monograph; complete primary papers on BFAST, LandTrendr and CCDC; the NASA HLS Version 2.0 user guide; and AnySat (2025) as current foundation-model evidence. Canty's full fifth edition remains unavailable. Task-specific current verification remains required before publication or consequential deployment.
