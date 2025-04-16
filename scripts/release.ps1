#!/usr/bin/env pwsh

<#
.SYNOPSIS
    ScaleUp Admin HeroUI Release Script for PowerShell
.DESCRIPTION
    This script automates the release process for the ScaleUp Admin HeroUI project.
.PARAMETER version
    The version number to release. If not provided, it will be determined automatically
    based on conventional commits since the last tag.
.EXAMPLE
    .\scripts\release.ps1
    .\scripts\release.ps1 0.2.0
#>

param (
    [string]$version
)

# Output color settings
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

# Function to execute a command
function Exec-Command {
    param([string]$command)
    try {
        $output = Invoke-Expression $command
        return $output
    }
    catch {
        Write-Host "Error executing command: $command" -ForegroundColor $ErrorColor
        Write-Host $_.Exception.Message -ForegroundColor $ErrorColor
        return ""
    }
}

# Function to confirm an action
function Confirm-Action {
    param([string]$message)
    $confirm = Read-Host "$message [y/N]"
    return ($confirm.ToLower() -eq "y" -or $confirm.ToLower() -eq "yes")
}

# Function to update the changelog
function Update-Changelog {
    param([string]$version, [string]$date)
    try {
        $changelogPath = Join-Path $PWD "CHANGELOG.md"
        if (-not (Test-Path $changelogPath)) {
            Write-Host "⚠️  CHANGELOG.md doesn't exist. Consider creating one." -ForegroundColor $WarningColor
            return
        }
        
        $content = Get-Content $changelogPath -Raw
        
        # Check if version already exists in changelog
        if ($content -match "\[${version}\]") {
            Write-Host "✓ Version $version is already in CHANGELOG.md" -ForegroundColor $SuccessColor
            return
        }
        
        # Add new version entry
        $updatedContent = $content -replace "## \[Unreleased\]", "## [Unreleased]`n`n## [$version] - $date"
        Set-Content -Path $changelogPath -Value $updatedContent
        Write-Host "📝 Added version $version to CHANGELOG.md" -ForegroundColor $SuccessColor
    }
    catch {
        Write-Host "Error updating CHANGELOG.md:" -ForegroundColor $ErrorColor
        Write-Host $_.Exception.Message -ForegroundColor $ErrorColor
    }
}

# Main release function
function Start-Release {
    # If version is not provided, determine it automatically
    if (-not $version) {
        Write-Host "No version specified, determining automatically..." -ForegroundColor $InfoColor
        $version = node ./scripts/determine-version.js
        
        # Confirm the automatically determined version
        if (-not (Confirm-Action "Do you want to proceed with version $version?")) {
            Write-Host "❌ Release process cancelled." -ForegroundColor $ErrorColor
            return
        }
    }
    
    # Get current branch
    $currentBranch = Exec-Command "git rev-parse --abbrev-ref HEAD"
    $releaseBranch = "release/v$version"
    $tagName = "v$version"
    
    # Get current date
    $currentDate = Get-Date -Format "yyyy-MM-dd"
    
    Write-Host "🚀 Starting release process for version $version..." -ForegroundColor $InfoColor
    
    # Check if the release branch already exists
    $branchExists = $null -ne (Exec-Command "git show-ref --verify --quiet refs/heads/$releaseBranch 2>$null; if (`$?) { echo 'exists' } else { echo 'not_exists' }")
    
    if ($branchExists -eq "exists") {
        Write-Host "⚠️  Release branch $releaseBranch already exists." -ForegroundColor $WarningColor
        
        if (-not (Confirm-Action "Do you want to continue with the existing branch?")) {
            Write-Host "❌ Release process cancelled." -ForegroundColor $ErrorColor
            return
        }
        
        Exec-Command "git checkout $releaseBranch"
    }
    else {
        Write-Host "📁 Creating release branch $releaseBranch from $currentBranch..." -ForegroundColor $InfoColor
        Exec-Command "git checkout -b $releaseBranch"
    }
    
    # Update version in package.json
    Write-Host "📝 Updating version in package.json..." -ForegroundColor $InfoColor
    Exec-Command "npm version $version --no-git-tag-version"
    
    # Check and update CHANGELOG.md
    Write-Host "📝 Checking CHANGELOG.md..." -ForegroundColor $InfoColor
    $changelogPath = Join-Path $PWD "CHANGELOG.md"
    if (Test-Path $changelogPath) {
        $changelogContent = Get-Content $changelogPath -Raw
        
        if ($changelogContent -match "\[${version}\]") {
            Write-Host "✓ Version $version is already in CHANGELOG.md" -ForegroundColor $SuccessColor
        }
        else {
            Write-Host "⚠️  Version $version is not in CHANGELOG.md." -ForegroundColor $WarningColor
            
            if (Confirm-Action "Do you want to add a placeholder for this version in the CHANGELOG?") {
                Update-Changelog $version $currentDate
            }
        }
    }
    else {
        Write-Host "⚠️  CHANGELOG.md doesn't exist. Consider creating one." -ForegroundColor $WarningColor
    }
    
    # Commit changes
    Write-Host "💾 Committing version changes..." -ForegroundColor $InfoColor
    Exec-Command "git add package.json package-lock.json CHANGELOG.md 2>$null"
    Exec-Command "git commit -m `"chore: prepare release v$version`""
    
    # Tag the release
    Write-Host "🏷️  Tagging release as $tagName..." -ForegroundColor $InfoColor
    Exec-Command "git tag -a $tagName -m `"Release $tagName`""
    
    # Merge to master
    Write-Host "🔀 Merging release branch to master..." -ForegroundColor $InfoColor
    Exec-Command "git checkout master"
    Exec-Command "git merge --no-ff $releaseBranch -m `"chore: merge release v$version to master`""
    
    Write-Host "🎉 Release v$version is ready!" -ForegroundColor $SuccessColor
    Write-Host ""
    Write-Host "To complete the release, run:" -ForegroundColor $InfoColor
    Write-Host "  git push origin master" -ForegroundColor $InfoColor
    Write-Host "  git push origin $tagName" -ForegroundColor $InfoColor
    Write-Host ""
    Write-Host "To create a GitHub release (if applicable):" -ForegroundColor $InfoColor
    Write-Host "  1. Go to GitHub > Releases > Draft a new release" -ForegroundColor $InfoColor
    Write-Host "  2. Choose the tag: $tagName" -ForegroundColor $InfoColor
    Write-Host "  3. Title: Release v$version" -ForegroundColor $InfoColor
    Write-Host "  4. Description: Copy the relevant section from CHANGELOG.md" -ForegroundColor $InfoColor
    Write-Host ""
    Write-Host "To continue development:" -ForegroundColor $InfoColor
    Write-Host "  git checkout $currentBranch" -ForegroundColor $InfoColor
}

# Run the release process
try {
    Start-Release
}
catch {
    Write-Host "Release process failed:" -ForegroundColor $ErrorColor
    Write-Host $_.Exception.Message -ForegroundColor $ErrorColor
    exit 1
} 