#!/bin/bash

# Optional post-commit hook that automatically pushes to GitHub after each commit
# This will sync changes to Lovable automatically
# 
# WARNING: This will push after EVERY commit. Use with caution!
# 
# To enable: Copy this file to .git/hooks/post-commit and make it executable
# To disable: Remove or rename .git/hooks/post-commit

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we should skip auto-push (useful for testing)
if [ "$SKIP_AUTO_PUSH" = "true" ]; then
    exit 0
fi

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)

# Skip if on a detached HEAD or if branch is not tracking a remote
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Branch '$current_branch' is not tracking a remote. Skipping auto-push.${NC}"
    exit 0
fi

# Check if there are commits to push
if git diff --quiet HEAD @{u}; then
    # Already up to date
    exit 0
fi

# Push to GitHub
echo -e "${GREEN}⬆️  Auto-pushing to GitHub (will sync to Lovable)...${NC}"
if git push; then
    echo -e "${GREEN}✅ Auto-pushed successfully! Changes will sync to Lovable.${NC}"
else
    echo -e "${RED}❌ Auto-push failed. You may need to push manually.${NC}"
    exit 1
fi
