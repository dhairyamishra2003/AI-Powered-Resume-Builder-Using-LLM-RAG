// ============================================
// chroma.config.js - In-Memory Vector Store
// ============================================
// Implements a lightweight in-memory vector store
// using Gemini Embedding API for semantic search.
// No external server needed — runs fully in-process.
// ============================================

import { GoogleGenAI } from '@google/genai';

const EMBEDDING_MODEL = 'gemini-embedding-001';

let ai = null;
let vectorStore = null;

// Initialize the Gemini AI client for embeddings
const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

// Generate embedding for a single text
const embed = async (text) => {
  const response = await getAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  return response.embeddings[0].values;
};

// Generate embeddings for multiple texts (optimized to use a single API call for all texts)
const embedBatch = async (texts) => {
  if (texts.length === 0) return [];
  const response = await getAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
  });
  return response.embeddings.map((e) => e.values);
};

// Cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// In-memory vector store class
class InMemoryVectorStore {
  constructor() {
    this.documents = []; // { id, content, metadata, embedding }
  }

  // Add documents with their embeddings
  async add(ids, contents, metadatas) {
    const embeddings = await embedBatch(contents);
    for (let i = 0; i < ids.length; i++) {
      this.documents.push({
        id: ids[i],
        content: contents[i],
        metadata: metadatas[i],
        embedding: embeddings[i],
      });
    }
  }

  // Load pre-embedded documents directly (e.g. from local file cache)
  load(cachedDocs) {
    this.documents = cachedDocs;
  }

  // Get all documents in the store (used for saving cache)
  getAll() {
    return this.documents;
  }

  // Query the store for similar documents
  async query(queryText, nResults = 5, whereFilter = null) {
    const queryEmbedding = await embed(queryText);

    let candidates = this.documents;

    // Apply metadata filter if provided
    if (whereFilter) {
      candidates = candidates.filter((doc) => {
        if (whereFilter.type) {
          return doc.metadata.type === whereFilter.type.$eq;
        }
        if (whereFilter.role) {
          return doc.metadata.role === whereFilter.role.$eq;
        }
        if (whereFilter['$and']) {
          return whereFilter['$and'].every((condition) => {
            const [key] = Object.keys(condition);
            return doc.metadata[key] === condition[key].$eq;
          });
        }
        return true;
      });
    }

    // Calculate similarity scores
    const scored = candidates.map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // Sort by similarity (descending) and take top N
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, nResults);
  }

  // Get total document count
  count() {
    return this.documents.length;
  }
}

// Initialize the vector store
const initializeVectorStore = () => {
  if (!vectorStore) {
    vectorStore = new InMemoryVectorStore();
    console.log('In-memory vector store initialized.');
  }
  return vectorStore;
};

// Get the active vector store instance
const getVectorStore = () => {
  if (!vectorStore) {
    throw new Error('Vector store not initialized. Call initializeVectorStore() first.');
  }
  return vectorStore;
};

export { initializeVectorStore, getVectorStore, embed, embedBatch };
