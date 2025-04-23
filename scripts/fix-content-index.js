// This script drops the old unique index on tmdbId and creates a compound unique index on (tmdbId, contentType)
// Usage: node scripts/fix-content-index.js

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixIndexes() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('contents');
    // List indexes
    const indexes = await collection.indexes();
    // Drop old unique index on tmdbId if exists
    const tmdbIdIndex = indexes.find(idx => idx.key && idx.key.tmdbId === 1 && idx.unique);
    if (tmdbIdIndex) {
      console.log('Dropping old unique index on tmdbId:', tmdbIdIndex.name);
      await collection.dropIndex(tmdbIdIndex.name);
    } else {
      console.log('No unique index on tmdbId found, skipping drop.');
    }
    // Create compound unique index
    console.log('Creating compound unique index on (tmdbId, contentType)...');
    await collection.createIndex({ tmdbId: 1, contentType: 1 }, { unique: true });
    console.log('Compound unique index created successfully.');
  } catch (err) {
    console.error('Error updating indexes:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixIndexes();
