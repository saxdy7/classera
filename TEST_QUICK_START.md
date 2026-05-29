# Test System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Both mentor and student accounts created
- Students are enrolled at same university as mentor
- Supabase project with migrations applied

---

## Step 1: Mentor Creates Test

### 1.1 Navigate to Create Test
```
Go to: /dashboard/mentor/tests/create
```

### 1.2 Fill Test Form
```
Title:               "Math Quiz - Chapter 5"
Duration:            60 minutes
Total Marks:         100
Question Type:       MCQ
Enable Anti-Cheat:   ON
Enable Screen Rec:   ON (optional)
Enable Face Monitoring: ON (optional)

Questions: [Add 5-10 MCQ questions]
```

### 1.3 Submit
```
Button: "Create Test"
```

✅ **Result:** Test created with `is_live = false`

---

## Step 2: Mentor Assigns Test to Students

### 2.1 Go to Test Details
```
Click: Test name in /dashboard/mentor/tests
```

### 2.2 Assign Test
```
Button: "Assign Test" or "Invite Students"
```

### 2.3 Select Students
```
Choose: Student(s) from your university
OR
Choose: Community to assign to all members
```

### 2.4 Send Invitations
```
✓ Include notifications
Click: "Assign"
```

✅ **Result:**
- Test now `is_live = true`
- `test_invitations` created for each student
- Students notified with action link

---

## Step 3: Student Receives Notification

### 3.1 Check Notifications
```
Click: Bell icon in header
See: "New Test Assigned: Math Quiz - Chapter 5"
```

### 3.2 Navigate to Tests
```
Click: Notification link OR
Go to: /dashboard/student/tests
```

✅ **Result:** Test appears in "Live Now" section

---

## Step 4: Student Starts Test (Creates Secure Session)

### 4.1 Click Start Test
```
Button: "Start Test" (green, in Live Now section)
```

### 4.2 Wait for Initialization
```
Loading animation shows:
"Initializing secure test session..."
```

### 4.3 Test Interface Loads
```
Secure Banner: "Secure Test Session Active"
Questions appear with timer
Session Token displayed (first 16 chars)
```

✅ **Result:**
- Secure session created with unique token
- Device fingerprint captured
- IP address logged
- Expiry set to: now + 60 min + 5 min grace
- Entry in `test_sessions` table

---

## Step 5: Student Takes Test

### 5.1 Answer Questions
```
For each question:
1. Read question
2. Select/type answer
3. Click Next OR use arrow buttons
```

### 5.2 Monitor Progress
```
Top: Timer counts down (00:59:45)
Right: Question progress (5/10)
Bottom: Answered count (3/10 answered)
```

### 5.3 Anti-Cheat Monitoring Active
```
Visible Warnings:
- "Warnings: 0/5" badge
- Tab switch detected → violation logged
- Fullscreen exit detected → violation logged

System tracks:
- Copy/paste attempts
- Face detection failures
- Screen share stops
- Suspicious patterns
```

### 5.4 Time Management
```
Timer < 5 min: Red "00:04:30"
Timer < 1 min: Blinking red "00:00:45"
At 0:00: Auto-submits test
```

✅ **Result:**
- Answers stored in component state
- Violations logged in `test_proctoring_violations`
- Audit entries created per violation
- Session keeps tracking

---

## Step 6: Student Submits Test

### 6.1 Submit Test
```
Button: "Submit Test" (top right)
OR
On last question: Click "Finish"
```

### 6.2 Submission Processing
```
Shows: "Submitting..."
Validates:
  ✓ Session token valid
  ✓ Session active
  ✓ Submission within time window
  ✓ Not already submitted
  ✓ Timing validation
  ✓ Suspicious activity check
```

### 6.3 Submission Confirmation
```
Response shows:
{
  "success": true,
  "submission": {
    "id": "uuid",
    "score": 75,
    "percentage": "75.00",
    "is_disqualified": false,
    "securityAnalysis": {
      "risksDetected": false,
      "riskScore": 15
    }
  }
}
```

### 6.4 Redirect to Results
```
Auto-redirect to: /dashboard/student/tests/[id]/results
Shows: Score, grade, analysis
```

✅ **Result:**
- `test_submissions` entry created
- `test_submission_integrity` entry created (hash verification)
- `test_sessions` marked as submitted
- Audit log entries created
- AI evaluation triggered (async)

---

## Step 7: Mentor Reviews Results

### 7.1 Navigate to Test Results
```
Go to: /dashboard/mentor/tests/[test-id]
```

### 7.2 View Submissions
```
Table shows:
- Student name
- Score
- Percentage
- Status (graded, reviewing, etc)
- Warnings count
- Is flagged (if risky)
```

### 7.3 Review Violations
```
Click: "View Violations" or violations icon
Shows:
- Tab switches: 2
- Fullscreen exits: 1
- Copy/paste attempts: 0
- Face detection failures: 0
- Screen share stops: 0
- Risk score: 15/100
```

### 7.4 View Audit Log
```
Shows timeline:
- 14:32:15 - session_start (device fingerprint, IP)
- 14:35:42 - violation: tab_switch
- 14:58:30 - violation: fullscreen_exit
- 15:31:45 - submission (score 75, risk 15)
```

