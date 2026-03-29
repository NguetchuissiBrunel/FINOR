import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="card-title text-gold mb-4">{title}</h3>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};
