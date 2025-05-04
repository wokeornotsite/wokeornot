const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://taamshelbayit:taamshelbayit@wokeornot.28psz.mongodb.net/wokeornot?retryWrites=true&w=majority&appName=wokeornot";
const dbName = "wokeornot";
const collectionName = "reviews";
const indexName = "reviews_userId_contentId_key";

async function dropIndex() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // List indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);

    // Drop the unique index if it exists
    const exists = indexes.find(idx => idx.name === indexName);
    if (exists) {
      await collection.dropIndex(indexName);
      console.log(`Index "${indexName}" dropped successfully.`);
    } else {
      console.log(`Index "${indexName}" not found. Nothing to drop.`);
    }
  } catch (err) {
    console.error("Error dropping index:", err);
  } finally {
    await client.close();
  }
}

dropIndex();
