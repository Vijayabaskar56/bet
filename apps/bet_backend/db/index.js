// import CompressionType from '@aws-sdk/client-s3'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config();
mongoose.set('strictQuery', false);



mongoose.set('strictQuery', false);

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    // Use a proper database name for MongoDB Atlas
    await mongoose.connect(process.env.DB_CONNECTION_URL);
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1); // Exit process with failure code
  }
};

// Initialize connection
connectToDatabase();

// Use the default connection (already connected to the specific database)
const db = mongoose.connection;

const objectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }
  return mongoose.Types.ObjectId(id);
}
// Export mongoose and other utilities
export {
  mongoose,
  db,
  objectId,
  connectToDatabase,
};
