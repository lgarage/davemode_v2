// lib/clarification-engine.js
class ClarificationEngine {
  constructor() {
    this.clarificationPatterns = {
      "missing-features": {
        keywords: ["app", "website", "system", "platform"],
        triggers: ["build", "create", "develop"],
        questions: [
          "What specific features should the app have?",
          "Can you list the main functionalities you need?",
          "What are the core user journeys?",
        ],
      },
      "missing-tech-stack": {
        keywords: ["app", "website", "api"],
        triggers: ["build", "create", "develop"],
        questions: [
          "Do you have a preferred technology stack?",
          "Are there any specific frameworks or libraries you'd like to use?",
          "Any constraints on technologies we should use?",
        ],
      },
      "missing-design": {
        keywords: ["ui", "interface", "design", "look"],
        triggers: ["build", "create", "develop"],
        questions: [
          "Do you have any design preferences or mockups?",
          "What style or theme are you looking for?",
          "Are there any brand guidelines we should follow?",
        ],
      },
      "missing-integration": {
        keywords: ["connect", "integrate", "api", "external"],
        triggers: ["connect", "integrate", "link"],
        questions: [
          "What systems or services should this integrate with?",
          "Are there any third-party APIs we need to connect to?",
          "Do you have authentication requirements?",
        ],
      },
      "missing-data": {
        keywords: ["data", "database", "storage", "information"],
        triggers: ["store", "save", "manage"],
        questions: [
          "What kind of data will the application handle?",
          "Do you have a preferred database solution?",
          "Are there any data privacy requirements?",
        ],
      },
      "missing-users": {
        keywords: ["users", "people", "customers"],
        triggers: ["for", "by", "with"],
        questions: [
          "Who are the target users for this application?",
          "How many users do you expect?",
          "What are the user roles and permissions?",
        ],
      },
      "missing-deployment": {
        keywords: ["deploy", "host", "server"],
        triggers: ["deploy", "host", "publish"],
        questions: [
          "Where do you plan to deploy this application?",
          "Do you have any hosting preferences?",
          "Are there any scalability requirements?",
        ],
      },
      "missing-timeline": {
        keywords: ["timeline", "deadline", "schedule"],
        triggers: ["when", "how soon", "by when"],
        questions: [
          "What is your timeline for this project?",
          "Are there any critical deadlines?",
          "Is this a phased rollout or all at once?",
        ],
      },
    };
    // Contextual understanding patterns
    this.contextualPatterns = {
      "e-commerce": {
        keywords: ["shop", "store", "cart", "checkout", "payment", "product"],
        specificQuestions: [
          "What payment methods do you need to support?",
          "Do you need inventory management?",
          "Are there any tax or shipping requirements?",
        ],
      },
      "social-media": {
        keywords: ["social", "profile", "post", "comment", "like", "share"],
        specificQuestions: [
          "Do you need user profiles and authentication?",
          "What social features are most important?",
          "Do you need content moderation capabilities?",
        ],
      },
      dashboard: {
        keywords: [
          "dashboard",
          "analytics",
          "metrics",
          "charts",
          "data visualization",
        ],
        specificQuestions: [
          "What data sources will the dashboard connect to?",
          "What types of visualizations do you need?",
          "Do you need real-time data updates?",
        ],
      },
      blog: {
        keywords: ["blog", "article", "post", "content", "cms"],
        specificQuestions: [
          "Do you need a content management system?",
          "Will there be multiple authors?",
          "Do you need commenting functionality?",
        ],
      },
    };
  }

