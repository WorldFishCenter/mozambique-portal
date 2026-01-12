import { useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

/**
 * @typedef {Object} InfoButtonProps
 * @property {string} title - The tooltip title
 * @property {string} content - The tooltip content
 * @property {'auto' | 'top' | 'bottom' | 'left' | 'right'} [placement='bottom'] - Tooltip placement
 */

/**
 * Reusable info button component with custom styled tooltip
 * Displays explanatory information in a tooltip when hovered
 * @param {InfoButtonProps} props
 */
const InfoButton = ({ title, content, placement = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        className="btn btn-icon btn-ghost-secondary ms-2"
        aria-label="More information"
      >
        <IconInfoCircle size={20} stroke={1.5} />
      </button>

      {isVisible && (
        <div
          className="card shadow-lg"
          style={{
            position: 'absolute',
            zIndex: 1050,
            minWidth: '250px',
            maxWidth: '350px',
            opacity: 0.9,
            backdropFilter: 'blur(8px)',
            ...(placement === 'bottom' && {
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }),
            ...(placement === 'top' && {
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }),
            ...(placement === 'left' && {
              right: 'calc(100% + 8px)',
              top: '50%',
              transform: 'translateY(-50%)',
            }),
            ...(placement === 'right' && {
              left: 'calc(100% + 8px)',
              top: '50%',
              transform: 'translateY(-50%)',
            }),
          }}
        >
          <div className="card-body p-3">
            <h4 className="card-title mb-2">{title}</h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
              {content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoButton;
