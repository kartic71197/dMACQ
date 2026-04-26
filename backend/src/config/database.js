// Import mongoose library
const mongoose = require('mongoose');

async function connectDB() {
  try {
    // Connect with mongoose
    const conn = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        // Connection pool size, keeps connections warm for high write throughput
        maxPoolSize: 10,
      }
    );
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    // Terminate Node.js process
    process.exit(1);
  }
}

module.exports = connectDB;
