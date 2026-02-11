# Aurikrex Academy - Project Structure

This is a monorepo structure with separate frontend and backend applications.

## Project Structure

```
Aurikrex-Academy/
├── aurikrex-frontend/          # 🎨 Frontend Vite + React + TypeScript application
│   ├── src/                    # Frontend source code
│   │   ├── components/         # Reusable React components
│   │   ├── context/            # React context (Theme, etc.)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components
│   │   ├── assets/             # Static assets
│   │   ├── App.tsx             # Main App component with routing
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles with Tailwind
│   ├── public/                 # Static files
│   ├── index.html              # HTML entry point
│   ├── vite.config.ts          # Vite configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── package.json            # Frontend dependencies
│   └── package-lock.json       # Dependency lock file
│
├── aurikrex-backend/           # 🚀 Backend application (coming soon)
│
├── eslint.config.js            # ESLint configuration (shared)
└── README.md                   # Main project README
```

## Running the Frontend

```bash
# Navigate to frontend directory
cd aurikrex-frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Frontend Features

### Signup Page
- **Email signup form** with First/Last name, email, password, institution, role
- **Google OAuth button** (placeholder)
- **Phone number field** (optional)
- **Terms of Service checkbox**
- **OTP verification flow**
- **Full form validation** with real-time feedback

### Animated Background
- **30+ educational/science-themed icons** (atom, molecule, microscope, compass, etc.)
- **4 animation types**: float, drift, orbit, pulse
- **Dark/light mode support** with smooth transitions
- **Responsive design** that works on all screen sizes

### Theme System
- **Dark/Light mode toggle** in top right corner
- **Automatic theme detection** based on system preference
- **Persistent theme** stored in localStorage
- **Smooth transitions** between themes

### Form Features
- **Real-time password validation** with visual feedback
- **Error summary** at top of form for accessibility
- **Professional styling** with Tailwind CSS
- **Smooth animations** and transitions
- **Full keyboard navigation** support
- **ARIA labels** for accessibility
- **Responsive design** for mobile, tablet, and desktop

## Technology Stack

- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 7.3.1
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.1.18
- **Routing**: React Router 7.13.0
- **Icons**: React Icons 5.5.0
- **Linting**: ESLint 9.39.1

## Development Notes

- All frontend files are now consolidated in the `aurikrex-frontend` directory
- The main signup page is located at `aurikrex-frontend/src/pages/SignupPage.tsx`
- Animations are defined in `aurikrex-frontend/src/index.css`
- Theme context is managed in `aurikrex-frontend/src/context/ThemeContext.tsx`

## Next Steps

1. Copy `aurikrex-frontend` directory to the deployment environment
2. Run `npm install` and `npm run build` to create production build
3. Serve the `dist` folder using a web server
4. Ensure backend API is ready for form submission endpoints
