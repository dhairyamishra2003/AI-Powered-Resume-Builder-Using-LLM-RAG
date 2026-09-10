# Project Specification: AI-Powered Resume Builder using LLM & RAG

## 1. Project Overview
The **AI-Powered Resume Builder** is a modern MERN (MongoDB, Express, React, Node.js) web application designed to help job seekers create, optimize, and evaluate resumes. By integrating **Large Language Models (LLM)** and **Retrieval-Augmented Generation (RAG)**, the application acts as an interactive resume consultant that matches candidate profiles against industry-standard best practices, keyword taxonomies, and ATS (Applicant Tracking System) benchmarks.

---

## 2. System Architecture

```
                                 [ Client (React + Vite) ]
                                            │
                                            ▼ (HTTP Requests)
                                  [ Express Server ]
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      [ MongoDB Database ]         [ LangGraph Agent ]         [ In-Memory Vector Store ]
     (User/Resume/Chat Logs)       (Chat Model + Tools)         (Gemini Embeddings RAG)
                                            │                            │
                                            └──────────────┬─────────────┘
                                                           ▼
                                                   [ Gemini AI API ]
```

---

## 3. Technology Stack

### Frontend (Client)
- **Core Framework:** React 19 (JavaScript) with Vite
- **Styling:** Tailwind CSS v4 (Glassmorphism & 3D Interactive Design System)
- **Icons:** React Icons (`react-icons/hi2`)
- **Routing:** React Router DOM v7
- **Authentication:** Google OAuth SDK Integration

### Backend (Server)
- **Runtime Environment:** Node.js (ES Modules syntax)
- **Web Framework:** Express.js (v5)
- **Database ODM:** Mongoose (MongoDB)
- **File Upload:** Multer (for PDF resume parser)
- **AI Agent Framework:** LangChain JS & LangGraph JS
- **AI Provider:** Google Gemini API (`@google/genai` & `@langchain/google-genai`)

---

## 4. Database Schema Specification

### User Model (`User.model.js`)
Stores account information for local and Google OAuth authenticated users.
- `name`: String (Required)
- `email`: String (Required, Unique)
- `password`: String (Optional, for OAuth users)
- `googleId`: String (Optional)
- `createdAt` / `updatedAt`: Timestamps

### Resume Model (`Resume.model.js`)
Maintains structured resume data, target roles, job descriptions, and ATS analysis results.
- `userId`: Schema.Types.ObjectId (Reference to User)
- `title`: String (Default: "Untitled Resume")
- `templateId`: String (classic, modern, creative, minimal, executive)
- `targetRole`: String
- `jobDescription`: String
- `sections`:
  - `personalInfo`: `{ fullName, email, phone, location, linkedIn, portfolio }`
  - `summary`: `{ text }`
  - `experience`: Array of `{ company, role, startDate, endDate, current, bullets }`
  - `education`: Array of `{ institution, degree, field, startDate, endDate, gpa }`
  - `skills`: `{ technical: [], soft: [], languages: [] }`
  - `projects`: Array of `{ name, description, technologies: [], link }`
  - `certifications`: Array of `{ name, issuer, date, link }`
- `atsScore`:
  - `overall`: Number (0 - 100)
  - `breakdown`: `{ keywordMatch, formatting, sectionCompleteness, quantification, actionVerbs, length, contactInfo }`
  - `missingKeywords`: Array of Strings
  - `suggestions`: Array of Strings

### ChatHistory Model (`ChatHistory.model.js`)
Persists the messaging logs between the user and the LangGraph Interview Agent.
- `resumeId`: Schema.Types.ObjectId (Reference to Resume)
- `userId`: Schema.Types.ObjectId (Reference to User)
- `agentType`: String (Default: "interview")
- `messages`: Array of `{ role: 'user'|'assistant', content: String, timestamp: Date }`
- `metadata`: `{ sectionTargeted: String }`

