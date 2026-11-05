# Spatial Statistics and Map Validation

## Purpose

Use this branch to choose a spatial model, validation design or delivered-map assessment. Start by naming the estimand. Prediction transfer, map accuracy and area estimation are different questions and require different evidence.

## 1. Name the target

**Status: durable principle.**

- **Interpolation:** predict among conditions and locations represented by observations.
- **Spatial transfer:** predict new regions, distances, times, sensors or environmental regimes.
- **Fixed-map accuracy:** estimate error over a defined mapped population.
- **Area or prevalence:** estimate the population area of classes or change.
- **Scientific association:** estimate a relationship under stated causal or statistical assumptions.

One validation score cannot establish all five.

## 2. Preserve support and spatial identity

**Status: durable principle.**

Record whether each observation is a point, pixel average, chip, object, polygon total or event. Preserve CRS, transform, resolution, units, NoData and source identity. A reprojection or resampling step can alter support and dependence; a common grid does not prove alignment or equivalence.

Aggregation can create the modifiable areal unit problem, and polygon-level associations do not automatically describe individuals. Avoid ecological-fallacy claims.

## 3. Model dependence explicitly when it answers the question

**Status: durable principle.**

For random field \(Z(s)\),

$$
C(h)=\operatorname{Cov}[Z(s),Z(s+h)],\qquad
\gamma(h)=\tfrac12\operatorname{Var}[Z(s+h)-Z(s)].
$$

Covariance and variograms summarize dependence only under their stated mean, stationarity and directional assumptions. Inspect trend, anisotropy, boundaries, sampling density and residual structure. Do not infer a universal spatial range from one empirical variogram.

For areal data, the neighborhood matrix is part of the model. For event data, use a point-process formulation when intensity or interaction is the target. Rasterization changes the question.

## 4. Use kriging as conditional prediction

**Status: durable principle.**

$$
\widehat{Z}(s_0)=\sum_i\lambda_iZ(s_i).
$$

The weights and reported kriging variance depend on the mean and covariance model, observation support and fitted parameters. Validate residuals and out-of-sample behavior. Do not treat an interpolated surface or its nominal variance as observed truth.

## 5. Choose validation from the deployment claim

**Status: durable principle.**

Use random folds only when exchange with the target is defensible. Otherwise group the unit that creates dependence: source scene, site, polygon, object, survey, acquisition, date, region or provider. Spatial blocks, buffers, leave-location-out, temporal blocks and environmental folds estimate different target shifts.

Derive block or buffer scale from the phenomenon, sampling layout, feature/receptive-field context and deployment distance. There is no universal distance. Compare error against distance and predictor dissimilarity when transfer is material. A coordinate-only or proximity baseline can reveal memorized geography.

Fit normalization, imputation, PCA, feature selection, calibration, thresholding and postprocessing choices inside the appropriate training/validation loop. Keep a final test untouched after selection.

## 6. Do not confuse cross-validation with map assessment

**Status: durable principle.**

- Cross-validation supports model selection and estimates performance for a specified train-to-target scenario.
- An independent probability sample with design-based inference estimates accuracy of a fixed map over its target population.

Spatial CV can be intentionally pessimistic for interpolation and still appropriate for far-transfer model selection. It is not a replacement for population map assessment. Conversely, a representative map-accuracy sample does not by itself test transfer to a new region or future sensor.

## 7. Design map assessment as a survey

**Status: durable principle.**

Define the population and assessment unit. Then align:

1. **Sampling design:** known, non-zero inclusion probabilities; choose simple random, systematic, stratified, cluster or multistage sampling for the precision, subgroup and cost objectives.
2. **Response design:** reference source, temporal window, label legend, interpreter protocol, agreement rule and reference uncertainty.
3. **Analysis:** use estimators and variance formulas that match the design.

Stratify when rare classes or subregion estimates need adequate representation. Clustering can reduce reference-data cost but may reduce precision and requires cluster-aware estimators.

## 8. Use area-weighted accuracy and estimation

For map class \(i\), reference class \(j\), stratum area weight \(W_i\), and sample count \(n_{ij}\),

$$
\widehat{p}_{ij}=W_i\frac{n_{ij}}{n_{i+}}.
$$

Then

$$
\widehat{O}=\sum_j\widehat{p}_{jj},\quad
\widehat{U}_i=\frac{\widehat{p}_{ii}}{\widehat{p}_{i+}},\quad
\widehat{P}_j=\frac{\widehat{p}_{jj}}{\widehat{p}_{+j}},\quad
\widehat{A}_j=A_{\mathrm{total}}\widehat{p}_{+j}.
$$

Report overall, user's and producer's accuracy with design-consistent uncertainty and sample sizes. Report area estimates and confidence intervals for area claims. Do not substitute raw sample counts under unequal sampling, or map pixel counts that ignore classification error. Kappa is not a mandatory summary and should appear only when its estimand is specifically justified.

## 9. Treat reference quality as a measured limitation

Reference imagery should be more informative than the evaluated map for the assessment unit and date. Check mixed support, geolocation, temporal mismatch, interpreter disagreement and ambiguous classes. Blind interpretation when practical, record confidence and adjudication, and assess a repeat-label subset when disagreement could change conclusions.

## 10. Map applicability and uncertainty

Inspect distance to observations and dissimilarity in predictor space. An area-of-applicability mask may communicate where validation evidence is relevant, but its metric and threshold are conditional on the validation scheme. Derive thresholds from training/validation evidence and operational costs; verify them on independent cases when consequential.

Distinguish confidence intervals for population parameters from predictive intervals, model uncertainty and distribution-shift warnings. None is interchangeable with another.

## 11. Minimum reporting record

1. target population, estimand and deployment shift;
2. observation and assessment support;
3. sampling frame, inclusion probabilities and realized sample;
4. response design, label protocol and reference uncertainty;
5. train/validation/test grouping and all buffer or block rationale;
6. preprocessing fit scope and fixed split identifiers;
7. model, spatial/proximity baseline and selection history;
8. metrics, weights, variance estimator and confidence intervals;
9. final postprocessed map assessment and mapped error patterns;
10. applicability limits, extrapolation and unresolved bias.

## Source boundary

This branch fuses Moraga (2023), Olofsson (2025), Olofsson et al. (2014), Roberts et al. (2017), Valavi et al. (2019), Ploton et al. (2020), Wadoux et al. (2021), Meyer and Pebesma (2021), and Wang et al. (2023). Current task-specific methods and software still require verification.
