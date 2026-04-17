#!/bin/bash
# Supabase Edge Functions deployment script
# Run this script to deploy all edge functions to your Supabase project

echo "Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it from: https://github.com/supabase/cli"
    exit 1
fi

# Link to Supabase project (if not already linked)
supabase link --project-ref maysttckdfnnzvfeujaj

# Deploy all edge functions
echo "Deploying mpin-status..."
supabase functions deploy mpin-status

echo "Deploying mpin-set..."
supabase functions deploy mpin-set

echo "Deploying mpin-verify..."
supabase functions deploy mpin-verify

echo "Deploying forgot-mpin-options..."
supabase functions deploy forgot-mpin-options

echo "Deploying forgot-mpin-verify-totp..."
supabase functions deploy forgot-mpin-verify-totp

echo "Deploying forgot-mpin-verify-sq..."
supabase functions deploy forgot-mpin-verify-sq

echo "Deploying user-totp..."
supabase functions deploy user-totp

echo "Deploying totp-setup-init..."
supabase functions deploy totp-setup-init

echo "Deploying totp-setup-verify..."
supabase functions deploy totp-setup-verify

echo "Deploying totp-verify..."
supabase functions deploy totp-verify

echo "Deploying totp-status..."
supabase functions deploy totp-status

echo "Deploying totp-disable..."
supabase functions deploy totp-disable

echo "Deploying security-questions-save..."
supabase functions deploy security-questions-save

echo "Deploying security-questions-status..."
supabase functions deploy security-questions-status

echo "All functions deployed successfully!"