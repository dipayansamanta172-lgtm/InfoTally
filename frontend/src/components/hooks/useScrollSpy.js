import { useState, useEffect } from 'react';

/**
 * Custom hook to detect the active section based on vertical scroll offset.
 * @param {Array<string>} sectionIds - List of DOM element IDs to monitor.
 * @param {number} [offset] - Viewport offset adjustment in pixels. Defaults to window.innerHeight / 2 (center).
 * @returns {string} The active section ID.
 */
export function useScrollSpy(sectionIds, offset) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      // Compute center offset dynamically if not explicitly specified
      const currentOffset = offset !== undefined ? offset : (window.innerHeight / 2);
      const scrollPosition = window.scrollY + currentOffset;

      // Loop through sections and check offset boundaries
      let currentActive = sectionIds[0] || '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentActive = id;
            break;
          } else if (scrollPosition >= top) {
            currentActive = id; // Fallback if scrolling past the end
          }
        }
      }

      if (currentActive !== activeId) {
        setActiveId(currentActive);
      }
    };

    // Attach passive scroll listener for high FPS performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionIds, offset, activeId]);

  return activeId;
}
