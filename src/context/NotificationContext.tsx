import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Toast } from '../components/UI/Toast';

interface NotificationContextType {
  showNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = useCallback((msg: string) => {
    setMessage(msg);
    setIsVisible(true);
  }, []);

  const hideNotification = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Toast 
        message={message} 
        isVisible={isVisible} 
        onClose={hideNotification} 
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
