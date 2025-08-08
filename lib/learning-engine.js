// lib/learning-engine.js
const { PersistentMemorySystem } = require("./persistent-memory");
class LearningEngine {
  constructor() {
    this.memorySystem = new PersistentMemorySystem();
    this.creationPatterns = {};
    this.analysisPatterns = {};
    this.hybridPatterns = {};
    // Load existing patterns from memory
    this.loadPatterns();
  }
  async loadPatterns() {
    try {
      const patterns = await this.memorySystem.getLearningPatterns();
      this.creationPatterns = patterns.creation || {};
      this.analysisPatterns = patterns.analysis || {};
      this.hybridPatterns = patterns.hybrid || {};
      console.log("Loaded learning patterns from memory");
    } catch (error) {
      console.error("Error loading learning patterns:", error);
    }
  }
  async recordCreationInteraction(projectType, strategy, result) {
    // Record a creation interaction for learning
    const interaction = {
      type: "creation",
      projectType,
      strategy,
      result,
      timestamp: new Date().toISOString(),
      success: result.validation ? result.validation.success : false,
    };
    // Store in memory
    await this.memorySystem.storeInteraction(interaction);
    // Update patterns
    await this.updateCreationPatterns(
      projectType,
      strategy,
      interaction.success
    );
  }
  async recordAnalysisInteraction(projectType, strategy, result) {
    // Record an analysis interaction for learning
    const interaction = {
      type: "analysis",
      projectType,
      strategy,
      result,
      timestamp: new Date().toISOString(),
      success: result.issues ? result.issues.length < 10 : true,
    };
    // Store in memory
    await this.memorySystem.storeInteraction(interaction);
    // Update patterns
    await this.updateAnalysisPatterns(
      projectType,
      strategy,
      interaction.success
    );
  }
  async recordHybridInteraction(projectType, strategy, result) {
    // Record a hybrid interaction for learning
    const interaction = {
      type: "hybrid",
      projectType,
      strategy,
      result,
      timestamp: new Date().toISOString(),
      success: result.validation ? result.validation.success : false,
    };
    // Store in memory
    await this.memorySystem.storeInteraction(interaction);
    // Update patterns
    await this.updateHybridPatterns(projectType, strategy, interaction.success);
  }
  async updateCreationPatterns(projectType, strategy, success) {
    if (!this.creationPatterns[projectType]) {
      this.creationPatterns[projectType] = {
        bestArchitect: strategy.architect,
        bestBuilder: strategy.builders[0] || strategy.architect,
        bestStyler: strategy.styler,
        successRate: 0,
        uses: 0,
        agentPerformance: {},
      };
    }
    const pattern = this.creationPatterns[projectType];
    pattern.uses += 1;
    // Update success rate
    pattern.successRate =
      (pattern.successRate * (pattern.uses - 1) + (success ? 1 : 0)) /
      pattern.uses;
    // Update agent performance
    if (!pattern.agentPerformance[strategy.architect]) {
      pattern.agentPerformance[strategy.architect] = { uses: 0, success: 0 };
    }
    pattern.agentPerformance[strategy.architect].uses += 1;
    if (success) pattern.agentPerformance[strategy.architect].success += 1;
    for (const builder of strategy.builders) {
      if (!pattern.agentPerformance[builder]) {
        pattern.agentPerformance[builder] = { uses: 0, success: 0 };
      }
      pattern.agentPerformance[builder].uses += 1;
      if (success) pattern.agentPerformance[builder].success += 1;
    }
    if (!pattern.agentPerformance[strategy.styler]) {
      pattern.agentPerformance[strategy.styler] = { uses: 0, success: 0 };
    }
    pattern.agentPerformance[strategy.styler].uses += 1;
    if (success) pattern.agentPerformance[strategy.styler].success += 1;
    // Re-evaluate best agents if we have enough data
    if (pattern.uses >= 3) {
      this.reevaluateBestCreationAgents(projectType);
    }
    // Save to memory
    await this.memorySystem.updateLearningPatterns({
      creation: this.creationPatterns,
    });
  }
  async updateAnalysisPatterns(projectType, strategy, success) {
    if (!this.analysisPatterns[projectType]) {
      this.analysisPatterns[projectType] = {
        bestDetector: strategy.primaryAgent,
        bestFixer: strategy.secondaryAgents[0] || strategy.primaryAgent,
        successRate: 0,
        uses: 0,
        agentPerformance: {},
      };
    }
    const pattern = this.analysisPatterns[projectType];
    pattern.uses += 1;
    // Update success rate
    pattern.successRate =
      (pattern.successRate * (pattern.uses - 1) + (success ? 1 : 0)) /
      pattern.uses;
    // Update agent performance
    if (!pattern.agentPerformance[strategy.primaryAgent]) {
      pattern.agentPerformance[strategy.primaryAgent] = { uses: 0, success: 0 };
    }
    pattern.agentPerformance[strategy.primaryAgent].uses += 1;
    if (success) pattern.agentPerformance[strategy.primaryAgent].success += 1;
    for (const agent of strategy.secondaryAgents) {
      if (!pattern.agentPerformance[agent]) {
        pattern.agentPerformance[agent] = { uses: 0, success: 0 };
      }
      pattern.agentPerformance[agent].uses += 1;
      if (success) pattern.agentPerformance[agent].success += 1;
    }
    // Re-evaluate best agents if we have enough data
    if (pattern.uses >= 3) {
      this.reevaluateBestAnalysisAgents(projectType);
    }
    // Save to memory
    await this.memorySystem.updateLearningPatterns({
      analysis: this.analysisPatterns,
    });
  }
  async updateHybridPatterns(projectType, strategy, success) {
    if (!this.hybridPatterns[projectType]) {
      this.hybridPatterns[projectType] = {
        bestAnalyzer: strategy.agents.analyzer,
        bestCreator: strategy.agents.creator,
        bestIntegrator: strategy.agents.integrator,
        successRate: 0,
        uses: 0,
        agentPerformance: {},
      };
    }
    const pattern = this.hybridPatterns[projectType];
    pattern.uses += 1;
    // Update success rate
    pattern.successRate =
      (pattern.successRate * (pattern.uses - 1) + (success ? 1 : 0)) /
      pattern.uses;
    // Update agent performance
    if (!pattern.agentPerformance[strategy.agents.analyzer]) {
      pattern.agentPerformance[strategy.agents.analyzer] = {
        uses: 0,
        success: 0,
      };
    }
    pattern.agentPerformance[strategy.agents.analyzer].uses += 1;
    if (success)
      pattern.agentPerformance[strategy.agents.analyzer].success += 1;
    if (!pattern.agentPerformance[strategy.agents.creator]) {
      pattern.agentPerformance[strategy.agents.creator] = {
        uses: 0,
        success: 0,
      };
    }
    pattern.agentPerformance[strategy.agents.creator].uses += 1;
    if (success) pattern.agentPerformance[strategy.agents.creator].success += 1;
    if (!pattern.agentPerformance[strategy.agents.integrator]) {
      pattern.agentPerformance[strategy.agents.integrator] = {
        uses: 0,
        success: 0,
      };
    }
    pattern.agentPerformance[strategy.agents.integrator].uses += 1;
    if (success)
      pattern.agentPerformance[strategy.agents.integrator].success += 1;
    // Re-evaluate best agents if we have enough data
    if (pattern.uses >= 3) {
      this.reevaluateBestHybridAgents(projectType);
    }
    // Save to memory
    await this.memorySystem.updateLearningPatterns({
      hybrid: this.hybridPatterns,
    });
  }
  reevaluateBestCreationAgents(projectType) {
    const pattern = this.creationPatterns[projectType];
    if (!pattern || !pattern.agentPerformance) return;
    // Find the best architect
    let bestArchitect = pattern.bestArchitect;
    let bestArchitectRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestArchitectRate) {
        bestArchitect = agent;
        bestArchitectRate = rate;
      }
    }
    pattern.bestArchitect = bestArchitect;
    // Find the best builder
    let bestBuilder = pattern.bestBuilder;
    let bestBuilderRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestBuilderRate) {
        bestBuilder = agent;
        bestBuilderRate = rate;
      }
    }
    pattern.bestBuilder = bestBuilder;
    // Find the best styler
    let bestStyler = pattern.bestStyler;
    let bestStylerRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestStylerRate) {
        bestStyler = agent;
        bestStylerRate = rate;
      }
    }
    pattern.bestStyler = bestStyler;
  }
  reevaluateBestAnalysisAgents(projectType) {
    const pattern = this.analysisPatterns[projectType];
    if (!pattern || !pattern.agentPerformance) return;
    // Find the best detector
    let bestDetector = pattern.bestDetector;
    let bestDetectorRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestDetectorRate) {
        bestDetector = agent;
        bestDetectorRate = rate;
      }
    }
    pattern.bestDetector = bestDetector;
    // Find the best fixer
    let bestFixer = pattern.bestFixer;
    let bestFixerRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestFixerRate) {
        bestFixer = agent;
        bestFixerRate = rate;
      }
    }
    pattern.bestFixer = bestFixer;
  }
  reevaluateBestHybridAgents(projectType) {
    const pattern = this.hybridPatterns[projectType];
    if (!pattern || !pattern.agentPerformance) return;
    // Find the best analyzer
    let bestAnalyzer = pattern.bestAnalyzer;
    let bestAnalyzerRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestAnalyzerRate) {
        bestAnalyzer = agent;
        bestAnalyzerRate = rate;
      }
    }
    pattern.bestAnalyzer = bestAnalyzer;
    // Find the best creator
    let bestCreator = pattern.bestCreator;
    let bestCreatorRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestCreatorRate) {
        bestCreator = agent;
        bestCreatorRate = rate;
      }
    }
    pattern.bestCreator = bestCreator;
    // Find the best integrator
    let bestIntegrator = pattern.bestIntegrator;
    let bestIntegratorRate = 0;
    for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
      const rate = perf.uses > 0 ? perf.success / perf.uses : 0;
      if (rate > bestIntegratorRate) {
        bestIntegrator = agent;
        bestIntegratorRate = rate;
      }
    }
    pattern.bestIntegrator = bestIntegrator;
  }
  getBestCreationStrategy(projectType) {
    if (this.creationPatterns[projectType]) {
      const pattern = this.creationPatterns[projectType];
      return {
        architect: pattern.bestArchitect,
        builders: [pattern.bestBuilder],
        styler: pattern.bestStyler,
        approach: "learned",
        confidence: pattern.successRate,
      };
    }
    // Default strategy if no learned pattern exists
    return {
      architect: "qwen3-coder",
      builders: ["deepseek-v3"],
      styler: "deepseek-v3",
      approach: "default",
      confidence: 0.5,
    };
  }
  getBestAnalysisStrategy(projectType) {
    if (this.analysisPatterns[projectType]) {
      const pattern = this.analysisPatterns[projectType];
      return {
        primaryAgent: pattern.bestDetector,
        secondaryAgents: [pattern.bestFixer],
        approach: "learned",
        confidence: pattern.successRate,
      };
    }
    // Default strategy if no learned pattern exists
    return {
      primaryAgent: "deepseek-r1",
      secondaryAgents: ["deepseek-v3"],
      approach: "default",
      confidence: 0.5,
    };
  }
  getBestHybridStrategy(projectType) {
    if (this.hybridPatterns[projectType]) {
      const pattern = this.hybridPatterns[projectType];
      return {
        agents: {
          analyzer: pattern.bestAnalyzer,
          creator: pattern.bestCreator,
          integrator: pattern.bestIntegrator,
        },
        approach: "learned",
        confidence: pattern.successRate,
      };
    }
    // Default strategy if no learned pattern exists
    return {
      agents: {
        analyzer: "deepseek-r1",
        creator: "qwen3-coder",
        integrator: "deepseek-v3",
      },
      approach: "default",
      confidence: 0.5,
    };
  }
  async getAgentPerformance() {
    // Aggregate performance data across all project types
    const agentPerformance = {};
    // Process creation patterns
    for (const [projectType, pattern] of Object.entries(
      this.creationPatterns
    )) {
      if (pattern.agentPerformance) {
        for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
          if (!agentPerformance[agent]) {
            agentPerformance[agent] = { uses: 0, success: 0, tasks: {} };
          }
          agentPerformance[agent].uses += perf.uses;
          agentPerformance[agent].success += perf.success;
          if (!agentPerformance[agent].tasks.creation) {
            agentPerformance[agent].tasks.creation = { uses: 0, success: 0 };
          }
          agentPerformance[agent].tasks.creation.uses += perf.uses;
          agentPerformance[agent].tasks.creation.success += perf.success;
        }
      }
    }
    // Process analysis patterns
    for (const [projectType, pattern] of Object.entries(
      this.analysisPatterns
    )) {
      if (pattern.agentPerformance) {
        for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
          if (!agentPerformance[agent]) {
            agentPerformance[agent] = { uses: 0, success: 0, tasks: {} };
          }
          agentPerformance[agent].uses += perf.uses;
          agentPerformance[agent].success += perf.success;
          if (!agentPerformance[agent].tasks.analysis) {
            agentPerformance[agent].tasks.analysis = { uses: 0, success: 0 };
          }
          agentPerformance[agent].tasks.analysis.uses += perf.uses;
          agentPerformance[agent].tasks.analysis.success += perf.success;
        }
      }
    }
    // Process hybrid patterns
    for (const [projectType, pattern] of Object.entries(this.hybridPatterns)) {
      if (pattern.agentPerformance) {
        for (const [agent, perf] of Object.entries(pattern.agentPerformance)) {
          if (!agentPerformance[agent]) {
            agentPerformance[agent] = { uses: 0, success: 0, tasks: {} };
          }
          agentPerformance[agent].uses += perf.uses;
          agentPerformance[agent].success += perf.success;
          if (!agentPerformance[agent].tasks.hybrid) {
            agentPerformance[agent].tasks.hybrid = { uses: 0, success: 0 };
          }
          agentPerformance[agent].tasks.hybrid.uses += perf.uses;
          agentPerformance[agent].tasks.hybrid.success += perf.success;
        }
      }
    }
    // Calculate success rates
    for (const [agent, perf] of Object.entries(agentPerformance)) {
      perf.successRate = perf.uses > 0 ? perf.success / perf.uses : 0;
      for (const [task, taskPerf] of Object.entries(perf.tasks)) {
        taskPerf.successRate =
          taskPerf.uses > 0 ? taskPerf.success / taskPerf.uses : 0;
      }
    }
    return agentPerformance;
  }
  async getLearningPatterns() {
    return {
      creation: this.creationPatterns,
      analysis: this.analysisPatterns,
      hybrid: this.hybridPatterns,
    };
  }
}
module.exports = { LearningEngine };
