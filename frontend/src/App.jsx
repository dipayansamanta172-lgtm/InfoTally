import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout Imports
import { Navbar } from './components/layout/Navbar';
import { LeftNav } from './components/layout/LeftNav';
import { Footer } from './components/sections/Footer';

// Section Imports (Landing Page)
import { Hero } from './components/sections/Hero';
import { BeforeAfterShowcase } from './components/sections/BeforeAfterShowcase';
import { Features } from './components/sections/Features';
import { Workflow } from './components/sections/Workflow';
import { WhyInfoTally } from './components/sections/WhyInfoTally';
import { Security } from './components/sections/Security';
import { Preview } from './components/sections/Preview';
import { CTA } from './components/sections/CTA';

// Page Imports (Authentication & Admin Panels)
import { RequestAccess } from './components/pages/RequestAccess';
import { SignIn } from './components/pages/SignIn';
import { AdminLayout } from './components/pages/AdminLayout';
import { ForceChangePassword } from './components/pages/ForceChangePassword';
import { Workspace } from './components/pages/Workspace';

// Optimized Wrapper for sections to handle GPU-accelerated scroll fade and translate effects
const ScrollSectionWrapper = ({ children, id }) => {
  const containerRef = useRef(null);
  
  // Track scroll coordinates relative to section bounds
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'start start', 'end start']
  });

  // Map progress (0 = coming into view, 0.25 = center focus, 0.75 = leaving focus, 1 = scrolled past)
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [25, 0, 0, -25]);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.99, 1, 1, 0.99]);

  return (
    <div 
      ref={containerRef} 
      id={id} 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <motion.div 
        style={{ opacity, y, scale }} 
        className="w-full h-full flex items-center justify-center"
      >
        {children}
      </motion.div>
    </div>
  );
};

// Encapsulates the Landing Page layouts exactly as previously defined to prevent regressions
const LandingPage = () => {
  return (
    <>
      {/* Sticky Top Header */}
      <Navbar />

      {/* Fixed Left Navigation Progress Sidebar */}
      <LeftNav />

      {/* Main Sections flow */}
      <main role="main">
        {/* Hero Section */}
        <ScrollSectionWrapper id="home">
          <Hero />
        </ScrollSectionWrapper>

        {/* Before vs After Comparison */}
        <ScrollSectionWrapper id="comparison">
          <BeforeAfterShowcase />
        </ScrollSectionWrapper>

        {/* Features Section */}
        <ScrollSectionWrapper id="features">
          <Features />
        </ScrollSectionWrapper>

        {/* Storytelling Workflow Section */}
        <Workflow />

        {/* Storytelling Why InfoTally Section */}
        <WhyInfoTally />

        {/* Storytelling Security Section */}
        <Security />

        {/* Storytelling Preview Section */}
        <Preview />

        {/* CTA Get Started Section */}
        <ScrollSectionWrapper id="cta">
          <CTA />
        </ScrollSectionWrapper>
      </main>

      {/* Footer Branding */}
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="bg-primaryBg dark:bg-[#0D0D0D] min-h-screen text-primaryText dark:text-[#F2EFEA] antialiased scroll-smooth relative transition-colors duration-300">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="/sign-in" element={<SignIn />} />

          {/* Force password update on first login */}
          <Route path="/force-change-password" element={<ForceChangePassword />} />

          {/* User Panel (Workspace) */}
          <Route path="/workspace/*" element={<Workspace />} />

          {/* Protected Admin Routes (Includes sub-routing) */}
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
