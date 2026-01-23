#!/bin/bash

# Helper script to push changes to GitHub, which will automatically sync to Lovable
# Usage: ./scripts/push-to-lovable.sh [commit-message]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Pushing changes to GitHub (will auto-sync to Lovable)${NC}\n"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    exit 0
fi

# Get commit message from argument or prompt
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter commit message (or press Enter for default):${NC}"
    read -r commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Update project files"
    fi
else
    commit_message="$1"
fi

# Show what will be committed
echo -e "\n${GREEN}📝 Changes to be committed:${NC}"
git status --short

# Stage all changes
echo -e "\n${GREEN}📦 Staging changes...${NC}"
git add .

# Commit changes
echo -e "${GREEN}💾 Committing changes...${NC}"
git commit -m "$commit_message"

# Push to GitHub
echo -e "${GREEN}⬆️  Pushing to GitHub...${NC}"
if git push; then
    echo -e "\n${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}✨ Changes will automatically sync to Lovable${NC}\n"
else
    echo -e "\n${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi
