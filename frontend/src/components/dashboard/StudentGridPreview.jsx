import React, { useState } from 'react';
import { StudentCard } from './StudentCard';
import { Button } from '../ui/Button';
import { ChevronDown } from 'lucide-react';
import { AlertModal } from '../ui/AlertModal';

export const StudentGridPreview = ({
  students = [],
  searchQuery = '',
}) => {
  const [expandedId, setExpandedId] = useState(null);

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

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Safe search queries filtering
  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = student.name.toLowerCase().includes(query);
    const fieldMatch = student.fields.some((field) => 
      field.value.toLowerCase().includes(query)
    );
    return nameMatch || fieldMatch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            isExpanded={expandedId === student.id}
            onToggle={() => handleToggle(student.id)}
          />
        ))}
      </div>

      {/* Load More Trigger */}
      {filteredStudents.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronDown}
            className="text-[10px] font-bold tracking-wider uppercase py-2 px-4 border border-black/5 dark:border-[#557373]/25 dark:text-[#F2EFEA]"
            onClick={() => triggerAlert('Roster Data Sync', 'Connecting to secure university forms and syncing additional database rows...')}
          >
            Load more students
          </Button>
        </div>
      )}

      {filteredStudents.length === 0 && (
        <div className="text-center py-10 text-xs text-primaryText/45 dark:text-warmWhite/45 bg-warmWhite/20 dark:bg-[#0D0D0D]/20 border border-dashed border-primaryText/10 dark:border-[#557373]/20 rounded">
          No students found matching your query.
        </div>
      )}

      {/* Premium Reusable Alert Modal Portal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        type="alert"
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
};
