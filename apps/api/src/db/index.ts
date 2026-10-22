import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using MONGODB_URI environment variable.
 */
export async function connectDB(): Promise<void> {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/jojo-flora';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('[db] Connected successfully to MongoDB');
  } catch (error) {
    console.error('[db] MongoDB connection error:', error);
    // Don't crash immediately so tests and development can function with graceful messages
  }
}

/**
 * Disconnect from MongoDB instance (useful for tests or graceful shutdown).
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('[db] Disconnected from MongoDB');
  } catch (error) {
    console.error('[db] Error during MongoDB disconnection:', error);
  }
}
