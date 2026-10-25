# AI-Powered Resume Builder

A full-stack resume builder with editable templates, deterministic ATS scoring,
Google/email authentication, and AI-assisted import of PDF, DOCX, TXT, and JSON resumes.

## Setup

Create `server/.env` from `server/.env.example` and `client/.env` from
`client/.env.example`. Configure MongoDB, JWT, Gemini, Google Sign-In, and
the allowed frontend origin. Never commit credentials.

From the project root (or `client`), run `npm run dev`. On Windows this starts
the API on port 5000 and Vite together, and stops both with `Ctrl+C`. Do not
start Vite by itself: resume uploads require the API. To run one service
intentionally, use `npm run dev:server` or `npm run dev:client` from the
project root.

## Resume import

In the existing resume editor, choose **Upload Existing Resume**. The upload is
validated, parsed in memory, extracted into structured sections by Gemini when
needed, validated again, and mapped into the existing editable form. Nothing is
saved until the normal resume save flow runs.

## Performance diagnostics

Development server logs include HTTP and ATS timing. ATS results are safely
cached only for an exact hash of resume sections, job description, target role,
and the ATS cache version; changed inputs receive a new score.
