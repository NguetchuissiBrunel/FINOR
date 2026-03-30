import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-title-container mb-4">{title}</div>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};
