#!/bin/bash
# ScaleUp Admin HeroUI Release Script
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 0.2.0

set -e  # Exit immediately if a command exits with a non-zero status

# Check if version parameter is provided
if [ -z "$1" ]; then
  echo "Error: Version number is required."
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 0.2.0"
  exit 1
fi

VERSION=$1
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
RELEASE_BRANCH="release/v$VERSION"
TAG_NAME="v$VERSION"

# Function to confirm actions
confirm() {
  read -r -p "$1 [y/N] " response
  case "$response" in
    [yY][eE][sS]|[yY]) 
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Get current date in YYYY-MM-DD format
CURRENT_DATE=$(date +"%Y-%m-%d")

echo "🚀 Starting release process for version $VERSION..."

# Check if the release branch already exists
if git show-ref --quiet refs/heads/$RELEASE_BRANCH; then
  echo "⚠️  Release branch $RELEASE_BRANCH already exists."
  if confirm "Do you want to continue with the existing branch?"; then
    git checkout $RELEASE_BRANCH
  else
    echo "❌ Release process cancelled."
    exit 1
  fi
else
  echo "📁 Creating release branch $RELEASE_BRANCH from $CURRENT_BRANCH..."
  git checkout -b $RELEASE_BRANCH
fi

# Update version in package.json
echo "📝 Updating version in package.json..."
npm version $VERSION --no-git-tag-version

# Check if CHANGELOG.md exists and update it
if [ -f "CHANGELOG.md" ]; then
  echo "📝 Checking CHANGELOG.md..."
  
  # Check if the version is already in the changelog
  if grep -q "## \[$VERSION\]" CHANGELOG.md; then
    echo "✓ Version $VERSION is already in CHANGELOG.md"
  else
    echo "⚠️  Version $VERSION is not in CHANGELOG.md."
    if confirm "Do you want to add a placeholder for this version in the CHANGELOG?"; then
      # Add new version to changelog
      echo "📝 Adding version $VERSION to CHANGELOG.md..."
      sed -i.bak "s/## \[Unreleased\]/## [Unreleased]\n\n## [$VERSION] - $CURRENT_DATE/" CHANGELOG.md
      rm CHANGELOG.md.bak 2> /dev/null || true
    fi
  fi
else
  echo "⚠️  CHANGELOG.md doesn't exist. Consider creating one."
fi

# Commit changes
echo "💾 Committing version changes..."
git add package.json package-lock.json CHANGELOG.md 2> /dev/null || true
git commit -m "chore: prepare release v$VERSION"

# Tag the release
echo "🏷️  Tagging release as $TAG_NAME..."
git tag -a $TAG_NAME -m "Release $TAG_NAME"

# Merge to master
echo "🔀 Merging release branch to master..."
git checkout master
git merge --no-ff $RELEASE_BRANCH -m "chore: merge release v$VERSION to master"

echo "🎉 Release v$VERSION is ready!"
echo ""
echo "To complete the release, run:"
echo "  git push origin master"
echo "  git push origin $TAG_NAME"
echo ""
echo "To create a GitHub release (if applicable):"
echo "  1. Go to GitHub > Releases > Draft a new release"
echo "  2. Choose the tag: $TAG_NAME"
echo "  3. Title: Release v$VERSION"
echo "  4. Description: Copy the relevant section from CHANGELOG.md"
echo ""
echo "To continue development:"
echo "  git checkout $CURRENT_BRANCH" 