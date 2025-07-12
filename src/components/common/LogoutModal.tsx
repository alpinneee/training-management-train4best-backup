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
      // Clear ALL localStorage items related to login
      localStorage.removeItem("admin_login_timestamp");
      localStorage.removeItem("admin_email");
      localStorage.removeItem("instructure_login_timestamp");
      localStorage.removeItem("instructure_email");
      localStorage.removeItem("participant_login_timestamp");
      localStorage.removeItem("participant_email");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userType");
      localStorage.removeItem("username");
      localStorage.removeItem("hasProfile");
      // Atau gunakan localStorage.clear() jika ingin hapus semua
      // localStorage.clear();
      // Call our custom logout endpoint first to clear all cookies
      await fetch('/api/auth/logout');
      // Then use NextAuth signOut with redirect: false untuk mencegah halaman signout default
      await signOut({ redirect: false });
      // Redirect manual ke halaman login
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout error:", error);
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