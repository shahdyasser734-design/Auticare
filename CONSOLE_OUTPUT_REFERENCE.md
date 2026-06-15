# Doctor Booking Workflow - Expected Console Output Reference

This document shows the **exact console logs** you should see when executing the complete doctor registration and booking workflow. Use this to verify each step is working correctly.

## 1. DOCTOR REGISTRATION (No Specific Logs)

Register doctor with these details:
- Name: Dr. Test Doctor
- Email: doctortest@example.com
- Specialization: Pediatric Neurologist
- Experience: 10 years

**Expected**: Normal form submission, redirect to DoctorHome. No special [PREFIX] logs during registration itself.

---

## 2. PARENT LOADS "OUR SPECIALISTS" PAGE

Expected console logs when parent navigates to specialist browsing page:

```javascript
[SPECIALISTS] Loading specialists from API...
[SPECIALISTS] Raw API response: [
  {id: 1, name: "Dr. Test Doctor", type: "doctor", specialization: "Pediatric Neurologist", ...},
  {id: 2, name: "Dr. Another Doctor", type: "doctor", ...},
  ...
]
[SPECIALISTS] Extracted specialists data: [
  {id: 1, name: "Dr. Test Doctor", type: "doctor", ...},
  ...
]
[SPECIALISTS] Mapped specialists: [
  {id: 1, name: "Dr. Test Doctor", type: "doctor", ...},
  ...
]
[SPECIALISTS] Loaded 5 doctors and 3 therapists
```

**✓ SUCCESS INDICATOR**: Final log shows "Loaded X doctors and Y therapists" including the newly registered doctor.

---

## 3. PARENT CREATES BOOKING

Parent clicks "Book Appointment" on Dr. Test Doctor and fills in details:
- Date: Tomorrow
- Time: 2:00 PM  
- Reason: Child behavioral evaluation

Expected console logs:

```javascript
Selected specialist object: {
  id: 1,
  name: "Dr. Test Doctor",
  type: "doctor",
  specialization: "Pediatric Neurologist",
  yearsOfExperience: 10,
  rating: 4.8,
  profileImage: "...",
  ...
}
Selected specialist keys: ["id", "name", "type", "specialization", "yearsOfExperience", "rating", ...]
Selected specialist full dump: "{\"id\":1,\"name\":\"Dr. Test Doctor\",\"type\":\"doctor\",\"specialization\":\"Pediatric Neurologist\",\"yearsOfExperience\":10,...}"

[BOOKING] Creating booking for specialist: Dr. Test Doctor (ID: 1, Type: doctor)
[BOOKING] Request payload: {
  SpecialistId: 1,
  ChildId: "child-12345",
  PreferredDate: "2024-01-15",
  PreferredTime: "14:00",
  Reason: "Child behavioral evaluation"
}
[BOOKING] Successfully created booking: {
  id: "booking-001",
  specialistId: 1,
  status: "pending",
  childId: "child-12345",
  parentId: "parent-5678",
  dateTime: "2024-01-15T14:00:00Z",
  reason: "Child behavioral evaluation",
  ...
}
```

**✓ SUCCESS INDICATOR**: Booking created successfully log appears with booking ID.
**✓ ALERT MESSAGE**: "Booking successful! The doctor will review your request shortly."

---

## 4. DOCTOR LOGS INTO DASHBOARD

Doctor logs in and navigates to DoctorHome. Expected console logs:

```javascript
[DOCTOR_HOME] Fetching data for doctor: doctor-5678
[BOOKING] Fetching upcoming bookings from API...
[BOOKING] Fetched upcoming bookings from API: 1 items
[DOCTOR_HOME] Fetched 1 bookings, 3 children, 0 notifications
```

**✓ SUCCESS INDICATOR**: Doctor sees "Fetched 1 bookings" indicating the pending booking appears.

**✓ UI VERIFICATION**: 
- "Pending Booking Requests" section visible
- Shows: "Dr. Test Doctor - Tomorrow at 2:00 PM"
- Child name: "Test Child"
- Reason: "Child behavioral evaluation"
- [Approve] and [Reject] buttons visible

---

## 5. DOCTOR APPROVES BOOKING

