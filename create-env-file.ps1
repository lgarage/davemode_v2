# create-env-file.ps1
Write-Host "Creating .env file..." -ForegroundColor Green

$envPath = ".\.env"

if (Test-Path $envPath) {
    Write-Host ".env file already exists. Skipping creation." -ForegroundColor Yellow
    exit 0
}

$envContent = @"
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=dave_mode
DB_PASSWORD=password
DB_PORT=5432

# ChromaDB
CHROMA_DB_PATH=./chroma_db

# Together.ai
TOGETHER_API_KEY=your_together_api_key_here
TOGETHER_API_URL=https://api.together.xyz

# CodeSandbox
CSB_API_KEY=your_codesandbox_api_key_here

# Session
SESSION_SECRET=dave-mode-secret-key-change-in-production
"@

try {
    Set-Content -Path $envPath -Value $envContent
    Write-Host ".env file created successfully!" -ForegroundColor Green
    Write-Host "Please update the API keys in .env file with your actual keys." -ForegroundColor Yellow
} catch {
    Write-Host "Error creating .env file: $_" -ForegroundColor Red
    exit 1
}