### 7.5 Grade or Review
```
For flagged submissions:
1. Review violations
2. Review device info (IP, browser)
3. Compare to student's history
4. Make grading decision
5. Add feedback
```

✅ **Result:** Full audit trail visible to mentor

---

## 🔍 Database Verification

### Check Session Created
```sql
SELECT 
  id,
  session_token::text as token_sample,
  is_active,
  is_submitted,
  total_violations
FROM test_sessions
WHERE test_id = '[test-uuid]'
LIMIT 1;

-- Expected result:
-- id: [uuid]
-- token_sample: classera_test_...
-- is_active: false (after submission)
-- is_submitted: true
-- total_violations: 2
```

### Check Violations Logged
```sql
SELECT 
  violation_type,
  severity,
  violation_timestamp
FROM test_proctoring_violations
WHERE session_id = '[session-uuid]'
ORDER BY violation_timestamp;

-- Expected results:
-- tab_switch | warning | 14:35:42
-- fullscreen_exit | warning | 14:58:30
```

### Check Audit Log
```sql
SELECT 
  event_type,
  severity,
  created_at
FROM test_audit_log
WHERE session_id = '[session-uuid]'
ORDER BY created_at;

-- Expected events:
-- session_start | info
-- violation | warning (×2)
-- submission | info
```

### Check Submission Integrity
```sql
SELECT 
  id,
  submission_hash,
  integrity_verified
FROM test_submission_integrity
WHERE submission_id = '[submission-uuid]';

-- Expected:
-- integrity_verified: true
-- submission_hash: [sha256]
```

---

## ⚠️ Common Scenarios

### Scenario 1: Student Switches Tabs
```
1. Student is taking test
2. Clicks another tab/window
3. Anti-cheat wrapper detects tab switch
4. Violation logged
5. Warning count increments (1/5)
6. Student sees warning banner
7. Can continue test
```

**Mentor sees:** Tab switch violation in violations view

### Scenario 2: Student Exits Fullscreen
```
1. Fullscreen enforced by anti-cheat
2. Student minimizes or exits fullscreen
3. Violation detected and logged
4. Warning increments (1/5)
5. Fullscreen re-enforced
```

**Mentor sees:** Fullscreen exit violation

### Scenario 3: Maximum Violations Reached
```
1. Student gets 5th violation
2. Test auto-submits immediately
3. Status set to is_disqualified: true
4. Session ended
5. Audit log shows auto-submission
```

**Mentor sees:** Submission flagged with "disqualified" label

### Scenario 4: Test Time Expired
```
1. Timer reaches 00:00:00
2. Test auto-submits
3. Submission timestamp recorded
4. Session expired
5. Can't access test anymore
```

**Mentor sees:** Submission with time_taken_minutes = duration

### Scenario 5: Session Token Invalid
```
1. Student tries to submit without valid token
2. Request rejected with 401 Unauthorized
3. "Invalid session token" error
4. Student redirected to test page
5. Can start new session
```

**Mentor sees:** No submission created

---

## 📊 Expected Data

### Test Lifecycle
```
State Progression:
Draft       → Created in DB, is_live = false
Assigned    → is_live = true, invitations created
In Progress → Sessions created as students start
Completed   → Submissions recorded
Graded      → Manual grades added by mentor
```

### Session Lifecycle
```
Created  → Random token, device fingerprint, IP logged
Active   → Student takes test, violations tracked
Expired  → After duration + 5 min grace period
Ended    → On submission or expiry
Archived → After 30 days (optional)
```

### Submission Lifecycle
```
Pending    → Created, score calculated
Evaluating → AI analysis in progress
Graded     → Score finalized, feedback provided
Reviewed   → Mentor reviewed violations
Flagged    → High risk, needs investigation
Approved   → Final grade set, student notified
```

---

## 🐛 Troubleshooting

### "Session not found"
```
Cause: Tried to access test without creating session
Fix: Click "Start Test" button to create session
```

### "Session has expired"
```
Cause: Submission after duration + 5 min grace
Fix: Submit before timer reaches 0
```

### "Invalid session token"
```
Cause: Token was corrupted or tampered with
Fix: Start new test session
```

### "You have already submitted this test"
```
Cause: Student already submitted, trying again
Fix: View results page, can't retake
```

### "Too many violations"
```
Cause: Exceeded 5 warnings
Fix: Session auto-submitted, review feedback
```

### "Device fingerprint mismatch"
```
Cause: (Future) Changed browser/device mid-test
Fix: Use same browser/device
```

---

## ✨ What to Check

- ✅ Session token generated correctly
- ✅ Violations tracked in real-time
- ✅ Auto-submit works on violations
- ✅ Auto-submit works on timer
- ✅ Audit log comprehensive
- ✅ Risk score calculated
- ✅ Mentor can see violations
- ✅ Integrity hash verified
- ✅ Device fingerprint captured
- ✅ IP address logged

---

## 📞 Need Help?

See:
- `TEST_SECURITY_GUIDE.md` - Complete security guide
- `TEST_DEPLOYMENT_CHECKLIST.md` - Deployment steps
- `TEST_FIX_SUMMARY.md` - What was fixed

---

**Ready to test!** 🎉  
Follow steps 1-7 for end-to-end flow verification.