Doctor clicks "Approve" button on the pending booking. Expected console logs:

```javascript
[DOCTOR_HOME] Updating booking booking-001 to status: confirmed
[BOOKING] Updating booking booking-001 status to confirmed
[BOOKING] Updating booking booking-001 status to confirmed (via PATCH)
[BOOKING] Status updated successfully: {
  id: "booking-001",
  status: "confirmed",
  specialistId: 1,
  dateTime: "2024-01-15T14:00:00Z",
  ...
}
[NOTIFICATION] Booking booking-001 status changed to confirmed
[NOTIFICATION] Message for parent parent-5678: Dr. Test Doctor approved your booking request.
```

**✓ SUCCESS INDICATOR**: 
- "Status updated successfully" log appears
- Notification message created log shows doctor name included
- Booking disappears from "Pending Booking Requests"
- Booking appears in "Upcoming Approved Consultations"

**✓ UI VERIFICATION**:
- Pending section empties
- Booking moves to "Upcoming Consultations" with "Confirmed" badge
- Doctor can now see session details and mark as "Start"

---

## 6. PARENT NAVIGATES TO "MY BOOKINGS"

Parent opens browser tab and goes to "My Bookings" page. Expected console logs:

```javascript
[BOOKING] Fetching my bookings from API...
[BOOKING] Fetched my bookings: 1 items
```

**✓ SUCCESS INDICATOR**: Booking appears in "Upcoming" tab with status "Confirmed"

**✓ UI VERIFICATION**:
- Booking shows: "Dr. Test Doctor - Tomorrow at 2:00 PM"
- Status badge shows: "Confirmed"
- Reason shows: "Child behavioral evaluation"
- No longer appears as "pending"

---

## 7. TEST REJECTION FLOW (Optional)

Repeat steps 1-3 with a different doctor: Dr. Test Doctor 2

Doctor clicks "Reject" button. Expected console logs:

```javascript
[DOCTOR_HOME] Updating booking booking-002 to status: cancelled
[BOOKING] Updating booking booking-002 status to cancelled
[BOOKING] Status updated successfully: {
  id: "booking-002",
  status: "cancelled",
  ...
}
[NOTIFICATION] Booking booking-002 status changed to cancelled
[NOTIFICATION] Message for parent parent-5678: Dr. Test Doctor 2 rejected your booking request.
```

**✓ SUCCESS INDICATOR**:
- Booking disappears from doctor's pending list
- Parent receives notification: "Dr. Test Doctor 2 rejected your booking request"
- Booking no longer appears in parent's "My Bookings" upcoming tab

---

## COMPLETE WORKFLOW CONSOLE OUTPUT

Copy/paste the entire workflow logs sequence below for reference:

```javascript
// ===== STEP 2: SPECIALIST LOADING =====
[SPECIALISTS] Loading specialists from API...
[SPECIALISTS] Extracted specialists data: [...]
[SPECIALISTS] Mapped specialists: [...]
[SPECIALISTS] Loaded 5 doctors and 3 therapists

// ===== STEP 3: BOOKING CREATION =====
Selected specialist object: {...}
[BOOKING] Creating booking for specialist: Dr. Test Doctor (ID: 1, Type: doctor)
[BOOKING] Request payload: {...}
[BOOKING] Successfully created booking: {...}

// ===== STEP 4: DOCTOR DASHBOARD =====
[DOCTOR_HOME] Fetching data for doctor: doctor-5678
[BOOKING] Fetching upcoming bookings from API...
[BOOKING] Fetched upcoming bookings from API: 1 items
[DOCTOR_HOME] Fetched 1 bookings, 3 children, 0 notifications

// ===== STEP 5: BOOKING APPROVAL =====
[DOCTOR_HOME] Updating booking booking-001 to status: confirmed
[BOOKING] Updating booking booking-001 status to confirmed
[BOOKING] Updating booking booking-001 status to confirmed (via PATCH)
[BOOKING] Status updated successfully: {...}
[NOTIFICATION] Booking booking-001 status changed to confirmed
[NOTIFICATION] Message for parent parent-5678: Dr. Test Doctor approved your booking request.

// ===== STEP 6: PARENT CHECKS MY BOOKINGS =====
[BOOKING] Fetching my bookings from API...
[BOOKING] Fetched my bookings: 1 items
```

