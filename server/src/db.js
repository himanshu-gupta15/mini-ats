import mongoose from 'mongoose';

let memoryServer;

export async function connectDB() {
  let uri = process.env.MONGO_URI;
  let inMemory = false;
  if (!uri && process.env.NODE_ENV === 'production') {
    throw new Error('MONGO_URI must be set in production');
  }
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('mini-ats');
    inMemory = true;
  }
  await mongoose.connect(uri);
  console.log(`MongoDB connected (${inMemory ? 'in-memory' : uri.replace(/\/\/[^@]*@/, '//***@')})`);
  return { inMemory };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
