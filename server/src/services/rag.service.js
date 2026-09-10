// ============================================
// rag.service.js - Retrieval-Augmented Generation
// ============================================
// Handles knowledge base ingestion into the vector
// store and semantic retrieval for enhancing AI
// prompts with relevant context.
// ============================================

import { readFile, writeFile, access } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeVectorStore, getVectorStore } from '../config/chroma.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let isInitialized = false;

// ---- Knowledge Base Ingestion ----

// Flatten the knowledge base JSON into individual documents for embedding
const flattenKnowledgeBase = (kb) => {
  const documents = [];

  // Resume bullet examples
  if (kb.resume_bullets) {
    for (const item of kb.resume_bullets) {
      documents.push({
        id: `bullet-${item.role.toLowerCase().replace(/\s+/g, '-')}-${documents.length}`,
        content: `[${item.role}] ${item.content}`,
        metadata: {
          category: item.category,
          role: item.role,
          tags: (item.tags || []).join(','),
          type: 'resume_bullet',
        },
      });
    }
  }

  // Industry keywords
  if (kb.industry_keywords) {
    for (const item of kb.industry_keywords) {
      documents.push({
        id: `keywords-${item.role.toLowerCase().replace(/\s+/g, '-')}-${documents.length}`,
        content: item.content,
        metadata: {
          category: item.category,
          role: item.role,
          tags: (item.tags || []).join(','),
          type: 'industry_keywords',
        },
      });
      // Synonyms as a separate document for better retrieval
      if (item.synonyms) {
        const synonymText = Object.entries(item.synonyms)
          .map(([term, syns]) => `${term} is also known as: ${syns.join(', ')}`)
          .join('. ');
        documents.push({
          id: `synonyms-${item.role.toLowerCase().replace(/\s+/g, '-')}-${documents.length}`,
          content: `Keyword synonyms for ${item.role}: ${synonymText}`,
          metadata: {
            category: 'synonyms',
            role: item.role,
            tags: 'synonyms,keywords',
            type: 'synonyms',
          },
        });
      }
    }
  }

  // ATS best practices
  if (kb.ats_best_practices) {
    for (const item of kb.ats_best_practices) {
      documents.push({
        id: `ats-${documents.length}`,
        content: item.content,
        metadata: {
          category: item.category,
          role: 'all',
          tags: (item.tags || []).join(','),
          type: 'ats_practice',
        },
      });
    }
  }

  // Action verbs
  if (kb.action_verbs) {
    for (const item of kb.action_verbs) {
      documents.push({
        id: `verbs-${documents.length}`,
        content: item.content,
        metadata: {
          category: item.category,
          role: 'all',
          tags: (item.tags || []).join(','),
          type: 'action_verbs',
        },
      });
    }
  }

  // Skill taxonomies
  if (kb.skill_taxonomies) {
    for (const item of kb.skill_taxonomies) {
      documents.push({
        id: `skills-${documents.length}`,
        content: item.content,
        metadata: {
          category: item.category,
          role: 'all',
          tags: (item.tags || []).join(','),
          type: 'skill_taxonomy',
        },
      });
    }
  }

  // Summary examples
  if (kb.summary_examples) {
    for (const item of kb.summary_examples) {
      documents.push({
        id: `summary-${item.role.toLowerCase().replace(/\s+/g, '-')}-${documents.length}`,
        content: `[${item.role} Summary Example] ${item.content}`,
        metadata: {
          category: item.category,
          role: item.role,
          tags: (item.tags || []).join(','),
          type: 'summary_example',
        },
      });
    }
  }

  return documents;
};

// Load knowledge base and ingest into vector store
export const initializeKnowledgeBase = async () => {
  if (isInitialized) {
    console.log('Knowledge base already initialized, skipping.');
    return;
  }

  try {
    console.log('Initializing RAG knowledge base...');

    // 1. Initialize vector store
    const store = initializeVectorStore();

    // 2. Check if already populated
    if (store.count() > 0) {
      console.log(`Knowledge base already has ${store.count()} documents. Skipping ingestion.`);
      isInitialized = true;
      return;
    }

    const cachePath = join(__dirname, '..', 'data', 'vector-cache.json');
    let cacheExists = false;
    try {
      await access(cachePath);
      cacheExists = true;
    } catch {
      cacheExists = false;
    }

    // 3. Load from cache if it exists (0 API calls, bypasses 429 quota limits)
    if (cacheExists) {
      console.log('Found vector cache. Loading pre-computed embeddings...');
      const cacheRaw = await readFile(cachePath, 'utf-8');
      const cachedDocs = JSON.parse(cacheRaw);
      store.load(cachedDocs);
      console.log(`✅ RAG knowledge base loaded from cache: ${cachedDocs.length} documents loaded instantly!\n`);
      isInitialized = true;
      return;
    }

    console.log('\n⚠️ No vector cache found. Skipping automatic embedding to prevent API rate limits (429).');
    console.log('👉 To enable RAG features, run: node generate-cache.js');
    console.log('👉 Standard AI chat and prompts will still work perfectly!\n');
    isInitialized = false;
    return;
  } catch (error) {
    console.error('Failed to initialize knowledge base:', error.message);
    // Non-fatal: app can still work without RAG
    console.warn('RAG features will be unavailable. App will use standard LLM prompts.');
  }
};

