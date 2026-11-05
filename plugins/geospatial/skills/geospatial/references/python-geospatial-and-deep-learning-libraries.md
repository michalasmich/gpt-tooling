# Python Libraries for Geospatial Deep Learning

## Purpose and scope

This guide maps the maintained Python ecosystem to the roles needed in geospatial computer vision and deep learning. It is a curated operational map, not an exhaustive PyPI directory. Add a library only when its data model or capability solves a project requirement.

Official documentation was checked on 5 November 2026. APIs, licenses, supported Python versions, binary dependencies, model weights, and hosted services require verification when a project environment is created.

## 1. Choose the data model first

| Data and operation | Default library or format | Why |
|---|---|---|
| Dense numerical arrays in memory | NumPy | Common CPU array contract |
| Tabular metadata and manifests | pandas, PyArrow, Parquet | Typed columns, joins, efficient columnar storage |
| Labeled multidimensional cubes | xarray | Named dimensions, coordinates, attributes |
| Larger-than-memory array or table work | Dask, only when needed | Chunked lazy and distributed execution |
| Vector geometry tables | GeoPandas + Shapely + pyproj + Pyogrio | Familiar tabular model with planar geometry and CRS support |
| Georeferenced raster files | Rasterio | Windowed raster I/O with CRS, transform, masks, and profiles |
| Georeferenced xarray objects | rioxarray or odc-geo | Raster CRS, transform, NoData, reprojection, and writing |
| EO catalog discovery | PySTAC + PySTAC Client | STAC objects, validation, static catalogs, and API search |
| STAC-to-cube loading | odc-stac or stackstac | STAC assets to aligned xarray/Dask objects |
| Deep-learning tensors and models | PyTorch | Training, inference, autograd, data loading, distribution |
| Geospatial sampling for PyTorch | TorchGeo | CRS-aware raster/vector datasets and spatial-temporal samplers |
| LAS/LAZ point access | laspy | Direct typed LAS/LAZ reading and writing |
| Point-cloud pipelines | PDAL | Format conversion, filtering, reprojection, tiling, and pipelines |

Use one primary representation for each stage. Repeated conversion among NumPy, xarray, pandas, tensors, and geometry objects creates copies and loses metadata unless the boundary is explicit.

## 2. Numerical and tabular foundation

### NumPy

