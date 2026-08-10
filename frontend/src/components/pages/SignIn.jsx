import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertModal } from '../ui/AlertModal';
import { ArrowLeft } from 'lucide-react';

export const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Alert configuration state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    autoCloseMs: null
  });

  const triggerAlert = (type, title, message, autoCloseMs = null) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      autoCloseMs
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await apiService.login(email, password);
    setLoading(false);

    if (res.success) {
      // Store token and user details in localStorage
      localStorage.setItem('token', res.token);
      
      if (res.mustChangePassword) {
        // Cache mustChangePassword in user profile details
        const tempUser = { ...res.user, mustChangePassword: true };
        localStorage.setItem('user', JSON.stringify(tempUser));

        triggerAlert(
          'success',
          'Welcome Back',
          `Teacher account verified successfully. Welcome, ${res.user.fullName}. Redirecting to setup secure credentials...`,
          2500
        );
        setTimeout(() => {
          navigate('/force-change-password');
        }, 2500);
      } else {
        localStorage.setItem('user', JSON.stringify(res.user));
        
        triggerAlert(
          'success',
          'Welcome Back',
          `Verification successful. Welcome, ${res.user.fullName}. Redirecting...`,
          2500
        );
        setTimeout(() => {
          if (res.user.role === 'Admin') {
            navigate('/admin');
          } else {
            navigate('/workspace');
          }
        }, 2500);
      }
    } else {
      setError(res.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-primaryBg dark:bg-[#0D0D0D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative font-sans">
      
      {/* Back button home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-primaryText/60 dark:text-[#F2EFEA]/60 hover:text-primaryText dark:hover:text-[#F2EFEA] transition-colors z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="flex items-end justify-center gap-[3px] h-5 mb-5 select-none">
          <span className="w-[3px] h-3 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="w-[3px] h-5 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="w-[3px] h-2 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="text-sm font-bold font-sans text-primaryText dark:text-[#F2EFEA] tracking-wider ml-1">InfoTally</span>
        </div>
        
        <h2 className="text-2xl font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-tight">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-xs text-primaryText/45 dark:text-[#F2EFEA]/45">
          Or request access from the coordination office.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FFFFFF] dark:bg-darkCardBg py-8 px-6 sm:px-10 border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] shadow-lg text-left">
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              id="signin-email"
              label="Academic Email"
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="signin-pass"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between font-sans">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-primaryText/15 dark:border-[#557373]/25 text-mutedGreen dark:text-softBlue focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-primaryText/60 dark:text-[#F2EFEA]/60">
                  Remember Me
                </span>
              </label>

              <button
                type="button"
                onClick={() => triggerAlert(
                  'alert',
                  'Password Reset Support',
                  'Please contact system administrator to reset password.'
                )}
                className="text-xs text-mutedGreen dark:text-softBlue hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="text-xs text-mutedGreen dark:text-softBlue font-semibold" role="alert">
                ⚠ {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center text-xs font-bold tracking-wider py-3 uppercase rounded"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </div>
          </form>

        </div>
      </div>

      {/* Premium Reusable Alert Modal Portal */}
      <AlertModal
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      
    </div>
  );
};
