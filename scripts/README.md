# Git Helper Scripts

This directory contains helper scripts to make syncing your local changes to GitHub (and Lovable) easier.

## Available Scripts

### `push-to-lovable.sh` / `push-to-lovable.ps1`

Helper scripts that streamline the process of committing and pushing changes to GitHub.

**Usage:**

**macOS/Linux:**
```bash
./scripts/push-to-lovable.sh "Your commit message"
```

**Windows (PowerShell):**
```powershell
.\scripts\push-to-lovable.ps1 "Your commit message"
```

**What it does:**
1. Checks if there are changes to commit
2. Shows you what will be committed
3. Stages all changes
4. Commits with your message
5. Pushes to GitHub
6. GitHub automatically syncs to Lovable

### `post-commit-hook.sh` (Optional)

An optional git hook that automatically pushes to GitHub after every commit.

**⚠️ WARNING:** This will push after EVERY commit. Only enable if you're comfortable with automatic pushes.

**To enable:**

1. Copy the hook to your `.git/hooks` directory:
   ```bash
   cp scripts/post-commit-hook.sh .git/hooks/post-commit
   chmod +x .git/hooks/post-commit
   ```

2. Test it by making a commit:
   ```bash
   git commit --allow-empty -m "Test auto-push"
   ```

**To disable:**

Simply remove or rename the hook:
```bash
mv .git/hooks/post-commit .git/hooks/post-commit.disabled
```

**To temporarily skip auto-push:**

Set the `SKIP_AUTO_PUSH` environment variable:
```bash
SKIP_AUTO_PUSH=true git commit -m "Don't auto-push this"
```

## Sync Flow

```
Local IDE Changes
    ↓
[Manual: git add, commit, push] OR [Auto: post-commit hook]
    ↓
GitHub Repository
    ↓
[Automatic: Lovable syncs from GitHub]
    ↓
Lovable Platform
```

## Recommendations

- **For most users**: Use the `push-to-lovable.sh` script for manual control
- **For frequent small commits**: Consider enabling the post-commit hook
- **For safety**: Keep the manual workflow to review changes before pushing
