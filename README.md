# Aurikrex Academy - Learning Management System

A modern, responsive learning platform built with React, TypeScript, and Tailwind CSS. The project is organized as a monorepo with separate frontend and backend applications.

## 🎯 Project Overview

Aurikrex Academy is an educational platform that provides:
- **User Registration & Authentication** - Secure signup with email verification
- **Course Management** - Browse and enroll in courses
- **Learning Dashboard** - Track progress and access courses
- **Interactive Features** - Embedded learning tools and assessments
- **Dark/Light Mode** - Accessible theme support
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 📁 Project Structure

```
Aurikrex-Academy/
├── aurikrex-frontend/          # 🎨 Frontend Application (Vite + React + TypeScript)
│   ├── src/
│   │   ├── App.tsx             # Main application with routing
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Global styles with Tailwind CSS
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AnimatedBackground.tsx
│   │   │   ├── Logo.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── context/            # React context providers
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useTheme.ts
│   │   │   └── useValidation.ts
│   │   ├── pages/              # Page components
│   │   │   ├── SignupPage.tsx
│   │   │   └── VerifyEmailPage.tsx
│   │   └── assets/             # Static assets
│   ├── public/                 # Static files served at root
│   ├── index.html              # HTML entry point
│   ├── vite.config.ts          # Vite bundler configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── package.json            # Dependencies and scripts
│   └── package-lock.json       # Locked dependency versions
│
├── aurikrex-backend/           # 🚀 Backend Application (Coming Soon)
│
├── eslint.config.js            # Shared ESLint configuration
├── node_modules/               # Installed dependencies
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm 9.0 or higher
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Aurikrex-Academy
   ```

2. **Navigate to frontend directory**
   ```bash
   cd aurikrex-frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

### Running the Application

**Development Server**
```bash
cd aurikrex-frontend
npm run dev
```
The app will be available at `http://localhost:5173`

**Production Build**
```bash
cd aurikrex-frontend
npm run build
```
The build output will be in `aurikrex-frontend/dist/`

**Preview Production Build**
```bash
cd aurikrex-frontend
npm run preview
```

**Run Linter**
```bash
cd aurikrex-frontend
npm run lint
```

## ✨ Features

### 🎨 UI/UX Features
- **Beautiful Animated Background** - 30+ educational/science-themed icons with smooth animations
  - Float, Drift, Orbit, and Pulse animations
  - Responsive icon sizing and positioning
  - Dark/Light mode support

- **Dark/Light Mode Toggle**
  - Located in top-right corner
  - Smooth transitions between themes
  - Persists preference in localStorage
  - System preference detection

- **Responsive Design**
  - Mobile-first approach
  - Optimized for all screen sizes (320px to 4k+)
  - Touch-friendly on mobile devices
  - Professional spacing and typography

### 📋 Signup Form Features
- **Form Fields**
  - First Name & Last Name
  - Email Address
  - Password (with strength requirements)
  - Confirm Password
  - Institution/School Name
  - User Role dropdown (Student, Teacher, Admin)
  - Optional Phone Number
  - Terms of Service & Privacy Policy checkbox

- **Form Validation**
  - Real-time password strength checking
  - Email format validation
  - Required field validation
  - Password confirmation matching
  - Error summary at top of form
  - Smooth error animations

- **User Experience**
  - Keyboard navigation support
  - ARIA labels for accessibility
  - Loading state on submit
  - Error feedback with visual indicators
  - Links to Terms and Privacy pages
  - Google OAuth button (placeholder)
  - OTP verification flow

## 🏗️ Architecture

### Component Structure
- **AnimatedBackground** - Manages floating educational icons and background animations
- **ThemeToggle** - Dark/Light mode toggle button with icons
- **Logo** - Aurikrex Academy branding
- **SignupPage** - Main signup form with all features
- **VerifyEmailPage** - Email verification after signup

### State Management
- **React Context** - ThemeContext for dark/light mode
- **React Hooks** - useState, useEffect, useMemo for component state
- **Custom Hooks** - useTheme, useValidation for reusable logic

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **Custom Animations** - Defined in index.css
- **Dark Mode** - CSS variables and class-based switching

## 🎨 Customization

### Changing Theme Colors
Edit `aurikrex-frontend/src/index.css` and update the `@theme` section:
```css
@theme {
  --color-primary-500: #3b82f6;  /* Change primary color */
  --color-secondary-500: #8b5cf6; /* Change secondary color */
  /* ... other colors ... */
}
```

### Adding More Icons to Background
Edit `aurikrex-frontend/src/components/AnimatedBackground.tsx` and add new SVG icon functions to the `educationalIcons` array.

### Adjusting Animation Durations
Edit `aurikrex-frontend/src/index.css` and modify `@keyframes` durations and timings.

## 📱 Browser Support
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔐 Security

### Form Security
- **Client-side validation** for user experience
- **HTTPS enforcement** (configure on backend)
- **CSRF protection** (implement on backend)
- **Input sanitization** (implement on backend)

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (!@#$%^&*)

## 📦 Dependencies

### Production Dependencies
- **react** (^19.2.0) - UI library
- **react-dom** (^19.2.0) - React rendering
- **react-router-dom** (^7.13.0) - Client-side routing
- **react-icons** (^5.5.0) - Icon library
- **tailwindcss** (^4.1.18) - CSS framework
- **@tailwindcss/vite** (^4.1.18) - Tailwind Vite plugin

### Development Dependencies
- **typescript** (~5.9.3) - Type safety
- **vite** (^7.3.1) - Build tool and dev server
- **eslint** (^9.39.1) - Code linting
- **@vitejs/plugin-react** (^5.1.1) - React support in Vite

## 🚀 Deployment

### Building for Production
```bash
cd aurikrex-frontend
npm run build
```

### Deployment Platforms
The built `dist/` folder can be deployed to:
- **Vercel** - (Recommended for React/Next.js projects)
- **Netlify** - (Good for static sites)
- **Azure Static Web Apps** - (Microsoft cloud platform)
- **AWS S3 + CloudFront** - (High-performance CDN)
- **Traditional Web Servers** - (Apache, Nginx, etc.)

### Environment Configuration
Create `aurikrex-frontend/.env.production` for production settings:
```env
VITE_API_URL=https://api.example.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🔄 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes
git add .
git commit -m "feat: add feature description"

# Push and create pull request
git push origin feature/feature-name
```

### Code Style
The project uses ESLint for code quality:
```bash
npm run lint          # Check for issues
npm run lint --fix    # Auto-fix issues
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@aurikrex.com or open an issue on GitHub.

## 🎯 Future Enhancements

- [ ] Backend API integration
- [ ] User authentication system
- [ ] Course listing and enrollment
- [ ] Video streaming support
- [ ] Quiz and assessment system
- [ ] Student progress tracking
- [ ] Certificate generation
- [ ] Payment integration
- [ ] Mobile app (React Native)
- [ ] Admin dashboard

---

**Last Updated**: February 11, 2026  
**Version**: 0.0.0  
**Status**: Pre-release (Signup Page Only)
