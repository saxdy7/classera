#!/usr/bin/env pwsh
# Quick Fix Script for RLS Sign-Up Error
# Run this script to apply the fix to your Supabase database

Write-Host "🔧 Classera RLS Fix Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if ($supabaseInstalled) {
    Write-Host "✅ Supabase CLI detected" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Applying RLS fix migration..." -ForegroundColor Yellow
    
    # Push the migration
    npx supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🧪 Test your sign-up at: http://localhost:3000/auth/student" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed. Please run manually in Supabase Dashboard." -ForegroundColor Red
        Write-Host "   See FIX_RLS_SIGNUP_ERROR.md for instructions" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Supabase CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Manual Fix Required:" -ForegroundColor Cyan
    Write-Host "   1. Open Supabase Dashboard (https://supabase.com)" -ForegroundColor White
    Write-Host "   2. Go to SQL Editor → New Query" -ForegroundColor White
    Write-Host "   3. Copy contents of: supabase/migrations/107_COMPLETE_FIX_USERS_RLS.sql" -ForegroundColor White
    Write-Host "   4. Paste and click 'Run'" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Full instructions: FIX_RLS_SIGNUP_ERROR.md" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
