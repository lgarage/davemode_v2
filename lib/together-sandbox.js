// lib/together-sandbox.js
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { CodeSandbox } = require("@codesandbox/sdk");

class TogetherSandbox {
  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY;
    this.baseUrl = process.env.TOGETHER_API_URL || "https://api.together.xyz";
    this.activeSandboxes = new Map();
    this.browserSessions = new Map();
    this.sdk = new CodeSandbox(process.env.CSB_API_KEY);
  }
  async createBrowserSession(sandboxId, userId) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox) {
        throw new Error("Sandbox not found");
      }

      // Create a browser session
      const session = await sandbox.createBrowserSession({
        id: userId,
      });

      // Store the browser session
      this.browserSessions.set(`${sandboxId}-${userId}`, session);

      return session;
    } catch (error) {
      console.error("Error creating browser session:", error);
      throw error;
    }
  }

  async hibernateSandbox(sandboxId) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox) {
        throw new Error("Sandbox not found");
      }

      // Disconnect the session but keep the sandbox
      if (sandbox.session) {
        await sandbox.session.disconnect();
        sandbox.session = null;
      }

      sandbox.status = "hibernated";
      return true;
    } catch (error) {
      console.error("Error hibernating sandbox:", error);
      throw error;
    }
  }

  async getBrowserSession(sandboxId, userId) {
    return this.browserSessions.get(`${sandboxId}-${userId}`);
  }

  async createSandbox(projectName, template = "node") {
    try {
      console.log(`Creating sandbox for project: ${projectName}`);

      // Create a new sandbox
      const sandbox = await this.sdk.sandboxes.create({
        source: "template",
        id: template, // Use a predefined template or custom template ID
      });

      const sandboxInfo = {
        id: sandbox.id,
        name: `${projectName}-${sandbox.id}`,
        status: "creating",
        createdAt: new Date().toISOString(),
      };

      this.activeSandboxes.set(sandbox.id, sandboxInfo);

      // Wait for sandbox to be ready
      await this.waitForSandboxReady(sandbox.id);

      // Connect to the sandbox
      const session = await sandbox.connect();

      // Update sandbox info
      sandboxInfo.status = "ready";
      sandboxInfo.session = session;

      return sandboxInfo;
    } catch (error) {
      console.error("Error creating sandbox:", error);
      throw error;
    }
  }

  async waitForSandboxReady(sandboxId, timeout = 300000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox) {
        throw new Error("Sandbox not found");
      }

      if (sandbox.status === "ready") {
        return true;
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error("Sandbox creation timed out");
  }

  async getSandboxStatus(sandboxId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/sandboxes/${sandboxId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.status;
    } catch (error) {
      console.error("Error getting sandbox status:", error);
      throw error;
    }
  }
  async uploadFiles(sandboxId, files) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox || !sandbox.session) {
        throw new Error("Sandbox not found or not ready");
      }

      // Create directory structure and upload files
      for (const file of files) {
        const pathParts = file.path.split("/");
        let currentPath = "/project/sandbox";

        // Create directories if they don't exist
        for (let i = 0; i < pathParts.length - 1; i++) {
          const dir = pathParts[i];
          currentPath += `/${dir}`;

          try {
            await sandbox.session.commands.run(`mkdir -p ${currentPath}`);
          } catch (e) {
            // Directory might already exist
          }
        }

        // Write the file
        const filePath = `/project/sandbox/${file.path}`;
        await sandbox.session.fs.writeTextFile(filePath, file.content);
      }

      return true;
    } catch (error) {
      console.error("Error uploading files to sandbox:", error);
      throw error;
    }
  }

  async createTarArchive(files) {
    // In a real implementation, this would create an actual tar archive
    // For now, we'll simulate it with a JSON representation
    return Buffer.from(JSON.stringify(files));
  }
  async executeCommand(sandboxId, command) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox || !sandbox.session) {
        throw new Error("Sandbox not found or not ready");
      }

      const output = await sandbox.session.commands.run(command);
      return {
        stdout: output.stdout || "",
        stderr: output.stderr || "",
        exitCode: output.exitCode || 0,
      };
    } catch (error) {
      console.error("Error executing command in sandbox:", error);
      throw error;
    }
  }

  async screenshot(sandboxId) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox || !sandbox.session) {
        throw new Error("Sandbox not found or not ready");
      }

      // Note: Screenshots might not be directly available in the SDK
      // This is a placeholder implementation
      return Buffer.from("screenshot-placeholder");
    } catch (error) {
      console.error("Error taking screenshot:", error);
      throw error;
    }
  }

  async updateFile(sandboxId, filePath, content) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox || !sandbox.session) {
        throw new Error("Sandbox not found or not ready");
      }

      const fullPath = `/project/sandbox/${filePath}`;
      await sandbox.session.fs.writeTextFile(fullPath, content);

      return true;
    } catch (error) {
      console.error("Error updating file in sandbox:", error);
      throw error;
    }
  }

  async readFile(sandboxId, filePath) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox || !sandbox.session) {
        throw new Error("Sandbox not found or not ready");
      }

      const fullPath = `/project/sandbox/${filePath}`;
      const content = await sandbox.session.fs.readTextFile(fullPath);

      return content;
    } catch (error) {
      console.error("Error reading file from sandbox:", error);
      throw error;
    }
  }

  async deleteSandbox(sandboxId) {
    try {
      const sandbox = this.activeSandboxes.get(sandboxId);
      if (!sandbox) {
        throw new Error("Sandbox not found");
      }

      // Disconnect the session
      if (sandbox.session) {
        await sandbox.session.disconnect();
      }

      // Remove from active sandboxes
      this.activeSandboxes.delete(sandboxId);

      return true;
    } catch (error) {
      console.error("Error deleting sandbox:", error);
      throw error;
    }
  }

  async validateProject(project) {
    // Create a temporary sandbox for validation
    const sandboxId = `validation-${Date.now()}`;

    try {
      const sandbox = await this.createSandbox("validation", "node");

      // Upload project files
      await this.uploadFiles(sandbox.id, project.files);

      // Install dependencies
      const installResult = await this.executeCommand(
        sandbox.id,
        "cd /project/sandbox && npm install"
      );

      // Run tests if they exist
      let testResult = null;
      try {
        testResult = await this.executeCommand(
          sandbox.id,
          "cd /project/sandbox && npm test"
        );
      } catch (error) {
        // Tests might not exist, which is okay
        console.log("No tests found or tests failed");
      }

      // Try to start the application
      let startResult = null;
      try {
        // Start in background
        await this.executeCommand(
          sandbox.id,
          "cd /project/sandbox && npm start &"
        );

        // Wait a bit for the app to start
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check if the process is running
        const psResult = await this.executeCommand(
          sandbox.id,
          "ps aux | grep node"
        );

        startResult = {
          success: psResult.stdout.includes("npm start"),
          output: psResult.stdout,
        };
      } catch (error) {
        startResult = {
          success: false,
          error: error.message,
        };
      }

      // Clean up
      await this.deleteSandbox(sandbox.id);

      return {
        success: startResult && startResult.success,
        installResult,
        testResult,
        startResult,
        errors: this.extractErrors(installResult, testResult, startResult),
      };
    } catch (error) {
      console.error("Error validating project:", error);

      // Try to clean up
      try {
        await this.deleteSandbox(sandboxId);
      } catch (cleanupError) {
        console.error("Error cleaning up sandbox:", cleanupError);
      }

      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  extractErrors(installResult, testResult, startResult) {
    const errors = [];

    if (installResult && installResult.exitCode !== 0) {
      errors.push(`Installation failed: ${installResult.stderr}`);
    }

    if (testResult && testResult.exitCode !== 0) {
      errors.push(`Tests failed: ${testResult.stderr}`);
    }

    if (startResult && !startResult.success) {
      errors.push(
        `Application failed to start: ${startResult.error || "Unknown error"}`
      );
    }

    return errors;
  }
}
module.exports = { TogetherSandbox };
