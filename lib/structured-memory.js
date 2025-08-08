// lib/structured-memory.js
const { Pool } = require("pg");
class StructuredMemory {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "dave_mode",
      password: process.env.DB_PASSWORD || "password",
      port: process.env.DB_PORT || 5432,
    });
    this.initializeDatabase();
  }
  async initializeDatabase() {
    try {
      // Create tables if they don't exist
      await this.createTables();
      console.log("Structured memory initialized");
    } catch (error) {
      console.error("Error initializing structured memory:", error);
      throw error;
    }
  }
  async createTables() {
    const createInteractionsTable = `
      CREATE TABLE IF NOT EXISTS interactions (
        id SERIAL PRIMARY KEY,
        interaction_id VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        project_type VARCHAR(100),
        project_context JSONB,
        requirements JSONB,
        strategy JSONB,
        result JSONB,
        success BOOLEAN,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    const createPatternsTable = `
      CREATE TABLE IF NOT EXISTS patterns (
        id SERIAL PRIMARY KEY,
        pattern_type VARCHAR(50) NOT NULL,
        project_type VARCHAR(100) NOT NULL,
        pattern_data JSONB NOT NULL,
        success_rate FLOAT DEFAULT 0,
        uses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    const createClarificationRequestsTable = `
      CREATE TABLE IF NOT EXISTS clarification_requests (
        id SERIAL PRIMARY KEY,
        interaction_id VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        original_interaction_id VARCHAR(255),
        requirements JSONB,
        context JSONB,
        files JSONB,
        project_context JSONB,
        questions JSONB NOT NULL,
        ambiguities JSONB,
        contextual_matches JSONB,
        is_follow_up BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createClarificationResponsesTable = `
      CREATE TABLE IF NOT EXISTS clarification_responses (
        id SERIAL PRIMARY KEY,
        interaction_id VARCHAR(255) UNIQUE NOT NULL,
        responses JSONB NOT NULL,
        updated_requirements JSONB,
        updated_project_context JSONB,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createAgentPerformanceTable = `
      CREATE TABLE IF NOT EXISTS agent_performance (
        id SERIAL PRIMARY KEY,
        agent_name VARCHAR(100) NOT NULL,
        task_type VARCHAR(50) NOT NULL,
        project_type VARCHAR(100),
        uses INTEGER DEFAULT 0,
        successes INTEGER DEFAULT 0,
        success_rate FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(agent_name, task_type, project_type)
      );
    `;
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        technologies JSONB,
        features JSONB,
        files JSONB,
        validation JSONB,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(createInteractionsTable);
    await this.pool.query(createPatternsTable);
    await this.pool.query(createAgentPerformanceTable);
    await this.pool.query(createProjectsTable);
    await this.pool.query(createClarificationRequestsTable);
    await this.pool.query(createClarificationResponsesTable);
  }
  async storeInteraction(interaction) {
    try {
      const query = `
        INSERT INTO interactions (
          interaction_id, type, project_type, project_context, requirements, strategy, result, success, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (interaction_id) DO UPDATE SET
          type = EXCLUDED.type,
          project_type = EXCLUDED.project_type,
          project_context = EXCLUDED.project_context,
          requirements = EXCLUDED.requirements,
          strategy = EXCLUDED.strategy,
          result = EXCLUDED.result,
          success = EXCLUDED.success,
          timestamp = EXCLUDED.timestamp
        RETURNING id;
      `;
      const values = [
        interaction.id,
        interaction.type,
        interaction.projectType || interaction.projectContext?.type || null,
        interaction.projectContext
          ? JSON.stringify(interaction.projectContext)
          : null,
        interaction.requirements
          ? JSON.stringify(interaction.requirements)
          : null,
        interaction.strategy ? JSON.stringify(interaction.strategy) : null,
        interaction.result ? JSON.stringify(interaction.result) : null,
        interaction.success !== undefined ? interaction.success : null,
        interaction.timestamp,
      ];
      const result = await this.pool.query(query, values);
      // Update agent performance
      if (interaction.strategy) {
        await this.updateAgentPerformance(interaction);
      }
      return result.rows[0].id;
    } catch (error) {
      console.error("Error storing interaction in structured memory:", error);
      throw error;
    }
  }

  async storeClarificationRequest(request) {
    try {
      const query = `
        INSERT INTO clarification_requests (
          interaction_id, type, original_interaction_id, requirements, context, files, project_context, 
          questions, ambiguities, contextual_matches, is_follow_up, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (interaction_id) DO UPDATE SET
          type = EXCLUDED.type,
          original_interaction_id = EXCLUDED.original_interaction_id,
          requirements = EXCLUDED.requirements,
          context = EXCLUDED.context,
          files = EXCLUDED.files,
          project_context = EXCLUDED.project_context,
          questions = EXCLUDED.questions,
          ambiguities = EXCLUDED.ambiguities,
          contextual_matches = EXCLUDED.contextual_matches,
          is_follow_up = EXCLUDED.is_follow_up,
          timestamp = EXCLUDED.timestamp
        RETURNING id;
      `;

      const values = [
        request.id,
        request.type,
        request.originalInteractionId || null,
        request.requirements ? JSON.stringify(request.requirements) : null,
        request.context ? JSON.stringify(request.context) : null,
        request.files ? JSON.stringify(request.files) : null,
        request.projectContext ? JSON.stringify(request.projectContext) : null,
        JSON.stringify(request.questions),
        request.ambiguities ? JSON.stringify(request.ambiguities) : null,
        request.contextualMatches
          ? JSON.stringify(request.contextualMatches)
          : null,
        request.isFollowUp || false,
        request.timestamp,
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error(
        "Error storing clarification request in structured memory:",
        error
      );
      throw error;
    }
  }

  async getClarificationRequest(interactionId) {
    try {
      const query = `
        SELECT * FROM clarification_requests
        WHERE interaction_id = $1;
      `;

      const values = [interactionId];
      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.interaction_id,
        type: row.type,
        originalInteractionId: row.original_interaction_id,
        requirements: row.requirements ? JSON.parse(row.requirements) : null,
        context: row.context ? JSON.parse(row.context) : null,
        files: row.files ? JSON.parse(row.files) : null,
        projectContext: row.project_context
          ? JSON.parse(row.project_context)
          : null,
        questions: JSON.parse(row.questions),
        ambiguities: row.ambiguities ? JSON.parse(row.ambiguities) : null,
        contextualMatches: row.contextual_matches
          ? JSON.parse(row.contextual_matches)
          : null,
        isFollowUp: row.is_follow_up,
        timestamp: row.timestamp,
      };
    } catch (error) {
      console.error("Error getting clarification request:", error);
      throw error;
    }
  }

  async storeClarificationResponse(response) {
    try {
      const query = `
        INSERT INTO clarification_responses (
          interaction_id, responses, updated_requirements, updated_project_context, timestamp
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (interaction_id) DO UPDATE SET
          responses = EXCLUDED.responses,
          updated_requirements = EXCLUDED.updated_requirements,
          updated_project_context = EXCLUDED.updated_project_context,
          timestamp = EXCLUDED.timestamp
        RETURNING id;
      `;

      const values = [
        response.id,
        JSON.stringify(response.responses),
        JSON.stringify(response.updatedRequirements),
        response.updatedProjectContext
          ? JSON.stringify(response.updatedProjectContext)
          : null,
        response.timestamp,
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error(
        "Error storing clarification response in structured memory:",
        error
      );
      throw error;
    }
  }

  async getClarificationHistory(projectType) {
    try {
      const query = `
        SELECT cr.*, crq.questions, crq.ambiguities, crq.contextual_matches
        FROM clarification_responses cr
        JOIN clarification_requests crq ON cr.interaction_id = crq.interaction_id
        WHERE crq.type = 'creation'
        AND crq.requirements->>'type' = $1
        ORDER BY cr.timestamp DESC
        LIMIT 10;
      `;

      const values = [projectType];
      const result = await this.pool.query(query, values);

      return result.rows.map((row) => ({
        interactionId: row.interaction_id,
        questions: JSON.parse(row.questions),
        ambiguities: row.ambiguities ? JSON.parse(row.ambiguities) : null,
        contextualMatches: row.contextual_matches
          ? JSON.parse(row.contextual_matches)
          : null,
        responses: JSON.parse(row.responses),
        updatedRequirements: row.updated_requirements
          ? JSON.parse(row.updated_requirements)
          : null,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error("Error getting clarification history:", error);
      throw error;
    }
  }

  async storePattern(patternType, projectType, patternData) {
    try {
      const query = `
        INSERT INTO patterns (
          pattern_type, project_type, pattern_data, success_rate, uses
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (pattern_type, project_type) DO UPDATE SET
          pattern_data = EXCLUDED.pattern_data,
          success_rate = EXCLUDED.success_rate,
          uses = EXCLUDED.uses,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id;
      `;
      const values = [
        patternType,
        projectType,
        JSON.stringify(patternData),
        patternData.successRate || 0,
        patternData.uses || 0,
      ];
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error("Error storing pattern in structured memory:", error);
      throw error;
    }
  }
  async storeProject(project) {
    try {
      const query = `
        INSERT INTO projects (
          project_id, name, type, technologies, features, files, validation, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (project_id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          technologies = EXCLUDED.technologies,
          features = EXCLUDED.features,
          files = EXCLUDED.files,
          validation = EXCLUDED.validation,
          timestamp = EXCLUDED.timestamp
        RETURNING id;
      `;
      const values = [
        project.id,
        project.name,
        project.type,
        project.technologies ? JSON.stringify(project.technologies) : null,
        project.features ? JSON.stringify(project.features) : null,
        project.files ? JSON.stringify(project.files) : null,
        project.validation ? JSON.stringify(project.validation) : null,
        project.timestamp,
      ];
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error("Error storing project in structured memory:", error);
      throw error;
    }
  }
  async updateAgentPerformance(interaction) {
    try {
      const strategy = interaction.strategy;
      const success =
        interaction.success !== undefined ? interaction.success : true;
      const projectType =
        interaction.projectType ||
        interaction.projectContext?.type ||
        "unknown";
      // Update architect performance
      if (strategy.architect) {
        await this.updateAgentPerformanceRecord(
          strategy.architect,
          "architecture",
          projectType,
          success
        );
      }
      // Update builder performance
      if (strategy.builders) {
        for (const builder of strategy.builders) {
          await this.updateAgentPerformanceRecord(
            builder,
            "building",
            projectType,
            success
          );
        }
      }
      // Update styler performance
      if (strategy.styler) {
        await this.updateAgentPerformanceRecord(
          strategy.styler,
          "styling",
          projectType,
          success
        );
      }
      // Update primary agent performance
      if (strategy.primaryAgent) {
        await this.updateAgentPerformanceRecord(
          strategy.primaryAgent,
          "analysis",
          projectType,
          success
        );
      }
      // Update secondary agents performance
      if (strategy.secondaryAgents) {
        for (const agent of strategy.secondaryAgents) {
          await this.updateAgentPerformanceRecord(
            agent,
            "analysis",
            projectType,
            success
          );
        }
      }
      // Update agents for hybrid development
      if (strategy.agents) {
        if (strategy.agents.analyzer) {
          await this.updateAgentPerformanceRecord(
            strategy.agents.analyzer,
            "analysis",
            projectType,
            success
          );
        }
        if (strategy.agents.creator) {
          await this.updateAgentPerformanceRecord(
            strategy.agents.creator,
            "creation",
            projectType,
            success
          );
        }
        if (strategy.agents.integrator) {
          await this.updateAgentPerformanceRecord(
            strategy.agents.integrator,
            "integration",
            projectType,
            success
          );
        }
      }
    } catch (error) {
      console.error("Error updating agent performance:", error);
      throw error;
    }
  }
  async updateAgentPerformanceRecord(
    agentName,
    taskType,
    projectType,
    success
  ) {
    try {
      const query = `
        INSERT INTO agent_performance (
          agent_name, task_type, project_type, uses, successes, success_rate
        ) VALUES ($1, $2, $3, 1, $4, $4)
        ON CONFLICT (agent_name, task_type, project_type) DO UPDATE SET
          uses = agent_performance.uses + 1,
          successes = agent_performance.successes + $4,
          success_rate = (agent_performance.successes + $4)::float / (agent_performance.uses + 1)::float,
          updated_at = CURRENT_TIMESTAMP;
      `;
      const values = [agentName, taskType, projectType, success ? 1 : 0];
      await this.pool.query(query, values);
    } catch (error) {
      console.error("Error updating agent performance record:", error);
      throw error;
    }
  }
  async getInteractions(projectType, limit = 10) {
    try {
      const query = `
        SELECT * FROM interactions
        WHERE project_type = $1
        ORDER BY timestamp DESC
        LIMIT $2;
      `;
      const values = [projectType, limit];
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => ({
        id: row.interaction_id,
        type: row.type,
        projectType: row.project_type,
        projectContext: row.project_context
          ? JSON.parse(row.project_context)
          : null,
        requirements: row.requirements ? JSON.parse(row.requirements) : null,
        strategy: row.strategy ? JSON.parse(row.strategy) : null,
        result: row.result ? JSON.parse(row.result) : null,
        success: row.success,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error("Error getting interactions:", error);
      throw error;
    }
  }
  async getPatterns(patternType = null, projectType = null) {
    try {
      let query = "SELECT * FROM patterns";
      const values = [];
      const conditions = [];
      if (patternType) {
        conditions.push(`pattern_type = $${conditions.length + 1}`);
        values.push(patternType);
      }
      if (projectType) {
        conditions.push(`project_type = $${conditions.length + 1}`);
        values.push(projectType);
      }
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY uses DESC, success_rate DESC";
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => ({
        patternType: row.pattern_type,
        projectType: row.project_type,
        patternData: JSON.parse(row.pattern_data),
        successRate: row.success_rate,
        uses: row.uses,
      }));
    } catch (error) {
      console.error("Error getting patterns:", error);
      throw error;
    }
  }
  async getAgentPerformance(
    agentName = null,
    taskType = null,
    projectType = null
  ) {
    try {
      let query = "SELECT * FROM agent_performance";
      const values = [];
      const conditions = [];
      if (agentName) {
        conditions.push(`agent_name = $${conditions.length + 1}`);
        values.push(agentName);
      }
      if (taskType) {
        conditions.push(`task_type = $${conditions.length + 1}`);
        values.push(taskType);
      }
      if (projectType) {
        conditions.push(`project_type = $${conditions.length + 1}`);
        values.push(projectType);
      }
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY uses DESC, success_rate DESC";
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => ({
        agentName: row.agent_name,
        taskType: row.task_type,
        projectType: row.project_type,
        uses: row.uses,
        successes: row.successes,
        successRate: row.success_rate,
      }));
    } catch (error) {
      console.error("Error getting agent performance:", error);
      throw error;
    }
  }
  async getProjects(projectType = null, limit = 10) {
    try {
      let query = "SELECT * FROM projects";
      const values = [];
      const conditions = [];
      if (projectType) {
        conditions.push(`type = $${conditions.length + 1}`);
        values.push(projectType);
      }
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY timestamp DESC LIMIT $" + (conditions.length + 1);
      values.push(limit);
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => ({
        id: row.project_id,
        name: row.name,
        type: row.type,
        technologies: row.technologies ? JSON.parse(row.technologies) : null,
        features: row.features ? JSON.parse(row.features) : null,
        files: row.files ? JSON.parse(row.files) : null,
        validation: row.validation ? JSON.parse(row.validation) : null,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error("Error getting projects:", error);
      throw error;
    }
  }
  async getLearningPatterns() {
    try {
      const creationPatterns = await this.getPatterns("creation");
      const analysisPatterns = await this.getPatterns("analysis");
      const hybridPatterns = await this.getPatterns("hybrid");
      const patterns = {
        creation: {},
        analysis: {},
        hybrid: {},
      };
      // Organize creation patterns by project type
      for (const pattern of creationPatterns) {
        patterns.creation[pattern.projectType] = pattern.patternData;
      }
      // Organize analysis patterns by project type
      for (const pattern of analysisPatterns) {
        patterns.analysis[pattern.projectType] = pattern.patternData;
      }
      // Organize hybrid patterns by project type
      for (const pattern of hybridPatterns) {
        patterns.hybrid[pattern.projectType] = pattern.patternData;
      }
      return patterns;
    } catch (error) {
      console.error("Error getting learning patterns:", error);
      throw error;
    }
  }
  async updateLearningPatterns(patterns) {
    try {
      if (patterns.creation) {
        for (const [projectType, patternData] of Object.entries(
          patterns.creation
        )) {
          await this.storePattern("creation", projectType, patternData);
        }
      }
      if (patterns.analysis) {
        for (const [projectType, patternData] of Object.entries(
          patterns.analysis
        )) {
          await this.storePattern("analysis", projectType, patternData);
        }
      }
      if (patterns.hybrid) {
        for (const [projectType, patternData] of Object.entries(
          patterns.hybrid
        )) {
          await this.storePattern("hybrid", projectType, patternData);
        }
      }
    } catch (error) {
      console.error("Error updating learning patterns:", error);
      throw error;
    }
  }
}
module.exports = { StructuredMemory };
