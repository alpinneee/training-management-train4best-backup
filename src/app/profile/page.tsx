'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Import the actual profile component with no SSR
const ProfileComponent = dynamic(() => import('./ProfileComponent'), {
  ssr: false
});

export default function ProfilePage() {
  return (
    <div>
      <ProfileComponent />
    </div>
  );
}
