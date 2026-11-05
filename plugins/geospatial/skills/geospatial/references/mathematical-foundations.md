# Mathematical Foundations for Geospatial Machine Learning

## Purpose

Use this reference to check the mathematical meaning of a geospatial ML decision. It is a compact router, not a replacement for the source books or domain physics.

## Core rules

1. **Preserve semantics through representation changes.** Record basis, CRS, units, scaling, band order, spatial support and masks. Shape compatibility is not physical compatibility.
2. **Inspect conditioning.** Near-collinearity, poorly scaled variables and small singular values can make estimates unstable. Report sensitivity when it could change the conclusion.
3. **Fit learned transforms within training data.** Centering, scaling, PCA, whitening, feature selection and calibration must not see held-out evidence.
4. **Name the probability statement.** Separate observation noise, parameter uncertainty, predictive uncertainty and distribution shift. Validate calibration for the claimed population.
5. **Treat losses and constraints as scientific choices.** They encode costs, weights and assumptions. Optimization success does not validate the objective.
6. **Use the simplest established estimator that matches the question.** Prefer closed-form or convex methods when they satisfy the requirement; use more complex models only for a material limitation.

## Minimal equations

Empirical risk:

$$
\widehat{R}(f)=\frac{1}{n}\sum_{i=1}^{n}\ell(f(x_i),y_i).
$$

Regularized estimation:

$$
\widehat{\theta}=\arg\min_\theta\left[\sum_i w_i\ell_i(\theta)+\lambda\Omega(\theta)\right].
$$

The weights \(w_i\), penalty \(\Omega\) and strength \(\lambda\) need an error model, operational rationale or training/validation evidence. They are not neutral defaults.

## Source boundary

This reference synthesizes Deisenroth, Faisal and Ong (2020) and Boyd and Vandenberghe (2004), with the probabilistic foundations already extracted from Bishop (2006), Goodfellow et al. (2016), and Bishop and Bishop (2024). Current software behavior and numerical implementations require current documentation.
