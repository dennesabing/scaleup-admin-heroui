#!/usr/bin/env node

/**
 * Determine Version Script
 * 
 * This script analyzes git commits since the last tag and determines the appropriate
 * version bump (major, minor, patch) based on conventional commit messages.
 * 
 * Usage:
 *   node ./scripts/determine-version.js
 * 
 * Return:
 *   A version string (e.g., "1.2.3") that the release scripts can use
 */

const { execSync } = require('child_process');
const semver = require('semver');

// Configuration
const CONVENTIONAL_COMMIT_TYPES = {
  major: ['BREAKING CHANGE', 'breaking change'],
  minor: ['feat', 'feature'],
  patch: ['fix', 'perf', 'refactor']
};

// Get the latest version tag
function getLatestVersionTag() {
  try {
    // Get all tags sorted by version
    const tags = execSync('git tag -l "v*" --sort=-v:refname')
      .toString()
      .trim()
      .split('\n')
      .filter(tag => /^v\d+\.\d+\.\d+$/.test(tag));

    if (tags.length === 0) {
      return '0.0.0'; // No tags found, start with 0.0.0
    }

    return tags[0].replace(/^v/, ''); // Remove 'v' prefix
  } catch (error) {
    console.error('Error getting latest version tag:', error.message);
    return '0.0.0';
  }
}

// Get commits since the last tag
function getCommitsSinceLastTag(latestTag) {
  try {
    const compareRef = latestTag === '0.0.0' ? '--all' : `v${latestTag}..HEAD`;
    return execSync(`git log ${compareRef} --pretty=format:"%s %b"`)
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.error('Error getting commits since last tag:', error.message);
    return [];
  }
}

// Determine the type of version bump based on conventional commits
function determineVersionBump(commits) {
  let bump = 'patch'; // Default to patch

  for (const commit of commits) {
    const commitLower = commit.toLowerCase();
    
    // Check for breaking changes
    if (CONVENTIONAL_COMMIT_TYPES.major.some(type => commitLower.includes(type))) {
      return 'major';
    }
    
    // Check for features (only update if we haven't found a major change)
    if (bump !== 'major' && CONVENTIONAL_COMMIT_TYPES.minor.some(type => 
      commitLower.startsWith(`${type}:`) || commitLower.startsWith(`${type}(`)
    )) {
      bump = 'minor';
    }
    
    // Check for patches (only update if we haven't found a major or minor change)
    if (bump === 'patch' && CONVENTIONAL_COMMIT_TYPES.patch.some(type => 
      commitLower.startsWith(`${type}:`) || commitLower.startsWith(`${type}(`)
    )) {
      bump = 'patch';
    }
  }

  return bump;
}

// Main function
function determineVersion() {
  try {
    // Get the latest version tag
    const latestVersion = getLatestVersionTag();
    
    // Get commits since the last tag
    const commits = getCommitsSinceLastTag(latestVersion);
    
    // If no commits since last tag, use the latest version
    if (commits.length === 0 && latestVersion !== '0.0.0') {
      return latestVersion;
    }
    
    // Determine the type of version bump
    const bumpType = determineVersionBump(commits);
    
    // Calculate the new version
    const newVersion = semver.inc(latestVersion, bumpType);
    
    return newVersion;
  } catch (error) {
    console.error('Error determining version:', error.message);
    return '0.1.0'; // Return a default version if something goes wrong
  }
}

// Run the script
const newVersion = determineVersion();
console.log(newVersion);

module.exports = determineVersion; 