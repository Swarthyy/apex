---
description: commit and push all changes to GitHub
---
// turbo-all

1. Stage all changes
```bash
cd c:\APEX && git add -A
```

2. Commit with a descriptive message (replace the message as needed)
```bash
cd c:\APEX && git commit -m "update: [describe changes]"
```

3. Push to GitHub (this also happens automatically via post-commit hook)
```bash
cd c:\APEX && git push origin main
```
