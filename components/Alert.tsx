import React from 'react';

interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, children, className = '', onDismiss }) => {
  const baseClasses = 'p-4 mb-4 rounded-md';
  let typeClasses = '';

  switch (type) {
    case 'success':
      typeClasses = 'bg-green-50 text-green-800 border border-green-200';
      break;
    case 'warning':
      typeClasses = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      break;
    case 'error':
      typeClasses = 'bg-red-50 text-red-800 border border-red-200';
      break;
    case 'info':
    default:
      typeClasses = 'bg-blue-50 text-blue-800 border border-blue-200';
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses} ${className}`} role="alert">
      <div className="flex items-center justify-between">
        <div className="flex-1">{children}</div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Dismiss"
          >
            <span className="text-xl">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert; 