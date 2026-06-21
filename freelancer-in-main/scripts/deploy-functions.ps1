# Supabase Edge Functions deployment script (PowerShell)
# Run this script to deploy all edge functions to your Supabase project

Write-Host "Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "Error: Supabase CLI is not installed"
    Write-Host "Install it from: https://github.com/supabase/cli"
    exit 1
}

# Link to Supabase project (if not already linked)
Write-Host "Linking to Supabase project..."
supabase link --project-ref maysttckdfnnzvfeujaj

# List of functions to deploy
$functions = @(
    "mpin-status",
    "mpin-set",
    "mpin-verify",
    "forgot-mpin-options",
    "forgot-mpin-verify-totp",
    "forgot-mpin-verify-sq",
    "user-totp",
    "totp-setup-init",
    "totp-setup-verify",
    "totp-verify",
    "totp-status",
    "totp-disable",
    "security-questions-save",
    "security-questions-status"
)

# Deploy each function
foreach ($func in $functions) {
    Write-Host "Deploying $func..."
    supabase functions deploy $func
}

Write-Host "All functions deployed successfully!"