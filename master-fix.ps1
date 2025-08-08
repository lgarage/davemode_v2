# master-fix.ps1
Write-Host "Starting davemode-v2 fix process..." -ForegroundColor Green

# Step 1: Install dependencies
Write-Host "`nStep 1: Installing dependencies..." -ForegroundColor Cyan
.\install-dependencies.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency installation failed. Exiting." -ForegroundColor Red
    exit 1
}

# Step 2: Create .env file
Write-Host "`nStep 2: Creating .env file..." -ForegroundColor Cyan
.\create-env-file.ps1

# Step 3: Update vector-memory.js
Write-Host "`nStep 3: Updating vector-memory.js..." -ForegroundColor Cyan
.\update-vector-memory.ps1

# Step 4: Update persistent-memory.js
Write-Host "`nStep 4: Updating persistent-memory.js..." -ForegroundColor Cyan
.\update-persistent-memory.ps1

# Step 5: Initialize ChromaDB
Write-Host "`nStep 5: Initializing ChromaDB..." -ForegroundColor Cyan
.\init-chromadb.ps1

Write-Host "`nAll fixes completed successfully!" -ForegroundColor Green
Write-Host "You can now start the server with: npm run dev" -ForegroundColor Yellow