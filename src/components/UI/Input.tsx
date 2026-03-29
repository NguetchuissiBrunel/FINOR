import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  id, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <input 
        id={id}
        className={`form-input ${className} ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="text-error text-sm mt-1">{error}</span>}
    </div>
  );
};
