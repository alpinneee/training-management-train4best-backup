import React from 'react';
import Modal from './Modal';
import Button from './button';
import { signOut } from 'next-auth/react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
  const handleLogout = async () => {
    try {
      // Call our custom logout endpoint first to clear all authentication cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Then use NextAuth signOut
      await signOut({ 
        redirect: false, 
        callbackUrl: '/login'
      });
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to direct redirect if error
      window.location.href = '/login';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-2">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Konfirmasi Logout</h2>
        <p className="text-sm text-gray-600 mb-4">
          Apakah Anda yakin ingin keluar dari aplikasi ini?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="gray"
            size="small"
            onClick={onClose}
            className="text-xs px-3 py-1.5"
          >
            Batal
          </Button>
          <Button
            variant="red"
            size="small"
            onClick={handleLogout}
            className="text-xs px-3 py-1.5"
          >
            Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal; 