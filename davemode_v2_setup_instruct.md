Dave Mode 2.0 - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- ChromaDB (or a compatible vector database)
- Together.ai API key

## Getting Your Together.ai API Key

1. Sign up for an account at [Together.ai](https://together.ai/)
2. Navigate to your account settings or API keys section
3. Generate a new API key
4. Copy the API key for use in the environment configuration

## Environment Configuration

Create a `.env` file in the root directory with the following content:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=dave_mode
DB_PASSWORD=password
DB_PORT=5432

# Vector Database Configuration
CHROMA_DB_PATH=http://localhost:8000

# Together.ai Configuration
TOGETHER_API_KEY=your_together_api_key
TOGETHER_API_URL=https://api.together.xyz

# Session Secret
SESSION_SECRET=your_secure_session_secret_here

# CodeSandbox Configuration
CSB_API_KEY=your_codesandbox_api_key
```
