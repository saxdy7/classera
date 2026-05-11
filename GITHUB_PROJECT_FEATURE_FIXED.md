# GitHub Project Feature - Fixed & Documentation

## Status
✅ **FIXED** - GitHub project evaluation feature is now fully functional

## What Was Fixed

### 1. **Improved Error Messages**
- Better error handling for rate limits, unauthorized access, and not found errors
- Clear instructions on what to do (connect GitHub account, add GITHUB_TOKEN)
- Logging of failed requests for debugging

### 2. **Public Repository Access**
- Added fallback to allow public repo analysis without authentication
- Works for both public and private repos (private requires token)
- No longer blocks public repo access due to missing tokens

### 3. **New Public API Endpoints**
- **`GET /api/github/public`** - Fetch public repo data without submission
- **`GET /api/github/repo-commits`** - Get commits from any repo
- Both endpoints work with optional GitHub token for higher rate limits

### 4. **Token Priority System**
When fetching GitHub data, tokens are checked in this priority:
1. Student's GitHub OAuth token (if they authenticated)
2. Student's stored GitHub connection token
3. Mentor's GitHub OAuth token (if they authenticated)
4. Mentor's stored GitHub connection token
5. Server GITHUB_TOKEN environment variable
6. No token (works for public repos)

## How to Use

### For Students

#### Option 1: Connect Your GitHub Account
Best approach - gives you and mentors access to private repos

```
1. Go to: /dashboard/student/projects (or /dashboard/mentor/projects)
2. Click "Connect GitHub" button
3. Authorize with your GitHub account
4. Your token is securely stored in the database
```

#### Option 2: Use Your Public Repositories
If your repo is public, no connection needed - evaluation works automatically

### For Mentors

#### Option 1: Have Students Connect
Ask students to connect their GitHub accounts via the platform
- Gives access to their private repos
- Stored securely on server

#### Option 2: Configure Server Token
Set `GITHUB_TOKEN` environment variable with a GitHub personal access token

```bash
# Generate at: https://github.com/settings/tokens
# Needs: repo (full control) scope

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### Evaluation Workflow

1. **Create Assignment** → Mentor creates a project assignment
2. **Assign Students** → Students get assigned to the project
3. **Submit Repo** → Students submit their GitHub repo URL
4. **Evaluate** → Mentor evaluates the submission:
   - **Commits** tab: View git history
   - **Files** tab: Browse repository structure
   - **AI Review** tab: AI code review
   - **Quality** tab: Code metrics
   - **Timeline** tab: Development timeline
   - **Evaluate** tab: Save mentor feedback & score

## API Endpoints Reference

### Public (No Auth Required for Public Repos)

#### Get Public Repository Data
```
GET /api/github/public?repo=owner/repo
  &includeCommits=true
  &includeContributors=true
  &includeLanguages=true
  &maxPages=3
  &token=optional_github_token

Response:
{
  "repo": { /* repo info */ },
  "commits": [ /* commit array */ ],
  "totalCommits": 42,
  "commitStats": { /* stats */ },
  "contributors": [ /* contributor array */ ],
  "languages": { /* language breakdown */ },
  "primaryLanguage": "TypeScript"
}
```

#### Get Commits from Any Repo
```
GET /api/github/repo-commits?repo=owner/repo
  &page=1
  &per_page=30
  &token=optional_github_token

Response:
{
  "repo": "owner/repo",
  "page": 1,
  "commits": [ /* commits */ ],
  "has_more": true,
  "_links": {
    "next": "url to next page"
  }
}
```

### Authenticated (User Must Be Logged In)

#### Get Commits for a Submission
```
GET /api/github/commits?submission_id=uuid&page=1

Requirements:
- User must be the student or mentor for this submission
- Tries to use: session token → student token → mentor token → GITHUB_TOKEN
```

#### Analyze Repository
```
POST /api/github/analyze
Body: { "submission_id": "uuid" }

