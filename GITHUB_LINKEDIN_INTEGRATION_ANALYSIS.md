# GitHub & LinkedIn Integration Analysis - Classera Codebase

**Date**: March 2026  
**Status**: Complete Integration across OAuth, Database, APIs, and UI Components

---

## 1. DATABASE TABLES & SCHEMA

### Core GitHub Integration Tables

#### **`github_connections`** (OAuth Token Storage)
**Location**: [ADD_GITHUB_PROJECTS.sql](supabase/migrations/ADD_GITHUB_PROJECTS.sql#L6)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Unique connection ID |
| `user_id` | UUID FK (users) | One-to-one link to user |
| `github_user_id` | BIGINT | GitHub's internal user ID |
| `github_username` | TEXT | GitHub username (e.g., @octocat) |
| `github_name` | TEXT | Full name from GitHub profile |
| `github_avatar_url` | TEXT | Avatar image URL |
| `github_profile_url` | TEXT | GitHub profile URL |
| `access_token` | TEXT | OAuth2 access token (read:user, repo scope) |
| `token_scope` | TEXT | Granted OAuth scopes |
| `public_repos` | INTEGER | Public repository count (cached) |
| `followers` | INTEGER | Follower count (cached) |
| `following` | INTEGER | Following count (cached) |
| `connected_at` | TIMESTAMPTZ | Connection creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Constraints**: 
- UNIQUE on `user_id` (one GitHub account per user)
- RLS Policy: `service_role_all` (admin-only via API routes)

---

#### **`project_assignments`** (Mentor-Created Assignments)
**Location**: [ADD_GITHUB_PROJECTS.sql](supabase/migrations/ADD_GITHUB_PROJECTS.sql#L24)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Assignment ID |
| `mentor_id` | UUID FK (users) | Creating mentor |
| `university_id` | UUID FK (universities) | Target university (optional) |
| `title` | TEXT | Assignment title |
| `description` | TEXT | Full description |
| `requirements` | TEXT | Project requirements |
| `technologies` | TEXT[] | Tech stack (array: ["React", "Node.js"]) |
| `deadline` | TIMESTAMPTZ | Submission deadline |
| `max_score` | INTEGER | Total points possible (default 100) |
| `is_active` | BOOLEAN | Active/archived status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

---

#### **`assignment_submissions`** (Student GitHub Repo Submissions)
**Location**: [ADD_GITHUB_PROJECTS.sql](supabase/migrations/ADD_GITHUB_PROJECTS.sql#L48)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Submission ID |
| `assignment_id` | UUID FK | Parent assignment |
| `student_id` | UUID FK (users) | Submitting student |
| `repo_url` | TEXT | GitHub repo URL entered by student |
| `repo_owner` | TEXT | Extracted repo owner (e.g., "facebook") |
| `repo_name` | TEXT | Extracted repo name (e.g., "react") |
| `repo_full_name` | TEXT | Full name (owner/name) for API calls |
| `submitted_at` | TIMESTAMPTZ | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |
| `status` | TEXT | One of: `submitted \| analyzing \| analyzed \| reviewed \| graded` |

**Constraints**:
- UNIQUE on `(assignment_id, student_id)` (one submission per student per assignment)

---

#### **`repo_analytics`** (Cached GitHub Repository Analysis)
**Location**: [ADD_GITHUB_PROJECTS.sql](supabase/migrations/ADD_GITHUB_PROJECTS.sql#L66)

**Purpose**: Stores computed metrics from GitHub API analysis, keyed to a submission.

| Column | Type | Sample Data | Use Case |
|--------|------|-------------|----------|
| **Identifiers** ||||
| `id` | UUID PK | | Unique analytics record |
| `submission_id` | UUID FK | | Links to assignment_submissions |
| `student_id` | UUID FK | | Denormalized for fast queries |
| `repo_full_name` | TEXT | "facebook/react" | GitHub repo identifier |
| **Basic Stats** ||||
| `total_commits` | INTEGER | 42 | CI pipeline activity |
| `total_branches` | INTEGER | 5 | Code organization |
| `total_files` | INTEGER | 312 | Project size |
| `repo_size_kb` | INTEGER | 15000 | Disk footprint |
| `open_issues` | INTEGER | 18 | Maintenance status |
| `stars` | INTEGER | 210000 | Popularity |
| `forks` | INTEGER | 42000 | Community adoption |
| **Dates** ||||
| `repo_created_at` | TIMESTAMPTZ | 2023-01-15T10:00:00Z | Project start |
| `last_push_at` | TIMESTAMPTZ | 2024-03-20T14:30:00Z | Latest activity |
| `last_commit_at` | TIMESTAMPTZ | 2024-03-20T14:25:00Z | Last commit time |
| **Activity** ||||
| `active_days` | INTEGER | 87 | Days with commits |
| `commit_frequency` | JSONB | `[{"week_start": "2024-01-01", "commits": 12}]` | Weekly breakdown |
| `daily_activity` | JSONB | `{"2024-03-20": 5, "2024-03-21": 2}` | Used in heatmap |
| `weekly_activity` | JSONB | `[{"week": unix_timestamp, "total": 25}]` | GitHub-provided |
| `contributors` | JSONB | `[{"login": "user1", "total": 50}, ...]` | Top contributors |
| `languages` | JSONB | `{"JavaScript": 45, "TypeScript": 35, "CSS": 20}` | Byte percentages |
| **Code Quality** ||||
| `total_lines` | INTEGER | 12400 | Estimated (avg 30/file) |
| `complexity_level` | TEXT | "medium" | Enum: low \| medium \| high |
| `has_readme` | BOOLEAN | true | README.md present |
| `has_tests` | BOOLEAN | true | Test folder detected |
| `folder_depth` | INTEGER | 8 | Max nesting level |
| **Scores (0-100)** ||||
| `consistency_score` | INTEGER | 78 | Commit pattern score |
| `activity_score` | INTEGER | 85 | Activity level score |
| `quality_score` | INTEGER | 72 | Code structure score |
| `overall_score` | INTEGER | 79 | Weighted average |
| **Suspicious Flags** ||||
| `suspicious_flags` | JSONB | `[{"type": "deadline_cramming", "severity": "high"}]` | Fraud detection |
| **Timeline** ||||
| `timeline_events` | JSONB | `[{"date": "...", "type": "repo_created", "message": "..."}]` | Milestone history |
| **Cache** ||||
| `file_tree` | JSONB | `[{"name": "src", "type": "folder", "children": [...]}]` | Nested folder structure |
| `analyzed_at` | TIMESTAMPTZ | 2024-03-21T09:30:00Z | Analysis timestamp |
| `is_stale` | BOOLEAN | false | Refresh needed if > 6h old |

---

#### **`project_evaluations`** (Mentor Grading)
**Location**: [ADD_GITHUB_PROJECTS.sql](supabase/migrations/ADD_GITHUB_PROJECTS.sql#L120)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Evaluation ID |
| `submission_id` | UUID FK | The submission being graded |
| `assignment_id` | UUID FK | Parent assignment |
| `mentor_id` | UUID FK | Grading mentor |
| `student_id` | UUID FK | Student being graded |
| `score` | INTEGER | Numerical grade (0-100) |
| `feedback` | TEXT | Long-form feedback |
| `comments` | JSONB | Array of comment objects: `[{text, created_at}]` |
| `evaluated_at` | TIMESTAMPTZ | Grading timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

---

#### **`users` Table (Profile URLs)**
**Location**: [database.types.ts](src/types/database.types.ts)

| Column | Type | Purpose |
|--------|------|---------|
| `github_url` | TEXT | Manual GitHub profile URL (e.g., "https://github.com/username") |
| `linkedin_url` | TEXT | Manual LinkedIn URL (e.g., "https://linkedin.com/in/username") |

**Note**: These are fallbacks for users who haven't connected via OAuth. When a user connects via OAuth, data is stored in `github_connections`.

---

## 2. API ENDPOINTS

### GitHub OAuth Flow

#### **GET /api/github/connect**
**File**: [src/app/api/github/connect/route.ts](src/app/api/github/connect/route.ts)

**Purpose**: Redirects user to GitHub OAuth authorization page

**Flow**:
1. User clicks "Connect GitHub Account" button
2. Endpoint generates OAuth state (encodes `userId` + optional `returnTo` URL in base64url)
3. Constructs GitHub authorize URL with:
   - `client_id`: GITHUB_CLIENT_ID from env
   - `redirect_uri`: `{APP_URL}/api/github/callback`
   - `scope`: `read:user repo` (read public info + repo access)
   - `state`: base64url-encoded {userId, returnTo}

**Query Parameters**:
- `returnTo` (optional): Where to redirect after OAuth completes

**Required Env Variables**:
- `GITHUB_CLIENT_ID`
- `NEXT_PUBLIC_APP_URL`

---

#### **GET /api/github/callback**
**File**: [src/app/api/github/callback/route.ts](src/app/api/github/callback/route.ts)

**Purpose**: GitHub redirects here after user authorizes. Exchanges code for token and stores connection.

**Flow**:
1. GitHub redirects with `code` and `state` query params
2. Validate state, extract `userId` and `returnTo`
3. POST to `https://github.com/login/oauth/access_token` with:
   - `client_id`, `client_secret`, `code`
4. Receive `access_token` + `scope`
5. Call `getAuthenticatedUser(token)` to fetch GitHub user profile
6. **UPSERT** into `github_connections` table (one-to-one per user)
7. Redirect to `returnTo` URL with `?github_connected=true` query param

**Stored in DB**:
```javascript
{
  user_id,
  github_user_id,
  github_username,
  github_name,
  github_avatar_url,
  github_profile_url,
  access_token,          // saved securely for future API calls
  token_scope,
  public_repos,
  followers,
  following,
  connected_at,
  updated_at
}
```

**Error Handling**:
- Redirects to `/dashboard/student/profile?github_error=access_denied` if user denies
- Redirects to `/dashboard/student/profile?github_error=not_configured` if env vars missing

---

### Data Fetching

#### **GET /api/github/repos**
**File**: [src/app/api/github/repos/route.ts](src/app/api/github/repos/route.ts)

**Purpose**: Returns authenticated user's connected GitHub repositories

**Flow**:
1. Verify user is authenticated
2. Query `github_connections` for this user's `access_token`
3. Call `getUserRepos(github_username, access_token)` (see lib/github.ts)
4. Optional `?search=` filter on repo name (case-insensitive)

**Response**:
```json
{
  "repos": [
    {
      "id": 12345,
      "name": "my-project",
      "full_name": "username/my-project",
      "description": "A cool project",
      "html_url": "https://github.com/username/my-project",
      "language": "TypeScript",
      "stargazers_count": 42,
      "forks_count": 5,
      "open_issues_count": 2
    }
  ]
}
```

---

#### **GET /api/github/profile-stats**
**File**: [src/app/api/github/profile-stats/route.ts](src/app/api/github/profile-stats/route.ts)

**Purpose**: Get comprehensive GitHub profile stats (for viewing a user's GitHub profile)

**Query Parameters**:
- `userId` (optional): Defaults to current user. Can view other users if permitted by mentor/student relationship.

**Response**:
```json
{
  "connected": true,
  "github": {
    "username": "octocat",
    "name": "The Octocat",
    "avatar": "https://avatars.githubusercontent.com/u/1?v=4",
    "profileUrl": "https://github.com/octocat",
    "publicRepos": 42,
    "followers": 1000,
    "following": 50,
    "memberSince": "2011-01-25T18:44:36Z"
  },
  "stats": {
    "totalRepos": 42,
    "totalStars": 245,
    "totalForks": 89,
    "topLanguages": [
      { "lang": "JavaScript", "count": 15 },
      { "lang": "TypeScript", "count": 10 }
    ],
    "totalCommitsInPlatform": 5432,
    "avgOverallScore": 78,
    "projectsAnalyzed": 3,
    "recentProjects": [
      {
        "overall_score": 85,
        "consistency_score": 82,
        "repo_full_name": "username/project1",
        "analyzed_at": "2024-03-20T09:00:00Z"
      }
    ]
  }
}
```

---

#### **DELETE /api/github/profile-stats**
**File**: [src/app/api/github/profile-stats/route.ts](src/app/api/github/profile-stats/route.ts#L95)

**Purpose**: Disconnects GitHub account (removes from `github_connections`)

**Note**: Existing `repo_analytics` records are preserved for historical grading.

---

#### **POST /api/github/analyze**
**File**: [src/app/api/github/analyze/route.ts](src/app/api/github/analyze/route.ts)

**Purpose**: Full GitHub repository analysis - fetches data, computes scores, stores in `repo_analytics`

**Request Body**:
```json
{ "submission_id": "uuid" }
```

**Process**:
1. Fetch submission details (repo URL, deadline, student ID)
2. Try to get student's GitHub token, fall back to mentor's, then env `GITHUB_TOKEN`
3. Parallel GitHub API calls:
   - `getRepoInfo()` - basic repo stats
   - `getAllCommits()` - all commits (paginated, max 5 pages)
   - `getCommitActivity()` - weekly activity (last 52 weeks)
   - `getContributors()` - top contributors
   - `getLanguages()` - language distribution
   - `getBranches()` - branch count
   - `getFileTree()` - complete file tree
4. **Compute Metrics**:
   - Build daily activity heatmap from commits
   - Detect file tree complexity (max nesting level)
   - Detect README, tests folders
   - Estimate total lines (avg 30/file)
   - Classify complexity: low/medium/high
   - Calculate 4 scores:
     - `consistency_score`: Based on consistent commit pattern
     - `activity_score`: Days with commits / total days
     - `quality_score`: README, tests, structure, branch count
     - `overall_score`: Weighted average of above 3
5. **Suspicious Activity Detection** via `detectSuspiciousActivity()`:
   - Minimal commits (≤2) → "minimal_commits" (medium severity)
   - 60%+ commits in last 24h of deadline → "deadline_cramming" (high)
   - 14+ day gap in activity → "inactivity_burst" (medium)
   - All commits in ≤2 hour window → "code_dump" (critical)
   - 70%+ boilerplate commit messages → "boilerplate_messages" (high)
   - Unusual velocity spike on final day → "velocity_anomaly" (critical)
6. **Build Timeline Events**:
   - Repo creation date
   - First commit
   - Latest commit
7. **Nested File Tree** for UI display
8. **UPSERT** into `repo_analytics`:
   ```javascript
   {
     submission_id,
     student_id,
     repo_full_name,
     total_commits,
     active_days,
     consistency_score,
     activity_score,
     quality_score,
     overall_score,
     suspicious_flags: [{ type, message, severity }],
     languages,
     contributors,
     daily_activity,
     weekly_activity,
     file_tree: nested structure,
     analyzed_at: now(),
     is_stale: false
   }
   ```
9. Update submission status to `analyzed` (or `submitted` if repo not found)

---

#### **GET /api/github/commits**
**File**: [src/app/api/github/commits/route.ts](src/app/api/github/commits/route.ts)

**Purpose**: Paginated commit history for a submission

**Query Parameters**:
- `submission_id` (required)
- `page` (optional, default 1)

**Access Control**: Student or assignment mentor only

**Response**:
```json
{
  "commits": [
    {
      "sha": "abc123...",
      "message": "Fix bug in login",
      "author": {
        "name": "John Doe",
        "date": "2024-03-20T10:00:00Z"
      }
    }
  ],
  "has_more": true
}
```

**Tech**: 
- Uses student's GitHub token if available, else mentor's, else `GITHUB_TOKEN` env
- 30 commits per page
- Uses `link` header for pagination detection

---

#### **GET /api/github/diff**
**File**: [src/app/api/github/diff/route.ts](src/app/api/github/diff/route.ts)

**Purpose**: Detailed diff for a single commit (files changed, additions/deletions)

**Query Parameters**:
- `submission_id` (required)
- `sha` (required): Commit SHA

**Response**:
```json
{
  "commit": {
    "sha": "abc123",
    "message": "Add login feature",
    "author": { "name": "John", "date": "2024-03-20T10:00:00Z" },
    "additions": 142,
    "deletions": 28,
    "files": [
      {
        "filename": "src/pages/login.tsx",
        "status": "modified",
        "additions": 100,
        "deletions": 20,
        "patch": "+  const [email, setEmail] = useState('');\n..."  // Limited to 5KB
      }
    ]
  }
}
```

---

#### **GET /api/github/file**
**File**: [src/app/api/github/file/route.ts](src/app/api/github/file/route.ts)

**Purpose**: Fetch decoded content of a single file from repo

**Query Parameters**:
- `submission_id` (required)
- `path` (required): File path in repo (e.g., "src/App.tsx")

**Response**:
```json
{
  "content": "import React from 'react';\n...",
  "size": 5234,
  "sha": "abc123...",
  "truncated": false  // true if content > 200KB
}
```

**Features**:
- Automatically decodes base64 from GitHub API
- Limits response to 200KB to avoid payload bloat
- Access control: Student or mentor only

---

#### **POST /api/github/ai-review**
**File**: [src/app/api/github/ai-review/route.ts](src/app/api/github/ai-review/route.ts)

**Purpose**: AI-powered code review using DeepSeek or Groq

**Request Body**:
```json
{
  "submission_id": "uuid",
  "file_path": "src/main.tsx",  // optional: review specific file or whole repo
  "force_refresh": false        // optional: bypass cache
}
```

**Process**:
1. Verify caller is the assignment mentor
2. Fetch file content (if file_path provided) - max 8KB
3. Fetch latest repo_analytics - max 6KB
4. Construct prompt with code + metrics
5. Call DeepSeek API (model: `deepseek-chat` or `deepseek/deepseek-chat`)
6. Fallback to Groq (`llama-3.1-8b-instant`) if DeepSeek fails
7. Parse JSON response with schema:
   ```javascript
   {
     summary: string,
     overall_rating: 0-100,
     strengths: string[],
     issues: [
       {
         severity: "critical" | "warning" | "info",
         line?: number,
         description: string,
         suggestion: string
       }
     ]
   }
   ```

**Response**:
```json
{
  "review": {
    "summary": "Well-structured code with good error handling...",
    "overall_rating": 82,
    "strengths": ["Clear function structure", "Good test coverage"],
    "issues": [
      {
        "severity": "warning",
        "line": 45,
        "description": "Unused variable 'config'",
        "suggestion": "Remove unused import or use the variable"
      }
    ],
    "cached_at": "2024-03-20T09:00:00Z",
    "is_cached": false
  }
}
```

---

#### **PUT /api/auth/profile**
**File**: [src/app/api/auth/profile/route.ts](src/app/api/auth/profile/route.ts#L113)

**Purpose**: Update user profile including GitHub/LinkedIn URLs (manual entry)

**Request Body**:
```json
{
  "full_name": "John Doe",
  "github_url": "https://github.com/johndoe",  // manual URL (fallback)
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "bio": "...",
  "expertise": ["React", "Node.js"],  // mentor field
  "years_of_experience": 5,           // mentor field
  ...
}
```

**Logic**:
- If `github_url` provided, extracted and stored as TEXT in `users.github_url`
- If `linkedin_url` provided, extracted and stored in `users.linkedin_url`
- These are used as fallbacks when user hasn't connected via OAuth

---

## 3. DATA FLOW

### Flow 1: OAuth Connection → Storage → Display

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER INITIATES CONNECTION                            │
│ • Student clicks "Connect GitHub Account" button        │
│ • Component: GitHubConnectButton.tsx                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. REDIRECT TO GITHUB OAUTH                             │
│ • GET /api/github/connect?returnTo=/path                │
│ • Navigate user to: https://github.com/login/oauth/... │
│ • GitHub generates auth dialog                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. USER AUTHORIZES (in GitHub)                          │
│ • User clicks "Authorize ClasseraApp"                   │
│ • Grants read:user + repo scopes                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. GITHUB REDIRECTS CALLBACK                            │
│ • GET /api/github/callback?code=...&state=...          │
│ • Decode state → extract userId, returnTo              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. EXCHANGE CODE FOR TOKEN                              │
│ • POST https://github.com/login/oauth/access_token     │
│   Body: { client_id, client_secret, code }             │
│ • Receive: { access_token, scope, token_type }         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. FETCH GITHUB USER PROFILE                            │
│ • GET https://api.github.com/user                       │
│ • Headers: Authorization: Bearer {access_token}         │
│ • Receive: { login, id, avatar_url, name, bio, ... }   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. STORE IN DATABASE (UPSERT)                           │
│ • Table: github_connections                             │
│ • Unique on (user_id):                                  │
│   - github_username, github_avatar_url, access_token    │
│   - public_repos, followers, following counts           │
│ • Timestamp: connected_at, updated_at                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 8. REDIRECT TO COMPLETION         │
│ • Redirect to returnTo + ?github_connected=true         │
│ • Typical: /dashboard/student/profile?github_connected  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 9. FRONTEND DETECTS CONNECTION                          │
│ • Query param triggers UI update                        │
│ • Component refreshes githubConnection state            │
│ • Shows connected badge with username + avatar         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 10. DISPLAY ON PROFILE PAGES                            │
│ • Student profile: /dashboard/student/profile           │
│ • Mentor profile: /dashboard/mentor/student/[id]        │
│ • Shows: @username, avatar, public repos, followers    │
│ • Shows: linked to profile URL                          │
│ • Option to disconnect                                  │
└─────────────────────────────────────────────────────────┘
```

### Flow 2: Manual URL Entry → Parsing → GitHub API Call → Display

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER ENTERS GITHUB URL                               │
│ • Mentor/student fills: github_url field                │
│ • Example: "https://github.com/johndoe"                 │
│ • Or just: "johndoe"                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SUBMIT PROFILE UPDATE                                │
│ • PUT /api/auth/profile                                 │
│ • Body: { github_url: "https://github.com/johndoe" }   │
│ • Stored in users.github_url (TEXT field)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EXTRACT USERNAME WITH PARSER                         │
│ • Function: extractGithubUsername(url)                  │
│ • Regex: /github\.com\/([\w.-]+)\/?$/i                  │
│ • Output: "johndoe"                                     │
│ • Works with:                                           │
│   - Full URLs: https://github.com/johndoe               │
│   - HTTP: http://github.com/johndoe                    │
│   - Just domain: github.com/johndoe                     │
│   - Just username: johndoe                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. FETCH FROM GITHUB API (NO TOKEN NEEDED)              │
│ • GET https://api.github.com/users/{username}           │
│ • No Authorization header (public data)                 │
│ • Response: GithubUser profile (public info)            │
│ • Includes: name, bio, public_repos, followers, etc.    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. DISPLAY ON PROFILES (MENTOR/STUDENT VIEWING)         │
│ • Page: /dashboard/mentor/student/[id]                  │
│ • Mentor profile: /dashboard/student/mentor/[id]        │
│ • Shows:                                                │
│   - Avatar (if OAuth connected or from API)             │
│   - Username (@johndoe)                                 │
│   - Public repos count                                  │
│   - Followers/following                                 │
│   - Bio                                                 │
│   - Company, location, website, etc.                    │
│   - GitHub profile URL link                             │
└─────────────────────────────────────────────────────────┘
```

### Flow 3: Project Submission → Analysis → Scoring

```
┌─────────────────────────────────────────────────────────┐
│ 1. STUDENT SUBMITS GITHUB REPO                          │
│ • Assignment submission form                            │
│ • URL: https://github.com/username/project-repo         │
│ • Stored in assignment_submissions.repo_url             │
│ • Extracted: repo_owner, repo_name, repo_full_name      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. MENTOR TRIGGERS ANALYSIS                             │
│ • Click "Analyze" in submission view                    │
│ • BatchToolbar component: POST /api/github/analyze      │
│ • Body: { submission_id: "uuid" }                       │
│ • Status update: submitted → analyzing                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. PARALLEL GITHUB API CALLS                            │
│ • Await Promise.all([                                   │
│    getRepoInfo(),                                       │
│    getAllCommits(),                                     │
│    getCommitActivity(),                                 │
│    getContributors(),                                   │
│    getLanguages(),                                      │
│    getBranches(),                                       │
│    getFileTree()                                        │
│  ])                                                     │
│ • Token priority: student > mentor > env                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. LOCAL COMPUTATION (SERVER)                           │
│ • buildDailyActivity() → heatmap data                    │
│ • countActiveDays() → days count                         │
│ • detectSuspiciousActivity() → fraud flags              │
│ • calculateScores() → 4 scores (0-100)                  │
│ • buildNestedTree() → UI file tree                       │
│ • Timeline events generation                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. STORE IN REPO_ANALYTICS                              │
│ • UPSERT with submission_id (unique)                    │
│ • Computed metrics + JSON columns:                      │
│   - daily_activity (JSONB): day → commit counts         │
│   - weekly_activity (JSONB): GitHub-provided stats      │
│   - suspicious_flags (JSONB): fraud detection           │
│   - contributors (JSONB): top authors                   │
│   - languages (JSONB): language distribution            │
│   - file_tree (JSONB): nested structure                 │
│   - timeline_events (JSONB): milestones                 │
│ • Timestamp: analyzed_at                                │
│ • is_stale = false (cache valid for 6h)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. DISPLAY IN MENTOR DASHBOARD                          │
│ • Cards: CodeQualityCard, ActivityHeatmap, etc.         │
│ • CommitHistory, ProjectTimeline components             │
│ • AI review button (DeepSeek/Groq powered)              │
│ • Suspicious activity alerts                            │
│ • Mentor can grade & provide feedback                   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. GITHUB LIBRARY FUNCTIONS

**File**: [src/lib/github.ts](src/lib/github.ts)

### Authentication & Headers

#### `githubHeaders(token?: string | null): HeadersInit`
Returns GitHub API headers. If token provided, adds Bearer authorization.

#### `githubFetch<T>(url, token?, revalidate): Promise<T | null>`
Generic GitHub API fetch with:
- Auto-retry for 202 (computing) responses
- Empty response handling
- Next.js revalidation caching (default 3600s)

---

### Repository Information

#### `getRepoInfo(repoFullName, token?): Promise<GithubRepo | null>`
**Returns**: `{ id, name, full_name, description, html_url, language, stargazers_count, forks_count, open_issues_count, size, created_at, updated_at, private, topics }`
**Cache**: 1800s (30 min)

#### `getTopRepositories(username, token?, limit=6): Promise<GithubRepo[]>`
**Returns**: User's top repos sorted by stars then forks

---

### Commits & Activity

#### `getAllCommits(repoFullName, token?, maxPages=5): Promise<GithubCommit[]>`
**Returns**: All commits up to 5 pages (500 commits max)
**Rate**: 100 commits per page pagin
**Returns**: `GithubCommit[] = { sha, commit: { message, author: { name, email, date } } }`

#### `getCommitActivity(repoFullName, token?): Promise<WeekActivity[]>`
**Returns**: Weekly activity for last 52 weeks from GitHub stats API
**Returns**: `[{ week: unix_timestamp, total: count, days: [0,1,1,2,...] }]`
**Cache**: 3600s

#### `getContributors(repoFullName, token?): Promise<Contributor[]>`
**Returns**: Top contributors with commit counts
**Returns**: `[{ author: { login, avatar_url, html_url }, total }]`
**Cache**: 3600s

---

### Code Structure

#### `getLanguages(repoFullName, token?): Promise<Record<string, number>>`
**Returns**: Language byte counts: `{ "JavaScript": 50000, "Python": 25000 }`
**Cache**: 3600s

#### `getBranches(repoFullName, token?): Promise<Array<{ name: string }>>`
**Returns**: All branches (paginated to 100)
**Cache**: 3600s

#### `getFileTree(repoFullName, token?): Promise<TreeItem[]>`
**Returns**: Complete file tree (flattened array)
**Returns**: `[{ path, mode, type: "blob|tree", sha, size?, url }]`
**Note**: Uses recursive parameter to get full depth

#### `getFileContent(repoFullName, path, token?): Promise<{ content, size, sha } | null>`
**Returns**: Decoded file content (base64 decoded)
**Encoding**: Only handles base64 responses

---

### User Information

#### `getGithubUser(username, token?): Promise<GithubUser | null>`
**Returns**: User profile: `{ login, id, name, avatar_url, html_url, bio, public_repos, followers, following, created_at, company?, location?, blog?, twitter_username? }`
**Cache**: 3600s

#### `getAuthenticatedUser(token: string): Promise<GithubUser | null>`
**Returns**: GitHub user of the access token owner (equivalent to `/user` endpoint)
**Cache**: 0 (always fresh, for security)

---

### URL Parsing

#### `parseRepoUrl(url): { owner, repo, full } | null`
**Input**: "https://github.com/facebook/react", "facebook/react", "git@github.com:facebook/react.git"
**Returns**: `{ owner: "facebook", repo: "react", full: "facebook/react" }`
**Handles**: Strips `.git` suffix, various URL formats

#### `extractGithubUsername(url): string | null`
**Input**: "https://github.com/octocat", "github.com/octocat", "octocat"
**Returns**: "octocat"
**Used for**: Fallback GitHub profile URLs

#### `extractLinkedInUsername(url): string | null`
**Input**: "https://linkedin.com/in/johndoe"
**Returns**: "johndoe"

#### `buildLinkedInProfileUrl(username): string`
**Input**: "johndoe"
**Returns**: "https://linkedin.com/in/johndoe"

---

### Activity Analysis

#### `buildDailyActivity(commits): Record<string, number>`
**Returns**: `{ "2024-03-20": 5, "2024-03-21": 2, ... }`
**Extracts**: ISO date from commit author timestamp, counts commits per day

#### `countActiveDays(daily): number`
**Input**: `{ "2024-03-20": 5, "2024-03-21": 0, ... }`
**Returns**: Count of days with ≥1 commit

#### `buildNestedTree(items): TreeNode[]`
**Input**: Flat TreeItem array from GitHub API
**Returns**: Hierarchical nested structure for UI:
```javascript
[
  {
    name: "src",
    path: "src",
    type: "folder",
    children: [
      { name: "index.ts", path: "src/index.ts", type: "file", size: 1024, sha: "..." }
    ]
  }
]
```

---

### Fraud Detection

#### `detectSuspiciousActivity(commits, deadline?): SuspiciousFlag[]`
**Returns**: Array of fraud flags with type, message, severity

**Checks**:
1. **minimal_commits** (≤2): Too few commits for a project
2. **deadline_cramming** (60%+ commits in last 24h): Last-minute rush
3. **inactivity_burst** (14+ day gap): Development then sudden burst
4. **code_dump** (all commits ≤2 hour window): Bulk upload
5. **boilerplate_messages** (70%+ generic messages): Automated/stolen code
6. **velocity_anomaly** (final day > 3x average): Unusual activity spike

---

### Scoring System

#### `calculateScores(options): { consistency_score, activity_score, quality_score, overall_score }`
**Input**:
```javascript
{
  commits: GithubCommit[],
  branches: number,
  hasReadme: boolean,
  hasTests: boolean,
  languageCount: number
}
```

**Scoring**:
- **activity_score**: Based on active days percentage
- **consistency_score**: Based on commit pattern regularity
- **quality_score**: README (20%), tests (20%), branch count (20%), languages (20%), commit quality (20%)
- **overall_score**: Weighted average

#### `classifyComplexity(totalFiles, folderDepth): "low" | "medium" | "high"`
**Logic**: 
- Low: < 50 files, depth ≤ 3
- Medium: 50-200 files, depth ≤ 6
- High: > 200 files or depth > 6

---

## 5. UI COMPONENTS

**Location**: [src/components/projects/](src/components/projects/)

### **GitHubConnectButton.tsx**
**Props**:
```typescript
interface GitHubConnectButtonProps {
  connected: boolean;
  username?: string | null;
  avatarUrl?: string | null;
  returnTo?: string;
}
```

**Features**:
- Shows connected badge with avatar + username if connected
- "Disconnect" button (with confirmation)
- "Connect GitHub Account" button if not connected
- Passes `returnTo` query param for post-OAuth navigation
- Handles page reload on disconnect

**Used In**:
- [src/app/dashboard/student/profile/page.tsx](src/app/dashboard/student/profile/page.tsx#L351)
- [src/app/onboarding/mentor/page.tsx](src/app/onboarding/mentor/page.tsx#L217)

---

### **CommitHistory.tsx**
**Props**:
```typescript
interface CommitHistoryProps {
  submissionId: string;
}
```

**Features**:
- Paginated commit list (30 per page)
- Click to expand & view diff
- Shows file changes (additions/deletions)
- Shows line-level patches (limited to 5KB)
- Error handling for rate limits
- Loading states

**Data Flow**:
1. Component mounts → fetch page 1 commits
2. User clicks commit → fetch diff
3. Display patch inline with syntax highlighting

---

### **ActivityHeatmap.tsx**
**Props**:
```typescript
interface ActivityHeatmapProps {
  dailyActivity: Record<string, number>;
  weeks?: number; // default 26
}
```

**Displays**: GitHub-style activity heatmap (grid of colored squares)
- Color intensity (0-6+): Light → Dark violet
- Shows month labels
- Total commits counter
- 26 weeks (6 months) view by default

**Data**: Uses `repo_analytics.daily_activity` JSONB

---

### **CodeQualityCard.tsx**
**Props**: Various repo metrics
```typescript
interface CodeQualityCardProps {
  hasReadme: boolean;
  hasTests: boolean;
  complexityLevel: 'low' | 'medium' | 'high';
  totalFiles: number;
  totalBranches: number;
  folderDepth: number;
  languages: Record<string, number>;
  consistencyScore: number;
  activityScore: number;
  qualityScore: number;
  overallScore: number;
}
```

**Features**:
- 4 circular score rings (Overall, Consistency, Activity, Quality)
- Language distribution pie chart
- Repo statistics grid
- ReadmeTests badges
- Complexity level tag

---

### **AIReviewPanel.tsx**
**Props**:
```typescript
interface AIReviewPanelProps {
  submissionId: string;
  pendingFilePath?: string | null;
  onClearPendingFile?: () => void;
}
```

**Features**:
- Calls POST /api/github/ai-review
- Shows AI-generated summary + rating
- Lists strengths
- Groups issues by severity (critical/warning/info)
- Shows/hides extra issues
- Shows cache status & refresh option
- Uses DeepSeek (primary) or Groq (fallback)

---

### **ProjectTimeline.tsx**
**Data**: `repo_analytics.timeline_events` (JSONB)
**Displays**: 
- Repo creation milestone
- First commit
- Latest commit
- Interactive timeline UI

---

### **RepoFileTree.tsx**
**Data**: `repo_analytics.file_tree` (nested JSONB)
**Features**:
- Expandable folder tree
- Click to view file content
- Shows file size/type icons

---

### **SuspiciousActivityAlert.tsx**
**Data**: `repo_analytics.suspicious_flags` (JSONB)
**Displays**: Color-coded alerts for each fraud flag
- Critical flags (red)
- High severity (orange)
- Medium/Low (yellow/blue)

---

### **BatchToolbar.tsx**
**Location**: [src/components/projects/BatchToolbar.tsx](src/components/projects/BatchToolbar.tsx#L48)

**Features**: Mentor action toolbar for submissions
- "Analyze" button → POST /api/github/analyze
- Bulk actions on selected submissions
- Triggers CodeQualityCard data population

---

## 6. PROFILE PAGES

### **Student's Own Profile**
**Path**: [src/app/dashboard/student/profile/page.tsx](src/app/dashboard/student/profile/page.tsx#L351)

**Displays**:
- GitHub Connection Button (with OAuth status)
- If connected via OAuth:
  - Avatar image
  - Username (@username)
  - Public repos count
  - Followers/following
  - Recent project analysis scores
  - Top languages
- If connected via URL (fallback):
  - Fetched profile data with API
  - Avatar, name, bio, company, etc.

**Data**:
```typescript
githubConnection: {
  github_username,
  github_avatar_url,
  public_repos,
  followers,
  following
}
// OR from fallback API fetch
githubUrlData: GithubUser
```

---

### **Mentor Views Student Profile**
**Path**: [src/app/dashboard/mentor/student/[id]/page.tsx](src/app/dashboard/mentor/student/[id]/page.tsx#L70)

**Features**:
- GitHub section:
  - Avatar + username
  - Public repos, followers, following counts
  - Bio, company, location, website
  - Profile link to GitHub
- LinkedIn section (if provided):
  - LinkedIn URL link
  - Connect on LinkedIn CTA
  - Shows "LinkedIn not added" if missing
- Repository analytics (if any submissions analyzed):
  - Overall score
  - Recent project metrics

**Data Flow**:
1. Query `github_connections` for student
2. If connected, fetch live stats from GitHub API
3. If not connected but `users.github_url` exists, parse & fetch from URL
4. Parse expertise array for display

---

### **Student Views Mentor Profile**
**Path**: [src/app/dashboard/student/mentor/[id]/page.tsx](src/app/dashboard/student/mentor/[id]/page.tsx)

**Features**:
- GitHub profile section:
  - Avatar + username
  - Public repos stats
  - Followers, following counts
  - Bio, name
  - Top languages (pill badges)
  - Profile link
- LinkedIn profile section:
  - LinkedIn URL link
  - "Connect on LinkedIn" CTA
  - Shows "LinkedIn not linked" if missing


**Data Flow**:
```typescript
// Get mentor's GitHub connection
const githubConn = await admin
  .from('github_connections')
  .select('*')
  .eq('user_id', mentorId)
  .single();

// Fallback if not connected via OAuth
if (!githubConn && mentor.github_url) {
  githubUrlData = await getGithubUser(extractGithubUsername(mentor.github_url));
}

// Display either githubConn or githubUrlData
```

---

### **Mentor Dashboard**
**Path**: [src/app/dashboard/mentor/page.tsx](src/app/dashboard/mentor/page.tsx#L253)

**Features**:
- Profile card with GitHub expertise hint
- Optional: GitHub connection badge if connected

---

### **Student Dashboard**
**Path**: [src/app/dashboard/student/mentor/[id]/page.tsx](src/app/dashboard/student/mentor/[id]/page.tsx#L211)

**Features**:
- Shows if mentor is connected to GitHub (expertise indicator)
- Links to mentor's profile with GitHub section

---

### **Mentor Onboarding**
**Path**: [src/app/onboarding/mentor/page.tsx](src/app/onboarding/mentor/page.tsx#L217)

**Step**: "Connect GitHub"
- GitHubConnectButton component
- `returnTo="/onboarding/mentor/quiz"`
- Encourages GitHub connection to showcase projects

---

### **Project Assignment Pages**
**Path**: [src/app/dashboard/mentor/assignments/](src/app/dashboard/mentor/assignments/)

**Features**:
- Create assignment with GitHub requirement
- View student submissions with GitHub repos
- Click submission → see:
  - CommitHistory
  - ActivityHeatmap
  - CodeQualityCard
  - AIReviewPanel
  - ProjectTimeline
  - SuspiciousActivityAlert
  - Grade + feedback form

---

## 7. GITHUB URL DISPLAY FEATURE

### Manual GitHub URL Entry (Fallback)

**Use Case**: User hasn't connected via OAuth, but has manually entered GitHub URL

**Storage**: `users.github_url` (TEXT field)

**Display Logic**:

```typescript
// Extract username from URL
const username = extractGithubUsername(user.github_url);

// Fetch live profile from GitHub API (no OAuth needed - public data)
const githubUserData = await getGithubUser(username);

// Display: avatar, name, bio, public_repos, followers, company, location, blog, etc.
```

**Supports Formats**:
- `https://github.com/username`
- `http://github.com/username`
- `github.com/username`
- `username` (plain)

**Used When**:
- Student/mentor hasn't completed OAuth connection
- Fallback for quick profile preview
- No private repo data (read-only public info)

---

## 8. LINKEDIN INTEGRATION

### LinkedIn URL Storage

**Database**: `users.linkedin_url` (TEXT field)

**Parser Function**: `extractLinkedInUsername(url): string | null`
- Regex: `/linkedin\.com\/in\/([\w.-]+)\/?/i`
- Returns username from URL

**Builder Function**: `buildLinkedInProfileUrl(username): string`
- Returns: `https://linkedin.com/in/{username}`

### LinkedIn Display

**Mentor Profile View** (mentor viewing student):
```typescript
if (student.linkedin_url) {
  <div className="flex items-center gap-2">
    <Linkedin className="w-5 h-5 text-blue-700" />
    <a href={student.linkedin_url} target="_blank">
      View LinkedIn Profile
    </a>
  </div>
}
```

**Student Profile View** (student viewing mentor):
```typescript
if (mentor.linkedin_url) {
  <div>
    <p>Connect with {mentor.full_name} on LinkedIn</p>
    <a href={mentor.linkedin_url} target="_blank">
      Visit LinkedIn →
    </a>
  </div>
}
```

### LinkedIn API Integration

**Current Status**: NO direct LinkedIn API integration
- Only URL storage & direct linking
- No OAuth connection
- No data fetching from LinkedIn

**Limitation**: 
- LinkedIn has restricted API access (requires LinkedIn Talent Solutions partnership)
- Current implementation is URL-only

**Future Enhancement Option**:
- Implement LinkedIn Sign-In OAuth (basic profile only)
- Would require LinkedIn App registration

---

## 9. KEY HELPER FUNCTIONS IN lib/github.ts

### Suspicious Activity Flags

```typescript
interface SuspiciousFlag {
  type: string;  // see list above
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function detectSuspiciousActivity(
  commits: GithubCommit[],
  deadline?: string | null
): SuspiciousFlag[]
```

**Severity Mapping**:
- **critical**: Code dump, velocity anomaly → likely dishonesty
- **high**: Deadline cramming, boilerplate messages → suspicious
- **medium**: Minimal commits, inactivity burst → noteworthy

---

### Score Calculation

```typescript
function calculateScores(options: {
  commits: GithubCommit[];
  branches: number;
  hasReadme: boolean;
  hasTests: boolean;
  languageCount: number;
}): {
  consistency_score: number;
  activity_score: number;
  quality_score: number;
  overall_score: number;
}
```

**Output**: All scores 0-100, stored in `repo_analytics`

---

### Complexity Classification

```typescript
function classifyComplexity(
  totalFiles: number,
  folderDepth: number
): 'low' | 'medium' | 'high'
```

**Rules**:
- Low: < 50 files, depth ≤ 3
- Medium: 50-200 files OR depth ≤ 6
- High: > 200 files OR depth > 6

---

## 10. ERROR HANDLING & EDGE CASES

### GitHub API Rate Limits

**Handling**:
- Unauthenticated: 60 req/hour
- Authenticated: 5000 req/hour
- Error response: 429 (Too Many Requests) or 403

**Graceful Degradation**:
- Try student token → mentor token → env GITHUB_TOKEN → no token
- Show user-friendly error: "GitHub API rate limit reached. Ask the student to connect their GitHub account..."

### Missing/Private Repositories

**Handling**:
- Public repos: Work with any token or none
- Private repos: Require user's own token
- Not found: Return `null` from API functions
- Submission validation: Check for null response before storing

### OAuth Timeout/Failure

**Redirects**:
- `?github_error=access_denied`: User clicked "Cancel"
- `?github_error=invalid_request`: Missing code/state
- `?github_error=not_configured`: Missing env variables
- `?github_error=token_exchange_failed`: Code didn't work (expired, used)
- `?github_error=profile_fetch_failed`: Couldn't fetch user profile
- `?github_error=server_error`: Unexpected error

**Frontend**: Detects error query params and shows appropriate message

---

## 11. SECURITY CONSIDERATIONS

### Access Control

- **github_connections**: Service-role only (admin) → accessed via API routes
- **repo_analytics**: Service-role only
- **assignment_submissions**: Service-role only

**Routes check**:
- `GET /api/github/commits`: Student OR mentor of assignment
- `GET /api/github/diff`: Student OR mentor
- `GET /api/github/file`: Student OR mentor
- `GET /api/github/profile-stats?userId=X`: Current user OR mentor viewing student

### Token Security

- OAuth token stored in DB (encrypted at rest via Supabase)
- Token used for API calls, never sent to frontend
- Token scope: `read:user repo` (read-only, no write access)
- No logout token revocation implemented (token stays valid)

### Rate Limiting

- Implemented on GitHub API side
- Fallback suggests adding personal access token
- No client-side rate limiting

---

## 12. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| [lib/github.ts](src/lib/github.ts) | All GitHub API functions & helpers |
| [api/github/connect/route.ts](src/app/api/github/connect/route.ts) | OAuth initiation |
| [api/github/callback/route.ts](src/app/api/github/callback/route.ts) | OAuth completion, token exchange |
| [api/github/repos/route.ts](src/app/api/github/repos/route.ts) | Fetch user's repos |
| [api/github/profile-stats/route.ts](src/app/api/github/profile-stats/route.ts) | GitHub profile stats |
| [api/github/analyze/route.ts](src/app/api/github/analyze/route.ts) | Full repo analysis & scoring |
| [api/github/commits/route.ts](src/app/api/github/commits/route.ts) | Paginated commits |
| [api/github/diff/route.ts](src/app/api/github/diff/route.ts) | Commit diff |
| [api/github/file/route.ts](src/app/api/github/file/route.ts) | File content viewer |
| [api/github/ai-review/route.ts](src/app/api/github/ai-review/route.ts) | DeepSeek AI code review |
| [components/projects/GitHubConnectButton.tsx](src/components/projects/GitHubConnectButton.tsx) | Connect/disconnect button |
| [components/projects/CommitHistory.tsx](src/components/projects/CommitHistory.tsx) | Commit list viewer |
| [components/projects/ActivityHeatmap.tsx](src/components/projects/ActivityHeatmap.tsx) | GitHub-style heatmap |
| [components/projects/CodeQualityCard.tsx](src/components/projects/CodeQualityCard.tsx) | Score rings + stats |
| [components/projects/AIReviewPanel.tsx](src/components/projects/AIReviewPanel.tsx) | AI code review UI |
| [app/dashboard/student/profile/page.tsx](src/app/dashboard/student/profile/page.tsx) | Student profile page |
| [app/dashboard/mentor/student/[id]/page.tsx](src/app/dashboard/mentor/student/[id]/page.tsx) | Mentor views student |
| [app/dashboard/student/mentor/[id]/page.tsx](src/app/dashboard/student/mentor/[id]/page.tsx) | Student views mentor |
| [migrations/ADD_GITHUB_PROJECTS.sql](supabase/migrations/ADD_GITHUB_PROJECTS.sql) | Schema: github_connections, analytics, etc. |

---

## SUMMARY

Classera implements a **comprehensive GitHub integration** featuring:

✅ **OAuth 2.0 Connection** - Secure token-based GitHub authorization  
✅ **Multi-source Data** - OAuth + manual URL fallback  
✅ **Detailed Analytics** - 60+ metrics per repo submission  
✅ **Fraud Detection** - 6 types of suspicious activity detection  
✅ **AI Code Review** - DeepSeek/Groq powered analysis  
✅ **Real-time Dashboard** - Mentor views student GitHub projects  
✅ **Performance Scoring** - 4-component scoring system  
✅ **Activity Heatmap** - GitHub-style commit visualization  

**LinkedIn integration** is currently **URL-only** (no API integration due to LinkedIn's restrictions).

