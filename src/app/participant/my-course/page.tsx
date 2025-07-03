'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/common/Layout';
import CourseCard from '@/components/course/CourseCard';
import Modal from '@/components/common/Modal';
import { useRouter } from 'next/navigation';

// Define interfaces for type safety
interface CourseType {
  course_type: string;
}

interface CourseInfo {
  course_name: string;
  courseType: CourseType;
  image?: string;
}

interface Course {
  id: string;
  quota: number;
  price: number;
  status: string;
  start_date: Date;
  end_date: Date;
  location: string;
  room: string;
  availableSlots: number;
  course: CourseInfo;
  imageUrl?: string;
}

interface SelectedCourse {
  id: string;
  title: string;
  className: string;
}

interface UserInfo {
  email: string;
  username: string;
  fullName: string;
}

interface RegistrationResult {
  registrationId: string;
  course: string;
  className: string;
  payment: number;
  paymentStatus: string;
  referenceNumber: string;
  courseScheduleId?: string;
  userInfo?: UserInfo;
  bankAccounts?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }[];
}

export default function MyCoursePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<React.ReactNode>('');
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [checkingLoginStatus, setCheckingLoginStatus] = useState(true);
  const [isDbConfigured, setIsDbConfigured] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentStep, setPaymentStep] = useState(1); // 1: Register, 2: Upload bukti
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<{[key: string]: string}>({});
  const [paidRegistrations, setPaidRegistrations] = useState<{[key: string]: boolean}>({});
  const [pendingRegistrationId, setPendingRegistrationId] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<{bankName: string; accountNumber: string; accountName: string}[]>([]);
  
  // Email validation function
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Validate email input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualEmail(value);
    
    if (value && !isValidEmail(value)) {
      setEmailError('Invalid email. Use format: example@domain.com');
    } else {
      setEmailError('');
    }
  };
  
  // Definisikan fetchAvailableCourses sebagai useCallback agar bisa dipanggil dari luar useEffect
  const fetchAvailableCourses = useCallback(async () => {
    setLoading(true);
    try {
      // Always attempt to fetch courses
      console.log('Mengambil data kursus yang tersedia...');
      const response = await fetch(`/api/course/available?limit=10&_=${new Date().getTime()}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        // Cek apakah error karena database belum dikonfigurasi
        if (response.status === 500 && errorData.includes('database')) {
          setIsDbConfigured(false);
          throw new Error('Database belum dikonfigurasi');
        }
        throw new Error(`Gagal mengambil kursus: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if there's login info in the response
      if (data.meta && data.meta.user) {
        setUserEmail(data.meta.user.email || '');
        setUserName(data.meta.user.name || data.meta.user.username || '');
        setIsLoggedIn(true);
      }
      
      if (data.data && Array.isArray(data.data)) {
        // Format data untuk memastikan semua data yang dibutuhkan tersedia
        const formattedCourses = data.data.map((course: any) => {
          // Pastikan course memiliki semua property yang dibutuhkan
          return {
            id: course.id,
            quota: course.quota || 0,
            price: course.price || 0,
            status: course.status || 'Active',
            start_date: course.start_date || new Date(),
            end_date: course.end_date || new Date(),
            location: course.location || 'Unknown',
            room: course.room || 'TBD',
            availableSlots: course.availableSlots || 0,
            course: {
              course_name: course.course?.course_name || `Course ${course.id.substring(0, 5)}`,
              courseType: {
                course_type: course.course?.courseType?.course_type || 'Technical'
              },
              image: course.course?.image || '/default-course.jpg'
            }
          };
        });
        
        setCourses(formattedCourses);
        setError(null);
        setIsDbConfigured(true);
      } else {
        throw new Error('Received invalid data format from API');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      
      if (err instanceof Error && err.message.includes('Database belum dikonfigurasi')) {
        setIsDbConfigured(false);
        setError('Database belum dikonfigurasi. Silakan klik tombol "Konfigurasi Database" di bawah.');
      } else {
        // Remove dummy data and just show error
        setError('Gagal memuat kursus dari server. Silakan coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Setup database
  const setupDatabase = async () => {
    setConfiguring(true);
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode: 'minimal' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsDbConfigured(true);
        
        // Simpan email demo user untuk demo yang lebih seamless
        localStorage.setItem('userEmail', 'demo@example.com');
        
        // Reload kursus setelah database dikonfigurasi
        fetchAvailableCourses();
        // Force refresh komponen dengan mengubah key
        setRefreshKey(prev => prev + 1);
        alert('Database berhasil dikonfigurasi!');
        // Force reload halaman 
        window.location.reload();
      } else {
        const error = await response.text();
        console.error('Error configuring database:', error);
        alert('Gagal mengkonfigurasi database. Lihat konsol untuk detail.');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      alert('Terjadi kesalahan saat mengkonfigurasi database.');
    } finally {
      setConfiguring(false);
    }
  };
  
  // Ambil data kursus dan user yang tersedia saat komponen dimuat
  useEffect(() => {
    // Get user profile information from session
    const getUserProfile = async () => {
      setCheckingLoginStatus(true);
      try {
        console.log('Memeriksa status login user...');
        
        // Try multiple methods to detect login status
        
        // Method 1: Try to get from session endpoint first (prioritas utama)
        try {
          const userResponse = await fetch('/api/user/current');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            if (userData.data && userData.data.email) {
              setUserEmail(userData.data.email);
              setUserName(userData.data.username || userData.data.name || '');
              setIsLoggedIn(true);
              localStorage.setItem('userEmail', userData.data.email);
              
              // Jika user sudah login, ambil daftar pendaftaran yang pending
              await fetchPendingRegistrations(userData.data.email);
              
              setCheckingLoginStatus(false);
              return true;
            }
          }
        } catch (sessionError) {
          console.error('Error checking session endpoint:', sessionError);
        }
        
        // Method 2: Check authentication status endpoint
        try {
          const authResponse = await fetch('/api/auth/session');
          if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('Auth session response:', authData);
            
            if (authData && authData.user) {
              console.log('User authenticated via next-auth session');
              setUserEmail(authData.user.email);
              setUserName(authData.user.name || '');
              setIsLoggedIn(true);
              localStorage.setItem('userEmail', authData.user.email);
              
              // Jika user sudah login, ambil daftar pendaftaran yang pending
              await fetchPendingRegistrations(authData.user.email);
              
              setCheckingLoginStatus(false);
              return true;
            }
          }
        } catch (authError) {
          console.error('Error checking auth session:', authError);
        }
        
        // Method 3: Try to get from local storage as fallback
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
          console.log('Email ditemukan di localStorage:', storedEmail);
          setUserEmail(storedEmail);
          
          // Verify this email with the server
          try {
            const verifyResponse = await fetch(`/api/user/verify?email=${encodeURIComponent(storedEmail)}`);
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.valid) {
                console.log('Email verified as valid user');
                setIsLoggedIn(true);
                setUserName(verifyData.username || '');
                
                // Jika user sudah login, ambil daftar pendaftaran yang pending
                await fetchPendingRegistrations(storedEmail);
                
                setCheckingLoginStatus(false);
                return true;
              }
            }
          } catch (verifyError) {
            console.error('Error verifying email:', verifyError);
          }
        }
        
        // Method 4: Try URL parameters as last resort
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        if (emailParam) {
          console.log('Email dari URL:', emailParam);
          setUserEmail(emailParam);
          localStorage.setItem('userEmail', emailParam);
          
          // Coba ambil pendaftaran dengan email ini
          await fetchPendingRegistrations(emailParam);
        }
        
        // No login detected
        console.log('No login detected after trying all methods');
        setIsLoggedIn(false);
        setCheckingLoginStatus(false);
        return false;
      } catch (error) {
        console.error('Error getting user profile:', error);
        setIsLoggedIn(false);
        setCheckingLoginStatus(false);
        return false;
      }
    };
    
    // Get user first, then fetch courses
    getUserProfile().then(() => {
      fetchAvailableCourses();
    });
  }, [fetchAvailableCourses, refreshKey]);
  
  // Update the fetchPendingRegistrations function to also track paid registrations
  const fetchPendingRegistrations = async (email: string) => {
    try {
      const response = await fetch(`/api/participant/pending-registrations?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.registrations && Array.isArray(data.registrations)) {
          // Buat objek dengan courseId sebagai key dan registrationId sebagai value
          const pendingRegs: {[key: string]: string} = {};
          const paidRegs: {[key: string]: boolean} = {};
          
          data.registrations.forEach((reg: any) => {
            if (reg.courseId && reg.registrationId) {
              pendingRegs[reg.courseId] = reg.registrationId;
              // Check if registration is paid
              if (reg.paymentStatus === 'Paid') {
                paidRegs[reg.courseId] = true;
              }
            }
          });
          
          console.log('Pending registrations:', pendingRegs);
          console.log('Paid registrations:', paidRegs);
          setPendingRegistrations(pendingRegs);
          setPaidRegistrations(paidRegs);
        }
      }
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    }
  };
  
  const handleRegisterClick = (courseId: string, courseTitle: string, courseClass: string, registrationId?: string) => {
    if (userEmail && !isLoggedIn) {
      setIsLoggedIn(true);
    }
    
    setSelectedCourse({
      id: courseId,
      title: courseTitle, 
      className: courseClass
    });
    
    // Jika ada registrationId, berarti ini adalah lanjutan pembayaran
    if (registrationId) {
      setPendingRegistrationId(registrationId);
      setPaymentStep(2); // Langsung ke step pembayaran
      
      // Ambil detail pembayaran
      fetchPaymentDetails(registrationId);
    } else {
      // Reset jika ini adalah pendaftaran baru
      setPendingRegistrationId(null);
      setPaymentStep(1);
    }
    
    setIsRegisterModalOpen(true);
    setRegistrationError('');
  };
  
  // Fungsi untuk mengambil detail pembayaran berdasarkan ID registrasi
  const fetchPaymentDetails = async (registrationId: string) => {
    try {
      console.log(`Fetching payment details for registration ID: ${registrationId}`);
      
      // Add cache-busting parameter to prevent cached responses
      const url = `/api/payment/${registrationId}?t=${Date.now()}`;
      console.log(`Request URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log(`Response status: ${response.status}`);
      
      // Get response as text first to inspect it
      const responseText = await response.text();
      console.log(`Response text length: ${responseText.length}`);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed payment data:', data);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        setRegistrationError('Server returned invalid data format');
        return;
      }
      
      if (response.ok) {
        // Handle registration-specific response from /api/payment/[id] endpoint
        // This handles both payment records and course registrations
        
        // Set registration result with fallbacks for different data formats
        setRegistrationResult({
          registrationId: data.registrationId || registrationId,
          course: data.courseName || data.course || '',
          className: data.className || '',
          payment: data.amount || data.paymentAmount || 0,
          paymentStatus: data.status || data.paymentStatus || 'Pending',
          referenceNumber: data.referenceNumber || '',
          courseScheduleId: data.courseScheduleId || '',
          userInfo: data.userInfo || null
        });
      } else {
        console.error('Error response:', data);
        setRegistrationError(data.error || `Failed to fetch payment details (${response.status})`);
        
        // Fallback to fetching from course registration endpoint
        if (response.status === 404) {
          console.log('Attempting to fetch from course registration API as fallback');
          try {
            const regResponse = await fetch(`/api/course/register/${registrationId}?t=${Date.now()}`);
            if (regResponse.ok) {
              const regData = await regResponse.json();
              console.log('Registration API response:', regData);
              
              if (regData && regData.registration) {
                const reg = regData.registration;
                setRegistrationResult({
                  registrationId: registrationId,
                  course: reg.class?.course?.course_name || '',
                  className: `${reg.class?.location || ''} - ${new Date(reg.class?.start_date).toLocaleDateString() || ''}`,
                  payment: reg.payment || 0,
                  paymentStatus: reg.payment_status || 'Pending',
                  referenceNumber: `REF-${Date.now()}`, // Generate reference if not available
                  courseScheduleId: reg.classId,
                  userInfo: reg.participant?.user ? {
                    email: reg.participant.user.email || '',
                    username: reg.participant.user.username || '',
                    fullName: reg.participant.full_name || ''
                  } : undefined
                });
                setRegistrationError(''); // Clear error if successful
                return;
              }
            }
          } catch (fallbackError) {
            console.error('Fallback request failed:', fallbackError);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setRegistrationError(`Error loading payment details: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleRegisterSubmit = async () => {
    if (!selectedCourse) return;
    
    // Validate email if not logged in and manual email is being used
    if (!isLoggedIn && manualEmail) {
      if (!isValidEmail(manualEmail)) {
        setRegistrationError('Invalid email. Please enter a correct email.');
        return;
      }
    }
    
    // Check terms acceptance
    if (!termsAccepted) {
      setRegistrationError('You must agree to the course terms to continue.');
      return;
    }
    
    setRegistering(true);
    setRegistrationError('');
    
    try {
      // Use either the logged in user's email or manual email if provided
      const emailToUse = isLoggedIn ? userEmail : (manualEmail || userEmail);
      
      // Validate the email to use
      if (!emailToUse || !isValidEmail(emailToUse)) {
        setRegistrationError('Invalid email. Please enter a valid email to register.');
        setRegistering(false);
        return;
      }
      
      const registrationData = {
        classId: selectedCourse.id,
        email: emailToUse,
        paymentMethod: 'Transfer Bank'
      };
      
      // Register the participant
      const response = await fetch('/api/course/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRegistrationResult(data.data);
        setPaymentStep(2);
        
        // Save successful email for future use
        if (data.data?.userInfo?.email) {
          localStorage.setItem('userEmail', data.data.userInfo.email);
        } else if (emailToUse) {
          localStorage.setItem('userEmail', emailToUse);
        }
      } else {
        // More descriptive error messages in English
        if (data.error?.includes("not found")) {
          setRegistrationError('User information was not found. Please login again and ensure your email is correct.');
        } else if (data.error?.includes("profile is incomplete")) {
          setRegistrationError(
            <>
              Your profile is incomplete. Please complete your profile before registering for a course.
            </>
          );
        } else if (data.error?.includes("sudah terdaftar") || data.error?.includes("already registered")) {
          setRegistrationError(
            <>
              You are already registered for this class. Please check your <a href="/participant/courses" className="text-blue-600 underline">My Courses</a> page for payment status and course details.
            </>
          );
        } else if (data.error?.includes("Class is full") || data.error?.includes("kelas sudah penuh")) {
          setRegistrationError('Sorry, this class is already full.');
        } else {
          setRegistrationError(data.error || 'Failed to register for the course.');
        }
      }
    } catch (error) {
      console.error('Error registering course:', error);
      setRegistrationError('Failed to register for the course. Please try again.');
    } finally {
      setRegistering(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validasi tipe file
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Invalid file type. Please upload an image (JPEG, PNG, GIF) or PDF');
        setFilePreviewUrl(null);
        return;
      }
      
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size exceeds 5MB limit');
        setFilePreviewUrl(null);
        return;
      }
      
      setPaymentFile(file);
      setUploadError(''); // Clear any previous errors
      
      // Generate preview URL
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);
      } else {
        // For non-image files (like PDF)
        setFilePreviewUrl(null);
      }
    }
  };
  
  const handleUploadPaymentProof = async () => {
    if (!paymentFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    // Gunakan registrationId dari pendingRegistrationId atau registrationResult
    const registrationId = pendingRegistrationId || (registrationResult?.registrationId);
    
    if (!registrationId) {
      setUploadError('Registration ID not found');
      return;
    }
    
    setUploading(true);
    setUploadError('');
    
    try {
      console.log('Uploading payment proof:', {
        fileName: paymentFile.name,
        fileSize: paymentFile.size,
        fileType: paymentFile.type,
        registrationId: registrationId
      });
      
      const formData = new FormData();
      formData.append('paymentProof', paymentFile);
      formData.append('registrationId', registrationId);
      
      const response = await fetch('/api/payment/upload-proof', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      console.log('Upload response:', data);
      
      if (response.ok) {
        setUploadSuccess(true);
      } else {
        setUploadError(data.error || 'Failed to upload payment proof');
        console.error('Upload error:', data.error);
      }
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      setUploadError(error instanceof Error ? 
        `Failed to upload payment proof: ${error.message}` : 
        'Failed to upload payment proof. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };
  
  const closeModal = () => {
    // Clean up object URL to prevent memory leaks
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    
    setIsRegisterModalOpen(false);
    setSelectedCourse(null);
    setRegistrationResult(null);
    setRegistrationError('');
    setManualEmail('');
    setEmailError('');
    setTermsAccepted(false);
    setPaymentStep(1);
    setPaymentFile(null);
    setUploadSuccess(false);
    setUploadError('');
    setFilePreviewUrl(null);
    setPendingRegistrationId(null);
  };
  
  // Tambahkan fungsi untuk fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      return [];
    }
  };
  
  // Tambahkan useEffect untuk fetch bank accounts
  useEffect(() => {
    const loadBankAccounts = async () => {
      const accounts = await fetchBankAccounts();
      setBankAccounts(accounts);
    };
    
    loadBankAccounts();
  }, []);
  
  // Grid layout for displaying course cards
  const renderCourses = () => {
    if (loading || checkingLoginStatus) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (!isDbConfigured) {
      return (
        <div className="space-y-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm">
            Database is not configured. Please click the button below to configure the database.
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={setupDatabase}
              disabled={configuring}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {configuring ? 'Configuring...' : 'Configure Database'}
            </button>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="space-y-2">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
          
          {!isDbConfigured && (
            <div className="flex justify-center mt-4">
              <button
                onClick={setupDatabase}
                disabled={configuring}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {configuring ? 'Configuring...' : 'Configure Database'}
              </button>
            </div>
          )}
        </div>
      );
    }
    
    if (courses.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No courses available at this time.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {courses.map((course) => {
          console.log('Course image:', course.course.image); // Debug to see the image path
          return (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.course.course_name}
              type={course.course.courseType.course_type}
              image={course.course.image || '/default-course.jpg'}
              className={`${course.location} - ${new Date(course.start_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}`}
              startDate={course.start_date}
              endDate={course.end_date}
              price={course.price}
              location={course.location}
              room={course.room}
              quota={course.quota}
              onRegister={handleRegisterClick}
              isPendingRegistration={!!pendingRegistrations[course.id]}
              isPaidRegistration={!!paidRegistrations[course.id]}
              registrationId={pendingRegistrations[course.id] as any}
            />
          );
        })}
      </div>
    );
  };
  
  return (
    <Layout variant="participant">
      <div className="p-2 sm:p-3 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-3">Available Courses</h1>
        
        {renderCourses()}
        
        {/* Registration Modal */}
        {isRegisterModalOpen && (
          <Modal onClose={closeModal}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {pendingRegistrationId ? 'Payment Confirmation' : 
               paymentStep === 1 ? 'Course Registration' : 'Payment Confirmation'}
            </h2>
            
            {/* Info message about registration process */}
            
            {registrationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-3 text-sm">
                {registrationError}
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-3 text-sm">
                {uploadError}
              </div>
            )}
            
            {paymentStep === 1 && !pendingRegistrationId && (
              <div>
                {selectedCourse && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md">
                    <h3 className="font-medium text-gray-800 mb-1 text-sm">{selectedCourse.title}</h3>
                    <p className="text-gray-600 text-xs">{selectedCourse.className}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-0.5"
                    />
                    <label htmlFor="terms" className="ml-2 block text-xs text-gray-700">
                      I agree to the course terms and understand that payment is required to confirm registration.
                      My registration will only be processed after the admin verifies my payment.
                    </label>
                  </div>
                  
                  <div className="flex gap-2 justify-end mt-3">
                    <button
                      onClick={closeModal}
                      className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegisterSubmit}
                      disabled={registering || (!isLoggedIn && (!manualEmail || !!emailError))}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm"
                    >
                      {registering ? 'Processing...' : 'Register'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(paymentStep === 2 || pendingRegistrationId) && registrationResult && (
              <div className="space-y-3">
                {uploadSuccess ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                    Payment proof uploaded successfully! Your registration is pending admin verification. 
                    You will be notified once your payment has been verified and your registration is confirmed.
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm">
                      Registration received. You need to complete your payment by bank transfer and upload the payment proof.
                      Your registration will only be processed after admin verification of payment.
                    </div>
                    
                    <div className="space-y-1 p-3 bg-gray-50 rounded-md text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium text-gray-700">{registrationResult.course}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Class:</span>
                        <span className="font-medium text-gray-700">{registrationResult.className}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Amount:</span>
                        <span className="font-medium text-gray-700">{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(registrationResult.payment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference No.:</span>
                        <span className="font-medium text-gray-700">{registrationResult.referenceNumber}</span>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md p-3">
                      <h3 className="font-medium text-sm mb-2 text-gray-700">Bank Transfer Information</h3>
                      <div className="space-y-2 text-sm">
                        {registrationResult.bankAccounts ? (
                          registrationResult.bankAccounts.map((bank, index) => (
                            <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                              <div>
                                <span className="block text-gray-600">Bank Name:</span>
                                <span className="font-medium text-gray-700">{bank.bankName}</span>
                              </div>
                              <div>
                                <span className="block text-gray-600">Account Number:</span>
                                <span className="font-medium text-gray-700">{bank.accountNumber}</span>
                              </div>
                              <div>
                                <span className="block text-gray-600">Account Name:</span>
                                <span className="font-medium text-gray-700">{bank.accountName}</span>
                              </div>
                            </div>
                          ))
                        ) : bankAccounts.length > 0 ? (
                          bankAccounts.map((bank, index) => (
                            <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                              <div>
                                <span className="block text-gray-600">Bank Name:</span>
                                <span className="font-medium text-gray-700">{bank.bankName}</span>
                              </div>
                              <div>
                                <span className="block text-gray-600">Account Number:</span>
                                <span className="font-medium text-gray-700">{bank.accountNumber}</span>
                              </div>
                              <div>
                                <span className="block text-gray-600">Account Name:</span>
                                <span className="font-medium text-gray-700">{bank.accountName}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div>
                            <div>
                              <span className="block text-gray-600">Bank Name:</span>
                              <span className="font-medium text-gray-700">Bank BCA</span>
                            </div>
                            <div>
                              <span className="block text-gray-600">Account Number:</span>
                              <span className="font-medium text-gray-700">0123456789</span>
                            </div>
                            <div>
                              <span className="block text-gray-600">Account Name:</span>
                              <span className="font-medium text-gray-700">Train4Best Indonesia</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Payment Proof
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Please upload a screenshot or picture of your transfer receipt
                      </p>
                      
                      {/* File Preview */}
                      {filePreviewUrl && (
                        <div className="mt-2 border rounded-md p-2">
                          <p className="text-xs text-gray-500 mb-1">Preview:</p>
                          <img 
                            src={filePreviewUrl} 
                            alt="Payment proof preview" 
                            className="max-h-40 max-w-full object-contain"
                          />
                        </div>
                      )}
                      
                      {paymentFile && !filePreviewUrl && (
                        <div className="mt-2 border rounded-md p-2 bg-gray-50 text-xs">
                          <p className="text-gray-700">
                            <span className="font-medium">Selected file:</span> {paymentFile.name} ({Math.round(paymentFile.size / 1024)} KB)
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end mt-3">
                      <button
                        onClick={closeModal}
                        className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUploadPaymentProof}
                        disabled={uploading || !paymentFile}
                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-sm"
                      >
                        {uploading ? 'Uploading...' : 'Submit Payment Proof'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Modal>
        )}
      </div>
    </Layout>
  );
} 