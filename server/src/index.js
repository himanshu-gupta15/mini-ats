import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './db.js';
import Candidate from './models/Candidate.js';
import { seedCandidates } from './seedData.js';

const PORT = process.env.PORT || 5001;

const { inMemory } = await connectDB();
await Candidate.syncIndexes();
if (inMemory && (await Candidate.estimatedDocumentCount()) === 0) {
  console.log(`Seeded ${await seedCandidates()} sample candidates into in-memory DB`);
}

const server = createApp().listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

const shutdown = async () => {
  server.close();
  await disconnectDB();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
