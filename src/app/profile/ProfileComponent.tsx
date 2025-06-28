'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Layout from '@/components/common/Layout';

// Define types
interface UserData {
  name: string;
  email: string;
  role: string;
}

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birthDate: string;
  jobTitle: string;
  company: string;
  profiency: string;
}

interface DebugInfo {
  sessionStatus: string;
  sessionData: any;
  profileData: any;
  error: string | null;
  emailToUse?: string | null;
}

export default function ProfileComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [isEditing, setIsEditing] = useState(true); // Selalu edit mode
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    birthDate: '',
    jobTitle: '',
    company: '',
    profiency: '',
  });
  
  // Check if user has completed profile
  const [profileComplete, setProfileComplete] = useState(true);
  
  // Add loading state to better handle session loading
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug state untuk melihat data yang diambil
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    sessionStatus: '',
    sessionData: null,
    profileData: null,
    error: null
  });

  // Initialize form data from localStorage on client-side only
  useEffect(() => {
    const initialEmail = localStorage.getItem('userEmail') || '';
    const initialName = localStorage.getItem('username') || '';
    
    setFormData(prev => ({
      ...prev,
      fullName: initialName,
      email: initialEmail
    }));
    
    loadProfileData();
  }, [session, status]);
  
  // Function to load profile data
  const loadProfileData = async () => {
    // Try to get email from URL first
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    // Try to get email from various sources
    let emailToUse = emailParam;
    
    // Check cookies first (direct login)
    if (!emailToUse) {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const cookieEmail = getCookie('userEmail');
      if (cookieEmail) {
        emailToUse = decodeURIComponent(cookieEmail);
        console.log("Using email from cookie:", emailToUse);
        
        // Store in localStorage for persistence
        localStorage.setItem('userEmail', emailToUse);
      }
    }
    
    // Try localStorage next
    if (!emailToUse) {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        emailToUse = userEmail;
        console.log("Using email from localStorage:", emailToUse);
      }
    }
    
    // Try session last
    if (!emailToUse && session?.user?.email) {
      emailToUse = session.user.email;
      console.log("Using email from session:", emailToUse);
      
      // If we have userType in session, store it in localStorage
      if (session.user.userType) {
        localStorage.setItem('userType', session.user.userType);
        console.log("Stored userType in localStorage:", session.user.userType);
      }
    }
    
    // Try admin email from localStorage
    if (!emailToUse) {
      const adminEmail = localStorage.getItem("admin_email");
      if (adminEmail) {
        emailToUse = adminEmail;
        console.log("Using admin email from localStorage:", emailToUse);
        
        // Store admin role in localStorage
        localStorage.setItem('userType', 'Admin');
      }
    }
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      sessionStatus: status,
      sessionData: session,
      emailToUse
    }));
    
    if (!emailToUse) {
      console.log("No email found to fetch profile data");
      setIsLoading(false);
      setDebugInfo(prev => ({
        ...prev,
        error: "No email found to fetch profile data"
      }));
      return;
    }
    
    try {
      console.log("Fetching profile data for email:", emailToUse);
      
      // Determine the endpoint based on user role
      const userType = localStorage.getItem('userType') || '';
      const isInstructor = userType.toLowerCase().includes('instruct');
      const endpoint = isInstructor 
        ? `/api/instructure/get?email=${encodeURIComponent(emailToUse)}`
        : `/api/profile/get?email=${encodeURIComponent(emailToUse)}`;
      
      console.log("Using endpoint:", endpoint);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error("Failed to fetch profile:", response.status);
        setIsLoading(false);
        setDebugInfo(prev => ({
          ...prev,
          error: `Failed to fetch profile: ${response.status}`
        }));
        return;
      }
      
      const result = await response.json();
      console.log("Profile data retrieved:", JSON.stringify(result, null, 2));
      
      setDebugInfo(prev => ({
        ...prev,
        profileData: result
      }));
      
      if (result.data) {
        if (isInstructor) {
          // Update form data with retrieved instructure data
          const instructureData = {
            fullName: result.data.full_name || result.data.name || session?.user?.name || '',
            email: result.data.email || emailToUse || '',
            phone: result.data.phone_number || '',
            address: result.data.address || '',
            gender: '',
            birthDate: '',
            jobTitle: '',
            company: '',
            profiency: result.data.profiency || '',
          };
          
          console.log("Setting instructure form data:", JSON.stringify(instructureData, null, 2));
          setFormData(instructureData);
          
          // Store user type in localStorage
          localStorage.setItem('userType', 'Instructure');
          
          // Check if profile is complete for instructure
          const hasAllRequiredFields = 
            !!instructureData.fullName && 
            !!instructureData.phone && 
            !!instructureData.address && 
            !!instructureData.profiency;
          
          console.log("Instructure profile completeness:", {
            hasAllRequiredFields,
            hasProfile: result.data.hasProfile || false
          });
          
          // Set profile complete status and editing mode
          const isComplete = hasAllRequiredFields && result.data.hasProfile;
          setProfileComplete(isComplete);
          setIsEditing(!isComplete);
          
          // Also check localStorage for manual override
          const hasProfileFlag = localStorage.getItem('hasProfile');
          if (hasProfileFlag === 'true') {
            setProfileComplete(true);
            setIsEditing(false);
          }
        } else {
          // Update form data with retrieved participant data
          setFormData({
            fullName: result.data.fullName || result.data.name || session?.user?.name || '',
            email: result.data.email || emailToUse || '',
            phone: result.data.phone_number || '',
            address: result.data.address || '',
            gender: result.data.gender || '',
            birthDate: result.data.birth_date ? new Date(result.data.birth_date).toISOString().split('T')[0] : '',
            jobTitle: result.data.job_title || '',
            company: result.data.company || '',
            profiency: '',
          });
          
          // Check if profile is complete
          const requiredFields = ['fullName', 'gender', 'phone_number', 'address', 'birth_date'];
          const hasCompleteProfile = requiredFields.every(field => !!result.data[field]);
          
          setProfileComplete(hasCompleteProfile && result.data.hasProfile);
          setIsEditing(!hasCompleteProfile || !result.data.hasProfile);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading profile:", error);
      setIsLoading(false);
      setDebugInfo(prev => ({
        ...prev,
        error: `Error loading profile: ${error}`
      }));
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
        {isLoading ? (
          <div>Loading profile data...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div>
                    <strong>Name:</strong> {formData.fullName}
                  </div>
                  <div>
                    <strong>Email:</strong> {formData.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {formData.phone}
                  </div>
                  <div>
                    <strong>Address:</strong> {formData.address}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
} 