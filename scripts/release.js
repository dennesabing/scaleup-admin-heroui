#!/usr/bin/env node

/**
 * ScaleUp Admin HeroUI Release Script
 * Usage: node scripts/release.js [version]
 * Example: node scripts/release.js
 *          node scripts/release.js 0.2.0
 * 
 * If version is not provided, it will be automatically determined based on 
 * conventional commits since the last tag.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const determineVersion = require('./determine-version');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utils
const execCommand = (command) => {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return '';
  }
};

const confirm = async (message) => {
  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
};

// Function to modify the changelog
const updateChangelog = (version, date) => {
  try {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    if (!fs.existsSync(changelogPath)) {
      console.warn('⚠️  CHANGELOG.md doesn\'t exist. Consider creating one.');
      return;
    }
    
    const content = fs.readFileSync(changelogPath, 'utf8');
    
    // Check if version already exists in changelog
    if (content.includes(`## [${version}]`)) {
      console.log(`✓ Version ${version} is already in CHANGELOG.md`);
      return;
    }
    
    // Add new version entry
    const updatedContent = content.replace(
      '## [Unreleased]', 
      `## [Unreleased]\n\n## [${version}] - ${date}`
    );
    
    fs.writeFileSync(changelogPath, updatedContent);
    console.log(`📝 Added version ${version} to CHANGELOG.md`);
  } catch (error) {
    console.error('Error updating CHANGELOG.md:');
    console.error(error.message);
  }
};

// Main function
const release = async () => {
  let version = process.argv[2];
  
  // If version is not provided, automatically determine it
  if (!version) {
    console.log('No version specified, determining automatically...');
    version = determineVersion();
    
    // Confirm the automatically determined version
    const confirmAutoVersion = await confirm(`Do you want to proceed with version ${version}?`);
    if (!confirmAutoVersion) {
      console.log('❌ Release process cancelled.');
      rl.close();
      return;
    }
  }
  
  // Get current branch
  const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD');
  const releaseBranch = `release/v${version}`;
  const tagName = `v${version}`;
  
  // Get current date
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  console.log(`🚀 Starting release process for version ${version}...`);
  
  // Check if the release branch already exists
  const branchExists = execCommand(`git show-ref --quiet refs/heads/${releaseBranch} || echo "not_exists"`) !== 'not_exists';
  
  if (branchExists) {
    console.log(`⚠️  Release branch ${releaseBranch} already exists.`);
    const continueWithExisting = await confirm('Do you want to continue with the existing branch?');
    
    if (!continueWithExisting) {
      console.log('❌ Release process cancelled.');
      rl.close();
      return;
    }
    
    execCommand(`git checkout ${releaseBranch}`);
  } else {
    console.log(`📁 Creating release branch ${releaseBranch} from ${currentBranch}...`);
    execCommand(`git checkout -b ${releaseBranch}`);
  }
  
  // Update version in package.json
  console.log(`📝 Updating version in package.json...`);
  execCommand(`npm version ${version} --no-git-tag-version`);
  
  // Check and update CHANGELOG.md
  console.log(`📝 Checking CHANGELOG.md...`);
  if (fs.existsSync(path.join(process.cwd(), 'CHANGELOG.md'))) {
    const changelogContent = fs.readFileSync(path.join(process.cwd(), 'CHANGELOG.md'), 'utf8');
    
    if (changelogContent.includes(`## [${version}]`)) {
      console.log(`✓ Version ${version} is already in CHANGELOG.md`);
    } else {
      console.log(`⚠️  Version ${version} is not in CHANGELOG.md.`);
      const addToChangelog = await confirm('Do you want to add a placeholder for this version in the CHANGELOG?');
      
      if (addToChangelog) {
        updateChangelog(version, currentDate);
      }
    }
  } else {
    console.log(`⚠️  CHANGELOG.md doesn't exist. Consider creating one.`);
  }
  
  // Commit changes
  console.log(`💾 Committing version changes...`);
  execCommand(`git add package.json package-lock.json CHANGELOG.md || true`);
  execCommand(`git commit -m "chore: prepare release v${version}"`);
  
  // Tag the release
  console.log(`🏷️  Tagging release as ${tagName}...`);
  execCommand(`git tag -a ${tagName} -m "Release ${tagName}"`);
  
  // Merge to master
  console.log(`🔀 Merging release branch to master...`);
  execCommand(`git checkout master`);
  execCommand(`git merge --no-ff ${releaseBranch} -m "chore: merge release v${version} to master"`);
  
  console.log(`🎉 Release v${version} is ready!`);
  console.log('');
  console.log('To complete the release, run:');
  console.log(`  git push origin master`);
  console.log(`  git push origin ${tagName}`);
  console.log('');
  console.log('To create a GitHub release (if applicable):');
  console.log('  1. Go to GitHub > Releases > Draft a new release');
  console.log(`  2. Choose the tag: ${tagName}`);
  console.log(`  3. Title: Release v${version}`);
  console.log('  4. Description: Copy the relevant section from CHANGELOG.md');
  console.log('');
  console.log('To continue development:');
  console.log(`  git checkout ${currentBranch}`);
  
  rl.close();
};

// Run the release process
release().catch(error => {
  console.error('Release process failed:');
  console.error(error);
  rl.close();
  process.exit(1);
}); 