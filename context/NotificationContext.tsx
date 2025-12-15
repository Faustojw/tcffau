import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { AppNotification } from '../types';
import { getMyNotifications, markNotificationAsRead, markAllAsRead, checkOperatorStatus } from '../services/mockData';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Toast Component
const Toast: React.FC<{ notification: AppNotification, onClose: () => void }> = ({ notification, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClick = () => {
        if (notification.link) {
            navigate(notification.link);
        }
        onClose();
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle className="text-green-500 w-5 h-5" />;
            case 'warning': return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
            case 'error': return <AlertCircle className="text-red-500 w-5 h-5" />;
            default: return <Info className="text-blue-500 w-5 h-5" />;
        }
    };

    const getBgColor = () => {
        switch (notification.type) {
            case 'success': return 'bg-slate-800 border-green-500/50';
            case 'warning': return 'bg-slate-800 border-yellow-500/50';
            case 'error': return 'bg-slate-800 border-red-500/50';
            default: return 'bg-slate-800 border-blue-500/50';
        }
    };

    return (
        <div 
            onClick={handleClick}
            className={`fixed bottom-4 right-4 z-[100] max-w-sm w-full shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer animate-slide-up border ${getBgColor()}`}
        >
            <div className="w-0 flex-1 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        {getIcon()}
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">{notification.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-slate-700">
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  const fetchNotifications = () => {
      if (user) {
          const data = getMyNotifications(user.id, user.role);
          
          // Check for new notifications to trigger toast
          if (data.length > notifications.length && notifications.length > 0) {
              const latest = data[0];
              // Only toast if it's very recent (last 10 seconds) to avoid spam on refresh
              if (new Date(latest.timestamp).getTime() > Date.now() - 10000) {
                 setActiveToast(latest);
              }
          }
          setNotifications(data);
      } else {
          setNotifications([]);
      }
  };

  // Poll for notifications
  useEffect(() => {
    fetchNotifications(); // Initial fetch
    
    // Simulate Operator Background Check
    if (user?.role === 'operator' && user.stationId) {
        checkOperatorStatus(user.id, user.stationId);
    }

    const interval = setInterval(fetchNotifications, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (id: string) => {
      markNotificationAsRead(id);
      fetchNotifications();
  };

  const markAllRead = () => {
      if (user) {
          markAllAsRead(user.id, user.role);
          fetchNotifications();
      }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead }}>
      {children}
      {activeToast && <Toast notification={activeToast} onClose={() => setActiveToast(null)} />}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
