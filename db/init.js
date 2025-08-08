// db/init.js
const { StructuredMemory } = require("../lib/structured-memory");
async function initDatabase() {
  try {
    console.log("Initializing database...");
    const structuredMemory = new StructuredMemory();
    await structuredMemory.initializeDatabase();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log("Database initialization complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database initialization failed:", error);
      process.exit(1);
    });
}
module.exports = { initDatabase };
