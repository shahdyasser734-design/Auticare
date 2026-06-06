# Doctor Registration & Booking Workflow - Complete Testing Guide

## Overview
This document provides step-by-step instructions to verify the complete end-to-end doctor registration and booking workflow, including visibility, booking creation, approval, and notifications.

## System Architecture

### Key Components:
- **Frontend**: React/TypeScript with OurSpecialists page for parents
- **Backend**: API endpoints for specialists, bookings, notifications, dashboard
- **Mock Data**: Fallback when backend endpoints fail
- **Logging**: Console logs with `[COMPONENT]` prefix for debugging

## Testing Checklist

### Phase 1: Doctor Registration & Visibility

#### Step 1.1: Register a New Doctor Account
```
1. Open application in browser
2. Navigate to Signup page
3. Fill in registration form:
   - Name: Dr. Test Doctor
   - Email: doctor1@test.com
   - Password: TestPass123!
   - Role: Doctor
   - Phone: 01012345678
   - National ID: 30201012233445
   - Specialization: Pediatric Neurologist
   - License Number: LIC-123456
   - Years of Experience: 10
   - Qualification: MD
   - Upload certificates
4. Click Sign Up
5. System redirects to DoctorHome
```

**Verification Points:**
- ✓ Account created successfully
- ✓ Redirected to DoctorHome (not error page)
- ✓ Welcome message shows "Dr. Test Doctor"
- ✓ Console logs show successful authentication

#### Step 1.2: Verify Doctor Appears in Specialist List
```
1. Open new browser tab/window
2. Go to Login page
3. Login as Parent:
   - Email: parent@test.com  
   - Password: ParentPass123!
4. Navigate to "Our Specialists" or "Browse Doctors"
5. Check Doctors tab
```

**Verification Points:**
- ✓ "Dr. Test Doctor" appears in the list
- ✓ Specialization shows "Pediatric Neurologist"  
- ✓ Years of experience shows "10"
- ✓ Console shows: `[SPECIALISTS] Loaded X doctors and Y therapists`

**If Doctor Does NOT Appear:**
1. Check browser console for errors
2. Verify logs show: `[SPECIALISTS] Extracted specialists data:`
3. Check if API returns empty list vs. mock data being used
4. Backend should have created specialist record during registration
5. Check backend database for newly created specialist record

### Phase 2: Booking Creation

#### Step 2.1: Create Booking from Parent Account
```
1. While logged in as Parent (from previous step)
2. From OurSpecialists page, find "Dr. Test Doctor"
3. Click "Book Appointment"
4. Fill booking modal:
   - Date: Tomorrow's date
   - Time: 2:00 PM
   - Reason: "Child behavioral evaluation"
5. Click "Book" or "Confirm"
```

**Console Logs to Expect:**
```
[BOOKING] Creating booking for specialist: Dr. Test Doctor (ID: X, Type: doctor)
[BOOKING] Request payload: {SpecialistId: X, ChildId: ..., PreferredDate: ..., PreferredTime: ..., Reason: ...}
[BOOKING] Created booking successfully: {id: ..., status: 'pending', ...}
```

**Verification Points:**
- ✓ Booking modal closes
- ✓ Success message shown: "Booking successful! The doctor will review your request shortly."
- ✓ Booking created with correct specialist ID
- ✓ Booking status is 'pending'
- ✓ Console shows `[BOOKING] Created booking successfully`

### Phase 3: Doctor Dashboard - View Pending Requests

#### Step 3.1: Doctor Sees Pending Booking Request
```
1. Switch to Doctor browser window (or open new tab)
2. Navigate to Doctor Home (should still be logged in, or login again)
3. Look for "Pending Booking Requests" section
4. Verify the booking appears in the list
```

**Console Logs to Expect:**
```
[DOCTOR_HOME] Fetching data for doctor: [doctor-id]
[BOOKING] Fetching upcoming bookings from API...
[BOOKING] Fetched upcoming bookings from API: X items
[DOCTOR_HOME] Fetched X bookings, Y children, Z notifications
```

**Verification Points:**
- ✓ "Pending Booking Requests" section visible
- ✓ Booking from parent appears in list
- ✓ Shows appointment date and reason
- ✓ "Approve" and "Reject" buttons are visible and clickable
- ✓ Console shows booking was fetched

**If Booking Does NOT Appear:**
1. Check console logs for errors
2. Verify endpoint `/bookings/upcoming` returns the booking
3. Verify booking.specialistId matches doctor's ID
4. Check if booking was actually created (from Phase 2)
5. Manual verification: Open browser dev tools → Network tab → Call `/bookings/upcoming` and check response

