# Classera Test Section - Complete Codebase Guide

## Overview
The Classera test system is a full-featured assessment platform with **proctoring**, **anti-cheat monitoring**, **automated grading**, and **analytics**. It serves both **students** (test-takers) and **mentors** (test creators/graders).

---

## 📚 STUDENT PORTAL - TEST SECTION

### Student Test Pages
**Base Route**: `/dashboard/student/tests`

#### 1. **Tests Hub** (`page.tsx`)
- **Purpose**: Dashboard showing all tests the student is invited to
- **Query**: Fetches:
  - `test_invitations` - Tests assigned to student
  - `test_submissions` - Student's completed tests
  - `tests` - Test metadata for each invitation
  
**Test Categories Displayed**:
| Status | Criteria | Action |
|--------|----------|--------|
| **Live Tests** | `is_live=true` AND not completed | "Take Test" button |
| **Pending** | Not live yet, upcoming schedule | "View Details" |
| **Completed** | Has submission record | Score, grade, results link |

**Features**:
- ✅ Grade distribution (A+, A, B, C, D, F)
- ✅ Grade color coding (green ≥70%, amber ≥50%, red <50%)
- ✅ Countdown timer for active tests
- ✅ Performance analytics per test
- ✅ Achievement badges

---

#### 2. **Take Test - Standard Mode** (`[id]/take/page.tsx`)
**Route**: `/dashboard/student/tests/[id]/take`

**Features**:
- Question navigation (next/previous)
- Question flagging for review
- Auto-save answers
- Time countdown with auto-submit
- Answer review before submission
- Randomized questions (if enabled)
- Review question explanations

**Component**: `TestTakingClient`
```typescript
interface TestData {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  questions: Question[];
  settings?: {
    randomize_questions?: boolean;
    show_results_immediately?: boolean;
    allow_review?: boolean;
    enable_anti_cheat?: boolean;
    passing_percentage?: number;
  };
}
```

**State Management**:
- `currentQuestion` - Current question index
- `answers` - Record<question_id, answer>
- `timeRemaining` - Countdown in seconds
- `flagged` - Set of flagged question IDs
- `violations` - Anti-cheat violations array

---

#### 3. **Take Test - Proctored Mode** (`[id]/take-secure/page.tsx`)
**Route**: `/dashboard/student/tests/[id]/take-secure`

**Enhanced Security Features**:
- **Anti-Cheat Wrapper** active
- **Daily.co Video** for live proctoring
- **Face Detection** (if enabled)
- **Screen Recording** (if enabled)
- **Fullscreen Enforcement** (mandatory)
- **Violation Tracking** (server-side)

**Violation Types Tracked**:
1. `tab_switch` - User switched browser tabs
2. `fullscreen_exit` - Left fullscreen mode
3. `face_detection` - Face not detected
4. `copy_paste` - Copy/paste attempted
5. `screen_share_stopped` - Screen share interrupted
6. `suspicious` - Unusual activity pattern

**Max Violations**: 3 warnings → auto-submit + disqualification

---

#### 4. **Test Results** (`[id]/results/page.tsx`)
**Route**: `/dashboard/student/tests/[id]/results`

**Server-side Rendering**:
- Fetches submission with AI analysis
- Auto-triggers evaluation if not done
- Scores MCQ questions immediately
- Queues descriptive questions for mentor review

**Results Display**:
```
┌─────────────────────────────────┐
│ Score Card                      │
│ ─────────────────────────────   │
│ Your Score: 78/100 (78%)       │
│ Grade: A                        │
│ Time Taken: 45 minutes          │
│ Status: Passed ✓               │
└─────────────────────────────────┘

Question-by-Question Review:
- Your answer vs Correct answer
- Marks awarded
- Explanation (if provided)
```

**Components Used**:
- `ScoreSummary` - Score display card
- `ClassLeaderboard` - Rank among classmates (if available)
- `MCQQuestionDisplay` - Question/answer review
- AI feedback section (if generated)

---

### Student Test Components

