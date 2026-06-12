# Auticare Platform

## Project Overview

Auticare is a comprehensive digital platform designed to support families, doctors, and therapists in the early detection and ongoing care of autism in children. 

The platform supports distinct workflows for three main user roles:

*   **Parent flow:** Parents can sign up, manage profiles for their children, and complete preliminary autism screening questionnaires. After viewing the initial screening results, they can book specialized professionals, attend Zoom sessions, and track their child's customized treatment plans.
*   **Doctor flow:** Doctors receive and approve booking requests, conduct remote consultations using an integrated Zoom session flow, and complete post-session notes. Based on their assessment, they can create and publish personalized treatment plans for the parent and assign follow-up care to therapists.
*   **Therapist flow:** Therapists receive assigned treatment plans from doctors. They track the child's progress, conduct ongoing sessions to continue recovery, and add incremental progress notes to the system.

Features include:
- **Autism screening:** Initial digital assessments for early detection.
- **Session booking:** Seamless appointment scheduling with professionals.
- **Zoom sessions:** Secure, integrated tele-health video conferencing.
- **Treatment plans:** Centralized, structured action plans managed by doctors and therapists.
- **Notes:** Ongoing clinical and progress notes tracking the child's journey.
- **Notifications:** Real-time updates for session approvals and treatment plan changes.
- **Chat system:** Secure, real-time messaging between parents and their assigned specialists.

---

## Tech Stack

*   **Frontend:** React (with TypeScript)
*   **Build Tool:** Vite
*   **State Management:** React Context API
*   **HTTP Client:** Axios
*   **Backend:** Node.js / Express deployed on Railway
*   **Frontend Deployment:** Vercel deployment

---

## Setup Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory. You must configure the following:
```env
# The base URL for the backend API
VITE_API_BASE_URL=https://auticare-production-828c.up.railway.app/api

# The application name
VITE_APP_NAME=Auticare
```
*(Note: If testing locally with the Vite proxy, the `API_BASE_URL` in `src/services/apiClient.ts` uses `/api` to avoid CORS preflight errors.)*

### 3. Run dev server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## API Modules

The application interacts with the backend through dedicated API modules located in `src/services/api/`:

*   **Auth (`authService.ts`)**: Handles user authentication, login, registration, and logout.
*   **Children (`childrenService.ts`)**: Manages child profiles and screening data.
*   **Bookings (`bookings.ts` / `bookingsService.ts`)**: Manages appointment scheduling, requests, and status updates.
*   **Sessions (`sessionsService.ts`)**: Manages active Zoom sessions and session metadata.
*   **Treatment Plans (`treatmentPlans.ts`)**: Manages the creation, retrieval, and updating of customized care plans.
*   **Notifications (`dashboard.ts` / Context)**: Retrieves real-time alerts for the dashboard.
*   **Chat (`chatService.ts`)**: Manages real-time conversations and messaging history.
*   **Notes (`notesService.ts`)**: Handles clinical progress notes.
*   **Specialists (`specialists.ts`)**: Retrieves the directory of available doctors and therapists.
*   **Profile (`profileService.ts`)**: Manages the current user's profile and settings.

---

## User Roles

*   **Parent:** The primary caregiver who adds children to the platform, completes screenings, books sessions, communicates via chat, and tracks treatment progress.
*   **Doctor:** The primary medical specialist who diagnoses, conducts initial Zoom consultations, writes the core treatment plan, and assigns therapists.
*   **Therapist:** The specialized care provider who executes the treatment plan, conducts ongoing sessions, and maintains progress notes.

---

## Current Workflow

The exact system flow follows this lifecycle:

1.  **Parent:** Sign up → Add child → Screening → View result → Book specialist → Receive confirmation → Join session → View treatment plan.
2.  **Doctor:** Receive booking → Approve → Start Zoom session → Complete session → Create treatment plan → Publish to parent and therapist.
3.  **Therapist:** Receive assigned treatment plan → View plan → Follow sessions → Add notes → Continue recovery.

---

## Deployment

*   **Frontend:** Deployed and hosted globally via **Vercel**.
*   **Backend:** Deployed and hosted securely on **Railway**.