---

## 5. RAG (Retrieval-Augmented Generation) Specification

To provide domain-specific and highly accurate guidance, the server includes a custom **In-Memory Vector Store** populated with a resume writing knowledge base.

### Vector Store Configuration (`chroma.config.js`)
- **Embedding Model:** `gemini-embedding-001` (3072 dimensions)
- **Vector Index:** Custom JavaScript memory array using **Cosine Similarity** for matching:
  $$\text{Similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
- **Ingestion Batching:** Optimised to embed all documents in **exactly 1 API request** on initial setup, preventing 429 quota exhaustion.
- **Caching (`vector-cache.json`):** Pre-calculated vector embeddings are stored locally after the first generation. Subsequent server startups load vectors instantly in **0 milliseconds** with **0 API calls**.

### Knowledge Base Database (`knowledge-base.json`)
Contains 68 flattened documents categorised into:
- **Resume Bullets:** Action-oriented STAR-method experience descriptions for 15+ tech roles.
- **Industry Keywords & Synonyms:** Standardized skill terms and synonym mappings (e.g., "CI/CD" ↔ "Continuous Integration").
- **ATS Best Practices:** Rules on formatting, length, metrics, and parsing constraints.
- **Action Verbs:** Classified lists of impactful verbs (leadership, creative, technical, etc.).
- **Skill Taxonomies:** Hierarchical lists of mandatory skills by subfield.
- **Professional Summaries:** High-impact pitch examples for different career stages.

### Context Retrieval Pipeline (`rag.service.js`)
Six specialized functions semantic-search the vector database to augment LLM prompts:
1. `retrieveBulletContext()`: Combines similar role bullets + action verbs.
2. `retrieveAtsContext()`: Extracts formatting rules, industry keywords, and keyword synonyms.
3. `retrieveSummaryContext()`: Fetches summary examples and role-specific skills.
4. `retrieveReviewContext()`: Grabs ATS score limits and qualitative review criteria.
5. `retrieveJobMatchContext()`: Fetches synonym mappings and required taxonomies.
6. `retrieveSkillGapContext()`: Pulls required technologies based on the target job profile.

---

## 6. LangGraph Agent Architecture (`agent.service.js`)

The AI assistant utilizes a LangGraph React Agent loop running on **`gemini-2.0-flash-lite`** to support structured, conversational resume creation.

### Toolbelt Specification (`agent.tools.js`)
The agent is equipped with five dynamic tools:
1. **`update_resume_section`**: Saves extracted information (experience, education, skills, projects) back to MongoDB.
2. **`generate_star_bullets`**: Calls the internal AI service to rewrite raw experiences into metrics-driven STAR bullets.
3. **`get_ats_score`**: Runs the 10-metric algorithmic scorer and returns overall scores + recommendations.
4. **`generate_summary`**: Generates a professional summary statement based on sections filled.
5. **`search_knowledge_base`**: Searches the RAG vector store for specific resume advice on demand.

---

## 7. UI/UX Style Guide

The frontend features a premium, state-of-the-art interactive style guide defined in `App.css` and `HomePage/index.css`.
- **Primary Color:** Deep Indigo (`#1e1b4b`)
- **Accent Color:** Violet / Purple Gradient (`#7c3aed` to `#6d28d9`)
- **Layout Theme:** Frosted Glassmorphism (semi-transparent backgrounds with `backdrop-filter: blur(12px)` and thin purple borders).
- **Backgrounds:** Smooth radial flows (soft violet and warm gold accent glows overlaying the layout).
- **3D Card Transitions:** Home action cards feature 3D depth perspective (`perspective: 1000px`). Hovering over cards triggers a 3D lift (`translateY(-12px)`), rotation tilts, and an icon/text pop-out offset (`translateZ`).
- **Custom Elements:** Minimalist purple scrollbars, custom focused inputs with glowing outlines, and floating shadow states on buttons.
