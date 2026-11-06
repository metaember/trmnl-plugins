# Contributing

Open an issue or pull request at
[metaember/trmnl-plugins](https://github.com/metaember/trmnl-plugins).
Name the affected module and describe what a user sees, the expected behavior,
and the smallest reproduction you can provide.

Keep changes focused. Reuse TRMNL Framework components, keep API shaping in
the transform, and treat missing prices or scores as missing. Do not include
account exports, real credentials, personal data or private API responses.

Before opening a pull request, run the module's lint, tests and PNG build as
documented in the root README. When changing markup, inspect full, horizontal
half, vertical half and quadrant renders, including OG and X portrait layouts.
Attach relevant before/after screenshots directly to the pull request. Include
the settings and device/orientation each screenshot uses. The generated
`report/index.html` is useful for local review; its local path is not PR evidence.

Add a focused regression test for changed behavior. Tests use public factual
fixtures or clearly identified sample data and mock network calls. Preserve
the module's license and attribution. Update its README when behavior or
configuration changes.

Deployments and recipe submissions are maintainer actions. Pull requests and
CI must not upload to TRMNL or require a TRMNL API key.
