const { ChromaClient } = require("chromadb");

class VectorMemory {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log("Initializing ChromaDB client...");
      this.client = new ChromaClient({
        path: process.env.CHROMA_DB_PATH || "./chroma_db",
      });

      // Test connection
      await this.client.heartbeat();
      console.log("SUCCESS: ChromaDB connection successful");
      this.initialized = true;
      return true;
    } catch (error) {
      console.error(
        "ERROR: Vector memory initialization failed:",
        error.message
      );
      return false;
    }
  }

  async getOrCreateCollection(name) {
    if (!this.initialized) {
      await this.initialize();
    }
    try {
      const collection = await this.client.getOrCreateCollection({
        name: name,
      });
      console.log(
        "SUCCESS: Collection '" + name + "' created/retrieved successfully"
      );
      return collection;
    } catch (error) {
      console.error(
        "ERROR: Failed to get/create collection '" + name + "':",
        error.message
      );
      throw error;
    }
  }

  async addVectors(collectionName, embeddings, metadatas, ids) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      await collection.add({
        embeddings: embeddings,
        metadatas: metadatas,
        ids: ids,
      });
      console.log(
        "SUCCESS: Added " +
          embeddings.length +
          " vectors to collection '" +
          collectionName +
          "'"
      );
    } catch (error) {
      console.error("ERROR: Failed to add vectors:", error.message);
      throw error;
    }
  }

  async queryVectors(collectionName, queryEmbeddings, nResults = 5) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      const results = await collection.query({
        queryEmbeddings: queryEmbeddings,
        nResults: nResults,
      });
      console.log(
        "SUCCESS: Query successful, found " + results.ids[0].length + " results"
      );
      return results;
    } catch (error) {
      console.error("ERROR: Failed to query vectors:", error.message);
      throw error;
    }
  }
}

// Export the class
module.exports = VectorMemory;
