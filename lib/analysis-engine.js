// lib/analysis-engine.js
const { SpecialistAgents } = require("./specialist-agents");
class AnalysisEngine {
  constructor() {
    this.agents = new SpecialistAgents();
  }
  async analyzeCode(files, focusAreas = []) {
    // Analyze code for issues, patterns, and improvements
    const analysis = {
      issues: [],
      patterns: [],
      metrics: {},
      recommendations: [],
    };
    // Use different agents based on focus areas
    for (const area of focusAreas) {
      const agent = this.selectAgentForArea(area);
      const result = await this.agents.analyze(agent, {
        files,
        focusArea: area,
      });
      if (result.issues) {
        analysis.issues.push(...result.issues);
      }
      if (result.patterns) {
        analysis.patterns.push(...result.patterns);
      }
      if (result.metrics) {
        analysis.metrics = { ...analysis.metrics, ...result.metrics };
      }
      if (result.recommendations) {
        analysis.recommendations.push(...result.recommendations);
      }
    }
    // If no focus areas specified, do a general analysis
    if (focusAreas.length === 0) {
      const generalResult = await this.agents.analyze("deepseek-r1", {
        files,
        focusArea: "general",
      });
      if (generalResult.issues) {
        analysis.issues.push(...generalResult.issues);
      }
      if (generalResult.patterns) {
        analysis.patterns.push(...generalResult.patterns);
      }
      if (generalResult.metrics) {
        analysis.metrics = { ...analysis.metrics, ...generalResult.metrics };
      }
      if (generalResult.recommendations) {
        analysis.recommendations.push(...generalResult.recommendations);
      }
    }
    // Remove duplicate issues
    analysis.issues = this.removeDuplicateIssues(analysis.issues);
    // Prioritize issues
    analysis.issues = this.prioritizeIssues(analysis.issues);
    return analysis;
  }
  async detectSecurityIssues(files) {
    // Detect security vulnerabilities in the code
    const securityIssues = [];
    // Use deepseek-r1 for security analysis
    const result = await this.agents.analyze("deepseek-r1", {
      files,
      focusArea: "security",
    });
    if (result.issues) {
      securityIssues.push(...result.issues);
    }
    return securityIssues;
  }
  async detectPerformanceIssues(files) {
    // Detect performance issues in the code
    const performanceIssues = [];
    // Use qwen3-coder for performance analysis
    const result = await this.agents.analyze("qwen3-coder", {
      files,
      focusArea: "performance",
    });
    if (result.issues) {
      performanceIssues.push(...result.issues);
    }
    return performanceIssues;
  }
  async detectCodeQualityIssues(files) {
    // Detect code quality issues
    const qualityIssues = [];
    // Use deepseek-v3 for code quality analysis
    const result = await this.agents.analyze("deepseek-v3", {
      files,
      focusArea: "code-quality",
    });
    if (result.issues) {
      qualityIssues.push(...result.issues);
    }
    return qualityIssues;
  }
  async generateFixes(issues) {
    // Generate fixes for the identified issues
    const fixes = [];
    // Group issues by type
    const issuesByType = {};
    for (const issue of issues) {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    }
    // Generate fixes for each type
    for (const [type, typeIssues] of Object.entries(issuesByType)) {
      const agent = this.selectAgentForArea(type);
      const result = await this.agents.create(agent, {
        task: "fix",
        issues: typeIssues,
      });
      if (result.fixes) {
        fixes.push(...result.fixes);
      }
    }
    return fixes;
  }
  selectAgentForArea(area) {
    // Select the best agent for a specific analysis area
    const agentMap = {
      security: "deepseek-r1",
      performance: "qwen3-coder",
      "code-quality": "deepseek-v3",
      "frontend-optimization": "qwen3-coder",
      "backend-performance": "deepseek-v3",
      "state-management": "deepseek-r1",
      "test-coverage": "deepseek-v3",
      accessibility: "deepseek-r1",
      general: "deepseek-r1",
    };
    return agentMap[area] || "deepseek-r1";
  }
  removeDuplicateIssues(issues) {
    const seen = new Set();
    return issues.filter((issue) => {
      const key = `${issue.file}:${issue.line}:${issue.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  prioritizeIssues(issues) {
    // Sort issues by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return issues.sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}
module.exports = { AnalysisEngine };
