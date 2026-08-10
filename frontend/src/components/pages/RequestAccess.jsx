import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const RequestAccess = () => {
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [agree, setAgree] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const tempErrors = {};
    if (!fullName.trim()) tempErrors.fullName = 'Full Name is required';
    if (!institution.trim()) tempErrors.institution = 'Institution name is required';
    if (!department.trim()) tempErrors.department = 'Department name is required';
    
    // Email checks
    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        tempErrors.email = 'Enter a valid email address';
      }
    }

    if (!purpose.trim()) tempErrors.purpose = 'Purpose explanation is required';
    if (!description.trim()) tempErrors.description = 'Personal description is required';
    if (!agree) tempErrors.agree = 'You must agree to the privacy policy';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    const payload = {
      fullName,
      institution,
      department,
      designation,
      email,
      phone,
      purpose,
      description
    };

    const res = await apiService.requestAccess(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitSuccess(true);
    } else {
      setApiError(res.message || 'An error occurred during submission.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-primaryBg dark:bg-[#0D0D0D] font-sans relative">
      
      {/* Back button home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-primaryText/60 dark:text-[#F2EFEA]/60 hover:text-primaryText dark:hover:text-[#F2EFEA] transition-colors z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      {/* Left side: Premium branding & Quote Area */}
      <div className="lg:col-span-5 bg-warmWhite dark:bg-darkCardBg border-r border-primaryText/5 dark:border-[#557373]/20 p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden select-none">
        
        {/* Subtle abstract graphics (strictly no people or emojis) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gradient-grid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#557373" />
                <stop offset="100%" stopColor="#DFE5F3" />
              </linearGradient>
            </defs>
            <circle cx="20%" cy="80%" r="200" fill="url(#gradient-grid)" />
            <circle cx="80%" cy="20%" r="150" fill="url(#gradient-grid)" />
          </svg>
        </div>

        <div className="my-auto flex flex-col gap-8 relative z-10 text-left">
          {/* Logo brand */}
          <div className="flex items-end gap-[3px] h-4 mb-4">
            <span className="w-[3px] h-2.5 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
            <span className="w-[3px] h-4 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
            <span className="w-[3px] h-1.5 bg-mutedGreen dark:bg-softBlue rounded-sm"></span>
            <span className="text-xs font-bold font-sans text-primaryText dark:text-[#F2EFEA] tracking-wider ml-1">InfoTally</span>
          </div>

          <blockquote className="space-y-4">
            <h1 className="text-4xl lg:text-[44px] font-serif italic font-bold text-primaryText dark:text-[#F2EFEA] leading-[1.12] tracking-tight">
              "The details of academic data coordination deserve elegance."
            </h1>
            <cite className="block text-xs font-bold text-mutedGreen dark:text-softBlue uppercase tracking-widest mt-4">
              — Academic Workspace Initiative
            </cite>
          </blockquote>
          
          <p className="text-xs lg:text-sm text-primaryText/60 dark:text-[#F2EFEA]/60 leading-relaxed max-w-sm mt-4 font-normal">
            InfoTally provides a clean, secure portal for universities and colleges to organize survey records, map student rosters, and run centralized search operations.
          </p>
        </div>

        <div className="text-[10px] text-primaryText/40 dark:text-[#F2EFEA]/45 relative z-10 text-left font-mono">
          InfoTally Core Framework v1.4.0
        </div>
      </div>

      {/* Right side: Modern Form panel */}
      <div className="lg:col-span-7 p-8 lg:p-20 flex items-center justify-center bg-primaryBg dark:bg-[#0D0D0D]">
        
        {submitSuccess ? (
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6 p-8 bg-warmWhite/40 dark:bg-darkCardBg border border-primaryText/5 dark:border-[#557373]/25 rounded-[20px] shadow-lg">
            <div className="w-12 h-12 rounded-full bg-softBlue dark:bg-darkCardBg border border-mutedGreen/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-mutedGreen dark:text-softBlue" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-primaryText dark:text-[#F2EFEA]">
                Request Access Submitted
              </h2>
              <p className="text-xs text-primaryText/60 dark:text-[#F2EFEA]/60 mt-3 leading-relaxed">
                Thank you for applying. Your application has been logged. An email containing temporary login details will be dispatched upon administrative validation.
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full text-xs font-bold tracking-wider py-2.5 uppercase mt-2 rounded"
              onClick={() => navigate('/')}
            >
              Back to Homepage
            </Button>
          </div>
        ) : (
          <div className="max-w-xl w-full bg-primaryBg dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 p-8 lg:p-10 rounded-[20px] shadow-lg text-left">
            <div className="mb-8">
              <h2 className="text-2xl font-serif font-bold text-primaryText dark:text-[#F2EFEA]">
                Request System Access
              </h2>
              <p className="text-xs text-primaryText/45 dark:text-[#F2EFEA]/45 mt-1 leading-snug">
                Fill in the academic details below to request access. Fields marked with * are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="access-fullname"
                  label="Full Name *"
                  placeholder="Dr. Divyash Samanta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={errors.fullName}
                />
                <Input
                  id="access-institution"
                  label="Institution / University *"
                  placeholder="National Institute of Technology"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  error={errors.institution}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="access-department"
                  label="Department *"
                  placeholder="Computer Science & Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  error={errors.department}
                />
                <Input
                  id="access-designation"
                  label="Designation (Optional)"
                  placeholder="Associate Professor"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="access-email"
                  label="Institutional Email *"
                  type="email"
                  placeholder="divyash@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />
                <Input
                  id="access-phone"
                  label="Phone Number (Optional)"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5 font-sans">
                <label htmlFor="access-purpose" className="text-[11px] font-bold text-mutedGreen tracking-wider uppercase">
                  Why do you need InfoTally? *
                </label>
                <textarea
                  id="access-purpose"
                  rows={2}
                  className={`w-full bg-primaryBg dark:bg-darkCardBg border ${
                    errors.purpose 
                      ? 'border-mutedGreen dark:border-softBlue focus-visible:outline-mutedGreen dark:focus-visible:outline-softBlue' 
                      : 'border-primaryText/10 dark:border-[#557373]/25 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue'
                  } rounded px-3.5 py-2 text-sm text-primaryText dark:text-[#F2EFEA] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-0 placeholder-primaryText/30 dark:placeholder-[#F2EFEA]/30 transition-all duration-150`}
                  placeholder="State the academic purpose or survey mapping objectives..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
                {errors.purpose && (
                  <span className="text-xs text-mutedGreen dark:text-softBlue font-bold mt-0.5" role="alert">
                    ⚠ {errors.purpose}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 font-sans">
                <label htmlFor="access-desc" className="text-[11px] font-bold text-mutedGreen tracking-wider uppercase">
                  Tell us about yourself *
                </label>
                <textarea
                  id="access-desc"
                  rows={2}
                  className={`w-full bg-primaryBg dark:bg-darkCardBg border ${
                    errors.description 
                      ? 'border-mutedGreen dark:border-softBlue focus-visible:outline-mutedGreen dark:focus-visible:outline-softBlue' 
                      : 'border-primaryText/10 dark:border-[#557373]/25 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue'
                  } rounded px-3.5 py-2 text-sm text-primaryText dark:text-[#F2EFEA] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-0 placeholder-primaryText/30 dark:placeholder-[#F2EFEA]/30 transition-all duration-150`}
                  placeholder="Academic background, experience, or coordinator status..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && (
                  <span className="text-xs text-mutedGreen dark:text-softBlue font-bold mt-0.5" role="alert">
                    ⚠ {errors.description}
                  </span>
                )}
              </div>

              {/* Policy Checkbox */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="w-4 h-4 rounded border-primaryText/15 dark:border-[#557373]/25 text-mutedGreen dark:text-softBlue focus:ring-0 cursor-pointer mt-0.5"
                  />
                  <span className="text-xs text-primaryText/60 dark:text-[#F2EFEA]/60 leading-normal font-sans">
                    I agree to the privacy policy and data governance terms.
                  </span>
                </label>
                {errors.agree && (
                  <span className="text-xs text-mutedGreen dark:text-softBlue font-bold block" role="alert">
                    ⚠ {errors.agree}
                  </span>
                )}
              </div>

              {apiError && (
                <div className="text-xs text-mutedGreen dark:text-softBlue font-bold">
                  ⚠ {apiError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full text-xs font-bold tracking-wider py-3 mt-2 uppercase rounded"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering request...' : 'Request Access'}
              </Button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};