---

## ERROR LOG PATTERNS - TROUBLESHOOTING

### If You See These Errors, Here's What's Wrong:

#### ❌ "Failed to load specialists"
```javascript
[SPECIALISTS] Failed to load specialists: Error: Network error
[SPECIALISTS] Using mock specialists: [...]
```
**ISSUE**: Backend `/api/specialists` endpoint is down
**ACTION**: Check backend server is running, API endpoint accessible

#### ❌ "Failed to update booking"
```javascript
[DOCTOR_HOME] Error updating booking booking-001: Error: 403 Forbidden
[BOOKING] Update failed
```
**ISSUE**: Doctor doesn't have permission, or booking doesn't exist
**ACTION**: Verify doctor ID in booking matches logged-in doctor

#### ❌ "Booking fetching failed"
```javascript
[BOOKING] Failed to fetch upcoming bookings: Error: 404 Not Found
[BOOKING] Fetched upcoming bookings from API: 0 items
```
**ISSUE**: Backend `/bookings/upcoming` endpoint not found or returning empty
**ACTION**: Verify backend endpoint exists, returns doctor-specific bookings

#### ❌ "Notification message not created"
```javascript
[NOTIFICATION] Booking booking-001 status changed to confirmed
// (no "Message for parent" log follows)
```
**ISSUE**: Notification service not properly implemented
**ACTION**: Notification trigger is logged but backend must create actual notification record

---

## Quick Verification Checklist

As you follow the workflow, verify these logs appear in this order:

1. ✅ `[SPECIALISTS] Loaded X doctors` - Doctor is visible
2. ✅ `[BOOKING] Creating booking for specialist` - Booking being created
3. ✅ `[BOOKING] Successfully created` - Booking created with ID
4. ✅ `[DOCTOR_HOME] Fetched X bookings` - Doctor sees the booking
5. ✅ `[DOCTOR_HOME] Updating booking` - Approval in progress
6. ✅ `[BOOKING] Status updated successfully` - Approval completed
7. ✅ `[NOTIFICATION] Message for parent` - Notification message prepared
8. ✅ `[BOOKING] Fetched my bookings` - Parent sees updated status

**If any log is missing**, use the Debugging Guide in `DOCTOR_BOOKING_WORKFLOW_TESTING.md` to diagnose.

---

## Console Filtering Tips

Open DevTools Console (F12) and use these search patterns:

```javascript
// Show only booking logs
// Filter: [BOOKING]

// Show only specialist logs  
// Filter: [SPECIALISTS]

// Show only doctor dashboard logs
// Filter: [DOCTOR_HOME]

// Show only notification logs
// Filter: [NOTIFICATION]

// Show only errors
// Filter: "Error:" or "error"

// Show entire workflow
// Filter: \[BOOKING\]|\[SPECIALISTS\]|\[DOCTOR_HOME\]|\[NOTIFICATION\]
```

---

## Expected Behavior Summary

| Step | Expected Behavior | Console Log |
|------|-------------------|-------------|
| Doctor Registration | No special logs, redirect to DoctorHome | (normal signup flow) |
| Load Specialists | See doctor in list | `[SPECIALISTS] Loaded X doctors...` |
| Create Booking | Booking success alert | `[BOOKING] Successfully created` |
| Doctor Dashboard | See pending booking | `[DOCTOR_HOME] Fetched X bookings` |
| Approve Booking | Booking moves to confirmed | `[BOOKING] Status updated successfully` |
| Parent My Bookings | See confirmed status | `[BOOKING] Fetched my bookings` |
| Reject Booking | See rejection notification | `[NOTIFICATION] rejected your booking` |

---

## Notes

- **All logs use [COMPONENT] prefix** for easy identification
- **Logs appear in real-time** as workflow progresses  
- **No logs = check for errors** in console or network errors
- **Mock data fallback** will show if API endpoints fail
- **Build successful** - all code compiles and runs correctly

Use this guide alongside `DOCTOR_BOOKING_WORKFLOW_TESTING.md` for complete workflow verification.
