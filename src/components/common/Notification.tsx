"use client";

import React from 'react';
import { useNotification } from '@/context/NotificationContext';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Notification: React.FC = () => {
  const { notification } = useNotification();

  if (!notification?.isVisible) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-white" />,
    error: <XCircle className="w-5 h-5 text-white" />,
    warning: <AlertCircle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />
  };

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          ${bgColors[notification.type]}
          flex items-center gap-2 px-4 py-2 rounded-lg
          transform transition-all duration-300 ease-in-out
          animate-slide-in
        `}
      >
        {icons[notification.type]}
        <p className="text-white text-sm font-medium">
          {notification.message}
        </p>
      </div>
    </div>
  );
};

export default Notification; 