Use [NumPy](https://numpy.org/doc/stable/) for dense CPU arrays, numerical operations, dtype control, broadcasting, and interchange with raster and scientific libraries.

Required discipline:

- record axis order, band order, dtype, scale, offset, valid range, and mask convention;
- distinguish integer digital numbers from physical floating-point quantities;
- avoid loading a full raster when a window is sufficient;
- preserve NoData separately from valid zero;
- check copies and memory layout at NumPy-to-PyTorch boundaries.

NumPy does not retain CRS, affine transforms, units, or named axes by itself.

### pandas

Use [pandas](https://pandas.pydata.org/docs/) for source manifests, sample indexes, annotation tables, metrics, experiment summaries, and non-spatial attributes.

Pandas is not a raster or geometry engine. Store geometry in GeoPandas and multidimensional imagery in xarray, Rasterio-backed files, or an explicit array store. Prefer Parquet over CSV when types, nulls, nested metadata, or scale matter.

### PyArrow and Parquet

Use [PyArrow](https://arrow.apache.org/docs/python/) for Arrow tables, Parquet datasets, schema control, predicate filtering, and interchange. Use GeoParquet through GeoPandas or Pyogrio for vector tables when interoperability and columnar access matter.

Do not place full image arrays inside a tabular manifest unless the dataset is genuinely small and the storage design was measured. Store asset references and immutable identifiers instead.

### SciPy and scikit-learn

Use [SciPy](https://docs.scipy.org/doc/scipy/) for established numerical, signal, sparse, optimization, and statistical routines. Use [scikit-learn](https://scikit-learn.org/stable/) for classical models, preprocessing, pipelines, calibration, metrics, and group-aware split utilities.

Scikit-learn splitters understand groups, not geography automatically. Construct groups from the scientific validation design. Fit preprocessing, calibration, and feature selection inside the allowed training or development lifecycle.

## 3. CRS, geometry, and vector data

### pyproj

Use [pyproj](https://pyproj4.github.io/pyproj/stable/) for CRS objects, coordinate transformations, datum operations, geodesics, and PROJ access.

Check axis order, area of use, transformation accuracy, coordinate epoch, and grid availability. Use `always_xy=True` only as an explicit interface decision, not as a way to ignore CRS semantics. Use `pyproj.Geod` for geodesic distances and areas when a planar projected calculation is inappropriate.

### Shapely

Use [Shapely](https://shapely.readthedocs.io/en/stable/) for planar geometry predicates, overlays, buffers, validity, spatial indexing, and vectorized geometry operations.

Shapely coordinates are unitless and planar. Reproject to a suitable projected CRS before distance, area, or buffer operations. Repairing invalid geometry can change topology; inspect and record material repairs.

### GeoPandas

Use [GeoPandas](https://geopandas.org/en/stable/docs.html) for spatial tables, joins, overlays, dissolves, file I/O, and exploratory mapping.

Keep one active geometry and a known CRS. Before a spatial join or overlay, verify both layers' CRS, geometry validity, date, support, and intended predicate. GeoPandas convenience does not make a geographic-coordinate buffer physically meaningful.

### Pyogrio and Fiona

Use [Pyogrio](https://pyogrio.readthedocs.io/en/latest/) as the usual high-throughput vector I/O path behind GeoPandas. Use [Fiona](https://fiona.readthedocs.io/en/stable/) when an existing codebase, driver workflow, or streaming feature interface requires it.

Both depend on GDAL/OGR behavior. Verify driver support, field typing, CRS preservation, geometry dimensions, encoding, and layer selection with a round-trip sample.

### GDAL/OGR

Use [GDAL](https://gdal.org/en/stable/) command-line utilities or Python bindings for broad format support, warping, translation, virtual filesystems, multidimensional rasters, and operations not exposed by higher-level libraries.

GDAL is the shared native substrate beneath much of the ecosystem. Prefer Rasterio and Pyogrio for ordinary Python application code; use direct GDAL bindings when their broader interface is required. Avoid passing live dataset handles across libraries or processes.

### Optional vector and database tools

- [DuckDB spatial](https://duckdb.org/docs/stable/core_extensions/spatial/overview) for analytical SQL over local spatial and Parquet data.
- [PostGIS with SQLAlchemy/GeoAlchemy2](https://geoalchemy-2.readthedocs.io/en/latest/) for concurrent, indexed, transactional spatial databases.
- [OSMnx](https://osmnx.readthedocs.io/en/stable/) for OpenStreetMap street networks and related features.
- [MovingPandas](https://movingpandas.org/) for trajectory data when its object model fits the task.

Use a database when concurrency, indexed queries, integrity constraints, or shared state justify it. Do not add one for a small immutable file workflow.

## 4. Raster files and geospatial arrays

### Rasterio

Use [Rasterio](https://rasterio.readthedocs.io/en/stable/) for windowed raster reading and writing, profiles, CRS, affine transforms, masks, bounds, resampling, reprojection, rasterization, and vectorization.

Preserve and test:

- CRS and affine transform;
- width, height, band count, and band descriptions;
- dtype, scale, offset, units, and color interpretation;
- internal mask, alpha, and NoData semantics;
- block size, compression, overviews, and BigTIFF requirements;
- resampling method per variable type.

Use nearest-neighbor resampling for categorical labels unless the method explicitly requires another rule. Never copy a source profile after changing shape or resolution without updating the transform and dimensions.

### xarray

Use [xarray](https://docs.xarray.dev/en/stable/) for labeled arrays with named dimensions, coordinates, and attributes. It is the default analytical model for time, band, vertical, ensemble, and spatial cubes.

Named axes reduce channel and time-order errors, but xarray attributes are not automatically preserved by every operation. Add assertions for required CRS, transform, units, NoData, band names, and coordinate monotonicity at important boundaries.

### rioxarray and odc-geo

Use [rioxarray](https://corteva.github.io/rioxarray/stable/) to connect Rasterio semantics to xarray, including CRS, transform, NoData, clipping, reprojection, and raster output. Use [odc-geo](https://odc-geo.readthedocs.io/en/latest/) when Open Data Cube geobox, reprojection, or xarray integration matches the project.

Both can express geospatial metadata; do not maintain two competing conventions in one pipeline without a boundary adapter and checks.

### Dask

Use [Dask](https://docs.dask.org/en/stable/) when arrays or tables exceed memory, independent chunks can run in parallel, or distributed execution is actually required.

Start with eager Rasterio, NumPy, pandas, or xarray for small data. With Dask:

- choose chunks from access pattern, source blocks, memory, and downstream kernels;
- inspect the task graph before a large job;
- avoid repeated rechunking and tiny chunks;
- remember that `.compute()` materializes the result and must fit in memory;
- persist only reused intermediates that fit the cluster;
- test one representative subset before the full graph.

Dask does not make an algorithm memory-safe automatically.

### Zarr, NetCDF, COG, and GeoParquet

- [Zarr](https://zarr.readthedocs.io/en/stable/) for chunked N-dimensional arrays and cloud object storage.
- [NetCDF](https://docs.xarray.dev/en/stable/user-guide/io.html) for established CF-oriented scientific exchange.
- Cloud Optimized GeoTIFF through Rasterio/GDAL for spatial window and HTTP range access to 2D raster assets.
- GeoParquet for columnar vector data.

Choose format and chunking from the dominant read pattern. A training chip store, an analytical time cube, and a delivered map have different access needs.

### Raster analysis helpers

- [xarray-spatial](https://xarray-spatial.readthedocs.io/en/stable/) for scalable raster, terrain, proximity, zonal, and focal operations in the xarray/Dask ecosystem.
- [exactextract](https://isciences.github.io/exactextract/) for area-weighted zonal statistics when exact raster-polygon coverage matters.
- [rasterstats](https://pythonhosted.org/rasterstats/) for simple raster-vector summaries in small established workflows.
- [WhiteboxTools](https://www.whiteboxgeo.com/manual/wbt_book/python_scripting.html) for terrain, hydrology, and broader geoprocessing through its Python interface.

Validate numerical definitions, NoData handling, edge policy, units, and alignment. Two libraries with a function named `slope` or `zonal_stats` need not implement identical semantics.

## 5. Catalogs, cloud storage, and EO discovery

### PySTAC and PySTAC Client

Use [PySTAC](https://pystac.readthedocs.io/en/stable/) to create, inspect, extend, and validate STAC objects. Use [PySTAC Client](https://pystac-client.readthedocs.io/en/stable/) to query STAC APIs and traverse static catalogs.

Record the endpoint, collection, query, date range, bounding geometry, filters, returned item IDs, asset keys, and STAC extensions. A STAC item describes an asset; it does not guarantee product validity, physical compatibility, or persistent access.

### odc-stac and stackstac

Use [odc-stac](https://odc-stac.readthedocs.io/en/latest/) to load STAC items into an xarray `Dataset` with explicit geobox and band handling. Use [stackstac](https://stackstac.readthedocs.io/en/latest/) when a lazy time-band-y-x `DataArray` is the preferred model.

Choose one loader per pipeline. Always set or verify output CRS, resolution, bounds, resampling, dtype, scale, NoData, and item order. Automatic grid selection is a convenience, not a scientific decision.

### fsspec and provider adapters

Use [fsspec](https://filesystem-spec.readthedocs.io/en/latest/) for a common file-like interface across local and remote stores. Add provider implementations such as [s3fs](https://s3fs.readthedocs.io/en/latest/) only for stores in use.

Do not embed credentials in code, manifests, notebooks, or logs. Confirm caching, retries, range requests, requester-pays behavior, token expiry, and write semantics.

### Service-specific clients

- [Google Earth Engine Python API](https://developers.google.com/earth-engine/guides/python_install) and [geemap](https://geemap.org/) for Earth Engine workflows.
- [Microsoft Planetary Computer SDK](https://pypi.org/project/planetary-computer/) for signing assets on that service.
- [Sentinel Hub Python](https://sentinelhub-py.readthedocs.io/en/latest/) for Sentinel Hub APIs.
- [earthaccess](https://earthaccess.readthedocs.io/en/latest/) for NASA Earthdata search, authentication, and access.
- [eodag](https://eodag.readthedocs.io/en/stable/) for a provider-agnostic EO discovery and download interface when its supported providers fit the project.

Hosted-service APIs, quotas, collections, authentication, and costs can change. Keep service access outside the scientific core and record item identities locally.

## 6. Image processing and augmentation

### scikit-image

Use [scikit-image](https://scikit-image.org/docs/stable/) for NumPy-oriented filtering, morphology, measurement, segmentation primitives, transforms, exposure, and feature extraction.

### OpenCV

Use [OpenCV](https://docs.opencv.org/) for efficient image operations, camera geometry, feature matching, registration, video, and established computer-vision primitives.

OpenCV commonly uses BGR channel order and image-coordinate conventions that differ from geospatial libraries. Convert explicitly and preserve the geospatial transform when cropping, resizing, rotating, or warping.

### torchvision, Kornia, and Albumentations

- [torchvision v2 transforms](https://docs.pytorch.org/vision/stable/transforms.html) for a minimal PyTorch-native CPU/tensor pipeline.
- [Kornia](https://kornia.readthedocs.io/en/latest/augmentation.html) for batched, differentiable, GPU-capable tensor geometry and augmentation.
- [Albumentations](https://albumentations.ai/docs/) for broad CPU image, mask, box, keypoint, and oriented-box augmentation when its current AGPL or commercial license is acceptable.

Apply each random geometric transform jointly to imagery, masks, boxes, polygons, keypoints, and valid-data masks. Restrict spectral and radiometric transforms to physically defensible sensor behavior. Save or replay sampled parameters when an audit requires exact reconstruction.

## 7. PyTorch and general deep learning

### PyTorch

Use [PyTorch](https://docs.pytorch.org/docs/stable/) for tensors, automatic differentiation, models, optimization, mixed precision, compilation, distributed training, and deployment interfaces.

Core components:

- `torch.utils.data.Dataset` and `DataLoader` for sample access and batching;
- `torch.nn` for models and losses;
- `torch.optim` for optimization;
- automatic mixed precision for supported hardware;
- `DistributedDataParallel` for multi-process data parallelism when one GPU is insufficient;
- `torch.compile` or export only after correctness and compatibility checks.

Seed every relevant generator and record worker, sampler, and distributed settings. Reproducibility and stochastic stability are separate questions.

### torchvision and timm

Use [torchvision](https://docs.pytorch.org/vision/stable/) for maintained reference transforms, datasets, operators, and common classification, detection, and segmentation components. Use [timm](https://huggingface.co/docs/timm/index) when its broad encoder and pretrained-weight catalogue is needed.

For every pretrained model, record weight identifier, preprocessing configuration, input channels, expected range, resolution, interpolation, license, and source. A model name without its weight and preprocessing contract is incomplete.

### Training-loop helpers

- Native PyTorch is the default when the training loop is short and project-specific.
- [Lightning](https://lightning.ai/docs/pytorch/stable/) can reduce distributed, checkpointing, and logging boilerplate when its lifecycle matches the project.
- [Accelerate](https://huggingface.co/docs/accelerate/) can simplify device and distributed execution for compatible loops.

Do not add a framework only to wrap a simple loop. Add it when its tested lifecycle removes material complexity.

### Metrics and experiment records

Use [TorchMetrics](https://lightning.ai/docs/torchmetrics/stable/) for stateful, distributed-aware metric accumulation when its definitions match the task. Use scikit-learn, SciPy, or project code for metrics not represented correctly.

Verify averaging, class handling, ignore values, matching, thresholds, distributed reduction, and empty cases. A library metric name is not a complete metric specification.

Use an existing project logger or a simple structured file for experiments. Add MLflow, Weights & Biases, or TensorBoard only when comparison, collaboration, or artifact tracking requires it. Never upload sensitive imagery, coordinates, labels, or credentials without authorization.

## 8. Geospatial deep-learning libraries

### TorchGeo

Use [TorchGeo](https://docs.torchgeo.org/en/stable/) for geospatial datasets, CRS-aware raster and vector intersection, bounding-box queries, spatial-temporal sampling, benchmark datasets, transforms, and selected pretrained models.

TorchGeo is most valuable when imagery and labels remain georeferenced and samples should be drawn dynamically. Verify:

- chosen CRS and resolution;
- band order and units;
- source-label alignment and time overlap;
- random versus gridded sampling;
- split boundaries and parent groups;
- padding, overlap, and inference coverage;
- file-handle caching with DataLoader workers.

Do not use random spatial sampling across the entire dataset before assigning splits.

### TerraTorch

Use [TerraTorch](https://torchgeo.org/terratorch/) when its task modules and supported geospatial foundation models match the project. Confirm the exact model release, input adapter, decoder, bands, temporal metadata, weights, license, and TorchGeo/PyTorch compatibility.

TerraTorch is an implementation layer, not evidence that a foundation model is suitable. Follow the foundation-model and architecture-selection references.

### Optional model libraries

- [segmentation-models-pytorch](https://smp.readthedocs.io/en/latest/) for standard encoder-decoder segmentation baselines.
- [MMDetection](https://mmdetection.readthedocs.io/en/latest/) for a broad, configuration-driven detection ecosystem.
- [Detectron2](https://detectron2.readthedocs.io/en/latest/) for established detection and instance-segmentation components.
- [Ultralytics](https://docs.ultralytics.com/) for YOLO-family workflows when its current AGPL or enterprise license and task contract are acceptable.
- [torchange](https://github.com/Z-Zheng/pytorch-change-models) for change-detection architectures when an existing implementation is preferable to custom code.

Use one model ecosystem per task unless a controlled comparison needs more. Framework conversion and duplicated data pipelines create maintenance and fairness problems.

## 9. LiDAR and point clouds

### laspy

Use [laspy](https://laspy.readthedocs.io/en/latest/) for direct LAS/LAZ/COPC header and point-record access, chunked reads, point-format fields, VLRs, and writing.

Preserve LAS version, point format, scales, offsets, CRS VLRs, classifications, return fields, waveform references, extra dimensions, and source IDs. Raw integer coordinates and scaled coordinates are not interchangeable.

### PDAL

Use [PDAL](https://pdal.org/en/stable/) for declarative point-cloud reading, filtering, reprojection, registration, tiling, rasterization, and writing across formats. Save the complete pipeline JSON and tool version.

### Open3D

Use [Open3D](https://www.open3d.org/docs/latest/) for point-cloud and mesh geometry, registration, voxelization, reconstruction, visualization, tensors, and selected 3D ML workflows.

Open3D geometry objects do not automatically preserve the full LAS schema or geospatial CRS. Carry that metadata explicitly and use laspy or PDAL for authoritative file semantics.

### Deep point-cloud frameworks

Use maintained PyTorch implementations only after the point-cloud representation is fixed. [MinkowskiEngine](https://nvidia.github.io/MinkowskiEngine/) supports sparse tensors and convolutions; [PyTorch Geometric](https://pytorch-geometric.readthedocs.io/en/latest/) supports graph learning. Their abstractions do not replace point-cloud sampling, CRS, scale, density, return, and lineage decisions.

## 10. SAR and interferometry

No Python package replaces knowledge of the mission product, calibration, geometry, speckle, terrain correction, and complex-data conventions.

- [pyroSAR](https://pyrosar.readthedocs.io/en/latest/) for SAR scene identification and orchestration of SNAP or GAMMA workflows.
- [sarpy](https://sarpy.readthedocs.io/en/latest/) for complex SAR formats, SICD/SIDD/CPHD/CRSD structures, selected processing, orthorectification, registration, and annotation.
- [sarpyx](https://github.com/ESA-PhiLab/sarpyx) for emerging SNAP-integrated and research workflows; verify maturity and exact supported missions before adoption.
- [ISCE3](https://isce-framework.github.io/isce3/) for NISAR-oriented SAR and InSAR algorithms and Python bindings.
- [MintPy](https://mintpy.readthedocs.io/en/latest/) for InSAR time-series analysis from supported processors.
- [xarray-sentinel](https://github.com/bopen/xarray-sentinel) for Sentinel-1 SAFE access in an xarray-oriented workflow when its product support fits.

SNAP, GAMMA, ISCE, and GMTSAR are external processing systems even when invoked from Python. Record their versions, orbit and DEM sources, processing graphs, parameters, reference frames, and intermediate products.

## 11. Hyperspectral and spectroscopy

- [Spectral Python](https://www.spectralpython.net/) for ENVI-style hyperspectral I/O, visualization, classifiers, transforms, and spectral algorithms.
- [WISER](https://ehlmann-research-group.github.io/WISER/) for interactive imaging-spectroscopy exploration and extensible analysis.
- [spyndex](https://awesome-spectral-indices.readthedocs.io/en/latest/) for a registry and computation of published spectral indices, with formula and band validation.
- [specutils](https://specutils.readthedocs.io/en/stable/) for one-dimensional spectroscopy when its spectral-coordinate and uncertainty model fits.
- xarray, Dask, Rasterio, and rioxarray for large georeferenced spectral cubes.

Verify wavelength centers, full width at half maximum, units, bad-band masks, spectral response, smile, scale, interleave, NoData, and spatial geometry. A band index from one sensor is not a wavelength contract for another.

## 12. Spatial statistics and validation

- [PySAL](https://pysal.org/) for spatial weights, exploratory spatial analysis, point patterns, regionalization, spatial econometrics, and related vector-focused methods.
- [scikit-gstat](https://scikit-gstat.readthedocs.io/en/latest/) for experimental variograms and fitted variogram models.
- [GSTools](https://geostat-framework.readthedocs.io/projects/gstools/en/stable/) for covariance models, kriging, and random fields.
- [statsmodels](https://www.statsmodels.org/stable/) for established statistical models and diagnostics.
- [scikit-learn](https://scikit-learn.org/stable/modules/cross_validation.html) for group-aware folds and model evaluation plumbing.

The software computes a chosen method. It does not determine the sampling population, independence unit, block geometry, variogram validity, map-accuracy estimator, or inference population. Follow the spatial-statistics and validation reference.

## 13. Maps, plots, and visual inspection

- [Matplotlib](https://matplotlib.org/stable/) for static plots and diagnostic figures.
- [Cartopy](https://cartopy.readthedocs.io/stable/) for projected maps and geographic transformations in Matplotlib.
- GeoPandas `.plot()` for quick vector maps.
- [contextily](https://contextily.readthedocs.io/en/latest/) for web basemaps in projected static maps.
- [Folium](https://python-visualization.github.io/folium/latest/) or [ipyleaflet](https://ipyleaflet.readthedocs.io/en/latest/) for interactive web maps.
- [Datashader](https://datashader.org/) for rendering very large point, line, and raster collections.
- [hvPlot](https://hvplot.holoviz.org/) and [GeoViews](https://geoviews.org/) for concise interactive plots over pandas, xarray, and geospatial objects.
- [napari](https://napari.org/stable/) for interactive multidimensional image inspection and annotation plugins.

Always label CRS or projection, units, scale, date, source, class legend, NoData, and uncertainty meaning. A basemap is contextual data with attribution and date, not ground truth.

## 14. Recommended minimal stacks

Install only the stack needed by the project.

### Small local raster-vector project

`numpy`, `pandas`, `rasterio`, `geopandas`, `shapely`, `pyproj`, `pyogrio`, `matplotlib`

Add `scikit-learn` for classical modeling and validation. This stack covers most local GIS and dataset-building tasks.

### Multitemporal EO analysis

Base stack plus `xarray`, `rioxarray` or `odc-geo`, and one STAC loader. Add `dask` only when data volume or parallel execution requires it.

### Geospatial deep learning

Base stack plus `torch`, `torchvision`, and `torchgeo`. Add `timm`, TerraTorch, or one task-specific model library only for a declared candidate. Add one augmentation library, not all of them.

### LiDAR

Base metadata stack plus `laspy` for file access and PDAL for processing. Add Open3D for geometry, registration, visualization, or 3D algorithms.

### SAR

Base raster stack plus the mission's authoritative processor or a documented wrapper such as pyroSAR. Add sarpy for supported complex product standards. Keep processing-system installation separate from the Python environment when practical.

### Hyperspectral

Base raster stack plus xarray and Spectral Python. Add Dask for large cubes and a spectroscopy tool only when its data model matches the analysis.

## 15. Environment and installation strategy

Use an isolated, locked environment per project.

- Prefer `uv` or pip for pure-Python and PyTorch-focused environments when binary wheels satisfy the platform.
- Prefer conda-forge or a container when GDAL, PROJ, GEOS, PDAL, SNAP, or other native geospatial dependencies must be coordinated, especially on Windows.
- Do not install both pip and conda builds of the same native library into one environment without a tested reason.
- Pin the environment for an experiment or publication; update deliberately in a separate branch or environment.
- Record Python, CUDA, driver, PyTorch, GDAL, PROJ, GEOS, Rasterio, TorchGeo, and model-weight versions when relevant.
- Verify licenses for code, pretrained weights, datasets, basemaps, and hosted services separately.

After environment creation, run a representative smoke test:

1. import every selected library and print its version;
2. report GDAL, PROJ, GEOS, CUDA, and driver versions where applicable;
3. read a small real source asset;
4. inspect CRS, transform, shape, dtype, units, NoData, band order, and masks;
5. round-trip a temporary output and compare metadata and values;
6. load one training sample and inspect image, target, and augmentation alignment;
7. run one model forward pass and metric update;
8. render the result on its real grid.

## 16. Interoperability contracts

At every library boundary, assert the properties that can change meaning:

- axes: `HWC`, `CHW`, `BCHW`, `BTCHW`, or named xarray dimensions;
- coordinates: pixel row-column versus x-y, origin, pixel center versus corner;
- channel or band names and order;
- dtype, numeric range, scale, offset, normalization, and complex representation;
- CRS, axis order, transform, bounds, resolution, and spatial support;
- NoData, internal mask, alpha, ignore label, and valid zero;
- timestamps, timezone, cadence, and missing observations;
- geometry convention, box order, angle units, orientation range, and polygon winding;
- device, precision, memory ownership, copy, and gradient requirement;
- sample, parent, source, split, and model identifiers.

Encode these checks in direct assertions or small tests. A generic metadata framework is unnecessary when a clear local contract is sufficient.

## 17. Failure rules

- Do not install a package because it appears in an ecosystem list.
- Do not use pandas alone for raster cubes or ordinary NumPy arrays as the only geospatial record.
- Do not reproject or resample without an explicit target grid and variable-specific method.
- Do not use geographic degrees as planar distance or area units.
- Do not call `.compute()` on an unknown Dask result without estimating memory.
- Do not let augmentation transform imagery without transforming every spatial target and valid-data mask.
- Do not use TorchGeo sampling before group-aware split assignment.
- Do not load pretrained weights without their preprocessing, bands, license, and model-card contract.
- Do not assume a wrapper validates the underlying SAR, LiDAR, hyperspectral, or EO product semantics.
- Do not mix native geospatial binary stacks casually.
- Do not claim reproducibility from a requirements file without data, weights, split, seed, configuration, and artifact identities.

## Source boundary

This guide is based on official project documentation current to 5 November 2026 and the library's geospatial workflow references. Package presence is not an endorsement for every project. Exact API calls, version compatibility, licenses, hosted-service behavior, and security guidance require current official verification at implementation time.
