// lib/template-library.js
class TemplateLibrary {
  constructor() {
    this.templates = {
      "react-app": {
        name: "React Application",
        description: "A modern React application with hooks and context",
        technologies: ["react", "javascript", "css"],
        files: [
          {
            path: "package.json",
            content: `{
  "name": "react-app",
  "version": "1.0.0",
  "description": "A modern React application",
  "main": "src/index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,
          },
          {
            path: "src/index.js",
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
          },
          {
            path: "src/App.js",
            content: `import React, { useState } from 'react';
import './App.css';
function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React</h1>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>
          <button type="button" onClick={() => setCount(count + 1)}>
            Count is: {count}
          </button>
        </p>
      </header>
    </div>
  );
}
export default App;`,
          },
          {
            path: "src/App.css",
            content: `.App {
  text-align: center;
}
.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}
button {
  background-color: #61dafb;
  border: none;
  border-radius: 8px;
  color: #282c34;
  font-size: 16px;
  padding: 10px 20px;
  margin: 10px;
  cursor: pointer;
}
button:hover {
  background-color: #4fa8c5;
}`,
          },
          {
            path: "src/index.css",
            content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
          },
          {
            path: "public/index.html",
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
          },
        ],
        directories: ["src", "public"],
      },
      "node-api": {
        name: "Node.js API",
        description: "A RESTful API built with Node.js and Express",
        technologies: ["node", "express", "javascript"],
        files: [
          {
            path: "package.json",
            content: `{
  "name": "node-api",
  "version": "1.0.0",
  "description": "A RESTful API built with Node.js and Express",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.1",
    "supertest": "^6.3.3"
  }
}`,
          },
          {
            path: "src/index.js",
            content: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
// Start server
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
          },
          {
            path: "src/routes/api.js",
            content: `const express = require('express');
const router = express.Router();
// GET /api/items
router.get('/items', (req, res) => {
  res.json({ items: [] });
});
// POST /api/items
router.post('/items', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  res.status(201).json({ message: 'Item created', item: { name } });
});
module.exports = router;`,
          },
        ],
        directories: ["src", "src/routes"],
      },
      "full-stack": {
        name: "Full Stack Application",
        description:
          "A complete full-stack application with React frontend and Node.js backend",
        technologies: ["react", "node", "express", "javascript", "css"],
        files: [
          {
            path: "package.json",
            content: `{
  "name": "full-stack-app",
  "version": "1.0.0",
  "description": "A complete full-stack application",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "concurrently \\"npm run server\\" \\"npm run client\\"",
    "server": "nodemon server/index.js",
    "client": "cd client && npm start",
    "build": "cd client && npm run build",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "concurrently": "^8.2.0",
    "jest": "^29.6.1"
  }
}`,
          },
          {
            path: "server/index.js",
            content: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));
// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
// Start server
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
          },
          {
            path: "client/package.json",
            content: `{
  "name": "client",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.4.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "proxy": "http://localhost:3001",
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,
          },
          {
            path: "client/src/index.js",
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
          },
          {
            path: "client/src/App.js",
            content: `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Fetch data from the API
    axios.get('/api')
      .then(response => {
        setMessage(response.data.message);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setMessage('Error connecting to the server');
        setLoading(false);
      });
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <h1>Full Stack Application</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <p>{message}</p>
        )}
      </header>
    </div>
  );
}
export default App;`,
          },
        ],
        directories: ["server", "client", "client/src"],
      },
    };
    this.technologyFiles = {
      react: [
        {
          path: "src/components/ExampleComponent.js",
          content: `import React from 'react';
import './ExampleComponent.css';
function ExampleComponent() {
  return (
    <div className="example-component">
      <h2>Example Component</h2>
      <p>This is an example React component.</p>
    </div>
  );
}
export default ExampleComponent;`,
        },
        {
          path: "src/components/ExampleComponent.css",
          content: `.example-component {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 10px;
  background-color: #f9f9f9;
}`,
        },
      ],
      express: [
        {
          path: "src/routes/example.js",
          content: `const express = require('express');
const router = express.Router();
// GET /api/example
router.get('/', (req, res) => {
  res.json({ message: 'Example route' });
});
module.exports = router;`,
        },
      ],
      node: [
        {
          path: "src/utils/example.js",
          content: `// Example utility function
function exampleFunction(input) {
  return \`Processed: \${input}\`;
}
module.exports = { exampleFunction };`,
        },
      ],
    };
  }
  async getTemplate(templateId) {
    return this.templates[templateId] || null;
  }
  async getAllTemplates() {
    return Object.values(this.templates);
  }
  async getTechnologyFiles(technology) {
    return this.technologyFiles[technology] || [];
  }
  async addTemplate(template) {
    this.templates[template.id] = template;
    return template;
  }
  async updateTemplate(templateId, updates) {
    if (this.templates[templateId]) {
      this.templates[templateId] = {
        ...this.templates[templateId],
        ...updates,
      };
      return this.templates[templateId];
    }
    return null;
  }
  async deleteTemplate(templateId) {
    if (this.templates[templateId]) {
      const deleted = this.templates[templateId];
      delete this.templates[templateId];
      return deleted;
    }
    return null;
  }
}
module.exports = { TemplateLibrary };
