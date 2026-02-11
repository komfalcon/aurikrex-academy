/**
 * App Component - Main application with routing
 * Includes ThemeProvider for dark/light mode support
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SignupPage } from './pages/SignupPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Signup Page */}
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Email Verification Page */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
          {/* Redirect root to signup for now */}
          <Route path="/" element={<Navigate to="/signup" replace />} />
          
          {/* Placeholder routes - will be implemented later */}
          <Route path="/login" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
              <div className="text-center p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Login Page
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Coming soon...
                </p>
                <a href="/signup" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Back to Signup
                </a>
              </div>
            </div>
          } />
          
          {/* 404 - Not Found */}
          <Route path="*" element={<Navigate to="/signup" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