### Phase 4: Booking Approval

#### Step 4.1: Doctor Approves Booking Request
```
1. From DoctorHome Pending Booking Requests section
2. Click "Approve" button for the booking
3. Wait for confirmation
```

**Console Logs to Expect:**
```
[DOCTOR_HOME] Updating booking [booking-id] to status: confirmed
[BOOKING] Updating booking [booking-id] status to confirmed
[BOOKING] Updating booking [booking-id] status to confirmed (via PATCH)
[BOOKING] Status updated successfully: {id: ..., status: 'confirmed', ...}
[NOTIFICATION] Booking [booking-id] status changed to confirmed
[NOTIFICATION] Message for parent [parent-id]: Dr. Test Doctor approved your booking request.
```

**Verification Points:**
- ✓ Booking disappears from "Pending Booking Requests"
- ✓ Booking appears in "Upcoming Approved Consultations"
- ✓ Status changes to 'confirmed'
- ✓ Console shows status update successful
- ✓ Console shows notification message created

### Phase 5: Parent Receives Notification & Updates

#### Step 5.1: Parent Sees Updated Booking Status
```
1. Switch to Parent browser window
2. Navigate to "My Bookings"
3. Check booking status
4. Look for notifications
```

**Verification Points:**
- ✓ Booking status shows "Confirmed" or "Approved"
- ✓ Booking appears in "Upcoming" tab, not pending
- ✓ If notifications system implemented: See notification "Dr. Test Doctor approved your booking request."

**If Status NOT Updated:**
1. Parent may need to refresh page
2. Check `/bookings/my-bookings` endpoint
3. Verify booking.status is actually 'confirmed' in response
4. Check timestamps - booking may be showing cached data

### Phase 6: Rejection Flow (Repeat with different doctor)

#### Step 6.1: Register Second Doctor & Create Booking
```
Repeat Steps 1.1-2.1 with:
- Dr. Test Doctor 2
- doctor2@test.com
Create separate booking request
```

#### Step 6.2: Doctor Rejects Booking
```
1. As Doctor 2, go to DoctorHome
2. Click "Reject" on the pending booking
3. Observe changes
```

**Console Logs to Expect:**
```
[BOOKING] Updating booking [booking-id] status to cancelled
[NOTIFICATION] Message for parent [parent-id]: Dr. Test Doctor 2 rejected your booking request.
```

**Verification Points:**
- ✓ Booking is removed from pending list
- ✓ Booking status changes to 'cancelled' or 'rejected'
- ✓ Parent receives notification about rejection
- ✓ Booking disappears from parent's "My Bookings"

## Debugging Guide

### Issue: Doctor Not Appearing in Specialist List

**Diagnostic Steps:**
```
1. Check console for errors during specialist loading
2. Look for: [SPECIALISTS] API response
3. Verify specialist list contains newly registered doctor
4. Check if mock data is being used instead of real data

If using mock data:
- Backend /specialists endpoint may be failing
- Check backend logs for API errors
- Verify database has specialist record
```

### Issue: Booking Not Appearing for Doctor

**Diagnostic Steps:**
```
1. Check console: [BOOKING] Fetched upcoming bookings
2. Verify response includes the booking
3. Check booking.specialistId matches doctor's ID
4. Verify booking.status is 'pending'

If booking is not in the list:
- Check if it was actually created (verify booking ID)
- Verify booking.specialistId matches logged-in doctor
- Check if booking filtered out due to status
```

### Issue: Notification Not Sent

**Diagnostic Steps:**
```
1. Check console for: [NOTIFICATION] Message for parent
2. Verify appointment status update succeeded
3. Check if backend sends notification or if frontend needs to
4. Verify parent fetches notifications after approval

Possible issues:
- Notification service endpoint not working
- Parent not refreshing to fetch new notifications
- Backend not creating notification record
```

## Expected Console Output - Complete Workflow

