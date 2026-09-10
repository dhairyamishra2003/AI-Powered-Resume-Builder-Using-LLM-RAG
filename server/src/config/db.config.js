// ============================================
// db.config.js - MongoDB Connection
// ============================================

import mongoose from 'mongoose'; // Mongoose ODM (MongoDB: Database Connection)

// Using async/await pattern (JS Essentials: Async/Await)
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  const localURI = 'mongodb://127.0.0.1:27017/ai-resume-builder';

  try {
    if (mongoURI) {
      const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return;
    }
  } catch (error) {
    console.warn(`⚠️ Remote MongoDB Atlas Connection Failed: ${error.message}`);
    console.log('🔄 Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/ai-resume-builder)...');
  }

  try {
    const localConn = await mongoose.connect(localURI, { serverSelectionTimeoutMS: 3000 });
    console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
  } catch (localErr) {
    console.error(`❌ MongoDB Connection Error: ${localErr.message}`);
    console.error('💡 TIP: If using MongoDB Atlas, whitelist your IP address in MongoDB Atlas dashboard (Network Access -> Add IP Address -> Allow Access from Anywhere 0.0.0.0/0 for dev).');
  }
};

export default connectDB;
