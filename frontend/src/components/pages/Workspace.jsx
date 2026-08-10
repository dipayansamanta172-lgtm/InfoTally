import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { AlertModal } from '../ui/AlertModal';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Folder, Settings, LogOut, LayoutGrid, X, 
  Calendar, Award, Briefcase, FileText, Bell, Activity, Search, Sun, Moon, Lock, ShieldCheck, Eye, EyeOff, Plus, ArrowLeft, Trash2, Mail, Users,
  Download, ChevronDown
} from 'lucide-react';

export const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Navigation dock collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Theme state synced with website context
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Custom Alert configuration state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    autoCloseMs: null
  });

  // Safeguard 1: Redirect immediately if no token
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  // Safeguard 2: Force password change redirect if mustChangePassword claim is set in the JWT token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.mustChangePassword) {
      return <Navigate to="/force-change-password" replace />;
    }
  } catch (e) {
    console.error('[Session Check] Failed to decode auth token:', e);
  }

  // Sync dark class on document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeProject');
    navigate('/sign-in');
  };

  const triggerAlert = (type, title, message, autoCloseMs = null, onConfirm = null, confirmText = 'Confirm', cancelText = 'Cancel') => {
    if (type === 'dismiss') {
      setAlertConfig(prev => ({ ...prev, isOpen: false }));
      return;
    }

    if (!message || String(message).trim() === '') {
      console.warn('[Workspace] Blocked triggering empty alert dialog popup.');
      return;
    }
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      autoCloseMs,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  // Bottom navigation elements (exactly matching order: Overview, My Projects, Profile Settings)
  const navItems = [
    { label: 'Overview', path: '/workspace', icon: BookOpen, exact: true },
    { label: 'My Projects', path: '/workspace/projects', icon: Folder },
    { label: 'Profile Settings', path: '/workspace/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-primaryBg dark:bg-[#0D0D0D] text-primaryText dark:text-[#F2EFEA] font-sans pb-28 transition-colors duration-300 relative text-left">
      
      {/* Top Header bar */}
      <header className="border-b border-primaryText/5 dark:border-[#557373]/20 bg-[#FFFFFF] dark:bg-darkCardBg py-4 px-6 md:px-12 flex items-center justify-between select-none">
        <div className="flex items-end gap-[3px] h-4">
          <span className="w-[3px] h-2.5 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="w-[3px] h-4 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="w-[3px] h-1.5 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="text-xs font-bold text-primaryText dark:text-[#F2EFEA] tracking-wider ml-1">InfoTally Workspace</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Minimalist Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded text-primaryText/50 dark:text-[#F2EFEA]/50 hover:text-primaryText dark:hover:text-[#F2EFEA] hover:bg-warmWhite/20 dark:hover:bg-[#161616]/40 transition-all cursor-pointer"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 stroke-[1.8]" />
            ) : (
              <Sun className="w-4 h-4 stroke-[1.8]" />
            )}
          </button>
          
          <div className="text-xs font-semibold text-primaryText/60 dark:text-[#F2EFEA]/60 font-mono">
            {sessionUser.fullName || 'User'}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-[1600px] mx-auto p-6 md:p-12 px-6 lg:px-16">
        <Routes>
          <Route index element={<WorkspaceOverview user={sessionUser} triggerAlert={triggerAlert} />} />
          <Route path="projects" element={<WorkspaceProjects user={sessionUser} triggerAlert={triggerAlert} />} />
          <Route path="settings" element={
            <WorkspaceSettings 
              user={sessionUser} 
              triggerAlert={triggerAlert} 
              handleLogout={handleLogout} 
              theme={theme}
              toggleTheme={toggleTheme}
            />
          } />
        </Routes>
      </main>

      {/* Simplified, highly padded and rounded Center Floating Bottom Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 select-none px-4 md:px-0">
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.button
              key="collapsed-dock"
              layoutId="user-nav-dock"
              onClick={() => setIsCollapsed(false)}
              className="w-12 h-12 rounded-full bg-[#FFFFFF] dark:bg-[#161616] border border-primaryText/10 dark:border-[#557373]/25 flex items-center justify-center shadow-lg text-mutedGreen dark:text-softBlue cursor-pointer hover:scale-105 transition-transform"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label="Expand navigation dock"
            >
              <LayoutGrid className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="expanded-dock"
              layoutId="user-nav-dock"
              className="bg-[#FFFFFF] dark:bg-[#161616] border border-primaryText/10 dark:border-[#557373]/25 rounded-[26px] px-7 py-3.5 flex items-center gap-4 sm:gap-6 shadow-xl max-w-[95vw] md:max-w-2xl text-xs font-semibold"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Order: Overview, My Projects, Profile Settings */}
              {navItems.map((item) => {
                const IconComp = item.icon;
                const activeOverride = (item.path === '/workspace' && location.pathname === '/workspace') || 
                                       (item.path !== '/workspace' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      activeOverride
                        ? 'bg-softBlue text-primaryText dark:bg-softBlue/10 dark:text-softBlue font-bold'
                        : 'text-primaryText/60 dark:text-[#F2EFEA]/60 hover:text-primaryText dark:hover:text-[#F2EFEA]'
                    }`}
                  >
                    <IconComp className="w-4 h-4 stroke-[2]" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Logout Button inside Bottom Dock */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-mutedGreen dark:text-softBlue hover:bg-warmWhite dark:hover:bg-darkCardBg cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <div className="w-[1px] h-6 bg-primaryText/10 dark:bg-[#557373]/20 mx-1.5" />
              
              {/* Close (X) button simply collapses dock */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-full hover:bg-warmWhite dark:hover:bg-darkCardBg text-primaryText/40 dark:text-[#F2EFEA]/45 cursor-pointer transition-colors"
                aria-label="Collapse navigation dock"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Reusable Alert Modal Portal */}
      <AlertModal
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};

// ==========================================
// SUB-PANEL MODULES (Clean & Minimal Empty States)
// ==========================================

// Helper to log user actions locally in client activities
const logUserActivity = (action, details) => {
  try {
    const list = JSON.parse(localStorage.getItem('userActivities') || '[]');
    const newLog = {
      id: Date.now(),
      action,
      details,
      created_at: new Date().toISOString()
    };
    const updated = [newLog, ...list].slice(0, 10); // Keep last 10
    localStorage.setItem('userActivities', JSON.stringify(updated));
  } catch (e) {
    console.error('[Activity Tracking] Error logging:', e);
  }
};

// 1. Workspace Overview Screen (Zero fake stats)
const WorkspaceOverview = ({ user, triggerAlert }) => {
  const [projectsList, setProjectsList] = useState(() => {
    const list = localStorage.getItem('projectsData');
    const parsed = list ? JSON.parse(list) : [];
    return parsed.filter(p => p.id !== 'proj-1' && !p.name.includes('NIT Roster') && !p.name.includes('Demo') && !p.name.includes('Mock'));
  });

  const [activities, setActivities] = useState(() => {
    return JSON.parse(localStorage.getItem('userActivities') || '[]');
  });

  // Limit display to the last 5 activities, never more than five
  const recentActivities = activities.slice(0, 5);

  return (
    <div className="flex flex-col gap-8 text-left max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
          Welcome back, {user.fullName || 'Workspace Member'}
        </h1>
        <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
          Review metrics, manage folders, and inspect invitations.
        </p>
      </div>

      {/* Statistics Cards (Three Cards Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Total Projects */}
        <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider block">
              Total Projects
            </span>
            <span className="text-2xl font-bold text-primaryText dark:text-[#F2EFEA] block mt-1.5 leading-none">
              {projectsList.length} {projectsList.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
          <div className="p-3 rounded-[12px] bg-softBlue dark:bg-[#0D0D0D] border border-black/5 dark:border-[#557373]/15">
            <Folder className="w-5 h-5 text-[#557373] dark:text-softBlue" />
          </div>
        </Card>

        {/* Card 2: Collaboration Invitations */}
        <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider block">
              Invitations
            </span>
            <span className="text-2xl font-bold text-primaryText dark:text-[#F2EFEA] block mt-1.5 leading-none">
              No invitations
            </span>
          </div>
          <div className="p-3 rounded-[12px] bg-softBlue dark:bg-[#0D0D0D] border border-black/5 dark:border-[#557373]/15">
            <Mail className="w-5 h-5 text-[#557373] dark:text-softBlue" />
          </div>
        </Card>

        {/* Card 3: Recent Activity */}
        <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider block">
              Recent Activity
            </span>
            <span className="text-2xl font-bold text-primaryText dark:text-[#F2EFEA] block mt-1.5 leading-none">
              {recentActivities.length > 0 ? `${recentActivities.length} Logged` : 'No recent activity'}
            </span>
          </div>
          <div className="p-3 rounded-[12px] bg-softBlue dark:bg-[#0D0D0D] border border-black/5 dark:border-[#557373]/15">
            <Activity className="w-5 h-5 text-[#557373] dark:text-softBlue" />
          </div>
        </Card>
      </div>

      {/* Recent Activity Trail (Max 5 items, clean empty state if none) */}
      <div className="bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] p-6 flex flex-col gap-4">
        <h3 className="text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-wider border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Recent Activity Logs (5 Latest)
        </h3>
        <div className="divide-y divide-primaryText/5 dark:divide-[#557373]/10 max-h-[300px] overflow-y-auto pr-1">
          {recentActivities.length > 0 ? (
            recentActivities.map((log) => (
              <div key={log.id} className="py-3 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">
                    {log.action}
                  </span>
                  <span className="text-[9px] text-primaryText/45 dark:text-[#F2EFEA]/45 flex items-center gap-1 font-mono">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[10px] text-primaryText/60 dark:text-[#F2EFEA]/65 leading-relaxed font-normal">
                  {log.details}
                </p>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-primaryText/30 dark:text-[#F2EFEA]/30">
              No recent activity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Workspace Projects List & Workspace Panel Details Screen
const WorkspaceProjects = ({ user, triggerAlert }) => {
  // Read and maintain projects from localStorage
  const [projects, setProjects] = useState(() => {
    const list = localStorage.getItem('projectsData');
    const parsed = list ? JSON.parse(list) : [];
    return parsed.filter(p => p.id !== 'proj-1' && !p.name.includes('NIT Roster') && !p.name.includes('Demo') && !p.name.includes('Mock'));
  });

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Optional connection states during creation
  const [connectGoogleForms, setConnectGoogleForms] = useState(false);
  const [connectMicrosoftForms, setConnectMicrosoftForms] = useState(false);

  // Project details Tab selector
  const [activeTab, setActiveTab] = useState('uploads'); // 'uploads' | 'setup' | 'invitations'
  const [activeUploadSubTab, setActiveUploadSubTab] = useState(null); // null | 'google_forms'

  const location = useLocation();
  const navigate = useNavigate();

  // Google Forms integration states
  const [googleStatus, setGoogleStatus] = useState({ connected: false, loading: true });
  const [googleForms, setGoogleForms] = useState([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formsError, setFormsError] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);

  // User-level connection status
  const [userGoogleStatus, setUserGoogleStatus] = useState({ connected: false, email: '', loading: true });

  // Microsoft Forms integration states
  const [microsoftStatus, setMicrosoftStatus] = useState({ connected: false, loading: true });
  const [microsoftForms, setMicrosoftForms] = useState([]);
  const [msFormsLoading, setMsFormsLoading] = useState(false);
  const [msFormsError, setMsFormsError] = useState(null);
  const [isEditingMsForm, setIsEditingMsForm] = useState(false);

  // User-level Microsoft connection status
  const [userMicrosoftStatus, setUserMicrosoftStatus] = useState({ connected: false, email: '', loading: true });

  // Syncing, primary key, and project records states
  const [isPrimaryKeyModalOpen, setIsPrimaryKeyModalOpen] = useState(false);
  const [isSyncStrategyModalOpen, setIsSyncStrategyModalOpen] = useState(false);
  const [syncStrategy, setSyncStrategy] = useState('replace');
  const [selectedPrimaryKey, setSelectedPrimaryKey] = useState('');
  const [schemaQuestions, setSchemaQuestions] = useState([]);

  const [projectRecords, setProjectRecords] = useState([]);
  const [projectColumns, setProjectColumns] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const [isSyncSummaryModalOpen, setIsSyncSummaryModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  useEffect(() => {
    if (!activeProjectId) {
      fetchUserGoogleStatus();
      fetchUserMicrosoftStatus();
    }
  }, [activeProjectId]);

  const fetchUserGoogleStatus = async () => {
    setUserGoogleStatus(prev => ({ ...prev, loading: true }));
    const token = localStorage.getItem('token');
    const res = await apiService.getUserGoogleStatus(token);
    if (res.connected) {
      setUserGoogleStatus({ connected: true, email: res.email, loading: false });
    } else {
      setUserGoogleStatus({ connected: false, email: '', loading: false });
    }
  };

  const fetchUserMicrosoftStatus = async () => {
    setUserMicrosoftStatus(prev => ({ ...prev, loading: true }));
    const token = localStorage.getItem('token');
    const res = await apiService.getUserMicrosoftStatus(token);
    console.log(`React received: ${res.email || 'None'}`);
    console.log(`Rendered: ${res.email || 'None'}`);
    if (res.connected) {
      setUserMicrosoftStatus({ connected: true, email: res.email, loading: false });
    } else {
      setUserMicrosoftStatus({ connected: false, email: '', loading: false });
    }
  };

  const handleUserGoogleConnect = () => {
    const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendBase}/api/integrations/google/auth?userId=${user.id || ''}`;
  };

  const handleUserGoogleDisconnect = () => {
    triggerAlert(
      'confirm',
      'Disconnect Google Forms',
      'Are you sure you want to disconnect your Google Forms account? Stored OAuth tokens will be removed and every project will lose Google Forms integration access.',
      null,
      async () => {
        const token = localStorage.getItem('token');
        const res = await apiService.disconnectUserGoogle(token);
        if (res.success) {
          setUserGoogleStatus({ connected: false, email: '', loading: false });
          triggerAlert('success', 'Disconnected', 'Google Account integration removed.', 2500);
          logUserActivity('Google Forms Disconnected', 'Removed user-level Google Forms OAuth connection.');
        } else {
          triggerAlert('alert', 'Action Failed', res.message || 'Unable to disconnect Google account.');
        }
      },
      'Disconnect',
      'Cancel'
    );
  };

  const handleUserMicrosoftConnect = () => {
    const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendBase}/api/integrations/microsoft/auth?userId=${user.id || ''}`;
  };

  const handleUserMicrosoftDisconnect = () => {
    triggerAlert(
      'confirm',
      'Disconnect Microsoft Forms',
      'Are you sure you want to disconnect your Microsoft Forms account? Stored OAuth tokens will be removed and every project will lose Microsoft Forms integration access.',
      null,
      async () => {
        const token = localStorage.getItem('token');
        const res = await apiService.disconnectUserMicrosoft(token);
        if (res.success) {
          setUserMicrosoftStatus({ connected: false, email: '', loading: false });
          triggerAlert('success', 'Disconnected', 'Microsoft Account integration removed.', 2500);
          logUserActivity('Microsoft Forms Disconnected', 'Removed user-level Microsoft Forms OAuth connection.');
        } else {
          triggerAlert('alert', 'Action Failed', res.message || 'Unable to disconnect Microsoft account.');
        }
      },
      'Disconnect',
      'Cancel'
    );
  };

  // Listen to Google/Microsoft redirect callback query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const connected = params.get('connected');
    const pid = params.get('projectId');
    const err = params.get('error');

    if (connected === 'google') {
      if (pid) {
        setActiveProjectId(pid);
        setActiveTab('uploads');
        setActiveUploadSubTab('google_forms');
        triggerAlert(
          'success',
          'Google Forms Connected',
          'Your Google Account has been integrated. You can now select forms to connect.',
          3500
        );
      } else {
        triggerAlert(
          'success',
          'Account Connected',
          'Your Google Account has been successfully integrated. You can now select forms inside any project directory.',
          3500
        );
        fetchUserGoogleStatus();
      }

      logUserActivity('Google Forms Connected', `Connected Google Account for project workspace.`);
      navigate('/workspace/projects', { replace: true });
    }

    if (connected === 'microsoft') {
      if (pid) {
        setActiveProjectId(pid);
        setActiveTab('uploads');
        setActiveUploadSubTab('microsoft_forms');
        triggerAlert(
          'success',
          'Microsoft Forms Connected',
          'Your Microsoft Account has been integrated. You can now select forms to connect.',
          3500
        );
      } else {
        triggerAlert(
          'success',
          'Account Connected',
          'Your Microsoft Account has been successfully integrated. You can now select forms inside any project directory.',
          3500
        );
        fetchUserMicrosoftStatus();
      }

      logUserActivity('Microsoft Forms Connected', `Connected Microsoft Account for project workspace.`);
      navigate('/workspace/projects', { replace: true });
    }

    if (err === 'google_auth_failed') {
      triggerAlert(
        'alert',
        'Google Authentication Cancelled',
        'The OAuth login process was cancelled or rejected. Please verify your credentials and try again.'
      );
      navigate('/workspace/projects', { replace: true });
    }

    if (err === 'microsoft_auth_failed') {
      triggerAlert(
        'alert',
        'Microsoft Authentication Cancelled',
        'The OAuth login process was cancelled or rejected. Please verify your credentials and try again.'
      );
      navigate('/workspace/projects', { replace: true });
    }
  }, [location.search]);

  // Fetch status of Google/Microsoft Integrations when uploads tab opens
  useEffect(() => {
    if (activeProjectId && activeTab === 'uploads') {
      fetchGoogleStatus();
      fetchMicrosoftStatus();
    }
  }, [activeProjectId, activeTab]);

  const fetchGoogleStatus = async () => {
    setGoogleStatus({ connected: false, loading: true });
    const token = localStorage.getItem('token');
    const res = await apiService.getGoogleIntegrationStatus(activeProjectId, token);
    
    if (res.connected) {
      setGoogleStatus({
        connected: true,
        email: res.email,
        lastSyncTime: res.lastSyncTime,
        connectedFormId: res.connectedFormId,
        connectedFormTitle: res.connectedFormTitle,
        loading: false
      });
      // Fetch forms list automatically
      fetchFormsList();
    } else {
      setGoogleStatus({ connected: false, loading: false });
    }
  };

  const fetchFormsList = async () => {
    setFormsLoading(true);
    setFormsError(null);
    const token = localStorage.getItem('token');
    const res = await apiService.getGoogleForms(activeProjectId, token);
    setFormsLoading(false);
    
    if (res.success) {
      setGoogleForms(res.forms || []);
    } else {
      setGoogleForms([]);
      setFormsError(res.message || 'Unable to fetch forms from Google Drive. Please reconnect your account.');
    }
  };

  const handleStartGoogleOAuth = () => {
    const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendBase}/api/integrations/google/auth?projectId=${activeProjectId}`;
  };

  const handleConnectForm = async (formId, formTitle) => {
    const token = localStorage.getItem('token');
    const res = await apiService.connectGoogleForm(activeProjectId, formId, formTitle, token);
    if (res.success) {
      triggerAlert(
        'success',
        'Google Form Connected',
        `Successfully attached form "${formTitle}" to this project directory.`,
        3000
      );
      setIsEditingForm(false);
      fetchGoogleStatus();
    } else {
      triggerAlert('alert', 'Connection Failed', res.message || 'Unable to connect Google Form.');
    }
  };

  const handleDisconnectGoogle = () => {
    triggerAlert(
      'confirm',
      'Disconnect Google Forms',
      'Are you sure you want to disconnect Google Forms? Stored access tokens will be removed.',
      null,
      async () => {
        const token = localStorage.getItem('token');
        const res = await apiService.disconnectGoogleIntegration(activeProjectId, token);
        if (res.success) {
          setGoogleStatus({ connected: false, loading: false });
          setGoogleForms([]);
          triggerAlert('success', 'Disconnected', 'Google Account integration removed.', 2500);
          logUserActivity('Google Forms Disconnected', 'Removed Google OAuth account association.');
        } else {
          triggerAlert('alert', 'Action Failed', res.message || 'Unable to disconnect Google account.');
        }
      },
      'Disconnect',
      'Cancel'
    );
  };

  const fetchMicrosoftStatus = async () => {
    if (!activeProjectId) return;
    setMicrosoftStatus({ connected: false, loading: true });
    const token = localStorage.getItem('token');
    const res = await apiService.getMicrosoftIntegrationStatus(activeProjectId, token);
    
    if (res.connected) {
      setMicrosoftStatus({
        connected: true,
        email: res.email,
        lastSyncTime: res.lastSyncTime,
        connectedFormId: res.connectedFormId,
        connectedFormTitle: res.connectedFormTitle,
        primaryKeyColumn: res.primaryKeyColumn,
        loading: false
      });
      fetchMsFormsList();
    } else {
      setMicrosoftStatus({ connected: false, loading: false });
    }
  };

  const fetchMsFormsList = async () => {
    setMsFormsLoading(true);
    setMsFormsError(null);
    const token = localStorage.getItem('token');
    const res = await apiService.getMicrosoftForms(activeProjectId, token);
    setMsFormsLoading(false);
    
    if (res.success) {
      setMicrosoftForms(res.forms || []);
    } else {
      setMicrosoftForms([]);
      setMsFormsError(res.message || 'Unable to fetch Excel workbooks from Microsoft. Please reconnect.');
    }
  };

  const handleStartMicrosoftOAuth = () => {
    const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendBase}/api/integrations/microsoft/auth?projectId=${activeProjectId}`;
  };

  const handleConnectMsForm = async (formId, formTitle) => {
    const token = localStorage.getItem('token');
    const res = await apiService.connectMicrosoftForm(activeProjectId, formId, formTitle, token);
    if (res.success) {
      triggerAlert(
        'success',
        'Microsoft Form Connected',
        `Successfully attached form "${formTitle}" to this project directory.`,
        3000
      );
      setIsEditingMsForm(false);
      fetchMicrosoftStatus();
    } else {
      triggerAlert('alert', 'Connection Failed', res.message || 'Unable to connect Microsoft Form.');
    }
  };

  const handleDisconnectMicrosoft = () => {
    triggerAlert(
      'confirm',
      'Disconnect Microsoft Forms',
      'Are you sure you want to disconnect Microsoft Forms? Stored access tokens will be removed.',
      null,
      async () => {
        const token = localStorage.getItem('token');
        const res = await apiService.disconnectMicrosoftIntegration(activeProjectId, token);
        if (res.success) {
          setMicrosoftStatus({ connected: false, loading: false });
          setMicrosoftForms([]);
          triggerAlert('success', 'Disconnected', 'Microsoft Account integration removed.', 2500);
          logUserActivity('Microsoft Forms Disconnected', 'Removed Microsoft OAuth account association.');
        } else {
          triggerAlert('alert', 'Action Failed', res.message || 'Unable to disconnect Microsoft account.');
        }
      },
      'Disconnect',
      'Cancel'
    );
  };

  // Fetch project records list
  useEffect(() => {
    if (activeProjectId && activeTab === 'uploads') {
      fetchProjectRecords();
    }
  }, [activeProjectId, activeTab]);

  const fetchProjectRecords = async () => {
    setRecordsLoading(true);
    const token = localStorage.getItem('token');

    // Always read from the database. Both endpoints return empty arrays when
    // there is nothing stored — they never fail destructively. Guarding this
    // call behind googleStatus / microsoftStatus caused a race condition: the
    // status fetch is async, so when this runs on mount the connectedFormId
    // fields are still undefined, triggering setProjectRecords([]) and wiping
    // any previously loaded data from the display.
    //
    // The Google records endpoint returns ALL records for the project regardless
    // of source_type, so it works for both Google and Microsoft synced data.
    const res = await apiService.getProjectRecords(activeProjectId, token);

    setRecordsLoading(false);
    if (res && res.success) {
      setProjectRecords(res.records || []);
      setProjectColumns(res.columns || []);
    }
  };

  const handleExportExcel = async () => {
    setIsExportDropdownOpen(false);
    triggerAlert('loading', 'Generating Excel', 'Formatting columns and writing cells...');
    try {
      const token = localStorage.getItem('token');
      const blob = await apiService.exportProjectExcel(activeProjectId, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.name.replace(/[^a-z0-9]/gi, '_')}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      triggerAlert('success', 'Export Complete', 'Excel file downloaded successfully.', 2500);
    } catch (err) {
      triggerAlert('alert', 'Export Failed', err.message || 'Could not export project to Excel.');
    }
  };

  const handleExportPdf = async () => {
    setIsExportDropdownOpen(false);
    triggerAlert('loading', 'Generating PDF', 'Formatting columns and writing landscape pages...');
    try {
      const token = localStorage.getItem('token');
      const blob = await apiService.exportProjectPdf(activeProjectId, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.name.replace(/[^a-z0-9]/gi, '_')}_export.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      triggerAlert('success', 'Export Complete', 'PDF report downloaded successfully.', 2500);
    } catch (err) {
      triggerAlert('alert', 'Export Failed', err.message || 'Could not export project to PDF.');
    }
  };

  const handleSyncClick = async () => {
    if (googleStatus.connectedFormId) {
      if (!googleStatus.primaryKeyColumn) {
        const token = localStorage.getItem('token');
        console.log('[InfoTally Debug] Get schema questions request started.');
        triggerAlert('loading', 'Retrieving Questions', 'Fetching form structure...');
        const res = await apiService.getGoogleFormSchema(activeProjectId, token);
        console.log('[InfoTally Debug] Get schema API response received:', res);
        
        triggerAlert('dismiss');
        console.log('[InfoTally Debug] Loading alert modal dismissed.');

        if (res.success) {
          setSchemaQuestions(res.questions || []);
          console.log('[InfoTally Debug] Schema questions stored in state:', res.questions);
          setSelectedPrimaryKey(res.questions[0]?.key || '');
          setIsPrimaryKeyModalOpen(true);
        } else {
          triggerAlert('alert', 'Error', res.message || 'Unable to fetch form structure.');
        }
      } else {
        setSyncStrategy('replace');
        setIsSyncStrategyModalOpen(true);
      }
    } else if (microsoftStatus.connectedFormId) {
      if (!microsoftStatus.primaryKeyColumn) {
        const token = localStorage.getItem('token');
        console.log('[InfoTally Debug] Get Microsoft schema questions request started.');
        triggerAlert('loading', 'Retrieving Questions', 'Fetching form structure...');
        const res = await apiService.getMicrosoftFormSchema(activeProjectId, token);
        console.log('[InfoTally Debug] Get Microsoft schema API response received:', res);
        
        triggerAlert('dismiss');
        console.log('[InfoTally Debug] Loading alert modal dismissed.');

        if (res.success) {
          setSchemaQuestions(res.questions || []);
          console.log('[InfoTally Debug] Schema questions stored in state:', res.questions);
          setSelectedPrimaryKey(res.questions[0]?.key || '');
          setIsPrimaryKeyModalOpen(true);
        } else {
          triggerAlert('alert', 'Error', res.message || 'Unable to fetch form structure.');
        }
      } else {
        setSyncStrategy('replace');
        setIsSyncStrategyModalOpen(true);
      }
    } else {
      triggerAlert('alert', 'Form Missing', 'No form is attached to this project. Please connect a form first.');
    }
  };

  const handleSavePrimaryKey = async () => {
    const token = localStorage.getItem('token');
    triggerAlert('loading', 'Saving Configuration', 'Configuring unique identifier...');
    
    let res;
    if (googleStatus.connectedFormId) {
      res = await apiService.setProjectPrimaryKey(activeProjectId, selectedPrimaryKey, token);
    } else if (microsoftStatus.connectedFormId) {
      res = await apiService.setMicrosoftProjectPrimaryKey(activeProjectId, selectedPrimaryKey, token);
    }
    
    triggerAlert('dismiss');

    if (res && res.success) {
      setIsPrimaryKeyModalOpen(false);
      if (googleStatus.connectedFormId) {
        await fetchGoogleStatus();
      } else {
        await fetchMicrosoftStatus();
      }
      setSyncStrategy('replace');
      setIsSyncStrategyModalOpen(true);
    } else {
      triggerAlert('alert', 'Error', res?.message || 'Unable to save primary key choice.');
    }
  };

  const handleStartSync = async () => {
    setIsSyncStrategyModalOpen(false);
    const token = localStorage.getItem('token');
    triggerAlert('loading', 'Synchronizing Responses', 'Connecting and parsing responses dynamically...');
    
    let res;
    if (googleStatus.connectedFormId) {
      res = await apiService.syncGoogleFormResponses(activeProjectId, syncStrategy, token);
    } else if (microsoftStatus.connectedFormId) {
      res = await apiService.syncMicrosoftFormResponses(activeProjectId, syncStrategy, token);
    }

    triggerAlert('dismiss');

    if (res && res.success) {
      setSyncResult(res.summary);
      setIsSyncSummaryModalOpen(true);
      if (googleStatus.connectedFormId) {
        fetchGoogleStatus();
      } else {
        fetchMicrosoftStatus();
      }
      fetchProjectRecords();
      logUserActivity(
        googleStatus.connectedFormId ? 'Google Forms Sync' : 'Microsoft Forms Sync', 
        `Synchronized ${res.summary.total} responses using "${syncStrategy}" strategy.`
      );
    } else {
      triggerAlert(
        'confirm',
        'Synchronization Failed',
        'Unable to fetch responses.\n\nYour project is safe. Please verify your connection and try again.',
        null,
        () => {
          handleStartSync();
        },
        'Retry',
        'Close'
      );
    }
  };

  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      triggerAlert('alert', 'Invalid Project Name', 'Please enter a valid project name to create a workspace directory.');
      return;
    }

    const newProject = {
      id: 'proj-' + Date.now(),
      name: projectName.trim(),
      createdDate: new Date().toLocaleDateString(),
      owner: user.fullName || 'Workspace Member',
      googleFormsConnected: connectGoogleForms,
      microsoftFormsConnected: connectMicrosoftForms
    };

    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem('projectsData', JSON.stringify(updated));

    // Log the user action
    logUserActivity('Project Created', `Created project folder: "${newProject.name}"`);

    // Reset inputs
    setProjectName('');
    setConnectGoogleForms(false);
    setConnectMicrosoftForms(false);
    setIsCreateModalOpen(false);

    // Refresh active view to display only this newly created project's workspace
    setActiveProjectId(newProject.id);

    triggerAlert('success', 'Project Registered', `Project "${newProject.name}" successfully created.`, 2000);
  };

  const handleDeleteProject = (id, name) => {
    triggerAlert(
      'confirm',
      'Delete Project',
      `Are you sure you want to permanently delete this project?\n\nProject:\n${name}\n\nThis action cannot be undone.`,
      null,
      () => {
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        localStorage.setItem('projectsData', JSON.stringify(updated));
        logUserActivity('Project Deleted', `Removed project: "${name}"`);
        setActiveProjectId(null);
        triggerAlert('success', 'Project Deleted', `Project "${name}" removed.`, 2000);
      },
      'Delete',
      'Cancel'
    );
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (activeProject) {
    // RENDER: Workspace Project Detail Folder (consistent layout, rounded containers)
    return (
      <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
        {/* Back Link */}
        <button 
          onClick={() => setActiveProjectId(null)}
          className="w-fit flex items-center gap-1.5 text-xs font-semibold text-primaryText/60 dark:text-[#F2EFEA]/60 hover:text-primaryText dark:hover:text-[#F2EFEA] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects List
        </button>

        {/* Project Header details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primaryText/5 dark:border-[#557373]/15 pb-4 select-none">
          <div>
            <h1 className="text-2xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
              {activeProject.name}
            </h1>
            <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-0.5 font-mono">
              Owner: {activeProject.owner} &bull; Created: {activeProject.createdDate}
            </p>
          </div>
          <div className="flex items-center gap-3 relative select-none">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border border-mutedGreen/20 text-mutedGreen dark:text-softBlue p-2 px-4 hover:bg-mutedGreen/10 rounded-[18px] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {isExportDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-[#1E292B] border border-primaryText/10 dark:border-[#557373]/20 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    <button
                      onClick={handleExportExcel}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-primaryText/80 dark:text-[#F2EFEA]/80 hover:bg-primaryText/5 dark:hover:bg-[#557373]/10 transition-colors cursor-pointer"
                    >
                      Export as Excel (.xlsx)
                    </button>
                    <button
                      onClick={handleExportPdf}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-primaryText/80 dark:text-[#F2EFEA]/80 hover:bg-primaryText/5 dark:hover:bg-[#557373]/10 transition-colors cursor-pointer"
                    >
                      Export as PDF (.pdf)
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              className="border-mutedGreen/20 text-mutedGreen dark:text-softBlue p-2 px-3 hover:bg-mutedGreen/10 rounded-[18px]"
              onClick={() => handleDeleteProject(activeProject.id, activeProject.name)}
            >
              Delete Project
            </Button>
          </div>
        </div>

        {/* Project tabs */}
        <div className="flex gap-4 border-b border-primaryText/5 dark:border-[#557373]/15 pb-1 select-none">
          {['uploads', 'setup', 'invitations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-mutedGreen text-primaryText dark:border-softBlue dark:text-softBlue'
                  : 'border-transparent text-primaryText/40 dark:text-[#F2EFEA]/45 hover:text-primaryText'
              }`}
            >
              {tab === 'uploads' ? 'Uploads' : tab === 'setup' ? 'Project Setup' : 'Invitations'}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="mt-4">
          
          {/* TAB 1: UPLOADS (Forms integrations panel) */}
          {activeTab === 'uploads' && (
            <div className="flex flex-col gap-6 select-none font-sans text-left">
              
              {/* Back to connections choice link when viewing a subtab without active connection */}
              {activeUploadSubTab && !googleStatus.connectedFormId && !microsoftStatus.connectedFormId && (
                <button 
                  onClick={() => setActiveUploadSubTab(null)}
                  className="w-fit flex items-center gap-1.5 text-xs font-bold text-[#557373] dark:text-softBlue hover:underline cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Integrations Choice
                </button>
              )}

              {/* Case 1: Google Forms View */}
              {(googleStatus.connectedFormId || activeUploadSubTab === 'google_forms') && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-indigo-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M17,17H7v-2h10V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
                        Google Forms Connection
                      </h2>
                      <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-normal">
                        Import responses directly from Google Forms worksheets.
                      </p>
                    </div>
                  </div>

                  {googleStatus.loading ? (
                    <div className="py-12 text-center text-xs text-primaryText/40 dark:text-[#F2EFEA]/45">
                      Verifying integration connection status...
                    </div>
                  ) : !googleStatus.connected ? (
                    // Disconnected state
                    <Card className="p-6 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex flex-col gap-4 max-w-xl text-left">
                      <h3 className="text-xs font-bold text-primaryText/70 dark:text-[#F2EFEA]/70 uppercase tracking-wider">
                        Google Forms Not Connected
                      </h3>
                      <p className="text-xs text-primaryText/60 dark:text-[#F2EFEA]/65 leading-relaxed font-normal">
                        No user-level Google Account integration has been configured. Please connect your Google Account in the "Connected Accounts" panel on the Projects Dashboard first.
                      </p>
                    </Card>
                  ) : (
                    // Connected state
                    <div className="flex flex-col gap-6 font-sans">
                      
                      {/* Connection metadata card */}
                      <Card className="p-6 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-mutedGreen dark:bg-softBlue shrink-0" />
                          <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-bold uppercase tracking-wider">
                            Connected as: <span className="font-mono text-primaryText dark:text-[#F2EFEA] font-bold ml-1">{googleStatus.email}</span>
                          </span>
                        </div>

                        {googleStatus.connectedFormId && !isEditingForm ? (
                          // Connected Form View
                          <div className="flex flex-col gap-4 text-left font-sans mt-2 border-t border-primaryText/5 dark:border-[#557373]/10 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal">
                              <div className="flex justify-between border-b border-primaryText/5 sm:border-b-0 pb-1.5 sm:pb-0">
                                <span className="text-primaryText/45 dark:text-[#F2EFEA]/45">Form Name:</span>
                                <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">
                                  {googleStatus.connectedFormTitle}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-primaryText/5 sm:border-b-0 pb-1.5 sm:pb-0">
                                <span className="text-primaryText/45 dark:text-[#F2EFEA]/45 font-semibold">Connected Account:</span>
                                <span className="font-semibold text-primaryText dark:text-[#F2EFEA] font-mono">
                                  {googleStatus.email}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-primaryText/45 dark:text-[#F2EFEA]/45">Last Sync:</span>
                                <span className="font-mono font-semibold text-primaryText dark:text-[#F2EFEA]">
                                  {googleStatus.lastSyncTime ? new Date(googleStatus.lastSyncTime).toLocaleString() : 'Never'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-primaryText/5 dark:border-[#557373]/10">
                              <button
                                onClick={() => setIsEditingForm(true)}
                                className="text-xs font-bold text-[#557373] dark:text-softBlue hover:underline cursor-pointer"
                              >
                                Change Form
                              </button>
                              <span className="text-primaryText/20 dark:text-[#F2EFEA]/20">|</span>
                              <button
                                onClick={handleDisconnectGoogle}
                                className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Disconnect Form
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Dropdown selector
                          <div className="flex flex-col gap-2 mt-2 font-sans text-left border-t border-primaryText/5 dark:border-[#557373]/10 pt-4">
                            <label className="text-[9px] font-bold text-[#557373] dark:text-softBlue uppercase tracking-wider">
                              Select Connected Google Form
                            </label>
                            
                            {formsLoading ? (
                              <span className="text-xs text-primaryText/40 dark:text-[#F2EFEA]/40">Retrieving forms list...</span>
                            ) : formsError ? (
                              <span className="text-xs text-red-500">{formsError}</span>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <select
                                  className="w-full sm:w-80 text-xs font-semibold bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/30 p-2.5 rounded-[12px] text-primaryText dark:text-[#F2EFEA] cursor-pointer"
                                  value={googleStatus.connectedFormId || ''}
                                  onChange={(e) => {
                                    const fId = e.target.value;
                                    const fObj = googleForms.find(f => f.id === fId);
                                    handleConnectForm(fId, fObj ? fObj.title : 'Google Form');
                                  }}
                                >
                                  <option value="">-- Choose a Google Form --</option>
                                  {googleForms.map(f => (
                                    <option key={f.id} value={f.id}>{f.title}</option>
                                  ))}
                                </select>
                                
                                {googleStatus.connectedFormId && (
                                  <div className="flex items-center gap-4">
                                    <a 
                                      href={`https://docs.google.com/forms/d/${googleStatus.connectedFormId}/edit`}
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-xs font-bold text-[#557373] dark:text-softBlue hover:underline shrink-0"
                                    >
                                      Open Form &rarr;
                                    </a>
                                    <button
                                      onClick={() => setIsEditingForm(false)}
                                      className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>

                      {/* Sync Responses trigger & metadata */}
                      {googleStatus.connectedFormId && (
                        <Card className="p-5 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA]">Synchronize Form Data</h4>
                              <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-normal mt-0.5 leading-normal">
                                Pull entries dynamically, evaluate duplicates using the configured primary key, and update project records.
                              </p>
                            </div>
                            <Button 
                              variant="primary"
                              onClick={handleSyncClick}
                              className="py-2.5 px-5 rounded-[16px] text-xs font-bold uppercase flex items-center justify-center gap-2 self-start sm:self-auto"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                              Sync Responses
                            </Button>
                          </div>
                          {googleStatus.primaryKeyColumn && projectColumns.length > 0 && (
                            <div className="text-[10px] text-primaryText/50 dark:text-[#F2EFEA]/50 font-normal border-t border-primaryText/5 dark:border-[#557373]/10 pt-3 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-mutedGreen dark:bg-softBlue shrink-0" />
                              Active Project Primary Key Column: <span className="font-semibold text-primaryText dark:text-[#F2EFEA] font-mono">{projectColumns.find(c => c.key === googleStatus.primaryKeyColumn)?.name || googleStatus.primaryKeyColumn}</span>
                            </div>
                          )}
                        </Card>
                      )}

                      {/* Imported Database Records Section */}
                      {googleStatus.connectedFormId && (
                        <div className="flex flex-col gap-4 border-t border-primaryText/5 dark:border-[#557373]/10 pt-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider">
                              Project Database Records ({projectRecords.length})
                            </h3>
                            <span className="text-[10px] text-primaryText/40 dark:text-[#F2EFEA]/40 font-normal">
                              Click any card to expand details
                            </span>
                          </div>

                          {recordsLoading ? (
                            <div className="py-8 text-center text-xs text-primaryText/40 dark:text-[#F2EFEA]/45">
                              Loading project database records...
                            </div>
                          ) : projectRecords.length === 0 ? (
                            <div className="py-12 text-center text-xs text-primaryText/40 dark:text-[#F2EFEA]/45 border border-dashed border-primaryText/10 dark:border-[#557373]/20 rounded-[20px] font-normal">
                              No records imported yet. Click "Sync Responses" above to dynamically pull and parse Google Form response rows.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {projectRecords.map((record) => {
                                const isExpanded = expandedRecordId === record.id;
                                const previewCols = projectColumns.slice(0, 3);

                                return (
                                  <Card 
                                    key={record.id}
                                    className="p-5 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] cursor-pointer flex flex-col gap-3 transition-all text-left"
                                    onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                                  >
                                    <div className="flex justify-between items-center gap-4">
                                      <div>
                                        <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA] font-mono break-all leading-tight">
                                          {record.recordKey}
                                        </h4>
                                        <span className="text-[9px] text-primaryText/40 dark:text-[#F2EFEA]/40 mt-1 block font-normal">
                                          Source: {record.sourceName} ({record.sourceType})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[9px] bg-[#DFE5F3]/30 dark:bg-softBlue/10 text-primaryText/55 dark:text-[#F2EFEA]/70 px-2 py-0.5 rounded font-mono font-bold">
                                          Updated: {new Date(record.updatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-primaryText/30 dark:text-[#F2EFEA]/30 text-xs">
                                          {isExpanded ? '▲' : '▼'}
                                        </span>
                                      </div>
                                    </div>

                                    {!isExpanded && (
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-primaryText/5 dark:border-[#557373]/10 pt-3">
                                        {previewCols.map((col) => (
                                          <div key={col.key} className="flex flex-col gap-0.5 truncate">
                                            <span className="text-[9px] text-[#557373] dark:text-softBlue uppercase font-bold tracking-wider">
                                              {col.name}
                                            </span>
                                            <span className="text-xs text-primaryText/70 dark:text-[#F2EFEA]/70 font-semibold truncate">
                                              {record.values[col.key] || '—'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {isExpanded && (
                                      <div className="flex flex-col gap-4 border-t border-primaryText/5 dark:border-[#557373]/10 pt-4 text-left">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {projectColumns.map((col) => (
                                            <div key={col.key} className="flex flex-col gap-1">
                                              <span className="text-[9px] text-[#557373] dark:text-softBlue uppercase font-bold tracking-wider">
                                                {col.name}
                                              </span>
                                              <span className="text-xs text-primaryText dark:text-[#F2EFEA] font-semibold bg-primaryText/[0.02] dark:bg-white/[0.02] border border-primaryText/5 dark:border-[#557373]/10 p-3 rounded-[12px] break-words">
                                                {record.values[col.key] || '—'}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Microsoft Forms View */}
              {(microsoftStatus.connectedFormId || activeUploadSubTab === 'microsoft_forms') && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-teal-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
                        Microsoft Forms Connection
                      </h2>
                      <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-normal">
                        Import responses from Microsoft Excel workbooks synchronized in OneDrive.
                      </p>
                    </div>
                  </div>

                  {microsoftStatus.loading ? (
                    <div className="py-12 text-center text-xs text-primaryText/40 dark:text-[#F2EFEA]/45">
                      Verifying integration connection status...
                    </div>
                  ) : !microsoftStatus.connected ? (
                    // Disconnected state
                    <Card className="p-6 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex flex-col gap-4 max-w-xl text-left">
                      <h3 className="text-xs font-bold text-primaryText/70 dark:text-[#F2EFEA]/70 uppercase tracking-wider">
                        Microsoft Forms Not Connected
                      </h3>
                      <p className="text-xs text-primaryText/60 dark:text-[#F2EFEA]/65 leading-relaxed font-normal">
                        No user-level Microsoft Account integration has been configured. Please connect your Microsoft Account in the "Connected Accounts" panel on the Projects Dashboard first.
                      </p>
                    </Card>
                  ) : (
                    // Connected state
                    <div className="flex flex-col gap-6 font-sans">
                      
                      {/* Connection metadata card */}
                      <Card className="p-6 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 shrink-0" />
                          <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-bold uppercase tracking-wider">
                            Connected as: <span className="font-mono text-primaryText dark:text-[#F2EFEA] font-bold ml-1">{microsoftStatus.email}</span>
                          </span>
                        </div>

                        {microsoftStatus.connectedFormId && !isEditingMsForm ? (
                          // Connected Form View
                          <div className="flex flex-col gap-4 text-left font-sans mt-2 border-t border-primaryText/5 dark:border-[#557373]/10 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal">
                              <div className="flex justify-between border-b border-primaryText/5 sm:border-b-0 pb-1.5 sm:pb-0">
                                <span className="text-primaryText/45 dark:text-[#F2EFEA]/45">Form Name:</span>
                                <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">
                                  {microsoftStatus.connectedFormTitle}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-primaryText/5 sm:border-b-0 pb-1.5 sm:pb-0">
                                <span className="text-primaryText/45 dark:text-[#F2EFEA]/45 font-semibold">Connected Account:</span>
                                <span className="font-semibold text-primaryText dark:text-[#F2EFEA] font-mono">
                                  {microsoftStatus.email}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-primaryText/45 dark:text-[#F2EFEA]/45">Last Sync:</span>
                                <span className="font-mono font-semibold text-primaryText dark:text-[#F2EFEA]">
                                  {microsoftStatus.lastSyncTime ? new Date(microsoftStatus.lastSyncTime).toLocaleString() : 'Never'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-primaryText/5 dark:border-[#557373]/10">
                              <button
                                onClick={() => setIsEditingMsForm(true)}
                                className="text-xs font-bold text-[#557373] dark:text-softBlue hover:underline cursor-pointer"
                              >
                                Change Form
                              </button>
                              <span className="text-primaryText/20 dark:text-[#F2EFEA]/20">|</span>
                              <button
                                onClick={handleDisconnectMicrosoft}
                                className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Disconnect Form
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Dropdown selector
                          <div className="flex flex-col gap-2 mt-2 font-sans text-left border-t border-primaryText/5 dark:border-[#557373]/10 pt-4">
                            <label className="text-[9px] font-bold text-[#557373] dark:text-softBlue uppercase tracking-wider">
                              Select Connected Microsoft Excel Form
                            </label>
                            
                            {msFormsLoading ? (
                              <span className="text-xs text-primaryText/40 dark:text-[#F2EFEA]/40">Retrieving workbook forms...</span>
                            ) : msFormsError ? (
                              <span className="text-xs text-red-500">{msFormsError}</span>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <select
                                  className="w-full sm:w-80 text-xs font-semibold bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/30 p-2.5 rounded-[12px] text-primaryText dark:text-[#F2EFEA] cursor-pointer"
                                  value={microsoftStatus.connectedFormId || ''}
                                  onChange={(e) => {
                                    const fId = e.target.value;
                                    const fObj = microsoftForms.find(f => f.id === fId);
                                    handleConnectMsForm(fId, fObj ? fObj.title : 'Microsoft Form');
                                  }}
                                >
                                  <option value="">-- Choose an Excel Sheet Form --</option>
                                  {microsoftForms.map(f => (
                                    <option key={f.id} value={f.id}>{f.title}</option>
                                  ))}
                                </select>
                                
                                {microsoftStatus.connectedFormId && (
                                  <div className="flex items-center gap-4">
                                    <a 
                                      href="https://onedrive.live.com/"
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-xs font-bold text-[#557373] dark:text-softBlue hover:underline shrink-0"
                                    >
                                      Open OneDrive &rarr;
                                    </a>
                                    <button
                                      onClick={() => setIsEditingMsForm(false)}
                                      className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>

                      {/* Sync Responses trigger & metadata */}
                      {microsoftStatus.connectedFormId && (
                        <Card className="p-5 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA]">Synchronize Form Data</h4>
                              <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-normal mt-0.5 leading-normal">
                                Pull entries dynamically, evaluate duplicates using the configured primary key, and update project records.
                              </p>
                            </div>
                            <Button 
                              variant="primary"
                              onClick={handleSyncClick}
                              className="py-2.5 px-5 rounded-[16px] text-xs font-bold uppercase flex items-center justify-center gap-2 self-start sm:self-auto"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                              Sync Responses
                            </Button>
                          </div>
                          {microsoftStatus.primaryKeyColumn && projectColumns.length > 0 && (
                            <div className="text-[10px] text-primaryText/50 dark:text-[#F2EFEA]/50 font-normal border-t border-primaryText/5 dark:border-[#557373]/10 pt-3 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 shrink-0" />
                              Active Project Primary Key Column: <span className="font-semibold text-primaryText dark:text-[#F2EFEA] font-mono">{projectColumns.find(c => c.key === microsoftStatus.primaryKeyColumn)?.name || microsoftStatus.primaryKeyColumn}</span>
                            </div>
                          )}
                        </Card>
                      )}

                      {/* Imported Database Records Section */}
                      {microsoftStatus.connectedFormId && (
                        <div className="flex flex-col gap-4 border-t border-primaryText/5 dark:border-[#557373]/10 pt-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider">
                              Project Database Records ({projectRecords.length})
                            </h3>
                            <span className="text-[10px] text-primaryText/40 dark:text-[#F2EFEA]/40 font-normal">
                              Click any card to expand details
                            </span>
                          </div>

                          {recordsLoading ? (
                            <div className="py-8 text-center text-xs text-primaryText/40 dark:text-[#F2EFEA]/45">
                              Loading project database records...
                            </div>
                          ) : projectRecords.length === 0 ? (
                            <div className="py-12 text-center text-xs text-primaryText/40 dark:text-[#F2EFEA]/45 border border-dashed border-primaryText/10 dark:border-[#557373]/20 rounded-[20px] font-normal">
                              No records imported yet. Click "Sync Responses" above to dynamically pull and parse Microsoft Excel workbook rows.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {projectRecords.map((record) => {
                                const isExpanded = expandedRecordId === record.id;
                                const previewCols = projectColumns.slice(0, 3);

                                return (
                                  <Card 
                                    key={record.id}
                                    className="p-5 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] cursor-pointer flex flex-col gap-3 transition-all text-left"
                                    onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                                  >
                                    <div className="flex justify-between items-center gap-4">
                                      <div>
                                        <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA] font-mono break-all leading-tight">
                                          {record.recordKey}
                                        </h4>
                                        <span className="text-[9px] text-primaryText/40 dark:text-[#F2EFEA]/40 mt-1 block font-normal">
                                          Source: {record.sourceName} ({record.sourceType})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[9px] bg-[#DFE5F3]/30 dark:bg-softBlue/10 text-primaryText/55 dark:text-[#F2EFEA]/70 px-2 py-0.5 rounded font-mono font-bold">
                                          Updated: {new Date(record.updatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-primaryText/30 dark:text-[#F2EFEA]/30 text-xs">
                                          {isExpanded ? '▲' : '▼'}
                                        </span>
                                      </div>
                                    </div>

                                    {!isExpanded && (
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-primaryText/5 dark:border-[#557373]/10 pt-3">
                                        {previewCols.map((col) => (
                                          <div key={col.key} className="flex flex-col gap-0.5 truncate">
                                            <span className="text-[9px] text-[#557373] dark:text-softBlue uppercase font-bold tracking-wider">
                                              {col.name}
                                            </span>
                                            <span className="text-xs text-primaryText/70 dark:text-[#F2EFEA]/70 font-semibold truncate">
                                              {record.values[col.key] || '—'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {isExpanded && (
                                      <div className="flex flex-col gap-4 border-t border-primaryText/5 dark:border-[#557373]/10 pt-4 text-left">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {projectColumns.map((col) => (
                                            <div key={col.key} className="flex flex-col gap-1">
                                              <span className="text-[9px] text-[#557373] dark:text-softBlue uppercase font-bold tracking-wider">
                                                {col.name}
                                              </span>
                                              <span className="text-xs text-primaryText dark:text-[#F2EFEA] font-semibold bg-primaryText/[0.02] dark:bg-white/[0.02] border border-primaryText/5 dark:border-[#557373]/10 p-3 rounded-[12px] break-words">
                                                {record.values[col.key] || '—'}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Case 3: Choices Grid (Neither connected and activeUploadSubTab is null) */}
              {!googleStatus.connectedFormId && !microsoftStatus.connectedFormId && !activeUploadSubTab && (
                <div className="flex flex-col gap-6">
                  <h3 className="text-xs font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider text-left">
                    Select Forms Integration Provider
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Google Forms Card */}
                    <Card 
                      className="p-5 border rounded-[20px] flex items-start gap-4 hover:shadow-md cursor-pointer transition-shadow border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg text-left"
                      onClick={() => setActiveUploadSubTab('google_forms')}
                    >
                      <div className="w-10 h-10 shrink-0 bg-[#DFE5F3]/30 dark:bg-softBlue/5 rounded-[12px] flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M17,17H7v-2h10V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA]">Google Forms</h4>
                        <p className="text-[10px] text-primaryText/50 dark:text-[#F2EFEA]/50 mt-1 leading-normal font-normal">
                          Import responses directly from Google Forms worksheets.
                        </p>
                      </div>
                    </Card>

                    {/* Microsoft Forms Card */}
                    <Card 
                      className="p-5 border rounded-[20px] flex items-start gap-4 hover:shadow-md cursor-pointer transition-shadow border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg text-left"
                      onClick={() => setActiveUploadSubTab('microsoft_forms')}
                    >
                      <div className="w-10 h-10 shrink-0 bg-teal-500/10 rounded-[12px] flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA]">Microsoft Forms</h4>
                        <p className="text-[10px] text-primaryText/50 dark:text-[#F2EFEA]/50 mt-1 leading-normal font-normal">
                          Connect spreadsheets to Office 365 Forms. Import excel columns.
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PROJECT SETUP */}
          {activeTab === 'setup' && (
            <Card className="p-6 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px]">
              <h3 className="text-xs font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider mb-4 border-b border-primaryText/5 dark:border-[#557373]/15 pb-2">
                Configure Project Parameters
              </h3>
              <div className="flex flex-col gap-4 text-xs font-sans">
                <Input
                  id="active-proj-name"
                  label="Rename Project"
                  value={activeProject.name}
                  onChange={(e) => {
                    const renamed = projects.map(p => p.id === activeProject.id ? { ...p, name: e.target.value } : p);
                    setProjects(renamed);
                    localStorage.setItem('projectsData', JSON.stringify(renamed));
                  }}
                />
                <div className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 leading-relaxed font-normal">
                  Renaming updates the dataset folder name immediately in client memory storage.
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: INVITATIONS (Generic and renamed) */}
          {activeTab === 'invitations' && (
            <Card className="p-6 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex flex-col gap-4">
              <h3 className="text-xs font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider border-b border-primaryText/5 dark:border-[#557373]/15 pb-2">
                Collaborative Invitations
              </h3>
              <div className="flex flex-col gap-3 py-4 text-center items-center text-xs text-primaryText/40 dark:text-[#F2EFEA]/45 font-sans font-normal">
                <Mail className="w-5 h-5 text-primaryText/35" />
                <span>No active invitations on file for this project.</span>
                <Button 
                  size="sm" 
                  className="mt-2 text-[10px] uppercase font-bold py-1.5 px-3.5 rounded-[18px]"
                  onClick={() => triggerAlert('alert', 'Send Collaboration Invitations', 'Database directory sharing hook is locked in demo.')}
                >
                  Send Invitations
                </Button>
              </div>
            </Card>
          )}

        </div>

        {/* 1. Choose Primary Key Modal */}
        {isPrimaryKeyModalOpen && (
          <Modal isOpen={isPrimaryKeyModalOpen} onClose={() => setIsPrimaryKeyModalOpen(false)}>
            <div className="flex flex-col gap-4 text-left select-none font-sans p-2">
              <div>
                <h3 className="text-base font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
                  Choose Primary Key
                </h3>
                <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-normal mt-1 leading-normal">
                  Select ONE column to serve as the unique identifier for this project. Duplicate checking will be performed using this field.
                </p>
              </div>

              {schemaQuestions.length === 0 ? (
                <div className="py-4 text-center text-xs text-primaryText/45">
                  No columns detected in the connected form.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {schemaQuestions.map(q => (
                    <label 
                      key={q.key} 
                      className={`flex items-center gap-3 p-3 border rounded-[14px] cursor-pointer transition-colors ${
                        selectedPrimaryKey === q.key 
                          ? 'border-mutedGreen bg-mutedGreen/5 dark:border-softBlue dark:bg-softBlue/5' 
                          : 'border-primaryText/10 dark:border-[#557373]/15 hover:bg-primaryText/5'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="primary_key_selection" 
                        value={q.key} 
                        checked={selectedPrimaryKey === q.key}
                        onChange={() => setSelectedPrimaryKey(q.key)}
                        className="accent-mutedGreen dark:accent-softBlue"
                      />
                      <span className="text-xs font-semibold text-primaryText dark:text-[#F2EFEA] truncate">
                        {q.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-primaryText/5 dark:border-[#557373]/10">
                <Button 
                  variant="secondary" 
                  className="py-2 px-4 rounded-[14px] text-xs font-bold uppercase"
                  onClick={() => setIsPrimaryKeyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="py-2 px-4 rounded-[14px] text-xs font-bold uppercase"
                  disabled={!selectedPrimaryKey}
                  onClick={handleSavePrimaryKey}
                >
                  Confirm Selection
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* 2. Sync Strategy Dialog */}
        {isSyncStrategyModalOpen && (
          <Modal isOpen={isSyncStrategyModalOpen} onClose={() => setIsSyncStrategyModalOpen(false)}>
            <div className="flex flex-col gap-4 text-left select-none font-sans p-2">
              <div>
                <h3 className="text-base font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
                  Synchronization Options
                </h3>
                <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-normal mt-1 leading-normal">
                  Choose how the importer should handle duplicate records based on the configured primary key.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <label 
                  className={`flex items-start gap-3 p-3.5 border rounded-[16px] cursor-pointer transition-colors ${
                    syncStrategy === 'replace' 
                      ? 'border-mutedGreen bg-mutedGreen/5 dark:border-softBlue dark:bg-softBlue/5' 
                      : 'border-primaryText/10 dark:border-[#557373]/15'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="sync_strategy" 
                    value="replace" 
                    checked={syncStrategy === 'replace'}
                    onChange={() => setSyncStrategy('replace')}
                    className="accent-mutedGreen dark:accent-softBlue mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-primaryText dark:text-[#F2EFEA] block">
                      Replace Existing Records
                    </span>
                    <span className="text-[10px] text-primaryText/50 dark:text-[#F2EFEA]/50 font-normal leading-normal mt-0.5 block">
                      Updates every field of existing records with the newest Google Form response values.
                    </span>
                  </div>
                </label>

                <label 
                  className={`flex items-start gap-3 p-3.5 border rounded-[16px] cursor-pointer transition-colors ${
                    syncStrategy === 'keep' 
                      ? 'border-mutedGreen bg-mutedGreen/5 dark:border-softBlue dark:bg-softBlue/5' 
                      : 'border-primaryText/10 dark:border-[#557373]/15'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="sync_strategy" 
                    value="keep" 
                    checked={syncStrategy === 'keep'}
                    onChange={() => setSyncStrategy('keep')}
                    className="accent-mutedGreen dark:accent-softBlue mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-primaryText dark:text-[#F2EFEA] block">
                      Keep Existing Records
                    </span>
                    <span className="text-[10px] text-primaryText/50 dark:text-[#F2EFEA]/50 font-normal leading-normal mt-0.5 block">
                      Ignores duplicates. Only imports responses that contain a new, unimported primary key value.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-primaryText/5 dark:border-[#557373]/10">
                <Button 
                  variant="secondary" 
                  className="py-2 px-4 rounded-[14px] text-xs font-bold uppercase"
                  onClick={() => setIsSyncStrategyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="py-2 px-4 rounded-[14px] text-xs font-bold uppercase"
                  onClick={handleStartSync}
                >
                  Start Sync
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* 3. Sync Summary Modal */}
        {isSyncSummaryModalOpen && (
          <Modal isOpen={isSyncSummaryModalOpen} onClose={() => setIsSyncSummaryModalOpen(false)}>
            <div className="flex flex-col gap-4 text-left select-none font-sans p-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mutedGreen dark:bg-softBlue animate-pulse" />
                <h3 className="text-base font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
                  Synchronization Complete
                </h3>
              </div>
              <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-normal leading-normal">
                Your Google Form records have been synchronized dynamically. Here is a summary of the operations performed:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-mutedGreen/5 dark:bg-softBlue/5 border border-primaryText/5 dark:border-[#557373]/10 rounded-[14px]">
                  <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 block font-bold">Total Extracted</span>
                  <span className="text-lg font-mono font-bold text-primaryText dark:text-[#F2EFEA]">{syncResult?.total || 0}</span>
                </div>
                <div className="p-3 bg-mutedGreen/5 dark:bg-softBlue/5 border border-primaryText/5 dark:border-[#557373]/10 rounded-[14px]">
                  <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 block font-bold">Newly Imported</span>
                  <span className="text-lg font-mono font-bold text-mutedGreen dark:text-softBlue">{syncResult?.imported || 0}</span>
                </div>
                <div className="p-3 bg-mutedGreen/5 dark:bg-softBlue/5 border border-primaryText/5 dark:border-[#557373]/10 rounded-[14px]">
                  <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 block font-bold">Updated/Replaced</span>
                  <span className="text-lg font-mono font-bold text-indigo-500">{syncResult?.updated || 0}</span>
                </div>
                <div className="p-3 bg-mutedGreen/5 dark:bg-softBlue/5 border border-primaryText/5 dark:border-[#557373]/10 rounded-[14px]">
                  <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 block font-bold">Ignored/Kept</span>
                  <span className="text-lg font-mono font-bold text-primaryText/40 dark:text-[#F2EFEA]/30">{syncResult?.ignored || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-primaryText/5 dark:border-[#557373]/10">
                <Button 
                  variant="primary" 
                  className="py-2 px-5 rounded-[14px] text-xs font-bold uppercase"
                  onClick={() => setIsSyncSummaryModalOpen(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
            My Projects
          </h1>
          <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
            Access mapping folders and forms. Set up collaborations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          className="text-xs font-bold py-2.5 px-5 rounded-[20px] shadow"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New Project
        </Button>
      </div>

      {/* Connected Accounts Section */}
      <div className="flex flex-col gap-4 border-b border-primaryText/5 dark:border-[#557373]/15 pb-6 mb-2">
        <h2 className="text-xs font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider">
          Connected Accounts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Google Forms Connection Card */}
          <Card className="p-5 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex items-center justify-between gap-4 font-sans text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-indigo-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M17,17H7v-2h10V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA]">Google Forms</h4>
                {userGoogleStatus.loading ? (
                  <span className="text-[10px] text-primaryText/40 dark:text-[#F2EFEA]/40 block mt-1">Verifying...</span>
                ) : userGoogleStatus.connected ? (
                  <span className="text-[10px] text-mutedGreen dark:text-softBlue font-mono font-bold block mt-1">
                    Connected &bull; {userGoogleStatus.email}
                  </span>
                ) : (
                  <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 block mt-1">Not Connected</span>
                )}
              </div>
            </div>
            
            {!userGoogleStatus.loading && (
              <div>
                {userGoogleStatus.connected ? (
                  <button
                    onClick={handleUserGoogleDisconnect}
                    className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="text-[10px] uppercase font-bold py-1.5 px-3.5 rounded-[14px]"
                    onClick={handleUserGoogleConnect}
                  >
                    Connect
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Microsoft Forms Connection Card */}
          <Card className="p-5 border border-primaryText/10 dark:border-[#557373]/25 bg-[#FFFFFF] dark:bg-darkCardBg rounded-[20px] flex items-center justify-between gap-4 font-sans text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-teal-600/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA]">Microsoft Forms</h4>
                {userMicrosoftStatus.loading ? (
                  <span className="text-[10px] text-primaryText/40 dark:text-[#F2EFEA]/40 block mt-1">Verifying...</span>
                ) : userMicrosoftStatus.connected ? (
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold block mt-1">
                    Connected &bull; {userMicrosoftStatus.email}
                  </span>
                ) : (
                  <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 block mt-1">Not Connected</span>
                )}
              </div>
            </div>
            
            {!userMicrosoftStatus.loading && (
              <div>
                {userMicrosoftStatus.connected ? (
                  <button
                    onClick={handleUserMicrosoftDisconnect}
                    className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="text-[10px] uppercase font-bold py-1.5 px-3.5 rounded-[14px]"
                    onClick={handleUserMicrosoftConnect}
                  >
                    Connect
                  </Button>
                )}
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* Projects Cards Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.map((p) => (
            <Card key={p.id} className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] flex flex-col justify-between gap-5 hover:shadow-md transition-shadow">
              <div className="text-left font-sans">
                <h3 className="text-base font-bold text-primaryText dark:text-[#F2EFEA]">{p.name}</h3>
                <div className="flex flex-col gap-1 mt-3 text-[10px] text-primaryText/50 dark:text-[#F2EFEA]/50 font-normal">
                  <span><strong>Created Date:</strong> {p.createdDate}</span>
                  <span><strong>Owner:</strong> {p.owner}</span>
                </div>
              </div>
              <div className="flex justify-start">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-[9px] font-bold tracking-wider py-2 px-4 rounded-[18px] uppercase bg-mutedGreen"
                  onClick={() => setActiveProjectId(p.id)}
                >
                  Open Project
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-primaryText/30 dark:text-[#F2EFEA]/30 border border-dashed border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] bg-warmWhite/5 dark:bg-[#0D0D0D]">
          No projects yet. Create or join a project to begin.
        </div>
      )}

      {/* Premium Create Project Dialog Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Project"
          className="rounded-[20px]"
        >
          <form onSubmit={handleCreateProjectSubmit} className="flex flex-col gap-4 text-left font-sans">
            <Input
              id="new-project-name"
              label="Project Name"
              placeholder="e.g. Q3 Feedback Campaign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
            
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-primaryText/60 dark:text-[#F2EFEA]/60">
                Optional Connections
              </label>
              
              <label className="flex items-center gap-2.5 text-xs text-primaryText/70 dark:text-[#F2EFEA]/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={connectGoogleForms}
                  onChange={(e) => setConnectGoogleForms(e.target.checked)}
                  className="rounded border-primaryText/10 dark:border-[#557373]/25 accent-mutedGreen dark:accent-softBlue w-4 h-4"
                />
                <span>Connect Google Forms</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-primaryText/70 dark:text-[#F2EFEA]/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={connectMicrosoftForms}
                  onChange={(e) => setConnectMicrosoftForms(e.target.checked)}
                  className="rounded border-primaryText/10 dark:border-[#557373]/25 accent-mutedGreen dark:accent-softBlue w-4 h-4"
                />
                <span>Connect Microsoft Forms</span>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-primaryText/5 dark:border-[#557373]/15">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-2 text-xs font-bold uppercase rounded-[18px]"
              >
                Create Project
              </Button>
              <Button
                variant="secondary"
                className="flex-1 py-2 text-xs font-bold uppercase border border-black/5 dark:border-[#557373]/20 rounded-[18px] text-primaryText dark:text-[#F2EFEA]"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

// 3. Workspace Profile / Settings Screen (Fully Functional)
const WorkspaceSettings = ({ user, triggerAlert, handleLogout, theme, toggleTheme }) => {
  const token = localStorage.getItem('token');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Errors/Loading
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePasswordChange = () => {
    const tempErrors = {};
    if (!currentPassword) {
      tempErrors.currentPassword = 'Current password is required.';
    }
    if (!newPassword) {
      tempErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      tempErrors.newPassword = 'New password must be at least 8 characters.';
    }
    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordChange()) return;

    setLoading(true);
    const res = await apiService.changePassword(currentPassword, newPassword, token);
    setLoading(false);

    if (res.success) {
      // Re-save reissued token and user details to localStorage
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      // Reset form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Log the password change activity
      logUserActivity('Password Changed', 'Updated workspace login security credentials.');

      triggerAlert(
        'success',
        'Security Credentials Updated',
        'Your password has been successfully updated in the database.',
        3000
      );
    } else {
      triggerAlert(
        'alert',
        'Update Failure',
        res.message || 'Unable to update password.'
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left font-sans max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
          Profile Settings
        </h1>
        <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
          Configure profile coordinates, change password, alter theme, or logout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Profile Information & Theme/Logout */}
        <div className="flex flex-col gap-6">
          {/* Profile details */}
          <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] flex flex-col gap-4">
            <h3 className="text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-wider border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Workspace Coordinates
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Display Name:</span>
                <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">{user.fullName || 'Workspace Member'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Academic Email:</span>
                <span className="font-mono font-semibold text-primaryText dark:text-[#F2EFEA]">{user.email || 'coordinator@nit.edu'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">System Role:</span>
                <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">{user.role || 'Teacher'}</span>
              </div>
            </div>
          </Card>

          {/* Theme & Logout Options */}
          <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] flex flex-col gap-4">
            <h3 className="text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-wider border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Preferences
            </h3>
            
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-primaryText/60 dark:text-[#F2EFEA]/60">Interface Styling Theme:</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-[18px] border border-primaryText/10 dark:border-[#557373]/25 hover:bg-warmWhite dark:hover:bg-[#0D0D0D] transition-colors text-xs font-semibold cursor-pointer"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5" />
                    Light Mode
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-primaryText/5 dark:border-[#557373]/15 pt-3">
              <span className="text-primaryText/60 dark:text-[#F2EFEA]/60">Terminate Active Session:</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[18px] bg-mutedGreen/10 hover:bg-mutedGreen/25 dark:bg-softBlue/10 dark:hover:bg-softBlue/25 text-mutedGreen dark:text-softBlue transition-colors text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Password Management (Real Password Change Flow) */}
        <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] flex flex-col gap-4">
          <h3 className="text-xs font-bold text-[#557373] dark:text-softBlue uppercase tracking-wider border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security & Password Management
          </h3>

          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            {/* Current Password */}
            <div className="relative text-left">
              <Input
                id="change-current"
                label="Current Password"
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
            <div className="relative text-left">
              <Input
                id="change-new"
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
            <div className="relative text-left">
              <Input
                id="change-confirm"
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
                className="w-full text-xs font-bold tracking-wider py-2.5  rounded-[20px] uppercase"
                disabled={loading}
              >
                {loading ? 'Changing password...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </div>
  );
};
