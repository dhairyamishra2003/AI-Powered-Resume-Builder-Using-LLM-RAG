# AI-Powered Resume Builder

## LinkedIn Integration

### Purpose

The LinkedIn integration lets an authenticated user import authorized LinkedIn profile information into an existing resume, review the imported fields, edit them, and confirm before saving.

### OAuth 2.0 / OpenID Connect Flow

1. The React resume builder calls `GET /api/linkedin/auth?resumeId=...`.
2. The backend creates a signed OAuth `state` value tied to the current user and resume.
3. The user authorizes the app on LinkedIn.
4. LinkedIn redirects to `GET /api/linkedin/callback`.
5. The backend validates `state`, exchanges the authorization code for an access token, and calls LinkedIn's OpenID Connect user info endpoint.
6. The backend redirects back to the resume builder with a short-lived signed import token.
7. The frontend loads an import preview through `GET /api/linkedin/profile`.
8. The user edits and confirms the fields.
9. The frontend calls `POST /api/linkedin/import`, and the backend saves the selected fields into the existing Resume document.

### Required Environment Variables

Set these on the backend only:

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/linkedin/callback
CLIENT_URL=http://localhost:5173
JWT_SECRET=
```

Do not expose `LINKEDIN_CLIENT_SECRET` to React or any `VITE_` environment variable.

### LinkedIn Application Configuration

Create a LinkedIn developer application and enable Sign In with LinkedIn using OpenID Connect. Add the backend callback URL from `LINKEDIN_REDIRECT_URI` as an authorized redirect URL.

### Available Profile Fields

This implementation requests only these scopes:

```text
openid profile email
```

With those scopes, LinkedIn may return identity/contact fields such as subject ID, name, email, profile picture, and locale. Returned fields can vary by account, app configuration, and granted permissions.

### Data Mapping

LinkedIn data is mapped only when it exists in the authorized response:

```text
LinkedIn name       -> sections.personalInfo.fullName
LinkedIn email      -> sections.personalInfo.email
LinkedIn profile URL -> sections.personalInfo.linkedIn, when available
```

The import also records minimal metadata on the Resume document:

```js
linkedin: {
  connected: Boolean,
  linkedinId: String,
  lastImportedAt: Date
}
```

### Security Considerations

The backend performs all LinkedIn token exchange and profile requests. OAuth `state` is validated to protect against CSRF. LinkedIn access tokens are not stored in MongoDB and are not returned to the frontend. The import preview uses a short-lived signed token, and the final import is still validated against the authenticated user and selected resume.

### Limitations

Basic OpenID Connect scopes do not provide detailed work experience, education, skills, certifications, or complete resume history. The app does not scrape LinkedIn pages and does not use unofficial LinkedIn scraping libraries.

### Future Work

Richer profile import, including detailed experience, education, skills, and certifications, depends on additional LinkedIn API permissions or partner access. Those fields should be implemented only when the official LinkedIn API grants the required permissions, and they should remain isolated from the basic OpenID Connect import flow.

## APAAR / DigiLocker Academic Data Integration

This project includes a future-scope prototype for importing verified academic details into `Resume.sections.education[]` after a user authorizes DigiLocker/APAAR access. It does not scrape DigiLocker, APAAR, academic portals, or use APAAR ID as a direct record lookup key.

### Required Official API Access

Live use requires approved DigiLocker/API Setu requester access, or the applicable official NAD/academic verification flow for the organization. The app expects an OAuth-style authorization and consent flow where the user signs in with DigiLocker/Meri Pehchaan and grants consent for academic documents before the backend fetches any data.

### Environment Variables

Keep all credentials on the Node/Express server:

```env
DIGILOCKER_CLIENT_ID=your_official_client_id
DIGILOCKER_CLIENT_SECRET=your_official_client_secret
DIGILOCKER_REDIRECT_URI=http://localhost:5000/api/digilocker/callback
DIGILOCKER_API_BASE_URL=https://official-digilocker-or-apisetu-base-url

# Optional explicit endpoint overrides if the approved API provides exact URLs
DIGILOCKER_AUTH_URL=
DIGILOCKER_TOKEN_URL=
DIGILOCKER_ACADEMIC_URL=
```

### Flow

1. React calls `GET /api/digilocker/auth?resumeId=...`.
2. The backend validates the authenticated user and resume ownership.
3. The backend creates a signed OAuth `state` and redirects the user to the official authorization URL.
4. The user authenticates and grants consent in DigiLocker/APAAR.
5. DigiLocker redirects to `GET /api/digilocker/callback`.
6. The backend validates `state`, exchanges the code server-side, and fetches only consented academic data/documents.
7. The backend creates a short-lived import token containing normalized authorized records.
8. React loads `GET /api/digilocker/academic?resumeId=...&importToken=...`, shows a preview, and lets the user confirm.
9. React calls `POST /api/digilocker/import`; the backend saves only authorized selected records into `Resume.sections.education[]`.

### Data Mapping

Only fields actually returned by the authorized API response are mapped:

```text
institution       -> education.institution
degree            -> education.degree
field/program     -> education.field
start date        -> education.startDate
end/graduation    -> education.endDate
GPA/marks         -> education.gpa
```

Missing fields remain blank and editable manually. The Gemini/RAG pipeline must not generate factual academic data.

### Security Considerations

- Client secrets never leave the backend.
- OAuth `state` is signed and expires quickly.
- API routes require the existing JWT authentication except the provider callback.
- Resume ownership is validated before authorization and import.
- The backend does not trust academic records submitted directly by React; selected records must match the signed import token.
- Duplicate education records are skipped during import.
- API/token failures are returned as safe error messages.

### Limitations

This is integration-ready scaffolding. Live retrieval remains dependent on official DigiLocker/API Setu/NAD approval, exact production endpoints, allowed scopes/document types, and the data structure returned by the approved academic APIs. Without those credentials, the UI reports the integration as not configured.
