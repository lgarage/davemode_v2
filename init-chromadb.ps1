# init-chromadb.ps1
Write-Host "Initializing ChromaDB..." -ForegroundColor Green

try {
    # Run the init-chroma.js script
    node init-chroma.js
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ChromaDB initialization failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "ChromaDB initialized successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error initializing ChromaDB: $_" -ForegroundColor Red
    exit 1
}