export const sectionFadeVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.98,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export const stepFadeVariants = {
  hidden: { opacity: 0.3, y: 10 },
  active: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  inactive: {
    opacity: 0.3,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};
