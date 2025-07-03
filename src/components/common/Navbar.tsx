"use client";

import React, { FC, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import LogoutModal from "./LogoutModal";

interface NavbarProps {
  onMobileMenuClick: () => void;
}

const Navbar: FC<NavbarProps> = ({ onMobileMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    email: ""
  });

  useEffect(() => {
    // Fungsi untuk mendapatkan data pengguna dari berbagai sumber
    const getUserData = async () => {
      console.log("Getting user data, session status:", status);
      console.log("Session data:", session);
      
      // 1. Coba dari session (next-auth)
      if (session?.user) {
        console.log("Using data from session:", session.user);
        setUserData({
          name: session.user.name || "User",
          role: session.user.userType || "User",
          email: session.user.email || ""
        });
        return;
      }

      // 2. Coba dari localStorage untuk participant
      const userEmail = localStorage.getItem("userEmail");
      const username = localStorage.getItem("username");
      
      if (username && userEmail) {
        console.log("Using data from localStorage participant:", { username, userEmail });
        setUserData({
          name: username,
          role: "Participant",
          email: userEmail
        });
        return;
      }
      
      // 3. Coba dari localStorage (untuk admin)
      const adminEmail = localStorage.getItem("admin_email");
      const adminTimestamp = localStorage.getItem("admin_login_timestamp");
      if (adminEmail && adminTimestamp) {
        console.log("Using data from localStorage admin:", { adminEmail, adminTimestamp });
        setUserData({
          name: adminEmail.split('@')[0] || "Admin",
          role: "Admin",
          email: adminEmail
        });
        return;
      }

      // 4. Coba dari API
      try {
        console.log("Fetching user data from API");
        const response = await fetch('/api/auth/session-check');
        const data = await response.json();
        console.log("API response:", data);
        
        if (data.valid && data.user) {
          console.log("Using data from API:", data.user);
          setUserData({
            name: data.user.name || "User",
            role: data.user.userType || "User",
            email: data.user.email || ""
          });
          return;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      // 5. Try to get user info from API using stored email
      if (userEmail) {
        try {
          const response = await fetch(`/api/user/info?email=${encodeURIComponent(userEmail)}`);
          const data = await response.json();
          
          if (data && data.username) {
            console.log("Using data from user info API:", data);
            
            // Cek apakah ini admin berdasarkan email atau data lainnya
            const isAdmin = localStorage.getItem("admin_email") === userEmail;
            
            setUserData({
              name: data.username,
              role: isAdmin ? "Admin" : (data.userType || "Participant"),
              email: userEmail
            });
            
            // Save username to localStorage
            localStorage.setItem('username', data.username);
            return;
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }

      // 6. Fallback ke nilai default jika semua gagal
      console.log("Using fallback data");
      setUserData({
        name: "User",
        role: "Guest",
        email: ""
      });
    };

    getUserData();
  }, [session, status]);

  // Fungsi untuk menampilkan modal logout
  const handleLogoutClick = () => {
    setIsProfileOpen(false); // Tutup dropdown
    setIsLogoutModalOpen(true); // Buka modal logout
  };

  return (
    <>
      <nav className="bg-[#362d98] text-white py-2 px-4 mt-3 mx-4 rounded-2xl shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Bagian kiri - Menu & Logo */}
            <div className="flex items-center gap-4">
              {/* Tombol Menu */}
              <button
                onClick={onMobileMenuClick}
                className="lg:hidden p-2 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center">
                <Image
                  src="/img/LogoT4B.png"
                  alt="Train4best Logo"
                  width={100}
                  height={16}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Navigation Links */}
            {/* <div className="flex items-center space-x-6">
              <Link 
                href="/application" 
                className="hover:text-gray-200 text-sm font-medium transition-colors hover:bg-indigo-700/50 px-4 py-2 rounded-xl"
              >
                Application
              </Link>
              <Link 
                href="/dashboard" 
                className="hover:text-gray-200 text-sm font-medium transition-colors hover:bg-indigo-700/50 px-4 py-2 rounded-xl"
              >
                Dashboard
              </Link>
            </div> */}

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center space-x-6">
              {/* Notifications */}
              {/* <button className="relative hover:text-gray-200 transition-colors p-2 hover:bg-indigo-700/50 rounded-xl">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium">
                  2
                </span>
              </button> */}

              {/* Profile with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        {userData.name ? (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {userData.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <Image
                            src="/img/profile.png"
                            alt="Default"
                            width={20}
                            height={20}
                            className="object-cover"
                          />
                        )}
                      </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#362d98] rounded-2xl shadow-lg overflow-hidden z-50 border border-white/10">
                    <div className="px-4 py-3 border-b border-indigo-600/30">
                      <p className="font-semibold text-sm">{userData.name}</p>
                      <p className="text-xs text-gray-300">{userData.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2.5 hover:bg-indigo-600/30 border-b border-indigo-600/30 transition-colors"
                    >
                      <span className="text-sm">Profile</span>
                    </Link>


                    <Link
                      href="/reset-password"
                      className="flex items-center px-4 py-2.5 hover:bg-indigo-600/30 border-b border-indigo-600/30 transition-colors"
                    >
                      <span className="text-sm">Reset Password</span>
                    </Link>

                    <Link
                      href="/help"
                      className="flex items-center px-4 py-2.5 hover:bg-indigo-600/30 border-b border-indigo-600/30 transition-colors"
                    >
                      <span className="text-sm">Help</span>
                    </Link>

                    <button 
                      onClick={handleLogoutClick}
                      className="flex items-center w-full px-4 py-2.5 hover:bg-indigo-600/30 text-left transition-colors"
                    >
                      <span className="text-sm">Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal Logout */}
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