  async analyzeRequirements(requirements) {
    // Analyze requirements for ambiguity and missing information
    const ambiguities = [];
    const questions = [];
    const contextualQuestions = [];

    // Check for missing features
    if (!requirements.features || requirements.features.length === 0) {
      ambiguities.push("missing-features");
    }

    // Check for missing technology stack
    if (!requirements.framework && !requirements.backend) {
      ambiguities.push("missing-tech-stack");
    }

    // Check for design requirements if it's a UI project
    if (requirements.type === "web-app" || requirements.type === "mobile-app") {
      if (!requirements.design) {
        ambiguities.push("missing-design");
      }
    }

    // Check for integration requirements
    if (
      requirements.description &&
      (requirements.description.includes("integrate") ||
        requirements.description.includes("connect"))
    ) {
      if (!requirements.integrations) {
        ambiguities.push("missing-integration");
      }
    }

    // Check for data requirements
    if (requirements.type === "web-app" || requirements.type === "api") {
      if (!requirements.dataModel) {
        ambiguities.push("missing-data");
      }
    }

    // Check for user requirements
    if (!requirements.users) {
      ambiguities.push("missing-users");
    }

    // Check for deployment requirements
    if (!requirements.deployment) {
      ambiguities.push("missing-deployment");
    }

    // Check for timeline requirements
    if (!requirements.timeline) {
      ambiguities.push("missing-timeline");
    }

    // Generate questions for each ambiguity
    for (const ambiguity of ambiguities) {
      if (this.clarificationPatterns[ambiguity]) {
        questions.push(...this.clarificationPatterns[ambiguity].questions);
      }
    }

    // Analyze for contextual patterns
    const allText = [
      requirements.name,
      requirements.description,
      ...(requirements.features || []).map((f) => f.name + " " + f.description),
      requirements.type,
    ]
      .join(" ")
      .toLowerCase();

    for (const [context, pattern] of Object.entries(this.contextualPatterns)) {
      const matchCount = pattern.keywords.reduce((count, keyword) => {
        return count + (allText.includes(keyword) ? 1 : 0);
      }, 0);

      if (matchCount >= 2) {
        contextualQuestions.push(...pattern.specificQuestions);
      }
    }

    // Prioritize questions
    const prioritizedQuestions = this.prioritizeQuestions([
      ...questions,
      ...contextualQuestions,
    ]);

    return {
      needsClarification: prioritizedQuestions.length > 0,
      questions: prioritizedQuestions,
      ambiguities,
      contextualMatches: Object.keys(this.contextualPatterns).filter(
        (context) => {
          const pattern = this.contextualPatterns[context];
          return pattern.keywords.some((keyword) => allText.includes(keyword));
        }
      ),
    };
  }

