// ============================================
// server.js - Entry Point
// ============================================
// Loads environment variables, connects to MongoDB,
// initializes RAG knowledge base, and starts the
// Express server.
// ============================================

import "dotenv/config"; // Environment variable loading (Node.js: Server Setup)
import app from "./src/app.js";
import connectDB from "./src/config/db.config.js";
import { initializeKnowledgeBase } from "./src/services/rag.service.js";

const PORT = process.env.PORT || 5000;

// Using async/await pattern (JS Essentials: Async/Await)
const startServer = async () => {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 URL: http://localhost:${PORT}\n`);
    });

    await connectDB();

    // Initialize RAG knowledge base in background (non-blocking)
    initializeKnowledgeBase().catch((err) => {
      console.warn('⚠️ Knowledge base initialization warning:', err.message);
    });
    const shutdown = () => server.close(() => process.exit(0));
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
  }
};

startServer();
