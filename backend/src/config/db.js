import mongoose from 'mongoose';

export async function connectDb(mongodbUri) {
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongodbUri);
  console.log('MongoDB connected');
}

