# Helper script to push changes to GitHub, which will automatically sync to Lovable
# Usage: .\scripts\push-to-lovable.ps1 [commit-message]

param(
    [string]$CommitMessage = ""
)

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check if there are any changes to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Get commit message from argument or prompt
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = "Update project files"
    }
}

Write-Host "🚀 Pushing changes to GitHub (will auto-sync to Lovable)`n" -ForegroundColor Green

# Show what will be committed
Write-Host "📝 Changes to be committed:" -ForegroundColor Green
git status --short

# Stage all changes
Write-Host "`n📦 Staging changes..." -ForegroundColor Green
git add .

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Green
git commit -m $CommitMessage

# Push to GitHub
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Green
if (git push) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "✨ Changes will automatically sync to Lovable`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}
