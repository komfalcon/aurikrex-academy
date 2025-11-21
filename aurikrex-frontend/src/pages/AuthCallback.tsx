import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Extract parameters from URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const email = searchParams.get('email');
        const displayName = searchParams.get('displayName');
        const uid = searchParams.get('uid');
        const error = searchParams.get('error');

        // Check for errors
        if (error) {
          console.error('OAuth error:', error);
          toast.error('Google sign-in failed. Please try again.');
          navigate('/login');
          return;
        }

        // Validate required parameters
        if (!token || !email || !uid) {
          console.error('Missing OAuth parameters');
          toast.error('Authentication failed. Missing required information.');
          navigate('/login');
          return;
        }

        // Store authentication data
        localStorage.setItem('aurikrex-token', token);
        if (refreshToken) {
          localStorage.setItem('aurikrex-refresh-token', refreshToken);
        }

        // Create user object
        const user = {
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          emailVerified: true, // Google users are always verified
        };

        // Store user data
        localStorage.setItem('aurikrex-user', JSON.stringify(user));

        console.log('✅ Google OAuth successful, redirecting to dashboard');
        toast.success(`Welcome, ${user.displayName}! 🎉`);

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Completing sign in...</h2>
        <p className="text-gray-400">Please wait while we set up your account</p>
      </div>
    </div>
  );
}