// ---- Retrieval ----

// Retrieve relevant context from vector store for a given query
export const retrieveContext = async (query, options = {}) => {
  if (!isInitialized) {
    return { documents: [], context: '' };
  }

  try {
    const store = getVectorStore();
    const { topK = 5, category = null, role = null } = options;

    // Build where filter
    let whereFilter = null;
    if (category && role) {
      whereFilter = {
        '$and': [
          { type: { $eq: category } },
          { role: { $eq: role } },
        ],
      };
    } else if (category) {
      whereFilter = { type: { $eq: category } };
    } else if (role) {
      whereFilter = { role: { $eq: role } };
    }

    const results = await store.query(query, topK, whereFilter);

    const documents = results.map((doc) => ({
      content: doc.content,
      metadata: doc.metadata,
      score: doc.score,
    }));

    // Build context string for prompt injection
    const context = documents
      .map((d, i) => `[${i + 1}] ${d.content}`)
      .join('\n');

    return { documents, context };
  } catch (error) {
    console.error('RAG retrieval failed:', error.message);
    return { documents: [], context: '' };
  }
};

// Retrieve context specifically for bullet point generation
export const retrieveBulletContext = async (role, rawExperience, targetRole) => {
  const query = `${role || ''} ${rawExperience || ''} ${targetRole || ''}`.trim();
  const [bulletExamples, actionVerbs] = await Promise.all([
    retrieveContext(query, { topK: 5, category: 'resume_bullet' }),
    retrieveContext(query, { topK: 2, category: 'action_verbs' }),
  ]);
  return `SIMILAR HIGH-QUALITY RESUME BULLETS:\n${bulletExamples.context}\n\nRECOMMENDED ACTION VERBS:\n${actionVerbs.context}`;
};

// Retrieve context for ATS scoring
export const retrieveAtsContext = async (targetRole, jobDescription) => {
  const query = `${targetRole || ''} ${jobDescription || ''}`.trim();
  const [atsPractices, keywords, synonyms] = await Promise.all([
    retrieveContext(query, { topK: 3, category: 'ats_practice' }),
    retrieveContext(query, { topK: 2, category: 'industry_keywords' }),
    retrieveContext(query, { topK: 2, category: 'synonyms' }),
  ]);
  return `ATS BEST PRACTICES:\n${atsPractices.context}\n\nINDUSTRY KEYWORDS:\n${keywords.context}\n\nKEYWORD SYNONYMS:\n${synonyms.context}`;
};

// Retrieve context for summary generation
export const retrieveSummaryContext = async (targetRole) => {
  const query = `professional summary for ${targetRole || 'general'} position`;
  const [summaryExamples, keywords] = await Promise.all([
    retrieveContext(query, { topK: 3, category: 'summary_example' }),
    retrieveContext(query, { topK: 2, category: 'industry_keywords' }),
  ]);
  return `EXAMPLE PROFESSIONAL SUMMARIES:\n${summaryExamples.context}\n\nROLE-SPECIFIC KEYWORDS:\n${keywords.context}`;
};

// Retrieve context for resume review
export const retrieveReviewContext = async (targetRole) => {
  const query = `resume review best practices for ${targetRole || 'general'}`;
  const [atsPractices, bulletExamples] = await Promise.all([
    retrieveContext(query, { topK: 3, category: 'ats_practice' }),
    retrieveContext(query, { topK: 3, category: 'resume_bullet' }),
  ]);
  return `REVIEW CRITERIA & BEST PRACTICES:\n${atsPractices.context}\n\nHIGH-QUALITY BULLET EXAMPLES FOR COMPARISON:\n${bulletExamples.context}`;
};

// Retrieve context for job matching
export const retrieveJobMatchContext = async (targetRole, jobDescription) => {
  const query = `${targetRole || ''} job matching ${jobDescription || ''}`.trim();
  const [keywords, synonyms, skills] = await Promise.all([
    retrieveContext(query, { topK: 2, category: 'industry_keywords' }),
    retrieveContext(query, { topK: 2, category: 'synonyms' }),
    retrieveContext(query, { topK: 2, category: 'skill_taxonomy' }),
  ]);
  return `INDUSTRY KEYWORDS:\n${keywords.context}\n\nKEYWORD SYNONYMS (match these as equivalent):\n${synonyms.context}\n\nSKILL TAXONOMY:\n${skills.context}`;
};

// Retrieve context for skill gap detection
export const retrieveSkillGapContext = async (targetRole, jobDescription) => {
  const query = `required skills for ${targetRole || 'general'} ${jobDescription || ''}`.trim();
  const [skills, keywords] = await Promise.all([
    retrieveContext(query, { topK: 3, category: 'skill_taxonomy' }),
    retrieveContext(query, { topK: 2, category: 'industry_keywords' }),
  ]);
  return `SKILL TAXONOMIES (related skills grouped together):\n${skills.context}\n\nINDUSTRY-STANDARD KEYWORDS:\n${keywords.context}`;
};

// General knowledge base search (for chat agent tool)
export const searchKnowledgeBase = async (query, topK = 5) => {
  const result = await retrieveContext(query, { topK });
  return result.context || 'No relevant information found in knowledge base.';
};
