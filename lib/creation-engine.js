// lib/creation-engine.js
const { SpecialistAgents } = require("./specialist-agents");
const { TemplateLibrary } = require("./template-library");
class CreationEngine {
  constructor() {
    this.agents = new SpecialistAgents();
    this.templates = new TemplateLibrary();
  }
  async generateProjectStructure(projectType, technologies) {
    // Generate a complete project structure based on type and technologies
    const structure = {
      files: [],
      directories: [],
    };
    // Get base template
    const template = await this.templates.getTemplate(projectType);
    if (template) {
      // Use template as base
      structure.files = [...template.files];
      structure.directories = [...template.directories];
      // Customize based on technologies
      for (const tech of technologies) {
        const techFiles = await this.templates.getTechnologyFiles(tech);
        if (techFiles) {
          structure.files.push(...techFiles);
        }
      }
    } else {
      // Generate basic structure
      structure.directories = this.getBasicDirectories(projectType);
      structure.files = this.getBasicFiles(projectType, technologies);
    }
    return structure;
  }
  async generateComponents(components, projectType) {
    const generatedComponents = [];
    for (const component of components) {
      const generatedComponent = await this.generateComponent(
        component,
        projectType
      );
      generatedComponents.push(generatedComponent);
    }
    return generatedComponents;
  }
  async generateComponent(component, projectType) {
    // Generate a single component based on its specification
    const generatedComponent = {
      name: component.name,
      type: component.type,
      files: [],
    };
    // Determine the best agent for this component type
    let agent = "qwen3-coder"; // Default
    if (component.type === "style") {
      agent = "deepseek-v3";
    } else if (component.type === "test") {
      agent = "deepseek-r1";
    }
    // Generate the component files
    const files = await this.agents.create(agent, {
      task: "component",
      component,
      projectType,
    });
    generatedComponent.files = files || [];
    return generatedComponent;
  }
  async generateStyling(components, projectType) {
    // Generate styling for all components
    const styling = {
      files: [],
    };
    // Use the deepseek-v3 agent for styling
    const files = await this.agents.create("deepseek-v3", {
      task: "styling",
      components,
      projectType,
    });
    styling.files = files || [];
    return styling;
  }
  async generateTests(components, projectType) {
    // Generate tests for all components
    const tests = {
      files: [],
    };
    // Use the deepseek-r1 agent for testing
    const files = await this.agents.create("deepseek-r1", {
      task: "testing",
      components,
      projectType,
    });
    tests.files = files || [];
    return tests;
  }
  getBasicDirectories(projectType) {
    const directories = [];
    if (projectType === "web-app") {
      directories.push(
        "src",
        "src/components",
        "src/pages",
        "src/styles",
        "src/utils",
        "public"
      );
    } else if (projectType === "api") {
      directories.push(
        "src",
        "src/routes",
        "src/middleware",
        "src/models",
        "src/controllers",
        "tests"
      );
    }
    return directories;
  }
  getBasicFiles(projectType, technologies) {
    const files = [];
    // Always add package.json
    files.push({
      path: "package.json",
      content: this.generatePackageJson(projectType, technologies),
    });
    // Add README.md
    files.push({
      path: "README.md",
      content: this.generateReadme(projectType),
    });
    // Add .gitignore
    files.push({
      path: ".gitignore",
      content: this.generateGitignore(projectType),
    });
    // Add entry point based on project type
    if (projectType === "web-app") {
      files.push({
        path: "src/index.js",
        content: this.generateWebAppEntry(technologies),
      });
      files.push({
        path: "public/index.html",
        content: this.generateHtmlTemplate(),
      });
    } else if (projectType === "api") {
      files.push({
        path: "src/index.js",
        content: this.generateApiEntry(technologies),
      });
    }
    return files;
  }
  generatePackageJson(projectType, technologies) {
    const packageJson = {
      name: "new-project",
      version: "1.0.0",
      description: "",
      main: "src/index.js",
      scripts: {
        start: "node src/index.js",
        test: 'echo "Error: no test specified" && exit 1',
      },
      dependencies: {},
      devDependencies: {},
    };
    // Add dependencies based on technologies
    if (technologies.includes("react")) {
      packageJson.dependencies.react = "^18.2.0";
      packageJson.dependencies["react-dom"] = "^18.2.0";
      packageJson.scripts.start = "react-scripts start";
      packageJson.scripts.build = "react-scripts build";
      packageJson.scripts.test = "react-scripts test";
      packageJson.devDependencies["react-scripts"] = "^5.0.1";
    }
    if (technologies.includes("express")) {
      packageJson.dependencies.express = "^4.18.2";
    }
    if (technologies.includes("node")) {
      packageJson.dependencies.nodemon = "^3.0.1";
      packageJson.devDependencies.nodemon = "^3.0.1";
      packageJson.scripts.dev = "nodemon src/index.js";
    }
    return JSON.stringify(packageJson, null, 2);
  }
  generateReadme(projectType) {
    let readme = `# New Project\n\n`;
    if (projectType === "web-app") {
      readme += `This is a web application built with modern JavaScript.\n\n`;
      readme += `## Getting Started\n\n`;
      readme += `1. Install dependencies:\n\n`;
      readme += `\`\`\`bash\nnpm install\n\`\`\`\n\n`;
      readme += `2. Start the development server:\n\n`;
      readme += `\`\`\`bash\nnpm start\n\`\`\`\n\n`;
    } else if (projectType === "api") {
      readme += `This is a RESTful API built with Node.js and Express.\n\n`;
      readme += `## Getting Started\n\n`;
      readme += `1. Install dependencies:\n\n`;
      readme += `\`\`\`bash\nnpm install\n\`\`\`\n\n`;
      readme += `2. Start the server:\n\n`;
      readme += `\`\`\`bash\nnpm start\n\`\`\`\n\n`;
    }
    return readme;
  }
  generateGitignore(projectType) {
    let gitignore = `# Dependencies\n/node_modules\n\n`;
    if (projectType === "web-app") {
      gitignore += `# Production builds\n/build\n/dist\n\n`;
      gitignore += `# Environment variables\n.env\n.env.local\n.env.development.local\n.env.test.local\n.env.production.local\n\n`;
    }
    gitignore += `# Logs\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n\n`;
    gitignore += `# Runtime data\npids\n*.pid\n*.seed\n*.pid.lock\n\n`;
    gitignore += `# Coverage directory used by tools like istanbul\ncoverage\n\n`;
    gitignore += `# IDE\n.vscode/\n.idea/\n*.swp\n*.swo\n`;
    return gitignore;
  }
  generateWebAppEntry(technologies) {
    let entry = "";
    if (technologies.includes("react")) {
      entry = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`;
    } else {
      entry = `// Main entry point for the web application\n\nconsole.log('Web application started');\n\n// Add your application logic here`;
    }
    return entry;
  }
  generateApiEntry(technologies) {
    let entry = "";
    if (technologies.includes("express")) {
      entry = `const express = require('express');\nconst app = express();\nconst port = process.env.PORT || 3000;\n\n// Middleware\napp.use(express.json());\n\n// Routes\napp.get('/', (req, res) => {\n  res.json({ message: 'Welcome to the API' });\n});\n\n// Start server\napp.listen(port, () => {\n  console.log(\`Server running on port \${port}\`);\n});`;
    } else {
      entry = `// Main entry point for the API\n\nconsole.log('API server started');\n\n// Add your API logic here`;
    }
    return entry;
  }
  generateHtmlTemplate() {
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>New Project</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`;
  }
}
module.exports = { CreationEngine };
