import React from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = '' }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="loop loop-1"></div>
        <div className="loop loop-2"></div>
        <div className="loop loop-3"></div>
      </div>
      <div className="loading-text">
        {message}
        <span className="dot-1">.</span>
        <span className="dot-2">.</span>
        <span className="dot-3">.</span>
      </div>
    </div>
  );
};
