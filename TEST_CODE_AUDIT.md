# Test System Code Audit & Fixes

## CRITICAL ISSUES FOUND

### 1. **Dual Test Flow Architecture (MAJOR)**
**Problem:** Two separate test-taking flows create confusion:
- `/take` → `/api/tests/submit` (basic flow)
- `/take-secure` → `/api/tests/submit-secure` (secure flow with tokens)

**Impact:** Students might end up in wrong flow; inconsistent security

**Fix:** Consolidate to single secure flow; remove `/take`

---

### 2. **Test Invitations RLS Policy Gap**
**Problem:** Student tests page queries `test_invitations` but RLS might block queries

**Location:** `src/app/dashboard/student/tests/page.tsx:30-40`

**Issue:** If RLS policy isn't properly set, students won't see tests

**Current Workaround:** Using admin client in `/api/tests/assign` works, but frontend needs verification

---

### 3. **AntiCheatWrapper Endpoint Mismatch**
**Problem:** AntiCheatWrapper posts to `/api/proctoring/violations` (line 78)

**Issue:** Should post to `/api/tests/[id]/violations-secure` instead

**Impact:** Violations might not be logged properly

---

### 4. **TestAssignModal Selection Persistence**
**Problem:** Modal shows checkboxes but no confirmation feedback

**Location:** `src/components/tests/TestAssignModal.tsx:64-82`

**Issue:** User can't tell if selection was saved until they close modal

---

### 5. **Results Page Complexity**
**Problem:** `results/page.tsx` is 627 lines with:
- Inline AI evaluation logic
- Leaderboard calculation
- Analysis rendering mixed together

**Better:** Separate concerns into smaller components

---

### 6. **Mentor Detail Client Component**
**Problem:** TestDetailClient is complex with multiple responsibilities:
- Analytics display
- Manual grading
- Test status management
- CSV export

**Better:** Split into smaller focused components

---

## DATA INTEGRITY ISSUES

### Test Invitations Not Showing
**Flow Analysis:**
1. Mentor creates test ✓
2. Mentor selects students in modal ✓ (UI shows checkmarks)
3. API `/api/tests/assign` called
4. Should create `test_invitations` records
5. Student page queries `test_invitations`
6. **PROBLEM:** Might fail at step 4 or 5

**Debug Checklist:**
- [ ] Verify `test_invitations` table has proper schema
- [ ] Check RLS policies on `test_invitations`
- [ ] Verify `invited_by` column exists
- [ ] Test `/api/tests/assign` response

---

## API ENDPOINT ISSUES

### `/api/tests/submit` (Basic)
- Uses `/api/proctoring/violations`
- No session tokens
- No integrity verification

### `/api/tests/submit-secure` (Secure)
- Uses `/api/tests/[id]/violations-secure`  
- Has session tokens
- Has integrity hashing
- Has suspicious activity scoring

**Problem:** They should merge into one

---

## UI/CODE QUALITY ISSUES

### 1. Type Safety
- Many `any` types in test components
- No discriminated unions for test states
- String literals for violation types

### 2. Repeated Code
- MCQ rendering logic duplicated in:
  - `/take/page.tsx` (lines 287-327)
  - `/take-secure/page.tsx` (lines 335-375)
  - `results/page.tsx` (lines 515-548)

### 3. State Management
- Multiple useState hooks managing related state
- No error boundaries
- No loading states in some components

### 4. Error Handling
- Generic error alerts
- No retry logic
- Silent failures in API calls

---

## RECOMMENDED FIXES (PRIORITY ORDER)

### P0: Fix Test Invitations Flow
1. Verify `test_invitations` RLS policy
2. Add error logging to `/api/tests/assign`
3. Add confirmation feedback to modal

### P1: Consolidate Test Taking
1. Remove `/take` page
2. Migrate all to `/take-secure`
3. Align both submit endpoints

### P2: Simplify Components
1. Break `results/page.tsx` into 5 smaller components
2. Break `TestDetailClient.tsx` into 3 smaller components

### P3: Improve Code Quality
1. Create test types file
2. Extract MCQ rendering component
3. Add error boundaries
4. Standardize API response shapes

---

## MINIMAL FIXES TO IMPLEMENT NOW

See FIXES.md for specific code changes
