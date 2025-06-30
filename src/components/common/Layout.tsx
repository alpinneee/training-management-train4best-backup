'use client';

import { FC, useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";
// import Footer from './Footer'; tidak terpakai

export interface LayoutProps {
  children: React.ReactNode;
  variant?: 'admin' | 'participant' | 'instructure';
}

const Layout: FC<LayoutProps> = ({ children, variant }) => {
  // Tambahkan state untuk mobile sidebar
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // State untuk jenis layout berdasarkan path
  const [detectedVariant, setDetectedVariant] = useState<'admin' | 'participant' | 'instructure'>('admin');
  const pathname = usePathname();

  // Deteksi jenis layout berdasarkan pathname
  useEffect(() => {
    if (pathname) {
      if (pathname.startsWith('/participant')) {
        setDetectedVariant('participant');
      } else if (pathname.startsWith('/instructure') || pathname.startsWith('/instructor')) {
        setDetectedVariant('instructure');
      } else {
        setDetectedVariant('admin');
      }
    }
  }, [pathname]);

  // Gunakan variant dari props jika ada, atau gunakan detectedVariant
  const activeVariant = variant || detectedVariant;

  const handleMobileOpen = () => {
    console.log("Toggle mobile menu");
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMobileMenuClick={handleMobileOpen} />
      <div className="flex flex-1">
        <Sidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => {
            setIsMobileOpen(false);
            document.body.style.overflow = 'auto';
          }}
          variant={activeVariant}
        />
        <main className="flex-1 p-4 bg-gray-50">{children}</main>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default Layout;
