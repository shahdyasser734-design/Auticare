# Deploying AUTICARE to Vercel

This file explains how to push the local changes and deploy to Vercel using the provided script.

1) Set environment variables in PowerShell (example):

```powershell
$env:GIT_REMOTE = 'https://github.com/yourname/AUTICARE.git'
$env:VERCEL_TOKEN = 'your_vercel_token'   # optional if you prefer interactive login
$env:GIT_USER_NAME = 'Your Name'
$env:GIT_USER_EMAIL = 'you@example.com'
./scripts/deploy_to_vercel.ps1
```

2) If you prefer to use the Vercel web UI, push the repository first, then follow the UI steps to import the repo and set `VITE_API_URL` as an environment variable.

3) Post-deploy verification:
- Open the production URL shown in the Vercel dashboard.
- Test signup/login and API-driven pages.
