import { MongoClient } from 'mongodb';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL is not set');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const collections = await db.collections();
  for (const col of collections) {
    const count = await col.countDocuments();
    console.log(`Collection: ${col.collectionName}, count: ${count}`);
    if (col.collectionName === 'contents') {
      const docs = await col.find({}).limit(5).toArray();
      console.log('Sample contents:', docs);
    }
    if (col.collectionName === 'content_genres') {
      const docs = await col.find({}).limit(5).toArray();
      console.log('Sample content_genres:', docs);
    }
    if (col.collectionName === 'genres') {
      const docs = await col.find({}).limit(5).toArray();
      console.log('Sample genres:', docs);
    }
  }
  await client.close();
}

main().catch(console.error);
