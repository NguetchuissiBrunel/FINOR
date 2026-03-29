import { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, isVisible, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className="toast-container animation-slide-up">
      <div className="toast-content">
        <span className="toast-icon">✨</span>
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>&times;</button>
      </div>
    </div>
  );
};
