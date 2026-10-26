# AI-Powered Resume Builder

> A full-stack application for creating, importing, editing, scoring, and exporting professional resumes.

The AI-Powered Resume Builder combines editable resume templates, structured resume data, deterministic ATS scoring, AI-assisted resume import, and browser-based PDF export in one workflow.

## Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Local Development](#local-development)
- [Resume Import Flow](#resume-import-flow)
- [Testing and Validation](#testing-and-validation)
- [Deployment Checklist](#deployment-checklist)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Overview

Users can create a resume from editable sections or import an existing file, review the extracted information, choose a resume template, preview the result, and export the finished resume to PDF. Resume content is stored as structured section data so the editor and template renderer can work from the same underlying model.

## Features

- **Editable resume builder** — manage personal information, summary, education, experience, skills, projects, certifications, and research/publication details.
- **Multiple resume templates** — switch between supported layouts while keeping resume content separate from template presentation.
- **Live preview** — inspect the rendered resume while editing.
- **PDF export** — generate a PDF from the browser-rendered resume layout.
- **ATS scoring** — calculate a deterministic score using resume content and job-related inputs.
- **AI-assisted import** — upload supported PDF, DOCX, TXT, or JSON files; extracted data is validated and mapped into editable resume sections.
- **Authentication** — email-based and Google sign-in flows, with server-side authentication configuration.
- **Resume persistence and versions** — save and reload resumes through the API; version endpoints are present in the resume service.
- **AI prompt enrichment** — a retrieval-augmented generation (RAG) service can provide relevant context from a vector store to supported generation and analysis workflows.
- **Development diagnostics** — HTTP/ATS timing logs and validation utilities help diagnose issues.

## System Architecture — AI-Powered Resume Builder

## 1. Purpose

This document describes the logical component architecture of the AI-Powered Resume Builder. It explains the boundaries between the browser-based editor, API, application services, persistence, and external AI/authentication providers.

## 2. Logical architecture

flowchart TD
    A["User / Browser"] --> B["React + Vite UI"]
    B --> C["Resume State & API Client"]
    C --> D["Express REST API"]

    D --> E["Resume Controller & Service"]
    E --> F["Validation & Section Normalization"]

    F -->|Valid resume data| G[("MongoDB")]
    F -->|Invalid data| H["Validation Error Response"]
    H --> B

    D --> I["Resume Import Pipeline"]
    I --> J["Parse PDF / DOCX / TXT / JSON"]
    J --> K["AI Extraction when required"]
    K --> L["Google Gemini API"]
    L --> M["Map Extracted Data to Resume Sections"]
    M --> F

    E --> N["ATS Scoring"]
    N --> O["ATS Results"]
    O --> B

    E --> P["AI + RAG Service"]
    P -->|Retrieve context when enabled| Q[("Vector Store / Chroma")]
    Q --> P
    P -->|AI workflow when configured| L

    B --> R["Template Renderer & Resume Preview"]
    R --> S["Browser PDF Export"]
    S --> T["Download Resume PDF"]

    G -->|Load saved resume| E
    E -->|Resume data / API response| C

    classDef client fill:#172554,stroke:#60a5fa,color:#eff6ff,stroke-width:1.5px
    classDef backend fill:#064e3b,stroke:#34d399,color:#ecfdf5,stroke-width:1.5px
    classDef external fill:#7c2d12,stroke:#fb923c,color:#fff7ed,stroke-width:1.5px
    classDef storage fill:#3f3f46,stroke:#a1a1aa,color:#fafafa,stroke-width:1.5px
    classDef error fill:#7f1d1d,stroke:#f87171,color:#fef2f2,stroke-width:1.5px

    class A,B,C,R,S,T,O client
    class D,E,F,I,J,K,M,N,P backend
    class L external
    class G,Q storage
    class H error

for the overview diagram. The architecture is grouped into four zones:

- **Client:** React/Vite UI, resume state, API client, template rendering, preview, and PDF export.
- **Backend API:** Node.js/Express endpoints and controller/service layers.
- **Data layer:** MongoDB-backed application records and the configured vector store used for retrieval.
- **External services:** Google Gemini for AI-enabled workflows and Google identity services when Google sign-in is enabled.

## 3. Component responsibilities

| Component | Responsibility | Boundary |
|---|---|---|
| React/Vite frontend | Presents the builder, section editor, template picker, preview, and download controls. | Runs in the user's browser. |
| Resume context/state | Holds the active resume and editing/save-state metadata used by the builder. | Client-side state; persistence is performed through API calls. |
| API client | Sends resume, authentication, import, and related requests to the server. | HTTP boundary between browser and backend. |
| Express API | Routes requests to controllers and returns responses. | Server-side entry point. |
| Resume controller/service/model | Handles resume operations and persistence-related workflows. | Backend owns validation, business operations, and database access. |
| Import pipeline | Receives files, validates/parses content, uses AI extraction where needed, and maps content into normalized resume sections. | Import does not imply persistence until the regular save flow runs. |
| ATS service | Produces deterministic ATS scoring from supported resume/job inputs. | Scoring logic runs on the server. |
| RAG service | Retrieves relevant context from a vector store for supported prompts. | Optional/conditional capability; availability depends on initialization and configuration. |
| MongoDB | Stores application data through backend models/services. | Persistent data store. |
| Gemini API | Supports configured AI extraction/generation workflows. | External provider; requires server-side configuration. |
| Google sign-in | Supports Google authentication when enabled. | External identity provider. |
| Browser PDF exporter | Captures the rendered resume and generates the downloadable PDF. | Runs in the browser; not a separate PDF microservice. |

## 4. Primary flows

### 4.1 Resume editing and persistence

1. The user edits a structured section in the frontend.
2. Client state reflects the edit and the save flow calls the backend API.
3. The backend receives the request and routes it through the resume controller/service layer.
4. The server persists the updated resume through its data/model layer.
5. The client can retrieve the saved resume to rehydrate the editor.

### 4.2 Importing an existing resume

1. The browser uploads a supported file.
2. The backend validates the upload and parses the supported document format.
3. The configured workflow performs AI extraction when required.
4. Parsed/extracted fields are validated and mapped to the canonical resume section structure.
5. The editor shows the editable result for user review.
6. The normal save flow persists the approved resume data.

### 4.3 Template rendering and PDF export

1. The client passes resume sections and selected template metadata to the chosen template component.
2. The selected template renders the resume in the browser preview.
3. The browser-side export path captures the rendered page(s) and creates a PDF.
4. The user downloads the resulting file.

### 4.4 ATS and retrieval-assisted AI workflows

- ATS scoring uses deterministic server-side logic for supported inputs.
- A supported AI workflow may call the RAG service for relevant context.
- When the vector store is initialized, RAG returns matching document context for the prompt.
- If RAG is unavailable, retrieval may return empty context; the caller's behavior depends on the workflow.

## 5. Architectural decisions and constraints

- **Structured data first:** Resume sections are represented as data rather than being hardcoded into template JSX.
- **Separate content from presentation:** The template renderer controls layout; resume records provide content.
- **Server-side provider credentials:** AI and persistence credentials should remain in backend environment configuration.
- **Browser-side PDF generation:** PDF export uses the rendered template, making preview/export verification important after template changes.
- **Import requires review:** Extracted fields are mapped into the editable form so users can correct content before saving.
- **RAG is conditional:** Retrieval availability depends on vector-store setup and initialization; it should not be assumed to be active in every environment.

## 6. Configuration and deployment boundaries

A production deployment typically needs the frontend and backend URLs configured consistently, a production MongoDB connection, backend AI credentials for enabled workflows, Google sign-in settings if enabled, and an allowed-origin setting that matches the deployed frontend. Consult the current `.env.example` files and hosting configuration for exact variable names and deployment topology.

## 7. Operational verification

For a release, verify:

- Authentication flow(s) enabled in the target environment.
- Resume create, edit, save, and reload.
- Resume import with each supported file type used by the application.
- Correct template rendering and section order.
- PDF page boundaries, content completeness, and download behavior.
- ATS scoring and relevant AI/RAG paths when configured.
- No secrets, local configuration, or temporary artifacts are included in the release commit.



### Architecture at a glance

| Layer | Responsibilities |
|---|---|
| **Presentation — React/Vite** | Builder screens, section forms, template selection, resume preview, browser-side PDF export. |
| **Client state and API access** | Maintains the active resume state and sends requests to the backend through the API service. |
| **Application API — Node.js/Express** | Receives HTTP requests and routes them to the relevant controller/service. |
| **Resume domain** | Normalizes section data and manages resume create, read, update, and version-related operations. |
| **Import pipeline** | Validates an uploaded file, parses supported formats, uses AI extraction when required, and maps validated results into editable sections. |
| **ATS and AI/RAG services** | Runs deterministic ATS scoring and, where configured, enriches AI workflows with retrieved context. |
| **Persistence and providers** | MongoDB stores application records; Gemini, Google sign-in, and the vector store are used by the relevant configured workflows. |

### Key request flows

**Edit and save a resume**

1. The user edits a section in the React application.
2. Client state updates and the normal save flow sends resume data to the Express API.
3. The backend validates/normalizes the request and persists the resume through the resume service.
4. The editor can reload the saved resume through the API.

**Import an existing resume**

1. The user uploads a supported file from the resume editor.
2. The API validates and parses the file; AI extraction is used when the import workflow requires it.
3. Extracted fields are normalized and mapped into the existing resume section model.
4. The user reviews the editable fields; persistence occurs through the normal resume save flow.

**Preview and export**

1. The client passes the current resume sections and selected template to the template renderer.
2. The browser renders the resume preview.
3. PDF export captures the rendered page layout and creates the downloadable PDF in the browser.

**AI-assisted retrieval**

1. A supported AI workflow forms a query for relevant context.
2. The RAG service searches the configured vector store when initialized.
3. Retrieved context can be included in the relevant AI prompt. If RAG is unavailable, the service can return empty context and the calling workflow may continue without it, depending on that workflow.

> **Implementation note:** This is a component-level architecture, not a deployment topology. Actual enabled providers and environment-variable names are controlled by the code and the `.env.example` files in the repository.

## Technology Stack

| Area | Technology / responsibility |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Persistence | MongoDB via the server data/model layer |
| AI workflows | Google Gemini where the relevant workflow requires it |
| Retrieval | Chroma/vector-store integration for RAG, when initialized and configured |
| Authentication | Email/Google sign-in flows and JWT-related server configuration |
| PDF export | `html2canvas` and `jsPDF` in the browser |
| Testing and maintenance | Client test files and repository validation scripts |

## Repository Structure

```text
Building AI-Powered Resume Builder/
├── client/
│   ├── src/
│   │   ├── components/       # Builder UI, preview, selectors, resume templates
│   │   ├── config/           # Client-side configuration
│   │   ├── constants/        # Template metadata and shared constants
│   │   ├── context/          # Resume editor state management
│   │   ├── pages/            # Application pages
│   │   └── services/         # API client calls
│   └── tests/                # Focused client tests and fixtures
├── server/
│   └── src/
│       ├── config/           # Database, provider, and vector-store configuration
│       ├── constants/        # Server-side constants and prompts
│       ├── controllers/      # HTTP request handlers
│       ├── models/           # Persistence models
│       ├── services/         # Resume, import, ATS, and RAG business logic
│       └── utils/            # Normalization and shared utilities
├── scripts/                  # Validation and repository utilities
├── docs/
│   └── system-architecture.svg
└── README.md
```

Some directories or files may differ by branch; use the checked-out repository as the source of truth.

## Local Development

### 1. Prerequisites

- Node.js and npm
- A MongoDB instance or connection string for the backend
- Gemini credentials for workflows that use AI extraction or generation
- Google sign-in configuration if Google authentication is enabled

### 2. Configure environment files

Create local environment files from the repository examples:

- Copy `server/.env.example` to `server/.env`.
- Copy `client/.env.example` to `client/.env`.

Populate only the variables required by the features you intend to run. Use the example files as the authority for the exact variable names and expected values. Configure database access, authentication, AI provider credentials, the frontend API base URL, and the allowed frontend origin as applicable.

**Never commit `.env` files, access tokens, passwords, private keys, or API credentials.**

### 3. Install dependencies

Use the package manager and lockfiles present in your checkout. Install dependencies from the project root and/or the `client` and `server` folders as indicated by the relevant `package.json` files. Do not mix package managers in the same working tree.

### 4. Start the development environment

From the project root:

```bash
npm run dev
```

The documented root development script starts the API on port `5000` and the Vite frontend together. Press `Ctrl+C` to stop both services.

To run one service intentionally, use the root scripts if present:

```bash
npm run dev:server
npm run dev:client
```

Resume upload/import flows require the API to be running; starting Vite alone is not sufficient.

## Resume Import Flow

1. Open the resume editor and choose **Upload Existing Resume**.
2. Select a supported PDF, DOCX, TXT, or JSON file.
3. The upload is validated and parsed. Gemini extraction is used when required by the configured import workflow.
4. Extracted fields are validated and mapped to the existing resume section model.
5. Review and correct the information in the editor.
6. Save using the normal resume save flow. Uploading a file does not necessarily mean the resume has already been persisted.

## Testing and Validation

Before committing a change:

1. Run the relevant test or validation command configured by the project.
2. Start the application and test the affected workflow manually.
3. For template changes, verify both the on-screen preview and downloaded PDF.
4. For API/import changes, inspect browser Network requests and backend logs.
5. Confirm that the resume still saves and reloads without losing section data.

The repository includes focused tests under `client/tests/` and utility scripts under `scripts/`. Check each script and the relevant `package.json` before assuming a command is available or part of the default build.

## Deployment Checklist

- [ ] Configure production environment variables in the hosting platform.
- [ ] Set the backend's allowed frontend origin to the production frontend URL.
- [ ] Point the frontend API base URL to the deployed backend URL.
- [ ] Configure MongoDB network access and production credentials.
- [ ] Configure Gemini and Google sign-in as required by enabled features.
- [ ] Confirm that no secrets or local-only files are included in the commit.
- [ ] Deploy the backend and frontend according to the hosting configuration.
- [ ] Verify sign-in, resume creation/editing, save/reload, import, template preview, ATS scoring, and PDF export in production.

## Security

- Keep secrets out of source control and frontend bundles.
- Use production-specific credentials and restrictive origin configuration.
- Validate uploaded files and treat extracted content as untrusted input.
- Review staged files before every commit, especially environment files, local agent settings, generated caches, and temporary artifacts.
- Do not expose server-only AI credentials in client-side configuration.

## Troubleshooting

### Upload or import fails

- Confirm that the backend is running and reachable.
- Inspect the browser Network panel for the failing request, response status, and response body.
- Check backend logs for file parsing, validation, database, or AI-provider errors.
- Confirm the accepted file type/size and required environment variables.

### The frontend loads but API requests fail

- Verify that the frontend API base URL points to the correct backend.
- Confirm that the backend is running on the configured port and that the allowed origin matches the frontend URL.
- In production, check the deployed frontend and backend URLs and their HTTPS configuration.

### AI-assisted features are unavailable

- Verify the relevant backend credential and provider configuration.
- Review provider quota/availability errors in the backend logs.
- Check whether the workflow can operate without AI/RAG context or requires the provider to be configured.

### Research/publication data does not appear in a template

- Verify that the saved resume response contains the expected publication data.
- Check the section normalizer and the template's render condition.
- Test both preview and PDF export after correcting the actual data-flow issue; avoid hardcoding user content into a template component.

## Contributing

1. Create a focused branch for the change.
2. Keep the change scoped to the intended feature.
3. Run relevant tests and validation scripts.
4. Verify the affected user workflow and generated PDF where applicable.
5. Commit with a clear, specific message.
