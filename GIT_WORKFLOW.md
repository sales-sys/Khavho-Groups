# Git Workflow for Khavho Groups Project

## Daily Workflow Commands

### 1. Check Status
```bash
git status
```

### 2. Add Changes
```bash
# Add all changes
git add .

# Or add specific files
git add filename.html
```

### 3. Commit Changes
```bash
git commit -m "Your commit message describing what you changed"
```

### 4. Push to GitHub
```bash
git push
```

## Common Commit Messages Examples

```bash
git commit -m "feat: Add new contact form validation"
git commit -m "fix: Resolve mobile menu hamburger issue"
git commit -m "style: Update admin panel colors"
git commit -m "docs: Update README with setup instructions"
git commit -m "admin: Add new message filtering features"
```

## Quick Setup Commands (One-time)

```bash
# Initialize repository
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Complete Khavho Groups website with admin panel"

# Rename branch to main
git branch -M main

# Add GitHub remote (replace YourUsername)
git remote add origin https://github.com/YourUsername/Khavho-Groups.git

# Push to GitHub
git push -u origin main
```

## Daily Use (After setup)

```bash
# Check what changed
git status

# Add changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push
```

## Checking GitHub Sync

```bash
# See remote repository
git remote -v

# See commit history
git log --oneline

# See current branch
git branch
```