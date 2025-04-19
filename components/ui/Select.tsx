import React, { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <select
        ref={ref}
        onChange={handleChange}
        className={`block w-full rounded-medium min-h-10 h-10 shadow-sm px-3 bg-default-100 
        hover:bg-default-200 focus:bg-default-100 focus:outline-none focus:ring-2 
        focus:ring-focus focus:ring-offset-2 focus:ring-offset-background 
        border border-default-200 transition-colors duration-150 ${className || ''}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select; 