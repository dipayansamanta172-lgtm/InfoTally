import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { AlertModal } from '../ui/AlertModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Inbox, ShieldCheck, Settings, LogOut, Check, X, Eye, 
  Database, UserCheck, UserX, Clock, Activity, Menu, LayoutGrid, Sun, Moon
} from 'lucide-react';

export const AdminLayout = () => {
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

  // Custom Alert Modal configuration state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    bullets: [],
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    autoCloseMs: null
  });

  // States
  const [metrics, setMetrics] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalUsers: 0
  });
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Safeguard: Redirect immediately if no token or role is not Admin
  if (!token || sessionUser.role !== 'Admin') {
    return <Navigate to="/sign-in" replace />;
  }

  // Trigger custom alert popup modal
  const triggerAlert = (type, title, message, onConfirm = null, bullets = [], autoCloseMs = null) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      bullets,
      confirmText: type === 'confirm' ? 'Approve' : 'Confirm',
      cancelText: 'Cancel',
      onConfirm,
      autoCloseMs
    });
  };

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

  // Fetch all administration data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    const metRes = await apiService.getMetrics(token);
    const reqRes = await apiService.getRequests(token);
    const usrRes = await apiService.getUsers(token);
    const logRes = await apiService.getLogs(token);

    if (metRes.success && reqRes.success && usrRes.success && logRes.success) {
      setMetrics(metRes.metrics);
      setRequests(reqRes.requests);
      setUsers(usrRes.users);
      setLogs(logRes.logs);
    } else {
      setError('Error communicating with administration database. Authenticate session again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/sign-in');
  };

  // Approval trigger
  const handleApprove = (id, email) => {
    triggerAlert(
      'confirm',
      'Approve Access Request',
      `Approve workspace access for ${email}?`,
      async () => {
        setLoading(true);
        const res = await apiService.approveRequest(id, token);
        if (res.success) {
          triggerAlert(
            'success',
            'Access Approved',
            'The user account has been created successfully. A welcome email has been dispatched.',
            null,
            [],
            3000 // Auto-close success modal after 3 seconds
          );
          await fetchData();
        } else {
          triggerAlert(
            'alert',
            'Approval Failure',
            res.message || 'Error executing request approval.'
          );
          setLoading(false);
        }
      },
      [
        'Create the account',
        'Generate temporary credentials',
        'Send the welcome email'
      ]
    );
  };

  // Rejection trigger
  const handleReject = async (id, email, reason) => {
    setLoading(true);
    const res = await apiService.rejectRequest(id, reason, token);
    if (res.success) {
      triggerAlert(
        'success',
        'Request Rejected',
        `Rejection log recorded for ${email}.`,
        null,
        [],
        3000
      );
      await fetchData();
    } else {
      triggerAlert(
        'alert',
        'Rejection Failure',
        res.message || 'Error executing request rejection.'
      );
      setLoading(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: Database, exact: true },
    { label: 'Pending', path: '/admin/pending', icon: Inbox },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Logs', path: '/admin/activity', icon: Activity },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-primaryBg dark:bg-[#0D0D0D] text-primaryText dark:text-[#F2EFEA] font-sans pb-28 transition-colors duration-300 relative text-left">
      
      {/* Top Header bar with InfoTally Logo and Theme Toggle */}
      <header className="border-b border-primaryText/5 dark:border-[#557373]/20 bg-[#FFFFFF] dark:bg-darkCardBg py-4 px-6 md:px-12 flex items-center justify-between select-none">
        <div className="flex items-end gap-[3px] h-4">
          <span className="w-[3px] h-2.5 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="w-[3px] h-4 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="w-[3px] h-1.5 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
          <span className="text-xs font-bold text-primaryText dark:text-[#F2EFEA] tracking-wider ml-1">InfoTally Admin</span>
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
            {sessionUser.fullName || 'Admin'}
          </div>
        </div>
      </header>

      {/* Main Content Workspace Panel */}
      <main className="max-w-[1600px] mx-auto p-6 md:p-12">
        {loading ? (
          <div className="h-full flex items-center justify-center py-20">
            <span className="text-xs text-primaryText/50 dark:text-[#F2EFEA]/50 font-mono">Syncing system database...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-mutedGreen bg-warmWhite/20 border border-dashed border-primaryText/15 rounded">
            ⚠ {error}
            <Button size="sm" className="mt-4 mx-auto block" onClick={fetchData}>Retry Database Connection</Button>
          </div>
        ) : (
          <Routes>
            <Route index element={<AdminDashboard metrics={metrics} logs={logs} />} />
            <Route path="pending" element={
              <PendingRequests 
                requests={requests} 
                handleApprove={handleApprove} 
                handleReject={handleReject} 
              />
            } />
            <Route path="users" element={<UsersList users={users} />} />
            <Route path="activity" element={<ActivityLogs logs={logs} />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        )}
      </main>

      {/* Bottom Center Floating Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 select-none">
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.button
              key="collapsed-dock"
              layoutId="nav-dock-container"
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
              layoutId="nav-dock-container"
              className="bg-[#FFFFFF] dark:bg-[#161616] border border-primaryText/10 dark:border-[#557373]/25 rounded-full px-5 py-2.5 flex items-center gap-3 sm:gap-5 shadow-xl max-w-[95vw] md:max-w-2xl text-xs font-semibold"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {navItems.map((item) => {
                const IconComp = item.icon;
                const activeOverride = (item.path === '/admin' && location.pathname === '/admin') || 
                                       (item.path !== '/admin' && location.pathname.startsWith(item.path));
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
              
              <div className="w-[1px] h-6 bg-primaryText/10 dark:bg-[#557373]/20" />
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-mutedGreen dark:text-softBlue hover:bg-warmWhite dark:hover:bg-darkCardBg cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              
              <div className="w-[1px] h-6 bg-primaryText/10 dark:bg-[#557373]/20" />
              
              {/* Collapse trigger */}
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
// SUB-PANEL COMPONENTS
// ==========================================

// 1. Dashboard Metrics Screen
const AdminDashboard = ({ metrics, logs }) => {
  const widgetStats = [
    { label: 'Pending Requests', value: metrics.pendingRequests, icon: Inbox, color: 'text-mutedGreen dark:text-softBlue' },
    { label: 'Approved Users', value: metrics.approvedRequests, icon: UserCheck, color: 'text-primaryText dark:text-softBlue' },
    { label: 'Rejected Requests', value: metrics.rejectedRequests, icon: UserX, color: 'text-mutedGreen dark:text-softBlue' },
    { label: 'Total Accounts', value: metrics.totalUsers, icon: ShieldCheck, color: 'text-primaryText dark:text-softBlue' }
  ];

  // Display exactly the 10 most recent activities, sorted newest first
  const recentLogs = (logs || []).slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
          Academic Workspace Overview
        </h1>
        <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
          Review coordinator registrations, examine activity trails, and audit system operations.
        </p>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgetStats.map((stat, idx) => {
          const IconComp = stat.icon;
          return (
            <Card key={idx} className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="text-left">
                <span className="text-[10px] font-bold text-primaryText/45 dark:text-[#F2EFEA]/45 uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className="text-2xl font-bold text-primaryText dark:text-[#F2EFEA] block mt-1.5 leading-none">
                  {stat.value}
                </span>
              </div>
              <div className="p-3 rounded bg-softBlue dark:bg-[#0D0D0D] border border-black/5 dark:border-[#557373]/15">
                <IconComp className={`w-5 h-5 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Logs (Latest 10 logs) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[12px] p-5">
          <h3 className="text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-wider mb-4 border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Activity Trail (10 Latest)
          </h3>
          <div className="divide-y divide-primaryText/5 dark:divide-[#557373]/10 max-h-[350px] overflow-y-auto pr-1">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">
                      {log.action}
                    </span>
                    <span className="text-[9px] text-primaryText/45 dark:text-[#F2EFEA]/45 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-primaryText/60 dark:text-[#F2EFEA]/65 leading-relaxed font-normal">
                    {log.details}
                  </p>
                  <span className="text-[9px] text-mutedGreen dark:text-softBlue block mt-0.5">
                    Logged by: {log.user_name || 'System'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-primaryText/30 dark:text-[#F2EFEA]/30 py-8 text-center">No activity logs recorded.</p>
            )}
          </div>
        </div>

        {/* Right Column: Newest Users */}
        <div className="bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[12px] p-5">
          <h3 className="text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-wider mb-4 border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Newest User Profiles
          </h3>
          <div className="flex flex-col gap-3">
            {metrics.recentUsers && metrics.recentUsers.length > 0 ? (
              metrics.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 border border-primaryText/5 dark:border-[#557373]/15 rounded bg-primaryBg/50 dark:bg-[#0D0D0D]/30">
                  <div className="text-left truncate max-w-[130px]">
                    <span className="text-xs font-bold text-primaryText dark:text-[#F2EFEA] block truncate">
                      {user.full_name}
                    </span>
                    <span className="text-[9px] text-primaryText/45 dark:text-[#F2EFEA]/45 block truncate">
                      {user.email}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-softBlue dark:bg-[#0D0D0D] text-mutedGreen dark:text-softBlue border border-black/5 dark:border-[#557373]/20 px-2 py-0.5 rounded uppercase">
                    {user.role}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-primaryText/30 dark:text-[#F2EFEA]/30 py-8 text-center">No users found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Pending Access Requests Screen
const PendingRequests = ({ requests, handleApprove, handleReject }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Local filter for pending requests only
  const pendingRequests = requests.filter(r => r.status === 'Pending');

  const openView = (request) => {
    setSelectedRequest(request);
  };

  const triggerApprove = (id, email) => {
    handleApprove(id, email);
  };

  const startReject = (id, email) => {
    setRejectId(id);
    setRejectionReason('');
  };

  const executeReject = () => {
    if (!rejectId) return;
    const req = requests.find(r => r.id === rejectId);
    handleReject(rejectId, req.email, rejectionReason);
    setRejectId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
          Pending Access Requests
        </h1>
        <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
          Review credentials, explore coordination motives, and approve workspaces.
        </p>
      </div>

      {/* Requests table container */}
      <div className="bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primaryText/5 dark:divide-[#557373]/15 text-xs text-left">
            <thead className="bg-warmWhite dark:bg-[#0D0D0D] select-none text-[10px] font-bold text-mutedGreen dark:text-softBlue tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Institution / Department</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Date Submitted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primaryText/5 dark:divide-[#557373]/10 font-normal">
              {pendingRequests.map((request) => (
                <tr key={request.id} className="hover:bg-warmWhite/20 dark:hover:bg-[#0D0D0D]/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primaryText dark:text-[#F2EFEA]">
                    {request.full_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="block font-medium text-primaryText dark:text-[#F2EFEA]">
                      {request.institution}
                    </span>
                    <span className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 block">
                      {request.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-primaryText/70 dark:text-[#F2EFEA]/70">
                    {request.email}
                  </td>
                  <td className="px-6 py-4 text-primaryText/60 dark:text-[#F2EFEA]/60">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={Eye} 
                      className="p-2 border-primaryText/10 dark:border-[#557373]/25 text-primaryText/55 dark:text-[#F2EFEA]/50 hover:text-primaryText dark:hover:text-[#F2EFEA] rounded"
                      onClick={() => openView(request)}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={Check} 
                      className="p-2 border-mutedGreen/10 dark:border-[#557373]/25 bg-mutedGreen/5 dark:bg-softBlue/5 text-mutedGreen dark:text-softBlue hover:bg-mutedGreen/10 dark:hover:bg-softBlue/10 rounded"
                      onClick={() => triggerApprove(request.id, request.email)}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={X} 
                      className="p-2 border-primaryText/10 dark:border-[#557373]/25 hover:bg-black/5 dark:hover:bg-white/5 rounded"
                      onClick={() => startReject(request.id, request.email)}
                    />
                  </td>
                </tr>
              ))}

              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-primaryText/30 dark:text-[#F2EFEA]/30">
                    No pending access requests on file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Inspector Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Access Request Details"
        >
          <div className="flex flex-col gap-4 text-left text-xs font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">Full Name</span>
                <p className="font-semibold text-primaryText dark:text-[#F2EFEA] mt-0.5">{selectedRequest.full_name}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">Email Address</span>
                <p className="font-mono text-primaryText dark:text-[#F2EFEA] mt-0.5 truncate">{selectedRequest.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">Institution</span>
                <p className="font-semibold text-primaryText dark:text-[#F2EFEA] mt-0.5">{selectedRequest.institution}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">Department</span>
                <p className="font-semibold text-primaryText dark:text-[#F2EFEA] mt-0.5">{selectedRequest.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">Designation</span>
                <p className="font-medium text-primaryText dark:text-[#F2EFEA] mt-0.5">{selectedRequest.designation || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">Phone Number</span>
                <p className="font-medium text-primaryText dark:text-[#F2EFEA] mt-0.5">{selectedRequest.phone || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">Purpose (Why InfoTally?)</span>
              <p className="text-primaryText/70 dark:text-[#F2EFEA]/75 leading-relaxed bg-warmWhite/30 dark:bg-[#0D0D0D] border border-primaryText/5 dark:border-[#557373]/15 rounded p-3 mt-1 font-normal">
                {selectedRequest.purpose}
              </p>
            </div>

            <div>
              <span className="text-[9px] font-bold text-mutedGreen uppercase tracking-wider">About Yourself</span>
              <p className="text-primaryText/70 dark:text-[#F2EFEA]/75 leading-relaxed bg-warmWhite/30 dark:bg-[#0D0D0D] border border-primaryText/5 dark:border-[#557373]/15 rounded p-3 mt-1 font-normal">
                {selectedRequest.description}
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-primaryText/5 dark:border-[#557373]/20 pt-4 mt-2">
              <Button
                variant="primary"
                className="flex-1 py-2 text-xs font-bold uppercase rounded"
                onClick={() => {
                  triggerApprove(selectedRequest.id, selectedRequest.email);
                  setSelectedRequest(null);
                }}
              >
                Approve Request
              </Button>
              <Button
                variant="secondary"
                className="flex-1 py-2 text-xs font-bold uppercase border border-black/5 dark:border-[#557373]/20 text-primaryText dark:text-[#F2EFEA] rounded"
                onClick={() => {
                  startReject(selectedRequest.id, selectedRequest.email);
                  setSelectedRequest(null);
                }}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Optional Rejection Reason Modal */}
      {rejectId && (
        <Modal
          isOpen={!!rejectId}
          onClose={() => setRejectId(null)}
          title="Rejection Specifications"
        >
          <div className="flex flex-col gap-4 text-left text-xs font-sans">
            <p className="text-primaryText/60 dark:text-[#F2EFEA]/60 leading-normal">
              State the optional rejection reason for administrative archives. No rejection email will be dispatched to the applicant.
            </p>
            <Input
              id="rejection-reason"
              label="Rejection Reason (Optional)"
              placeholder="Institutional credentials do not match or domain mismatch..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex items-center gap-3 border-t border-primaryText/5 dark:border-[#557373]/20 pt-4 mt-2">
              <Button
                variant="primary"
                className="flex-1 py-2 text-xs font-bold uppercase rounded bg-mutedGreen hover:bg-opacity-95"
                onClick={executeReject}
              >
                Confirm Rejection
              </Button>
              <Button
                variant="secondary"
                className="flex-1 py-2 text-xs font-bold uppercase border border-black/5 dark:border-[#557373]/20 text-primaryText dark:text-[#F2EFEA] rounded"
                onClick={() => setRejectId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

// 3. User Listing Screen
const UsersList = ({ users }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
          Authorized Workspaces User Listing
        </h1>
        <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
          Monitor approved workspace coordinator accounts, audit roles, and track logins.
        </p>
      </div>

      {/* Users table */}
      <div className="bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primaryText/5 dark:divide-[#557373]/15 text-xs text-left">
            <thead className="bg-warmWhite dark:bg-[#0D0D0D] select-none text-[10px] font-bold text-mutedGreen dark:text-softBlue tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primaryText/5 dark:divide-[#557373]/10 font-normal">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-warmWhite/20 dark:hover:bg-[#0D0D0D]/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-mutedGreen dark:text-softBlue">
                    #{user.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-primaryText dark:text-[#F2EFEA]">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-primaryText/75 dark:text-[#F2EFEA]/75">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-mono font-bold bg-softBlue dark:bg-[#0D0D0D] text-mutedGreen dark:text-softBlue border border-black/5 dark:border-[#557373]/20 px-2 py-0.5 rounded uppercase">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primaryText/80 dark:text-[#F2EFEA]/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-mutedGreen" />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-primaryText/60 dark:text-[#F2EFEA]/60">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never logged in'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4. Audit Activity Logs Screen
const ActivityLogs = ({ logs }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
          Security Activity Logs
        </h1>
        <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
          Historical trail of administrative database revisions, logins, and approvals.
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primaryText/5 dark:divide-[#557373]/15 text-xs text-left">
            <thead className="bg-warmWhite dark:bg-[#0D0D0D] select-none text-[10px] font-bold text-mutedGreen dark:text-softBlue tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Admin Username</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primaryText/5 dark:divide-[#557373]/10 font-normal">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-warmWhite/20 dark:hover:bg-[#0D0D0D]/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-primaryText/60 dark:text-[#F2EFEA]/60 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-primaryText dark:text-[#F2EFEA] whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-primaryText/70 dark:text-[#F2EFEA]/70 leading-relaxed font-normal">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 font-medium text-mutedGreen dark:text-softBlue whitespace-nowrap">
                    {log.user_name || 'System Process'}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-primaryText/30 dark:text-[#F2EFEA]/30">
                    No activity logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 5. System Settings Screen
const AdminSettings = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif italic font-bold text-primaryText dark:text-[#F2EFEA]">
          InfoTally Environment Settings
        </h1>
        <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1">
          System audit variables. Variables are loaded directly from the system environment configuration.
        </p>
      </div>

      {/* Settings layout cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Database configuration card */}
        <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[12px] flex flex-col gap-4 text-left">
          <h3 className="text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-wider border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            MySQL Integration Metrics
          </h3>
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Database System:</span>
              <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">MySQL Connection Pool</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Schema Name:</span>
              <span className="font-mono font-semibold text-primaryText dark:text-[#F2EFEA]">InfoTally</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Engine Target:</span>
              <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">InnoDB (UTF8MB4)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Pool Connections:</span>
              <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">Max 10 Limit</span>
            </div>
          </div>
        </Card>

        {/* Mail configuration card */}
        <Card className="p-6 bg-[#FFFFFF] dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded-[12px] flex flex-col gap-4 text-left">
          <h3 className="text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-wider border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Nodemailer Gateway Metrics
          </h3>
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">SMTP Host:</span>
              <span className="font-mono font-semibold text-primaryText dark:text-[#F2EFEA]">smtp.gmail.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Port / TLS:</span>
              <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">Port 587 (TLS Enabled)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">System Mailer Address:</span>
              <span className="font-mono font-semibold text-primaryText dark:text-[#F2EFEA] truncate max-w-[150px]">
                Configured via .env
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-primaryText/50 dark:text-[#F2EFEA]/50">Target Framework:</span>
              <span className="font-semibold text-primaryText dark:text-[#F2EFEA]">Nodemailer Transport Pool</span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};
