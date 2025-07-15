'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

type LayoutVariant = 'admin' | 'participant' | 'instructure';

interface LayoutContextType {
  variant: LayoutVariant;
  setVariant: (variant: LayoutVariant) => void;
  detectUserType: () => Promise<void>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [variant, setVariant] = useState<LayoutVariant>('admin');

  // Function to detect user type from API
  const detectUserType = async () => {
    try {
      const res = await fetch('/api/user/current');
      if (!res.ok) return;
      
      const data = await res.json();
      if (!data.data?.userType) return;
      
      // Convert userType from API to layout variant
      const userType = data.data.userType.toLowerCase();
      
      if (userType === 'participant') {
        setVariant('participant');
      } else if (userType === 'instructor' || userType === 'instructure') {
        setVariant('instructure');
      } else if (userType === 'admin' || userType === 'super_admin') {
        setVariant('admin');
      }
    } catch (error) {
      console.error('Error detecting user type:', error);
    }
  };

  // Detect user type on component mount
  useEffect(() => {
    detectUserType().catch(err => {
      console.error('Failed to detect user type:', err);
    });
  }, []);

  return (
    <LayoutContext.Provider value={{ variant, setVariant, detectUserType }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}; 