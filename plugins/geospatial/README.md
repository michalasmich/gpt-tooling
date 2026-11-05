# Geospatial

Geospatial is an optional GPT Tooling plugin for evidence-grounded remote sensing, Earth observation, GIS, and geospatial computer vision or machine learning.

It supplies domain semantics that general engineering guidance does not provide. These include sensor measurement constraints, georeferencing, spatial and temporal leakage, target support, map validation, geospatial metadata preservation, and model or library contracts specific to Earth observation.

## Scope

The skill routes among focused references for:

- optical, SAR, UAV photogrammetry, hyperspectral, LiDAR, and time-series data;
- classification, segmentation, detection, embeddings, foundation models, and multimodal fusion;
- dataset construction, training, architecture selection, domain adaptation, and operational uncertainty;
- spatial validation, leakage prevention, Python libraries, and scientific reporting.

The plugin contains the maintained fused guidance and two compact foundation-model registries. It does not redistribute the underlying books, papers, or temporary research artifacts.

## Use

The skill supports automatic discovery for relevant geospatial tasks. Invoke it explicitly with `$geospatial` when you want to force the domain workflow.

Example:

```text
$geospatial Review this Sentinel-2 segmentation design for spatial leakage, target alignment, and deployment validity.
```

Install it after registering the GPT Tooling marketplace:

```bash
codex plugin add geospatial@gpt-tooling
```

Start a new Codex thread after installation so the skill is discovered from a clean context.

## Authority

Geospatial supplies domain-specific reasoning and reference routing. Plinth remains responsible for methodology, evidence, engineering risk, and verification. Ponytail governs implementation economy. Quire governs expression and technical reporting.

## License

The plugin's original text is available under the [MIT License](LICENSE). Linked source material remains governed by its original terms.
