import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertModal } from '../ui/AlertModal';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

export const ForceChangePassword = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Input states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status states
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Custom alert configs
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

  // Safeguard: Redirect if no active session
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  // Sync dark class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const validate = () => {
    const tempErrors = {};
    if (!currentPassword) {
      tempErrors.currentPassword = 'Current password is required.';
    }
    if (!newPassword) {
      tempErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      tempErrors.newPassword = 'Password must contain at least 8 characters.';
    }
    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const res = await apiService.changePassword(currentPassword, newPassword, token);
    setLoading(false);

    if (res.success) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      triggerAlert(
        'success',
        'Security Credentials Updated',
        'Your password has been successfully configured. Redirecting to workspace...',
        2500
      );

      setTimeout(() => {
        navigate('/workspace');
      }, 2500);
    } else {
      triggerAlert(
        'alert',
        'Update Failure',
        res.message || 'Unable to update password.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-primaryBg dark:bg-[#0D0D0D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative font-sans select-none text-left">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-[#DFE5F3]/60 dark:bg-softBlue/10 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#557373] dark:text-softBlue" />
          </div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-tight">
          Password Update Required
        </h2>
        <p className="mt-2 text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 max-w-xs mx-auto leading-relaxed">
          For cybersecurity compliance, you must replace your temporary coordinates with a personal password before continuing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FFFFFF] dark:bg-darkCardBg py-8 px-6 sm:px-10 border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] shadow-lg">
          
          <form className="space-y-5" onSubmit={handlePasswordUpdate}>
            
            {/* Current Password */}
            <div className="relative">
              <Input
                id="current-pass"
                label="Temporary Password"
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={errors.currentPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-[31px] text-primaryText/40 dark:text-[#F2EFEA]/45 hover:text-primaryText dark:hover:text-[#F2EFEA]"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* New Password */}
            <div className="relative">
              <Input
                id="new-pass"
                label="New Secure Password (8+ characters)"
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-[31px] text-primaryText/40 dark:text-[#F2EFEA]/45 hover:text-primaryText dark:hover:text-[#F2EFEA]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id="confirm-pass"
                label="Confirm Secure Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-[31px] text-primaryText/40 dark:text-[#F2EFEA]/45 hover:text-primaryText dark:hover:text-[#F2EFEA]"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center text-xs font-bold tracking-wider py-3 uppercase rounded"
                disabled={loading}
              >
                {loading ? 'Configuring credentials...' : 'Update Password'}
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