#### `AntiCheatWrapper`
Enforces security policies during proctored tests:

```typescript
interface AntiCheatConfig {
  preventCopyPaste: boolean;        // Disable Ctrl+C, Cmd+C
  detectTabSwitch: boolean;         // Monitor document visibility
  preventRightClick: boolean;       // Disable context menu
  detectScreenCapture: boolean;     // Monitor screenshot attempts
  fullscreenMode: boolean;          // Enforce fullscreen
  maxTabSwitches: number;           // Default: 3
  maxWarnings: number;              // Default: 5
}
```

**Violation Handlers**:
- Logs each violation to `/api/tests/[id]/violations-secure`
- Shows visual warning modal (3 seconds)
- Increments warning counter
- Auto-submits on max violations

---

#### `TestTakingClient`
Core test-taking UI component:

**Key Methods**:
- `handleStartTest()` - Request fullscreen, initialize timer
- `handleAnswer(questionId, answer)` - Save answer
- `handleFlag(questionId)` - Mark for review
- `handleSubmit()` - Submit answers to server
- `handleViolation(type)` - Process anti-cheat violation

**Timer Behavior**:
- Counts down every second
- Auto-submits when reaches 0
- Shows "Time Remaining" badge (color: red < 5 min)

---

#### `ProctoringWindow`
Daily.co video room integration:

```typescript
interface ProctoringWindowProps {
  testId: string;
  sessionId: string;
  roomUrl: string;
  studentName: string;
  enableScreenShare?: boolean;
  enableWebcam?: boolean;
  enableRecording?: boolean;
}
```

**Features**:
- ✅ Webcam feed (mandatory if enabled)
- ✅ Screen share (can be toggled)
- ✅ Recording (if mentor requires)
- ✅ Participant monitoring
- ✅ Error handling for camera/permissions

---

#### `HeartbeatMonitor`
Continuous activity monitoring:

**Tracks**:
- Keyboard/mouse activity
- Window focus changes
- Page visibility
- Sends heartbeat every 5-10 seconds
- Server uses to detect inactivity

---

### Student Test API Endpoints

```
GET  /api/tests                    → List tests (paginated, filtered)
GET  /api/tests/[id]               → Get test details
POST /api/tests/[id]/start          → Begin test session (create submission)
POST /api/tests/[id]/submit         → Submit test answers
POST /api/tests/[id]/submit-secure  → Submit with proctoring data
POST /api/tests/[id]/violations     → Log violation
POST /api/tests/[id]/violations-secure → Server-side violation logging
POST /api/tests/[id]/proctor        → Proctoring events (heartbeat, etc.)
GET  /api/tests/[id]/analytics      → Get test analytics/results
GET  /api/tests/[id]/submissions    → Get student's submission
POST /api/tests/[id]/start          → Start session & create submission
```

---

## 🎓 MENTOR PORTAL - TEST SECTION

### Mentor Test Pages
**Base Route**: `/dashboard/mentor/tests`

#### 1. **Tests Hub** (`page.tsx`)
- **Purpose**: Manage all tests created by mentor
- **Admin Query**: Fetches tests with submission/invitation counts

**Test Categories**:
| Category | Criteria | Count |
|----------|----------|-------|
| **Total Tests** | All tests | Integer count |
| **Live Tests** | `is_live=true` | Integer count |
| **Completed** | Not live, has submissions | Integer count |
| **Ready** | Invites sent, no submissions yet | Integer count |
| **Draft** | No invites, no submissions | Integer count |
| **Scheduled** | Future `scheduled_at`, invites sent | Integer count |

**UI Layout**:
```
┌─────────────────────────────────────────────────┐
│ Stats Cards: [Total][Live][Completed]...        │
├─────────────────────────────────────────────────┤
│ [+ Create Test] Button                          │
├─────────────────────────────────────────────────┤
│ Test List (Tabs):                               │
│ ├─ ALL TESTS                                    │
│ ├─ LIVE NOW                                     │
│ ├─ COMPLETED                                    │
│ ├─ READY                                        │
│ ├─ DRAFTS                                       │
│ └─ SCHEDULED                                    │
└─────────────────────────────────────────────────┘
```

