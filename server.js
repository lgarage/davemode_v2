// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const { GLMOrchestrator } = require("./lib/glm-orchestrator");
const { initDatabase } = require("./db/init");
const { TogetherSandbox } = require("./lib/together-sandbox");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;
const togetherSandbox = new TogetherSandbox();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dave-mode-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// File upload configuration
const upload = multer({ dest: "uploads/" });
// Initialize the GLM Orchestrator
const glmOrchestrator = new GLMOrchestrator();
// Initialize database on startup
initDatabase().catch(console.error);
// API Routes
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Analysis mode for existing code
app.post("/api/analyze", upload.array("files"), async (req, res) => {
  try {
    const { projectContext } = req.body;
    const files = req.files.map((file) => ({
      name: file.originalname,
      path: file.path,
      content: file.buffer.toString("utf8"),
    }));
    const result = await glmOrchestrator.analyzeExistingCode(
      files,
      projectContext
    );
    res.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Creation mode for new programs
app.post("/api/create", async (req, res) => {
  try {
    const { requirements, context } = req.body;
    const result = await glmOrchestrator.createProgram(requirements, context);
    res.json(result);
  } catch (error) {
    console.error("Creation error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Hybrid mode - add features to existing projects
app.post("/api/extend", upload.array("files"), async (req, res) => {
  try {
    const { newRequirements, projectContext } = req.body;
    const files = req.files.map((file) => ({
      name: file.originalname,
      path: file.path,
      content: file.buffer.toString("utf8"),
    }));
    const result = await glmOrchestrator.extendExistingProject(
      files,
      newRequirements,
      projectContext
    );
    res.json(result);
  } catch (error) {
    console.error("Extension error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Sandbox session endpoints
app.post("/api/sandbox/create", async (req, res) => {
  try {
    const { projectName, template = "node" } = req.body;
    const sandbox = await togetherSandbox.createSandbox(projectName, template);
    // Create a browser session for the user
    const userId = req.session.id || "anonymous";
    const session = await togetherSandbox.createBrowserSession(
      sandbox.id,
      userId
    );
    res.json({
      sandbox,
      session,
    });
  } catch (error) {
    console.error("Error creating sandbox:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sandbox/:sandboxId/hibernate", async (req, res) => {
  try {
    const { sandboxId } = req.params;
    await togetherSandbox.hibernateSandbox(sandboxId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error hibernating sandbox:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post(
  "/api/sandbox/:sandboxId/upload",
  upload.array("files"),
  async (req, res) => {
    try {
      const { sandboxId } = req.params;
      const files = req.files.map((file) => ({
        path: file.originalname,
        content: file.buffer.toString("utf8"),
      }));
      await togetherSandbox.uploadFiles(sandboxId, files);
      res.json({ success: true });
    } catch (error) {
      console.error("Error uploading files to sandbox:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.get("/api/sandbox/session/:sandboxId", async (req, res) => {
  try {
    const { sandboxId } = req.params;
    const userId = req.session.id || "anonymous";

    const session = await togetherSandbox.getBrowserSession(sandboxId, userId);

    if (!session) {
      // Try to create a new browser session for existing sandbox
      const sandbox = togetherSandbox.activeSandboxes.get(sandboxId);
      if (sandbox) {
        // Reconnect if sandbox exists but is hibernated
        if (sandbox.status === "hibernated" && sandbox.session === null) {
          // Note: In a real implementation, you'd need to reconnect to the sandbox
          // For now, we'll create a new browser session
          const newSession = await togetherSandbox.createBrowserSession(
            sandboxId,
            userId
          );
          return res.json(newSession);
        }
      }
      return res.status(404).json({ error: "Session not found" });
    } else {
      res.json(session);
    }
  } catch (error) {
    console.error("Error getting sandbox session:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sandbox/:sandboxId/execute", async (req, res) => {
  try {
    const { sandboxId } = req.params;
    const { command } = req.body;

    const result = await togetherSandbox.executeCommand(sandboxId, command);

    res.json(result);
  } catch (error) {
    console.error("Error executing command in sandbox:", error);
    res.status(500).json({ error: error.message });
  }
});
// Clarification endpoints
app.post("/api/clarification/response", async (req, res) => {
  try {
    const { interactionId, responses } = req.body;
    const result = await glmOrchestrator.submitClarificationResponse(
      interactionId,
      responses
    );
    res.json(result);
  } catch (error) {
    console.error("Clarification response error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/clarification/history/:projectType", async (req, res) => {
  try {
    const { projectType } = req.params;
    const history = await glmOrchestrator.memorySystem.getClarificationHistory(
      projectType
    );
    res.json(history);
  } catch (error) {
    console.error("Clarification history error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get learning patterns and agent performance
app.get("/api/learning", async (req, res) => {
  try {
    const patterns = await glmOrchestrator.getLearningPatterns();
    res.json(patterns);
  } catch (error) {
    console.error("Learning patterns error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Get project templates
app.get("/api/templates", async (req, res) => {
  try {
    const templates = await glmOrchestrator.getTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Templates error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Serve the main UI
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// Start server
app.listen(PORT, () => {
  console.log(`Dave Mode 2.0 server running on port ${PORT}`);
});