```javascript
// Step 1: Doctor Registration
// (No specific doctor workflow logs during signup)

// Step 1.2: Parent loads OurSpecialists
[SPECIALISTS] Loading specialists from API...
[SPECIALISTS] Raw API response: [array of specialists]
[SPECIALISTS] Extracted specialists data: [array of specialists]
[SPECIALISTS] Mapped specialists: [array with type field]
[SPECIALISTS] Loaded 5 doctors and 3 therapists

// Step 2.1: Parent creates booking
[BOOKING] Creating booking for specialist: Dr. Test Doctor (ID: 1, Type: doctor)
[BOOKING] Request payload: {SpecialistId: 1, ChildId: "...", PreferredDate: "...", ...}
[BOOKING] Created booking successfully: {id: "booking-1", status: 'pending', specialistId: 1, ...}

// Step 3.1: Doctor loads dashboard
[DOCTOR_HOME] Fetching data for doctor: [doctor-id]
[BOOKING] Fetching upcoming bookings from API...
[BOOKING] Fetched upcoming bookings from API: 1 items
[DOCTOR_HOME] Fetched 1 bookings, 2 children, 0 notifications

// Step 4.1: Doctor approves booking
[DOCTOR_HOME] Updating booking booking-1 to status: confirmed
[BOOKING] Updating booking booking-1 status to confirmed
[BOOKING] Status updated successfully: {id: "booking-1", status: 'confirmed', ...}
[NOTIFICATION] Booking booking-1 status changed to confirmed
[NOTIFICATION] Message for parent [parent-id]: Dr. Test Doctor approved your booking request.

// Step 5.1: Parent loads MyBookings
[BOOKING] Fetching my bookings...
// Booking should show status: 'confirmed'
```

## Verification Checklist

### Doctor Registration & Profile
- [ ] Doctor can register with full specialization details
- [ ] Doctor redirected to DoctorHome after registration
- [ ] Specialist type field correctly set to 'doctor'
- [ ] Profile shows correct specialization and experience

### Specialist Visibility
- [ ] Newly registered doctor appears in parent's specialist list
- [ ] Doctor appears in "Doctors" tab, not "Therapists" tab  
- [ ] Specialist profile shows correct name, specialty, experience
- [ ] Console logs show real API data (not just mock)

### Booking Creation
- [ ] Parent can create booking for specific doctor
- [ ] Booking includes specialist ID, date, time, reason
- [ ] Booking created with status 'pending'
- [ ] Booking linked to correct doctor

### Doctor Dashboard  
- [ ] Pending bookings appear in doctor's dashboard
- [ ] Only that doctor's bookings appear (not all bookings)
- [ ] Approve and Reject buttons functional

### Booking Approval
- [ ] Doctor can approve booking
- [ ] Booking status changes to 'confirmed'
- [ ] Booking moves from pending to approved section
- [ ] Notification created for parent

### Parent Notification
- [ ] Parent receives notification of approval
- [ ] Notification includes doctor name
- [ ] MyBookings shows updated status
- [ ] Booking no longer appears as pending

### Rejection Flow
- [ ] Doctor can reject booking
- [ ] Booking status changes to 'cancelled'
- [ ] Parent receives rejection notification  
- [ ] Booking disappears from parent's active bookings

## Test Data Templates

### Doctor Registration:
```
Name: Dr. Test Doctor 1
Email: doctortest1@example.com
Password: TestPass123!@
Role: Doctor
Phone: 01012345678
National ID: 30201012233445
Specialization: Child Psychiatrist
License: PSY-123456
Experience: 12 years
Qualification: MD
```

### Parent Account (for testing):
```
Name: Test Parent
Email: parenttest@example.com
Password: TestPass123!@
Role: Parent
```

### Booking Details:
```
Date: [Next available date]
Time: 14:00
Reason: Child behavioral evaluation
```

## API Endpoints to Monitor

Monitor these endpoints in Network tab for verification:

1. **Specialist Registration**: `POST /auth/signup` or `POST /register`
2. **Specialist Listing**: `GET /api/specialists`
3. **Booking Creation**: `POST /api/bookings`
4. **Booking Updates**: `PATCH /api/bookings/{id}/status`
5. **Doctor Bookings**: `GET /api/bookings/upcoming` or `GET /api/bookings/my-bookings`
6. **Notifications**: `GET /api/notifications`

## Success Criteria

Workflow is **COMPLETE** when:

✅ Doctor registers and profile appears in specialist list  
✅ Parent can book that specific doctor  
✅ Booking appears in doctor's pending list (not other doctors' lists)  
✅ Doctor can approve/reject request  
✅ Parent receives notification of approval/rejection  
✅ Parent sees updated booking status  
✅ Therapist workflow mirrors doctor workflow  
✅ Role separation works (doctors only see doctor bookings, therapists see therapist bookings)  
✅ No console errors in workflow  
✅ All logging shows expected messages  

## Notes for Backend Implementation

For the workflow to function correctly, backend must:

1. **Create specialist record** when doctor registers with full details
2. **Return specialist record** in `GET /api/specialists` response
3. **Include type field** ('doctor' or 'therapist') in specialist object
4. **Filter bookings** by specialist ID when doctor fetches their bookings
5. **Create notification** when booking status is updated to 'confirmed' or 'cancelled'
6. **Include specialist name** in booking response for notification
7. **Include doctor ID/specialist ID** in booking response to verify ownership
