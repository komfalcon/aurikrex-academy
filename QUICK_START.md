# Quick Start Guide - Aurikrex Academy Frontend

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd aurikrex-frontend
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser

### Step 3: View the Signup Page
You should now see:
- ✨ Animated educational icons in the background
- 🌓 Dark/Light mode toggle in the top-right corner
- 📝 Beautiful signup form with all validation

## 📂 File Organization

All frontend code is now in `aurikrex-frontend/`:

```
Components (src/components/)
├── AnimatedBackground.tsx  → Floating animated icons (30 icons, 4 animations)
├── Logo.tsx               → Aurikrex branding
└── ThemeToggle.tsx        → Dark/Light mode button

Pages (src/pages/)
├── SignupPage.tsx         → Main signup form (FULLY FEATURED)
└── VerifyEmailPage.tsx    → Email verification

Context & Hooks (src/context/, src/hooks/)
├── ThemeContext.tsx       → Dark/light mode state
├── useTheme.ts           → Theme hook
└── useValidation.ts      → Form validation logic

Styling (src/)
└── index.css             → All Tailwind + custom animations
```

## ✨ Key Features Ready to Use

### Signup Form
- ✅ First name, Last name, Email, Password, Confirm Password
- ✅ Institution, User Role dropdown, Optional Phone
- ✅ Terms of Service checkbox
- ✅ Real-time password strength validator
- ✅ Full form validation with error messages
- ✅ Loading state on submit
- ✅ Google OAuth placeholder button

### Animated Background
- ✅ 16 educational/science icons (atom, microscope, compass, etc.)
- ✅ 4 animation types (float, drift, orbit, pulse)
- ✅ 30 floating icons for visual richness
- ✅ Dark/light mode support (icon colors adapt)
- ✅ Smooth, subtle animations (25-55 seconds duration)

### Theme System
- ✅ Dark/Light mode toggle
- ✅ Smooth transitions (300ms)
- ✅ Persists to localStorage
- ✅ Detects system preference on first visit
- ✅ All components adapt automatically

## 🎯 Common Tasks

### Running Commands
```bash
npm run dev      # Start development server (watch mode)
npm run build    # Build for production (creates dist/)
npm run preview  # Preview production build locally
npm run lint     # Check code quality with ESLint
```

### Customizing Colors
Edit `src/index.css` in the `@theme` section:
```css
@theme {
  --color-primary-500: #3b82f6;    /* Change primary color */
  --color-secondary-500: #8b5cf6;  /* Change secondary color */
}
```

### Adding Icons to Background
Edit `src/components/AnimatedBackground.tsx`:
```tsx
const educationalIcons = [
  // ... existing icons ...
  // Add your new icon SVG function here
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24">
      {/* Your SVG path here */}
    </svg>
  ),
];
```

### Changing Animation Speeds
Edit `src/index.css` to modify `@keyframes` durations:
```css
@keyframes floatSubtle {
  /* Adjust timing to make animations faster/slower */
}
```

## 🔗 Important Links

- **Signup Page**: `/signup` (default route on startup)
- **Verify Email**: `/verify-email` (after form submission)
- **Placeholder Routes**: `/login` (shows coming soon)

## 📱 Responsive Breakpoints

```css
Mobile       → 320px ~ 639px  (full width, stacked layout)
Tablet       → 640px ~ 1023px (responsive padding)
Desktop      → 1024px ~ 1279px (side-by-side layout)
Extra Large  → 1280px+        (optimized wide layout)
```

## 🧪 Testing

### Test Form Validation
1. Leave fields empty → See errors
2. Enter invalid email → See error
3. Weak password → See requirements
4. Mismatched passwords → See error
5. Fill all correctly → Form submits

### Test Dark/Light Mode
1. Click toggle in top-right
2. Page should fade to new theme (500ms)
3. All colors should adapt
4. Refresh page → Theme persists
5. Toggle again → Back to original

### Test Responsive Design
1. Open DevTools (F12)
2. Toggle Device Toolbar
3. Test different screen sizes
4. Features list hides on mobile
5. Form stays readable at all sizes

## 🚢 Deployment

### Build for Production
```bash
npm run build
```
This creates a `dist/` folder with optimized files.

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Deploy to Traditional Server
```bash
# Upload the dist/ folder to your web server
# Configure web server to serve dist/index.html on all routes
```

## 🐛 Troubleshooting

### Page doesn't load
- Make sure you're in `aurikrex-frontend/` folder
- Run `npm install` to ensure dependencies
- Check `npm run dev` output for errors

### Animations not smooth
- Check browser dev tools performance
- Ensure hardware acceleration is enabled
- Try Chrome/Firefox (best performance)

### Dark mode not working
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Refresh page and try again

### Form not validating
- Check browser console for JavaScript errors
- Verify all imports are correct
- Ensure TypeScript compiled without errors

## 📚 Learn More

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 💡 Pro Tips

1. **Use Tailwind IntelliSense** - Install Tailwind CSS IntelliSense extension in VS Code
2. **Dev Tools** - Use React DevTools browser extension to inspect components
3. **Network Tab** - Use Network tab to see form submission payloads
4. **Hot Module Reload** - Save files and see changes instantly without refresh
5. **Error Boundaries** - Components handle errors gracefully

## ✅ Quality Checklist

- ✅ TypeScript strict mode enabled
- ✅ ESLint configured for code quality
- ✅ Accessible (WCAG) form with ARIA labels
- ✅ Responsive design (mobile-first)
- ✅ Dark/Light mode support
- ✅ Smooth animations (CSS-based)
- ✅ Form validation (real-time + submit)
- ✅ Production-ready build (3MB uncompressed)

---

**Need Help?** Check the main [README.md](./README.md) for more details or open an issue on GitHub.
