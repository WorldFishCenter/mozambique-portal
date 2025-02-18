import { useEffect } from 'react';

export const useTooltip = () => {
  useEffect(() => {
    // Initialize tooltips with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      [...tooltipTriggerList].map(
        tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl)
      );
    }, 100);

    // Cleanup tooltips on unmount
    return () => {
      clearTimeout(timer);
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipTriggerList.forEach(tooltipTriggerEl => {
        const tooltip = window.bootstrap.Tooltip.getInstance(tooltipTriggerEl);
        if (tooltip) {
          tooltip.dispose();
        }
      });
    };
  }, []);
};
