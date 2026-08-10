export const textEntranceVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

export const dashboardEntranceVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 25 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};
