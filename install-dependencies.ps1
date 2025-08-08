# install-dependencies.ps1
Write-Host "Installing davemode-v2 dependencies..." -ForegroundColor Green

try {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Installing ChromaDB specifically..." -ForegroundColor Yellow
    npm install chromadb@1.8.1
    
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error installing dependencies: $_" -ForegroundColor Red
    exit 1
}