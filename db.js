import mongoose from 'mongoose';

export async function connect(uri) {
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('[MongoDB] Connected');
}