**Actions per Test**:
- View details & analytics
- Edit (if not live)
- Assign students
- Go live
- Monitor (if live)
- Export results

---

#### 2. **Create Test** (`create/page.tsx`)
**Route**: `/dashboard/mentor/tests/create`

**Component**: `TestCreateClient`

**Test Configuration**:
```typescript
interface TestFormData {
  title: string;                  // Test name (required)
  description: string;            // Instructions for students
  test_type: string;             // 'individual' | 'community'
  duration_minutes: number;       // Time limit (60 min default)
  scheduled_at: string;          // When to make live (optional)
  enable_screen_recording: boolean; // Video recording
  enable_face_monitoring: boolean;  // Webcam required
  randomize_questions: boolean;    // Shuffle question order
  show_results_immediately: boolean; // Show scores after submit
  allow_review: boolean;          // Review answers after submit
  passing_percentage: number;     // Pass threshold (default: 60%)
  enable_anti_cheat: boolean;    // Enable proctoring
}
```

**Question Building**:
```typescript
interface TestQuestion {
  id: string;
  text: string;                  // Question text
  type: 'mcq' | 'essay' | 'coding';
  options?: string[];            // For MCQ only
  correctAnswer: string | string[];
  marks: number;                 // Points for question
  explanation?: string;          // Show after submission
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];              // Topic tags
}
```

**Workflow**:
1. Select template (optional)
2. Enter basic info (title, description, duration)
3. Configure settings (proctoring, scoring, results)
4. Add questions:
   - Build inline via **QuestionBuilder**
   - Import from **Question Bank**
   - Use pre-built **Templates**
5. Review total marks & questions
6. Submit to create test

---

#### 3. **Test Details & Monitoring** (`[id]/page.tsx`)
**Route**: `/dashboard/mentor/tests/[id]`

**Component**: `TestDetailClient`

**Display Sections**:
- **Test Info**: Title, description, settings, schedule
- **Statistics**: 
  - Students invited
  - Submissions received
  - Average score
  - Pass rate
- **Student List**: 
  - Name, email, status (pending/submitted)
  - Score, percentage, submission time
  - Action buttons (view submission, grade)
- **Action Buttons**:
  - View Analytics
  - Assign Students
  - Go Live
  - Edit Test
  - Monitor Live Session
  - Export Results

---

#### 4. **Live Test Monitoring** (`[id]/monitor/page.tsx`)
**Route**: `/dashboard/mentor/tests/[id]/monitor`

**Real-time Features**:
- ✅ Student list with status (answering/submitted/disqualified)
- ✅ Average score (live update)
- ✅ Submissions in real-time
- ✅ Violation alerts for each student
- ✅ Disqualification control
- ✅ Time remaining for active students

**Proctoring Dashboard**:
```
Student: John Doe | Status: ANSWERING | Violations: 1
├─ Tab Switches: 1
├─ Fullscreen Exits: 0
├─ Face Detection Fails: 0
└─ Copy/Paste Attempts: 0
```

---

#### 5. **Edit Test** (`[id]/edit/page.tsx`)
**Route**: `/dashboard/mentor/tests/[id]/edit`

**Restrictions**:
- ❌ Cannot edit if test is live
- ❌ Cannot change questions if submissions exist (integrity)
- ✅ Can edit settings, title, description
- ✅ Can add questions (append only)

---

### Mentor Test Components

#### `TestCreateClient`
Main test creation form with 4 sections:

**Section 1: Basic Info**
- Title (required)
- Description
- Test type (individual/community)
- Duration in minutes

**Section 2: Proctoring Settings**
- [ ] Enable screen recording
- [ ] Enable face monitoring
- [ ] Enable anti-cheat (tab switching, fullscreen)
- [ ] Require fullscreen mode

**Section 3: Results Settings**
- [ ] Show results immediately after submission
- [ ] Allow review of answers
- [ ] Randomize question order
- Passing percentage (0-100)

