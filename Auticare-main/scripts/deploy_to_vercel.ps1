<#
Automated deployment script for Windows PowerShell.

Requirements (set as environment variables before running):
 - GIT_REMOTE (e.g. https://github.com/USERNAME/REPO.git)
 - VERCEL_TOKEN (Personal Token from Vercel) OR run vercel login interactively
 - Optional: GIT_USER_NAME, GIT_USER_EMAIL

Usage:
 $env:GIT_REMOTE = 'https://github.com/yourname/AUTICARE.git'
 $env:VERCEL_TOKEN = 'your_vercel_token'
 ./deploy_to_vercel.ps1
#>

Set-StrictMode -Version Latest

function Abort([string]$msg) {
    Write-Error $msg
    exit 1
}

$cwd = Get-Location
Write-Host "Working directory: $cwd"

if (-not $env:GIT_REMOTE) {
    Abort "Environment variable GIT_REMOTE is not set. Set it to your GitHub repo URL and rerun."
}

Write-Host "Initializing git repository (if missing)..."
if (-not (Test-Path .git)) {
    git init || Abort "git init failed"
}

if ($env:GIT_USER_NAME) { git config user.name $env:GIT_USER_NAME }
if ($env:GIT_USER_EMAIL) { git config user.email $env:GIT_USER_EMAIL }

git add . || Abort "git add failed"

try {
    git commit -m "chore: prepare vercel deployment" -q
} catch {
    Write-Host "No changes to commit or commit failed. Continuing..."
}

git branch -M main 2>$null

# Add or update remote
$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating existing remote 'origin' to $env:GIT_REMOTE"
    git remote set-url origin $env:GIT_REMOTE || Abort "Failed to set remote URL"
} else {
    Write-Host "Adding remote 'origin' -> $env:GIT_REMOTE"
    git remote add origin $env:GIT_REMOTE || Abort "Failed to add remote"
}

Write-Host "Pushing to origin/main..."
git push -u origin main --force || Abort "git push failed. Check credentials/permissions."

Write-Host "Installing dependencies and building..."
npm ci || Abort "npm ci failed"
npm run build || Abort "npm run build failed"

if ($env:VERCEL_TOKEN) {
    Write-Host "Deploying with Vercel CLI using VERCEL_TOKEN..."
    npm i -g vercel --silent || Abort "Failed to install vercel CLI"

    # Ensure env var on Vercel
    vercel env add VITE_API_URL production https://auticare-production-828c.up.railway.app/api --token $env:VERCEL_TOKEN --yes 2>$null | Out-Null

    # Deploy
    vercel --prod --token $env:VERCEL_TOKEN --confirm || Abort "Vercel deploy failed"
    Write-Host "Vercel deploy finished. Check Vercel dashboard for the production URL."
} else {
    Write-Host "VERCEL_TOKEN not set. You must run 'vercel login' interactively and then run 'vercel --prod' manually, or set VERCEL_TOKEN and re-run this script."
}

Write-Host "Done."