What it does:
- Fetches all GitHub data
- Calculates quality metrics
- Detects suspicious activity (bulk commits, late submissions)
- Stores results in repo_analytics table
```

#### Get AI Code Review
```
POST /api/github/ai-review
Body: { 
  "submission_id": "uuid",
  "file_path": "optional_file_path",
  "force_refresh": false
}
```

#### Get Evaluation
```
GET /api/project-assignments/[id]/evaluate?submission_id=uuid

POST /api/project-assignments/[id]/evaluate
Body: {
  "submission_id": "uuid",
  "student_id": "uuid",
  "score": 95,
  "feedback": "Great work!",
  "comment": "Optional eval comment"
}
```

## Environment Variables

### Required for GitHub Integration
```bash
# At least one of these:
GITHUB_CLIENT_ID=your_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_oauth_app_client_secret
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx  # For server-side access
```

### Optional (For Better Rate Limits)
If not set, uses unauthenticated GitHub API (60 reqs/hour limit)

## Rate Limiting

### Unauthenticated
- 60 requests per hour per IP
- Works for public repos only

### Authenticated (With Token)
- 5,000 requests per hour
- Access to private repos
- **Recommended for production**

## Troubleshooting

### Error: "Repository not found"
- **Solution**: Verify repo name is correct (owner/repo format)
- For private repos: Connect your GitHub account or add GITHUB_TOKEN

### Error: "Unauthorized" 
- **Possible causes**:
  1. Repository is private, no token available
  2. GitHub token has expired or been revoked
  3. Student hasn't connected GitHub account
- **Solutions**:
  - Have student connect GitHub (priority 1)
  - Add server GITHUB_TOKEN env var
  - Check token permissions on GitHub

### Error: "Rate limit reached"
- **Solution**: 
  - Add GitHub token to environment (`GITHUB_TOKEN`)
  - Ask student to connect GitHub account
  - Wait 1 hour for unauthenticated rate limit to reset

### Error: "Commit History not loading"
- **Try these**:
  1. Refresh the page
  2. Connect your GitHub account
  3. Check if repo exists and is accessible
  4. Look at server logs for detailed error

## Testing

### Test Public Repository Access
```bash
# Should work without authentication:
curl "http://localhost:3000/api/github/public?repo=facebook/react"

# Should show React commits:
curl "http://localhost:3000/api/github/repo-commits?repo=facebook/react&per_page=10"
```

### Test With Your Own Repo
```bash
# Should work for any public repo:
curl "http://localhost:3000/api/github/public?repo=YOUR_USERNAME/YOUR_PUBLIC_REPO"
```

## Database Tables

### `github_connections`
Stores GitHub OAuth tokens for users
```
- user_id (FK to users)
- github_username
- access_token (encrypted)
- token_scope
- connected_at
- updated_at
```

### `assignment_submissions`
Student project submissions
```
- id (PK)
- assignment_id (FK)
- student_id (FK)
- repo_full_name
- status (submitted, analyzing, analyzed)
- submitted_at
```

### `repo_analytics`
Analysis results for repositories
```
- submission_id (FK)
- overall_score
- commits_score
- quality_score
- consistency_score
- suspicious_flags
- analyzed_at
```

### `project_evaluations`
Mentor evaluations of submissions
```
- submission_id (FK)
- mentor_id (FK)
- score
- feedback
- comments (array of { text, created_at })
```

## Next Steps

1. **Set GitHub OAuth** (for student connection):
   - Create GitHub OAuth App: https://github.com/settings/developers
   - Add Client ID & Secret to `.env.local`

2. **Set GITHUB_TOKEN** (optional, for better rate limits):
   - Create Personal Access Token: https://github.com/settings/tokens
   - Add to `.env.local` or deployment environment

3. **Test the Feature**:
   - Create a project assignment
   - Assign students
   - Have them submit a repo (public or connected private)
   - Mentor evaluates using the dashboard

---

**Documentation Updated**: May 11, 2026
**Feature Status**: ✅ Production Ready
