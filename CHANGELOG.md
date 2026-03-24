# Changelog

All notable changes to the **Project Central** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0](https://github.com/bmoers/vscode-project-central/compare/v1.0.1...v1.1.0) (2026-03-24)


### Features

* icon controls to open project ([22c13fb](https://github.com/bmoers/vscode-project-central/commit/22c13fb99d5c4f4f9dde5618beea44b68a1319c7))

## [1.0.1](https://github.com/bmoers/vscode-project-central/compare/v1.0.0...v1.0.1) (2026-03-24)


### Bug Fixes

* integrate publish into release workflow ([17e1a37](https://github.com/bmoers/vscode-project-central/commit/17e1a3746aa2f66fa641bc5ecde93765e8517cce))

## 1.0.0 (2026-03-24)


### Features

* initial release with project browser, favorites, sorting and filtering ([b105a0f](https://github.com/bmoers/vscode-project-central/commit/b105a0f8285d6f97cb56ff7e3582c869f4005a99))

## [0.1.0] - 2026-03-24

### Added

- **Activity Bar view** with dedicated icon for browsing projects
- **Project scanner** that detects 7 project types: Git, VS Code, IntelliJ, Node.js, Rust, Python, Go
- **Multiple root folders** — configure several directories to scan, each with its own label, depth, and type filter
- **Favorites** — star projects for quick access; favorites appear in a dedicated section at the top
- **Sorting** — sort projects alphabetically (A-Z, Z-A), by usage count, or by last opened
- **Filtering** — filter the project list by project type
- **Quick Open** (`Cmd+Alt+P` / `Ctrl+Alt+P`) — fuzzy-search across all projects from anywhere
- **Usage tracking** — tracks how often and when each project was opened, persisted across sessions
- **Context menu actions** — Open in New/Current Window, Open in Terminal, Copy Path, Reveal in Finder
- **Auto-refresh** on configuration changes
- **Welcome view** with "Add Root Folder" button when no root folders are configured
- Light and dark theme icons for all project types