**Section 4: Questions**
- Question builder inline
- Import from question bank
- Use templates
- Delete/reorder questions
- Total marks calculator

---

#### `QuestionBuilder`
Build individual questions:

```typescript
interface QuestionInput {
  text: string;                    // Question text (required)
  type: 'mcq' | 'essay' | 'coding';
  marks: number;                   // Points
  
  // MCQ specific
  options?: string[];              // Answer choices
  correctAnswer?: number | string; // Index or text
  difficulty?: string;
  explanation?: string;
}
```

**MCQ Builder** (`MCQBuilder.tsx`):
- Add/remove options
- Mark correct answer
- Set marks value
- Add explanation

---

#### `QuestionBankSelector`
Reuse questions from question bank:

**Features**:
- Filter by difficulty, topic, subject
- Search questions
- Select multiple to bulk import
- Avoid duplicates (shows existing IDs)

---

#### `BulkInviteModal`
Assign test to students:

```typescript
interface BulkInviteOptions {
  test_id: string;
  student_ids: string[];    // Array of UUIDs
  scheduled_at?: string;    // When to unlock test
  inviteMessage?: string;   // Custom invite message
}
```

**Workflow**:
1. Open modal
2. Search/select students:
   - By email
   - By class/community
   - By individual
3. Optional: Set unlock date
4. Send invitations
5. Confirm: "X students invited"

---

#### `TestAssignModal`
Similar to BulkInviteModal, assign tests:

**Who can invite**:
- Mentor (their own students/communities)
- Admin (anyone)

**Invite Status Tracking**:
- `pending` - Invitation sent, not accepted
- `accepted` - Student acknowledged
- `declined` - Student declined invite
- `submitted` - Test completed

---

#### `TestAnalytics`
Comprehensive results analytics:

```typescript
interface AnalyticsData {
  summary: {
    total_invited: number;
    total_submitted: number;
    completion_rate: number;        // 0-100%
    average_score: number;
    highest_score: number;
    lowest_score: number;
    average_time_minutes: number;
    pass_rate: number;
  };
  grade_distribution: {
    grade: string;                  // 'A+', 'A', 'B', etc.
    count: number;
    percentage: number;
  }[];
  question_analysis: {
    question_id: string;
    question_text: string;
    correct_count: number;
    incorrect_count: number;
    skip_count: number;
    difficulty_rating: string;
    avg_time_seconds: number;
  }[];
  time_distribution: {              // How many submitted in time range
    range: string;                  // '0-5 min', '5-10 min', etc.
    count: number;
  }[];
  score_trend: {                    // Scores over time
    date: string;
    avg_score: number;
    submissions: number;
  }[];
}
```

**Visualization**:
- Bar chart: Grade distribution
- Line chart: Score trends
- Table: Question analysis
- Leaderboard: Top performers

**Export**:
- CSV download of all results
- Detailed per-question stats
- Per-student answer sheets

---

#### `ManualGrading`
Grade descriptive/essay questions:

**Features**:
- ✅ View student's essay answer
- ✅ Leave feedback comments
- ✅ Award points manually
- ✅ Mark as graded
- ✅ Bulk grade multiple submissions

---

### Mentor Test API Endpoints

```
GET  /api/tests                         → List mentor's tests
POST /api/tests                         → Create new test
GET  /api/tests/[id]                    → Get test details
PATCH /api/tests/[id]                   → Edit test
DELETE /api/tests/[id]                  → Delete test (draft only)

POST /api/tests/[id]/assign             → Bulk invite students
POST /api/tests/[id]/start              → Make test live
POST /api/tests/[id]/end                → End live test

GET  /api/tests/[id]/submissions        → Get all submissions
GET  /api/tests/[id]/submissions/[sid]  → Get specific submission
POST /api/tests/[id]/grade              → Manual grading

GET  /api/tests/[id]/analytics          → Get analytics & stats
POST /api/tests/[id]/export             → Export results (CSV/PDF)
POST /api/tests/[id]/monitor            → Live monitoring data

POST /api/tests/[id]/questions          → Add questions
DELETE /api/tests/[id]/questions/[qid]  → Delete question
```

