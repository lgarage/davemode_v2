// init-chroma.js
const { ChromaClient } = require("chromadb");
const path = require("path");

async function initChromaDB() {
  try {
    console.log("Initializing ChromaDB...");

    // For local file-based ChromaDB
    const client = new ChromaClient({
      path: path.join(__dirname, "chroma_db"),
    });

    // Test the connection
    await client.heartbeat();
    console.log("✓ ChromaDB connection successful");

    // Create or get collection
    const collection = await client.getOrCreateCollection({
      name: "dave_mode_knowledge",
    });

    console.log("✓ ChromaDB collection ready");
    return client;
  } catch (error) {
    console.error("✗ ChromaDB initialization failed:", error.message);
    return null;
  }
}

// Run initialization
initChromaDB();