  prioritizeQuestions(questions) {
    // Prioritize questions based on importance
    const priorityOrder = [
      "What specific features should the app have?",
      "Do you have a preferred technology stack?",
      "What kind of data will the application handle?",
      "Who are the target users for this application?",
      "What systems or services should this integrate with?",
      "Do you have any design preferences or mockups?",
      "Where do you plan to deploy this application?",
      "What is your timeline for this project?",
    ];

    // Sort questions based on priority order
    return questions.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      if (aIndex !== -1) {
        return -1;
      }

      if (bIndex !== -1) {
        return 1;
      }

      return 0;
    });
  }

  async processResponse(requirements, question, response) {
    // Process the user's response to a clarification question
    const updatedRequirements = { ...requirements };

    // Simple pattern matching to extract information from responses
    if (question.includes("features")) {
      // Extract features from the response
      const features = response
        .split(/[,;]/)
        .map((f) => f.trim())
        .filter((f) => f);
      if (features.length > 0) {
        updatedRequirements.features = updatedRequirements.features || [];
        updatedRequirements.features.push(
          ...features.map((f) => ({
            name: f,
            description: f,
          }))
        );
      }
    }

    if (
      question.includes("technology") ||
      question.includes("framework") ||
      question.includes("stack")
    ) {
      // Extract technology preferences
      if (response.includes("React")) updatedRequirements.framework = "react";
      else if (response.includes("Vue")) updatedRequirements.framework = "vue";
      else if (response.includes("Angular"))
        updatedRequirements.framework = "angular";
      else if (response.includes("Express"))
        updatedRequirements.backend = "express";
      else if (response.includes("Node")) updatedRequirements.backend = "node";
      else if (response.includes("Python"))
        updatedRequirements.backend = "python";
      else if (response.includes("Django"))
        updatedRequirements.backend = "django";
      else if (response.includes("Flask"))
        updatedRequirements.backend = "flask";
    }

    if (
      question.includes("design") ||
      question.includes("style") ||
      question.includes("theme")
    ) {
      // Extract design preferences
      updatedRequirements.design = updatedRequirements.design || {};
      updatedRequirements.design.preferences = response;

      if (response.includes("modern"))
        updatedRequirements.design.style = "modern";
      else if (response.includes("minimal"))
        updatedRequirements.design.style = "minimal";
      else if (response.includes("colorful"))
        updatedRequirements.design.style = "colorful";
      else if (response.includes("professional"))
        updatedRequirements.design.style = "professional";
    }

    if (
      question.includes("integrate") ||
      question.includes("connect") ||
      question.includes("API")
    ) {
      // Extract integration requirements
      updatedRequirements.integrations = updatedRequirements.integrations || [];
      const integrations = response
        .split(/[,;]/)
        .map((i) => i.trim())
        .filter((i) => i);
      updatedRequirements.integrations.push(...integrations);

      if (response.includes("payment")) {
        updatedRequirements.integrations.push("payment-processing");
      }

      if (response.includes("auth") || response.includes("login")) {
        updatedRequirements.integrations.push("authentication");
      }
    }

    if (
      question.includes("data") ||
      question.includes("database") ||
      question.includes("storage")
    ) {
      // Extract data requirements
      updatedRequirements.dataModel = updatedRequirements.dataModel || {};
      updatedRequirements.dataModel.description = response;

      if (
        response.includes("SQL") ||
        response.includes("PostgreSQL") ||
        response.includes("MySQL")
      ) {
        updatedRequirements.dataModel.type = "sql";
      } else if (response.includes("Mongo") || response.includes("NoSQL")) {
        updatedRequirements.dataModel.type = "nosql";
      }
    }

    if (question.includes("users") || question.includes("target")) {
      // Extract user requirements
      updatedRequirements.users = updatedRequirements.users || {};
      updatedRequirements.users.description = response;

      if (response.includes("admin") || response.includes("role")) {
        updatedRequirements.users.roles = ["admin", "user"];
      }

      if (response.includes("thousand") || response.includes("many")) {
        updatedRequirements.users.scale = "large";
      } else {
        updatedRequirements.users.scale = "small";
      }
    }

    if (question.includes("deploy") || question.includes("host")) {
      // Extract deployment requirements
      updatedRequirements.deployment = updatedRequirements.deployment || {};
      updatedRequirements.deployment.preferences = response;

      if (response.includes("AWS") || response.includes("Amazon")) {
        updatedRequirements.deployment.platform = "aws";
      } else if (response.includes("Azure") || response.includes("Microsoft")) {
        updatedRequirements.deployment.platform = "azure";
      } else if (response.includes("Google") || response.includes("GCP")) {
        updatedRequirements.deployment.platform = "gcp";
      } else if (response.includes("Vercel") || response.includes("Netlify")) {
        updatedRequirements.deployment.platform = "serverless";
      }
    }

    if (question.includes("timeline") || question.includes("deadline")) {
      // Extract timeline requirements
      updatedRequirements.timeline = updatedRequirements.timeline || {};
      updatedRequirements.timeline.description = response;

      if (response.includes("week") || response.includes("soon")) {
        updatedRequirements.timeline.urgency = "high";
      } else if (response.includes("month") || response.includes("quarter")) {
        updatedRequirements.timeline.urgency = "medium";
      } else {
        updatedRequirements.timeline.urgency = "low";
      }
    }

    // Context-specific processing
    if (question.includes("payment")) {
      updatedRequirements.payment = updatedRequirements.payment || {};
      updatedRequirements.payment.methods = response
        .split(/[,;]/)
        .map((m) => m.trim())
        .filter((m) => m);
    }

    if (question.includes("inventory")) {
      updatedRequirements.inventory = updatedRequirements.inventory || {};
      updatedRequirements.inventory.required = true;
    }

    if (question.includes("profile") || question.includes("authentication")) {
      updatedRequirements.authentication =
        updatedRequirements.authentication || {};
      updatedRequirements.authentication.required = true;
    }

    if (question.includes("dashboard") || question.includes("visualization")) {
      updatedRequirements.dashboard = updatedRequirements.dashboard || {};
      updatedRequirements.dashboard.required = true;
    }

    if (question.includes("cms") || question.includes("content")) {
      updatedRequirements.cms = updatedRequirements.cms || {};
      updatedRequirements.cms.required = true;
    }

    return updatedRequirements;
  }
  async generateFollowUpQuestions(
    requirements,
    previousQuestions,
    previousResponses
  ) {
    // Generate follow-up questions based on previous responses
    const followUpQuestions = [];

    // Check if we need more details about features
    if (requirements.features && requirements.features.length > 0) {
      const hasComplexFeature = requirements.features.some(
        (f) =>
          f.name.includes("user") ||
          f.name.includes("payment") ||
          f.name.includes("search") ||
          f.name.includes("notification")
      );

      if (hasComplexFeature) {
        followUpQuestions.push(
          "Can you provide more details about your most important feature?"
        );
      }
    }

    // Check if we need more details about integrations
    if (requirements.integrations && requirements.integrations.length > 0) {
      const hasExternalIntegration = requirements.integrations.some(
        (i) =>
          i.includes("API") ||
          i.includes("external") ||
          i.includes("third-party")
      );

      if (hasExternalIntegration) {
        followUpQuestions.push(
          "Do you have API documentation for the external services?"
        );
      }
    }

    // Check if we need more details about users
    if (requirements.users && requirements.users.scale === "large") {
      followUpQuestions.push("Do you need user analytics or reporting?");
    }

    // Check if we need more details about deployment
    if (
      requirements.deployment &&
      requirements.deployment.platform === "serverless"
    ) {
      followUpQuestions.push(
        "Do you need serverless functions for specific operations?"
      );
    }

    return followUpQuestions;
  }
}

module.exports = { ClarificationEngine };
