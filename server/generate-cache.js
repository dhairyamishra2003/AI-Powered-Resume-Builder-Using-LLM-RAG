// ============================================
// generate-cache.js - One-time Vector Embedding Generator
// ============================================
// Run this script once to pre-compute vector embeddings
// for the knowledge base. This creates vector-cache.json.
// ============================================

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EMBEDDING_MODEL = 'gemini-embedding-001';

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in your .env file');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

// Ingest and embed the knowledge base
const run = async () => {
  try {
    console.log('=== Vector Cache Generator ===\n');
    console.log('1. Loading knowledge base...');
    
    const kbPath = join(__dirname, 'src', 'data', 'knowledge-base.json');
    const kbRaw = await readFile(kbPath, 'utf-8');
    const kb = JSON.parse(kbRaw);

    const documents = [];

    // Flatten logic matching rag.service.js
    if (kb.resume_bullets) {
      kb.resume_bullets.forEach((item, idx) => {
        documents.push({
          id: `bullet-${item.role.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
          content: `[${item.role}] ${item.content}`,
          metadata: { category: item.category, role: item.role, tags: (item.tags || []).join(','), type: 'resume_bullet' },
        });
      });
    }

    if (kb.industry_keywords) {
      kb.industry_keywords.forEach((item, idx) => {
        documents.push({
          id: `keywords-${item.role.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
          content: item.content,
          metadata: { category: item.category, role: item.role, tags: (item.tags || []).join(','), type: 'industry_keywords' },
        });
        if (item.synonyms) {
          const synonymText = Object.entries(item.synonyms).map(([term, syns]) => `${term} is also known as: ${syns.join(', ')}`).join('. ');
          documents.push({
            id: `synonyms-${item.role.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
            content: `Keyword synonyms for ${item.role}: ${synonymText}`,
            metadata: { category: 'synonyms', role: item.role, tags: 'synonyms,keywords', type: 'synonyms' },
          });
        }
      });
    }

    if (kb.ats_best_practices) {
      kb.ats_best_practices.forEach((item, idx) => {
        documents.push({
          id: `ats-${idx}`,
          content: item.content,
          metadata: { category: item.category, role: 'all', tags: (item.tags || []).join(','), type: 'ats_practice' },
        });
      });
    }

    if (kb.action_verbs) {
      kb.action_verbs.forEach((item, idx) => {
        documents.push({
          id: `verbs-${idx}`,
          content: item.content,
          metadata: { category: item.category, role: 'all', tags: (item.tags || []).join(','), type: 'action_verbs' },
        });
      });
    }

    if (kb.skill_taxonomies) {
      kb.skill_taxonomies.forEach((item, idx) => {
        documents.push({
          id: `skills-${idx}`,
          content: item.content,
          metadata: { category: item.category, role: 'all', tags: (item.tags || []).join(','), type: 'skill_taxonomy' },
        });
      });
    }

    if (kb.summary_examples) {
      kb.summary_examples.forEach((item, idx) => {
        documents.push({
          id: `summary-${item.role.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
          content: `[${item.role} Summary Example] ${item.content}`,
          metadata: { category: item.category, role: item.role, tags: (item.tags || []).join(','), type: 'summary_example' },
        });
      });
    }

    console.log(`Prepared ${documents.length} documents for embedding.`);
    console.log('2. Requesting embeddings from Gemini API (in a single optimized request)...');

    const ai = getAI();
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: documents.map((doc) => doc.content),
    });

    console.log('3. Storing embeddings into cache structure...');
    const cachedDocuments = documents.map((doc, idx) => ({
      ...doc,
      embedding: response.embeddings[idx].values,
    }));

    const cachePath = join(__dirname, 'src', 'data', 'vector-cache.json');
    await writeFile(cachePath, JSON.stringify(cachedDocuments, null, 2), 'utf-8');

    console.log(`\n✅ Success! Vector cache saved to server/src/data/vector-cache.json.`);
    console.log('Restart your server to load RAG features instantly.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to generate vector cache:', error.message);
    process.exit(1);
  }
};

run();
