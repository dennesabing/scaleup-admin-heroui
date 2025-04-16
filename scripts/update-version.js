#!/usr/bin/env node

/**
 * This script automatically updates the package.json version based on the latest version in CHANGELOG.md
 * It also updates the version references in other files if needed
 */

const fs = require('fs');
const path = require('path');

// Function to extract version from CHANGELOG.md
function extractVersionFromChangelog() {
  try {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    
    // Look for the latest version using regex
    const versionMatch = changelog.match(/## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}/);
    
    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    } else {
      console.error('No version found in CHANGELOG.md');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error reading CHANGELOG.md:', error);
    process.exit(1);
  }
}

// Function to update package.json version
function updatePackageJsonVersion(version) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log(`Updating version from ${packageJson.version} to ${version}`);
    packageJson.version = version;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ Updated package.json version successfully');
  } catch (error) {
    console.error('Error updating package.json:', error);
    process.exit(1);
  }
}

// Main execution
const version = extractVersionFromChangelog();
updatePackageJsonVersion(version);

console.log(`\n🎉 Version updated to ${version}`); 