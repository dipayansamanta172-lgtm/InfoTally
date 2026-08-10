import React, { useState } from 'react';
import { useMotionValue, useMotionValueEvent } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { StudentCard } from './StudentCard';
import { NotificationCard } from './NotificationCard';
import { SearchBar } from '../ui/SearchBar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Bell, Plus, Filter, LayoutGrid } from 'lucide-react';
import mockProjects from '../mock/projects.json';
import mockStudents from '../mock/students.json';
import { AlertModal } from '../ui/AlertModal';

export const DashboardPreview = ({ className = '', scrollProgress }) => {
  const [projects] = useState(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState('project-1');
  const [students] = useState(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [activeStep, setActiveStep] = useState(10); // Defaults to fully loaded interactive state if scrollProgress is omitted

  // Custom Alert configuration state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const triggerAlert = (title, message) => {
    setAlertConfig({
      isOpen: true,
      title,
      message
    });
  };

  // Fallback MotionValue to prevent "on is not a function" crash when prop is undefined (e.g. in Hero)
  const fallbackProgress = useMotionValue(0);
  const activeProgress = scrollProgress || fallbackProgress;

  // Listen to scrollProgress and map to the 10 storytelling stages
  useMotionValueEvent(activeProgress, 'change', (latest) => {
    if (!scrollProgress) return;
    
    // Scale scroll depth from [0.0, 0.85] to [0.0, 1.0] to complete sequence early
    const activeRangeProgress = Math.min(1.0, latest / 0.85);
    
    // Distribute progress into 10 steps (0 to 10)
    const step = Math.floor(activeRangeProgress * 11);
    const clampedStep = Math.max(0, Math.min(10, step));
    setActiveStep(clampedStep);

    // Apply scroll-linked updates to dashboard states
    if (clampedStep === 0) {
      setSelectedProjectId(null);
      setSearchQuery('');
      setExpandedStudentId(null);
    } else if (clampedStep === 1) {
      setSelectedProjectId('project-1');
      setSearchQuery('');
      setExpandedStudentId(null);
    } else if (clampedStep >= 2 && clampedStep <= 5) {
      setSelectedProjectId('project-1');
      setSearchQuery('');
      setExpandedStudentId(null);
    } else if (clampedStep === 6) {
      // Type Ananya query dynamically inside the step progress
      const searchString = "Ananya";
      const startProg = 6 / 11;
      const endProg = 7 / 11;
      const progressInStep = (activeRangeProgress - startProg) / (endProg - startProg);
      const charCount = Math.floor(Math.max(0, Math.min(1, progressInStep)) * (searchString.length + 1));
      setSearchQuery(searchString.slice(0, charCount));
      setExpandedStudentId(null);
    } else if (clampedStep === 7) {
      setSelectedProjectId('project-1');
      setSearchQuery('Ananya');
      setExpandedStudentId('202400124'); // Expand Ananya Sharma
    } else if (clampedStep >= 8) {
      setSelectedProjectId('project-1');
      setSearchQuery('Ananya');
      setExpandedStudentId('202400124');
    }
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleToggleStudent = (id) => {
    setExpandedStudentId(prev => (prev === id ? null : id));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter students based on current search query
  const filteredStudents = students.filter(student => {
    const nameMatch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = student.id.includes(searchQuery);
    const fieldMatch = student.fields.some(f => 
      f.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return nameMatch || idMatch || fieldMatch;
  });

  // Dynamically compile notifications list based on scrollytelling step
  const getNotifications = () => {
    const baseNotifs = [
      { id: 2, message: 'Import completed successfully', time: '1h ago', type: 'success' },
      { id: 3, message: 'Password changed successfully', time: 'Yesterday, 10:14 PM', type: 'security' },
    ];
    if (activeStep >= 8) {
      return [
        { id: 1, message: 'Project shared with academic team', time: 'Just now', type: 'share' },
        ...baseNotifs
      ];
    }
    return baseNotifs;
  };

  return (
    <div className={`w-full bg-[#FFFFFF] dark:bg-[#0D0D0D] border border-primaryText/10 dark:border-[#557373]/30 rounded-lg shadow-xl overflow-hidden font-sans transition-colors duration-300 ${className}`}>
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-primaryText/5 dark:border-[#557373]/20 px-6 py-3 bg-[#FFFFFF] dark:bg-[#0D0D0D] select-none">
        
        {/* InfoTally Mini-Brand */}
        <div className="flex items-center gap-2">
          <div className="flex items-end gap-[2px] h-3.5">
            <span className="w-[3px] h-2.5 bg-mutedGreen dark:bg-softBlue rounded-full"></span>
            <span className="w-[3px] h-3.5 bg-mutedGreen dark:bg-softBlue rounded-full"></span>
            <span className="w-[3px] h-1.5 bg-mutedGreen dark:bg-softBlue rounded-full"></span>
          </div>
          <span className="text-xs font-bold text-primaryText dark:text-[#F2EFEA] tracking-wide">InfoTally</span>
        </div>

        {/* Global Search */}
        <div className="w-1/3 max-w-xs">
          <SearchBar placeholder="Search everything..." />
        </div>

        {/* User Notifications Profile */}
        <div className="flex items-center gap-4">
          <button 
            className="p-1 rounded text-primaryText/40 dark:text-[#F2EFEA]/40 hover:text-primaryText dark:hover:text-[#F2EFEA] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="w-6 h-6 rounded-full bg-softBlue dark:bg-darkCardBg flex items-center justify-center border border-black/5 dark:border-[#557373]/20">
            <span className="text-[10px] font-bold text-mutedGreen dark:text-[#DFE5F3]">T</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="p-6 bg-primaryBg dark:bg-[#0D0D0D] text-left">
        
        {/* Projects Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-primaryText/50 dark:text-[#F2EFEA]/50 tracking-wide uppercase select-none">
            Projects
          </h3>
          <Button 
            variant="primary" 
            size="sm" 
            icon={Plus} 
            className="px-2.5 py-1 text-xs"
            onClick={() => triggerAlert('Template Workspace Creator', 'This action will launch the template creation workspace. It is currently locked in demonstration mode.')}
          >
            New Project
          </Button>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {projects.map((project, idx) => {
            const isVisible = activeStep >= 1 || selectedProjectId === project.id;
            return isVisible ? (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={project.id === selectedProjectId}
                onClick={() => setSelectedProjectId(project.id)}
              />
            ) : (
              <div key={idx} className="border border-dashed border-primaryText/5 dark:border-[#557373]/15 rounded h-28" />
            );
          })}
        </div>

        {/* Active Project Workspace View */}
        {selectedProjectId && activeStep >= 1 ? (
          <div className="border-t border-primaryText/5 dark:border-[#557373]/20 pt-5">
            
            {/* Project Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 select-none">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA]">
                    {selectedProject.name}
                  </h3>
                  
                  {/* Dynamic scroll-linked connected source badges */}
                  {activeStep >= 2 && (
                    <Badge variant="outline" className="text-[8px] uppercase tracking-wide bg-softBlue/25 dark:bg-[#557373]/20 dark:text-softBlue">
                      MS Forms Connected
                    </Badge>
                  )}
                  {activeStep >= 3 && (
                    <Badge variant="outline" className="text-[8px] uppercase tracking-wide bg-softBlue/25 dark:bg-[#557373]/20 dark:text-softBlue">
                      Google Forms Synced
                    </Badge>
                  )}
                  {activeStep >= 4 && (
                    <Badge variant="outline" className="text-[8px] uppercase tracking-wide bg-softBlue/25 dark:bg-[#557373]/20 dark:text-softBlue">
                      Excel Imported
                    </Badge>
                  )}
                  {activeStep >= 9 && (
                    <Badge variant="default" className="text-[8px] uppercase tracking-wide">
                      Shared Workspace
                    </Badge>
                  )}
                </div>
                
                <p className="text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 mt-0.5">
                  {activeStep >= 5 ? selectedProject.recordsCount : '0'} student records synced
                </p>
              </div>

              {/* Local Search Toolbars */}
              <div className="flex items-center gap-2">
                <div className="w-48 sm:w-60">
                  <SearchBar
                    placeholder="Search within this project..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Filter} 
                  className="p-2 border-primaryText/10 dark:border-[#557373]/25 text-primaryText/50 dark:text-[#F2EFEA]/50 hover:text-primaryText dark:hover:text-[#F2EFEA]" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={LayoutGrid} 
                  className="p-2 border-primaryText/10 dark:border-[#557373]/25 text-primaryText/50 dark:text-[#F2EFEA]/50 hover:text-primaryText dark:hover:text-[#F2EFEA]" 
                />
              </div>
            </div>

            {/* Student grid + Notifications side-panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Left Column: Student Cards */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                {activeStep >= 5 ? (
                  <>
                    {filteredStudents.slice(0, 3).map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        isExpanded={expandedStudentId === student.id}
                        onToggle={() => handleToggleStudent(student.id)}
                      />
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className="text-center py-8 text-xs text-primaryText/45 dark:text-warmWhite/45 bg-warmWhite/20 dark:bg-darkCardBg border border-dashed border-primaryText/10 dark:border-[#557373]/25 rounded">
                        No records found matching "{searchQuery}"
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-xs text-primaryText/30 dark:text-[#F2EFEA]/30 border border-dashed border-primaryText/10 dark:border-[#557373]/25 rounded bg-warmWhite/10 dark:bg-[#0D0D0D]">
                    Workspace active. Connect sources to view student listings.
                  </div>
                )}
              </div>

              {/* Right Column: Notifications list */}
              <div className="border border-primaryText/5 dark:border-[#557373]/25 rounded p-4 bg-[#FFFFFF] dark:bg-[#0D0D0D] h-fit">
                <div className="flex items-center justify-between mb-3 border-b border-primaryText/5 dark:border-[#557373]/20 pb-2 select-none">
                  <h4 className="text-[10px] font-bold text-mutedGreen dark:text-softBlue tracking-wide uppercase">
                    Workspace Feed
                  </h4>
                  <button className="text-[9px] font-bold text-mutedGreen dark:text-softBlue hover:underline">
                    View all
                  </button>
                </div>
                <div className="divide-y divide-primaryText/5 dark:divide-[#557373]/15">
                  {getNotifications().map((notif) => (
                    <NotificationCard key={notif.id} notification={notif} />
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="py-20 text-center text-xs text-primaryText/30 dark:text-[#F2EFEA]/30 border border-dashed border-primaryText/10 dark:border-[#557373]/25 rounded bg-warmWhite/5 dark:bg-[#0D0D0D]">
            Select an academic project container to load workspace dashboard
          </div>
        )}

      </div>

      {/* Premium Reusable Alert Modal Portal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
};