---

## 🔒 SECURITY & PROCTORING

### Test Session Security Model

**Database Tables**:
```sql
test_sessions
├─ id (UUID primary)
├─ test_id → tests.id
├─ student_id → auth.users.id
├─ session_token (unique)
├─ browser_fingerprint
├─ ip_address
├─ user_agent
├─ started_at, expires_at, ended_at
├─ submission_id → test_submissions.id
├─ tab_switches_count
├─ fullscreen_exits_count
├─ face_detection_failures_count
├─ copy_paste_attempts_count
├─ suspicious_activity_count
├─ total_violations
├─ is_flagged, flag_reason
├─ is_active, is_submitted, was_interrupted

test_audit_log
├─ id, session_id, test_id, student_id
├─ event_type (session_start|violation|submission|session_end)
├─ event_details (JSONB)
├─ severity (info|warning|critical)
├─ created_at

test_proctoring_violations
├─ id, session_id
├─ violation_type (tab_switch|fullscreen_exit|etc.)
├─ violation_timestamp
├─ severity
├─ device_info (JSONB)
├─ additional_data (JSONB)
```

**RLS Policies**:
- Students see only their own sessions
- Mentors see sessions for their tests
- Audit logs visible to respective students/mentors
- INSERT/UPDATE by system/authenticated users

---

### Anti-Cheat Violations

| Violation Type | Trigger | Warning | Auto-Submit |
|---|---|---|---|
| `tab_switch` | Document hidden | 1st warning | After 3rd |
| `fullscreen_exit` | Exit fullscreen | 1st warning | After 3rd |
| `face_detection` | No face detected | 1st warning | After 3rd |
| `copy_paste` | Ctrl+C/Cmd+C | 1st warning | After 3rd |
| `screen_share_stopped` | Screen share interrupted | 1st warning | After 3rd |
| `suspicious` | Unusual pattern | 1st warning | After 3rd |

**Server-side Endpoints**:
```
POST /api/tests/[id]/violations-secure
{
  violation_type: string;
  timestamp: ISO string;
  session_id: UUID;
  device_info?: {
    browser: string;
    os: string;
    resolution: string;
  };
  additional_data?: object;
}
```

---

## 📊 TEST QUESTION TYPES

### 1. MCQ (Multiple Choice)
```typescript
{
  id: 'q_1',
  question: 'What is 2+2?',
  type: 'mcq',
  options: ['3', '4', '5', '6'],
  correctAnswer: 1,  // Index of correct option
  marks: 1,
  explanation: 'Basic arithmetic: 2+2=4'
}
```
**Auto-graded**: Yes ✅
**Marks Awarded**: Full or zero

---

### 2. Essay / Descriptive
```typescript
{
  id: 'q_2',
  question: 'Explain the theory of relativity',
  type: 'essay',
  marks: 10,
  explanation: 'Einstein proposed...'
}
```
**Auto-graded**: No ❌ (needs manual review)
**Marks Awarded**: Mentor decides (0-10)

---

### 3. Coding (Future)
```typescript
{
  id: 'q_3',
  question: 'Write a function to reverse a string',
  type: 'coding',
  testCases: [
    { input: 'hello', expected: 'olleh' },
    { input: 'abc', expected: 'cba' }
  ],
  marks: 5
}
```
**Auto-graded**: Against test cases
**Marks Awarded**: Full if all pass, partial if some pass

---

## 🎯 TEST SUBMISSION WORKFLOW

