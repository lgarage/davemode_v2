# update-persistent-memory.ps1
Write-Host "Updating persistent-memory.js..." -ForegroundColor Green

$persistentMemoryPath = ".\lib\persistent-memory.js"
$backupPath = ".\lib\persistent-memory.js.backup"

# Create backup if it doesn't exist
if (-not (Test-Path $backupPath)) {
    Copy-Item $persistentMemoryPath $backupPath
    Write-Host "Created backup: $backupPath" -ForegroundColor Yellow
}

$newContent = @"
const { StructuredMemory } = require("./structured-memory");

// Try to import VectorMemory, but handle gracefully if it fails
let VectorMemory;
try {
  VectorMemory = require("./vector-memory");
} catch (error) {
  console.error("Warning: VectorMemory could not be loaded. Vector features will be disabled:", error.message);
  // Create a mock class to prevent crashes
  VectorMemory = class {
    constructor() {
      this.initialized = false;
    }
    async initialize() { return false; }
    async getOrCreateCollection() { throw new Error("VectorMemory not available"); }
    async addVectors() { throw new Error("VectorMemory not available"); }
    async queryVectors() { throw new Error("VectorMemory not available"); }
  };
}

class PersistentMemorySystem {
  constructor() {
    this.vectorMemory = new VectorMemory();
    this.structuredMemory = new StructuredMemory();
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialize both memory systems
      await this.structuredMemory.initialize();
      
      // Try to initialize vector memory, but don't fail if it doesn't work
      try {
        await this.vectorMemory.initialize();
      } catch (error) {
        console.error("Vector memory initialization failed, continuing without it:", error.message);
      }
      
      this.initialized = true;
      console.log("Persistent memory system initialized");
    } catch (error) {
      console.error("Error initializing persistent memory system:", error);
      throw error;
    }
  }
  
  async storeClarificationRequest(request) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Store in both vector and structured memory
      try {
        await this.vectorMemory.storeClarificationRequest(request);
      } catch (error) {
        console.error("Failed to store in vector memory:", error.message);
      }
      
      await this.structuredMemory.storeClarificationRequest(request);
      
      return true;
    } catch (error) {
      console.error("Error storing clarification request:", error);
      throw error;
    }
  }
  
  async getClarificationRequest(interactionId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get from structured memory
      return await this.structuredMemory.getClarificationRequest(interactionId);
    } catch (error) {
      console.error("Error getting clarification request:", error);
      throw error;
    }
  }
  
  async getClarificationHistory(projectType) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get from structured memory
      return await this.structuredMemory.getClarificationHistory(projectType);
    } catch (error) {
      console.error("Error getting clarification history:", error);
      throw error;
    }
  }
  
  async storeClarificationResponse(response) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Store in both vector and structured memory
      try {
        await this.vectorMemory.storeClarificationResponse(response);
      } catch (error) {
        console.error("Failed to store in vector memory:", error.message);
      }
      
      await this.structuredMemory.storeClarificationResponse(response);
      
      return true;
    } catch (error) {
      console.error("Error storing clarification response:", error);
      throw error;
    }
  }
  
  async storeInteraction(interaction) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Store in both vector and structured memory
      try {
        await this.vectorMemory.storeInteraction(interaction);
      } catch (error) {
        console.error("Failed to store in vector memory:", error.message);
      }
      
      await this.structuredMemory.storeInteraction(interaction);
      
      return true;
    } catch (error) {
      console.error("Error storing interaction:", error);
      throw error;
    }
  }
  
  async storePattern(pattern) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Store in both vector and structured memory
      try {
        await this.vectorMemory.storePattern(pattern);
      } catch (error) {
        console.error("Failed to store in vector memory:", error.message);
      }
      
      await this.structuredMemory.storePattern(
        pattern.patternType,
        pattern.projectType,
        pattern.patternData
      );
      
      return true;
    } catch (error) {
      console.error("Error storing pattern:", error);
      throw error;
    }
  }
  
  async storeProject(project) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Store in both vector and structured memory
      try {
        await this.vectorMemory.storeProject(project);
      } catch (error) {
        console.error("Failed to store in vector memory:", error.message);
      }
      
      await this.structuredMemory.storeProject(project);
      
      return true;
    } catch (error) {
      console.error("Error storing project:", error);
      throw error;
    }
  }
  
  async getRelevantContext(query, projectName) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get similar interactions from vector memory
      let similarInteractions = [];
      try {
        const result = await this.vectorMemory.findSimilarInteractions(query, 10);
        similarInteractions = result || [];
      } catch (error) {
        console.error("Failed to get similar interactions from vector memory:", error.message);
      }
      
      // Get project-specific patterns from structured memory
      const projectPatterns = await this.structuredMemory.getPatterns(
        null,
        projectName
      );
      
      // Get agent performance data from structured memory
      const agentStats = await this.structuredMemory.getAgentPerformance();
      
      // Synthesize context
      return this.synthesizeContext(
        similarInteractions,
        projectPatterns,
        agentStats
      );
    } catch (error) {
      console.error("Error getting relevant context:", error);
      throw error;
    }
  }
  
  async getLearningPatterns() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      return await this.structuredMemory.getLearningPatterns();
    } catch (error) {
      console.error("Error getting learning patterns:", error);
      throw error;
    }
  }
  
  async updateLearningPatterns(patterns) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      await this.structuredMemory.updateLearningPatterns(patterns);
    } catch (error) {
      console.error("Error updating learning patterns:", error);
      throw error;
    }
  }
  
  synthesizeContext(similarInteractions, projectPatterns, agentStats) {
    // Synthesize the different sources of context into a unified view
    const context = {
      similarInteractions: similarInteractions.map((interaction) => ({
        id: interaction.id,
        type: interaction.metadata.type,
        projectType: interaction.metadata.projectType,
        success: interaction.metadata.success,
        similarity: interaction.similarity,
        document: interaction.document,
      })),
      projectPatterns: projectPatterns.map((pattern) => ({
        patternType: pattern.patternType,
        projectType: pattern.projectType,
        successRate: pattern.successRate,
        uses: pattern.uses,
        patternData: pattern.patternData,
      })),
      agentPerformance: {},
    };
    
    // Organize agent performance by agent
    for (const stat of agentStats) {
      if (!context.agentPerformance[stat.agentName]) {
        context.agentPerformance[stat.agentName] = {
          totalUses: 0,
          totalSuccesses: 0,
          totalSuccessRate: 0,
          tasks: {},
        };
      }
      
      const agentPerf = context.agentPerformance[stat.agentName];
      agentPerf.totalUses += stat.uses;
      agentPerf.totalSuccesses += stat.successes;
      
      if (!agentPerf.tasks[stat.taskType]) {
        agentPerf.tasks[stat.taskType] = {
          uses: 0,
          successes: 0,
          successRate: 0,
          projectTypes: {},
        };
      }
      
      const taskPerf = agentPerf.tasks[stat.taskType];
      taskPerf.uses += stat.uses;
      taskPerf.successes += stat.successes;
      taskPerf.successRate = taskPerf.uses > 0 ? taskPerf.successes / taskPerf.uses : 0;
      
      if (!taskPerf.projectTypes[stat.projectType]) {
        taskPerf.projectTypes[stat.projectType] = {
          uses: 0,
          successes: 0,
          successRate: 0,
        };
      }
      
      const projectPerf = taskPerf.projectTypes[stat.projectType];
      projectPerf.uses += stat.uses;
      projectPerf.successes += stat.successes;
      projectPerf.successRate = projectPerf.uses > 0 ? projectPerf.successes / projectPerf.uses : 0;
    }
    
    // Calculate overall success rates
    for (const [agentName, agentPerf] of Object.entries(context.agentPerformance)) {
      agentPerf.totalSuccessRate = agentPerf.totalUses > 0 ? 
        agentPerf.totalSuccesses / agentPerf.totalUses : 0;
    }
    
    return context;
  }
}

module.exports = { PersistentMemorySystem };
"@

try {
    Set-Content -Path $persistentMemoryPath -Value $newContent
    Write-Host "persistent-memory.js updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error updating persistent-memory.js: $_" -ForegroundColor Red
    exit 1
}