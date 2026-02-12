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
        const provider = searchParams.get('provider') || 'oauth';
        const error = searchParams.get('error');

        // Check for errors
        if (error) {
          console.error('OAuth error:', error);
          let errorMessage = 'Sign-in failed. Please try again.';
          
          if (error === 'auth_failed') {
            errorMessage = 'Authentication failed. Please try again.';
          } else if (error === 'github_not_configured') {
            errorMessage = 'GitHub sign-in is not yet available. Please use Google or Microsoft.';
          } else if (error === 'auth_callback_failed') {
            errorMessage = 'Authentication callback failed. Please try again.';
          }
          
          toast.error(errorMessage);
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

        // Parse displayName into firstName and lastName
        const [firstName = 'User', ...lastNameParts] = (displayName || email.split('@')[0]).split(' ');
        const lastName = lastNameParts.join(' ') || '';

        // Decode the JWT token to get the user role
        let role = 'student';
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          role = tokenPayload.role || 'student';
        } catch (e) {
          console.warn('Failed to decode token for role:', e);
        }

        // Create user object with role
        const user = {
          uid,
          email,
          firstName,
          lastName,
          displayName: displayName || email.split('@')[0],
          emailVerified: true, // OAuth users are always verified
          provider,
          role, // Include role from JWT token
        };

        // Store user data
        localStorage.setItem('aurikrex-user', JSON.stringify(user));

        console.log(`✅ ${provider} OAuth successful, user role: ${role}`);
        toast.success(`Welcome, ${firstName}! 🎉`);

        // Route based on role: admin goes to /admin, others go to /dashboard
        if (role === 'admin') {
          console.log('🔑 Admin user detected, redirecting to admin dashboard');
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
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
