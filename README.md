# AutiCare - Healthcare Platform Frontend

A comprehensive modern React frontend for AutiCare, a healthcare platform connecting parents, doctors, and therapists for autism spectrum disorder support.

## 🚀 Features

### Authentication
- Role-based authentication (Parent, Doctor, Therapist)
- Signup role selector cleanly displays **Doctor** (automatically mapped to `Specialist` to match backend contracts)
- Login with email and password
- Forgot password functionality
- Protected routes based on user roles
- Session persistence with localStorage

### 🎨 Visual & Motion System (New Update)
- **Premium Warm Beige Healthcare Palette**: Light theme converted to a nurturing healthcare space using elegant hues (`#F6F1E8`, `#FFF8F0`, `#EADBC8`, `#D9C7B0`) that are soft on the eyes.
- **SaaS Glassmorphism Dark Mode**: Deep blue gradients with glowing borders, preserving navy glassmorphism styles.
- **Micro-Animations & Motion**: calmming, non-distracting floating background elements (glowing puzzle pieces, stethoscope shapes, neural paths, glowing particles, and heart pulses) to create an emotionally supportive environment.
- **Layered CSS Hero Visuals**: Overlapping 3D floating visual card stacks for a modern, startup SaaS healthcare aesthetic.
- **Button Redesign**: Soft pill-shaped buttons (`rounded-full`) utilizing a warm gold/orange gradient in light mode and glowing deep blue gradients in dark mode.
- **Logo Standardization**: Standardized on the custom puzzle cube SVG logo everywhere for brand consistency.
- **Accessibility & Contrast**: Highly-visible elements, proper outline contrast, screen reader friendliness, and smooth responsive layout scaling.

### Parent Features
- **Home Dashboard**: Welcome section, quick actions, upcoming sessions, recent activities
- **Autism Screening Test**: 10-page interactive test with progress tracking
- **Test Results Dashboard**: Score summary, statistics, risk indicators, recommendations
- **Book Specialist**: Search and filter doctors/therapists, view specialist cards
- **Sessions Management**: View upcoming and past sessions, join sessions
- **Re-test**: Retake the screening test for progress tracking

### Doctor & Therapist Features
- **Dashboard**: Overview of sessions, statistics, and patient list
- **Sessions Management**: View upcoming sessions, create available time slots, join sessions
- **Patient Management**: View patient list, search patients, access detailed patient information
- **Patient Details**: View test results, session history, and patient notes

### Shared Features
- **Chat**: Real-time messaging with other users
- **Settings**: Manage notifications, preferences, and account settings
- **Profile**: View and edit personal information

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── common/         # Common UI components (Button, Input, Card, etc.)
│   ├── auth/           # Authentication forms
│   ├── dashboard/      # Dashboard components
│   └── test/           # Test-related components
├── pages/              # Page components
│   ├── auth/           # Authentication pages (Login, Signup, etc.)
│   ├── parent/         # Parent-specific pages
│   ├── doctor/         # Doctor-specific pages
│   ├── therapist/      # Therapist-specific pages
│   └── shared/         # Shared pages (Chat, Settings, Profile)
├── services/           # API service layer
│   ├── apiClient.ts    # Axios configuration
│   ├── authService.ts  # Authentication API calls
│   ├── testService.ts  # Test API calls
│   ├── sessionService.ts # Session & specialist API calls
│   ├── patientService.ts # Patient & chat API calls
│   └── notificationService.ts # Notification API calls
├── context/            # React Context
│   └── AuthContext.tsx # Authentication context
├── layouts/            # Layout components
│   ├── MainLayout.tsx  # Main layout with sidebar and topnav
│   ├── AuthLayout.tsx  # Authentication layout
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── TopNav.tsx      # Top navigation bar
├── hooks/              # Custom React hooks
│   ├── useAsync.ts     # Async state management
│   ├── useLocalStorage.ts # LocalStorage wrapper
│   ├── useDebounce.ts  # Debounce hook
│   └── useRole.ts      # Role-based hooks
├── utils/              # Utility functions
│   ├── constants.ts    # App constants
│   ├── dateUtils.ts    # Date formatting utilities
│   ├── validation.ts   # Form validation
│   └── stringUtils.ts  # String manipulation utilities
├── types/              # TypeScript types
│   └── index.ts        # All type definitions
├── routes/             # Routing configuration
│   ├── AppRoutes.tsx   # Route definitions
│   └── ProtectedRoute.tsx # Protected route wrapper
└── assets/             # Static assets
```

## 🛠️ Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Chart.js** - Charts and statistics
- **Lucide React** - Icons

## 📦 Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_APP_NAME=AutiCare
   VITE_APP_VERSION=1.0.0
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🏃 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🔐 Authentication

- User registration with role selection
- JWT-based authentication
- Token stored in localStorage
- Auto-redirect based on role
- Protected routes

## 📋 API Integration

All API calls through Axios with automatic token injection and error handling.

## 🎨 UI Components

Modern, reusable components with Tailwind CSS:
- Buttons, Inputs, Selects
- Cards, Badges, Modals
- Avatars, Progress bars, Spinners

## 📱 Responsive Design

Mobile-first approach with Tailwind breakpoints (md, lg).

---

For detailed documentation, see the code comments and types in the codebase.
