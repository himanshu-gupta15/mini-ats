import 'dotenv/config';
import { connectDB, disconnectDB } from './db.js';
import { seedCandidates } from './seedData.js';

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. The in-memory DB is auto-seeded on server start; set MONGO_URI to seed a persistent database.');
  process.exit(1);
}
await connectDB();
const n = await seedCandidates(Number(process.argv[2]) || 60);
console.log(`Seeded ${n} candidates`);
await disconnectDB();