### Student Submission Flow
```
1. Student clicks "Take Test"
   ↓
2. Session created via POST /api/tests/[id]/start
   ↓ Returns: test data, session_token, time_remaining
   ↓
3. Student answers questions (auto-saved)
   ↓
4. Timer expires OR student clicks "Submit"
   ↓
5. POST /api/tests/[id]/submit-secure
   ├─ Send: answers, violations, session_token
   ├─ Server validation:
   │  ├─ Check session valid
   │  ├─ Check not expired
   │  ├─ Check not already submitted
   │  └─ Verify question integrity
   │
6. Auto-grade MCQ questions
   ├─ Calculate percentage
   ├─ Determine grade (A+, A, B, etc.)
   └─ Check if passed (>= passing_percentage)
   ↓
7. Create test_submission record
   ├─ Store: answers, score, percentage, violations
   ├─ Queue: Descriptive questions for mentor review
   └─ Flag: If high violations detected
   ↓
8. Redirect to results page
   ├─ Show: Score, grade, time, rank
   ├─ If show_results_immediately: Show answers + explanations
   └─ Option: Review flagged violations
```

---

### Mentor Grading Flow
```
1. Mentor views test details
   ↓
2. Click "View Submissions"
   ↓
3. Filter by:
   - Status (pending/graded)
   - Score range
   - Violations present
   ↓
4. Click student submission
   ↓
5. Review:
   - MCQ answers (auto-marked ✓/✗)
   - Essay answers (awaiting grade)
   - Proctoring violations
   ↓
6. For each essay:
   - Read student answer
   - Award points (0 to max_marks)
   - Add feedback comments
   ↓
7. Submit grades
   ├─ Update submission record
   └─ Notify student via notification
   ↓
8. View analytics:
   - Class average
   - Grade distribution
   - Question difficulty
   - Performance trends
```

---

## 📈 TEST STATISTICS & ANALYTICS

### What Mentors See
```
Total Students: 30
Submissions: 24
Completion Rate: 80%
Average Score: 75/100
Passing Rate: 70% (21/30)
Highest Score: 95
Lowest Score: 42
Avg Time: 48 min

Question Breakdown:
Q1: 90% correct (Easy)
Q2: 70% correct (Medium)
Q3: 40% correct (Hard)

Grade Distribution:
A+: 3 students (10%)
A:  6 students (20%)
B:  8 students (27%)
C:  6 students (20%)
D:  2 students (7%)
F:  5 students (16%)

Time Distribution:
0-30 min: 5 students
30-60 min: 18 students
60+ min: 1 student
```

---

## 🎓 TEMPLATES & QUESTION BANK

### Pre-built Test Templates
- Competitive exam prep (MCQ focused)
- Skill assessment (Mixed types)
- Course final exam (Comprehensive)
- Quick quiz (Short duration)
- Coding assessment (Programming focused)

Each template includes:
- Settings pre-configured
- 5-20 sample questions
- Time estimate
- Difficulty level

### Question Bank
**Features**:
- Organize by subject/topic
- Difficulty levels
- Reuse across tests
- Track usage statistics
- Search functionality

---

## 🔧 TECHNICAL DETAILS

### Database Schema
```sql
tests (mentor_id, community_id, is_live, scheduled_at)
test_invitations (student_id, status)
test_submissions (student_id, answers, score, violations)
test_audit_log (session_id, event_type, severity)
test_proctoring_violations (session_id, violation_type)
test_submission_integrity (submission_id, submission_hash)
```

### RLS Policies
- Students: SELECT own submissions
- Mentors: SELECT own tests + submissions
- Service role: Full access (grading, monitoring)

### Indexes
- `test_sessions(test_id, student_id)` - Unique active
- `test_sessions(session_token)` - Token lookup
- `test_submissions(test_id, student_id)` - Result queries
- `test_audit_log(event_type, created_at)` - Event queries

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Test migration `20240529_add_test_security.sql` applied
- [ ] Daily.co API key configured
- [ ] Arcjet rate limiting enabled for test endpoints
- [ ] Session expiration cleanup job running
- [ ] Email notifications for test assignments working
- [ ] Violation logging persisting correctly
- [ ] File upload to Supabase Storage working
- [ ] Export functionality tested (CSV/PDF)
- [ ] Proctoring session recording working
- [ ] Face detection API enabled (if applicable)

