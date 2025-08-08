// public/js/sandbox-browser.js

// This file should be included in the HTML for browser-side sandbox integration

class SandboxBrowser {
  constructor() {
    this.sandbox = null;
    this.initialized = false;
  }

  async initialize(session) {
    if (this.initialized) return;

    try {
      // Dynamically import the browser SDK
      const { connectToSandbox } = await import("@codesandbox/sdk/browser");

      // Connect to the sandbox
      this.sandbox = await connectToSandbox({
        session: session,
        getSession: (id) => this.getSessionFromServer(id),
        onFocusChange: (notify) => {
          const onVisibilityChange = () => {
            notify(document.visibilityState === "visible");
          };

          document.addEventListener("visibilitychange", onVisibilityChange);

          return () => {
            document.removeEventListener(
              "visibilitychange",
              onVisibilityChange
            );
          };
        },
        onInitCb: (event) => {
          console.log("Sandbox initialization event:", event);
          // Show loading state
          this.showLoadingState(event);
        },
      });

      this.initialized = true;
      console.log("Sandbox browser session initialized");

      return this.sandbox;
    } catch (error) {
      console.error("Error initializing sandbox browser session:", error);
      throw error;
    }
  }

  async getSessionFromServer(sandboxId) {
    try {
      const response = await fetch(`/api/sandbox/session/${sandboxId}`);
      if (!response.ok) {
        throw new Error("Failed to get sandbox session");
      }
      return await response.json();
    } catch (error) {
      console.error("Error getting sandbox session from server:", error);
      throw error;
    }
  }

  showLoadingState(event) {
    // Update UI to show loading state
    const loadingElement = document.getElementById("sandbox-loading");
    if (loadingElement) {
      loadingElement.style.display = "block";
      loadingElement.textContent = `Initializing sandbox: ${event.type}...`;
    }
  }

  async writeFile(path, content) {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }

    try {
      await this.sandbox.fs.writeTextFile(path, content);
      return true;
    } catch (error) {
      console.error("Error writing file to sandbox:", error);
      throw error;
    }
  }

  async readFile(path) {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }

    try {
      return await this.sandbox.fs.readTextFile(path);
    } catch (error) {
      console.error("Error reading file from sandbox:", error);
      throw error;
    }
  }

  async runCommand(command) {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }

    try {
      return await this.sandbox.commands.run(command);
    } catch (error) {
      console.error("Error running command in sandbox:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.sandbox) {
      try {
        await this.sandbox.disconnect();
        this.sandbox = null;
        this.initialized = false;
        return true;
      } catch (error) {
        console.error("Error disconnecting from sandbox:", error);
        throw error;
      }
    }
    return true;
  }
}

// Export for use in other scripts
window.SandboxBrowser = SandboxBrowser;
