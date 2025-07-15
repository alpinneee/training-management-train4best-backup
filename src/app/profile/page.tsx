"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Layout from "@/components/common/Layout";
import { signOut } from "next-auth/react";

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Get initial email and name from localStorage if available
  const initialEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "" : "";
  const initialName = typeof window !== "undefined" ? localStorage.getItem("username") || "" : "";

  // Form state
  const [isEditing, setIsEditing] = useState(true); // Selalu edit mode
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: initialName,
    email: initialEmail,
    phone: "",
    address: "",
    gender: "",
    birthDate: "",
    jobTitle: "",
    company: "",
    profiency: "",
  });

  // Check if user has completed profile
  const [profileComplete, setProfileComplete] = useState(false);

  // Add loading state to better handle session loading
  const [isLoading, setIsLoading] = useState(true);

  // Debug state untuk melihat data yang diambil
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    sessionStatus: "",
    sessionData: null,
    profileData: null,
    error: null,
  });

  // Function to load profile data - memoized with useCallback
  const loadProfileData = useCallback(async () => {
    // Try to get email from URL first
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");

    // Try to get email from various sources
    let emailToUse = emailParam;

    // Check cookies first (direct login)
    if (!emailToUse) {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
      };

      const cookieEmail = getCookie("userEmail");
      if (cookieEmail) {
        emailToUse = decodeURIComponent(cookieEmail);
        console.log("Using email from cookie:", emailToUse);

        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("userEmail", emailToUse);
        }
      }
    }

    // Try localStorage next
    if (!emailToUse) {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
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
      if (typeof window !== "undefined" && session.user.userType) {
        localStorage.setItem("userType", session.user.userType);
        console.log("Stored userType in localStorage:", session.user.userType);
      }
    }

    // Try admin email from localStorage
    if (!emailToUse) {
      const adminEmail = typeof window !== "undefined" ? localStorage.getItem("admin_email") : null;
      if (adminEmail) {
        emailToUse = adminEmail;
        console.log("Using admin email from localStorage:", emailToUse);

        // Store admin role in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("userType", "Admin");
        }
      }
    }

    // Update debug info
    setDebugInfo((prev) => ({
      ...prev,
      sessionStatus: status,
      sessionData: session,
      emailToUse,
    }));

    if (!emailToUse) {
      console.log("No email found to fetch profile data");
      setIsLoading(false);
      setDebugInfo((prev) => ({
        ...prev,
        error: "No email found to fetch profile data",
      }));
      return;
    }

    try { 
      console.log("Fetching profile data for email:", emailToUse);

      // Determine the endpoint based on user role
      const userType = typeof window !== "undefined" ? localStorage.getItem("userType") || "" : "";
      const isInstructor = userType.toLowerCase().includes("instruct");
      const endpoint = isInstructor
        ? `/api/instructure/get?email=${encodeURIComponent(emailToUse)}`
        : `/api/profile/get?email=${encodeURIComponent(emailToUse)}`;

      console.log("Using endpoint:", endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        console.error("Failed to fetch profile:", response.status);
        setIsLoading(false);
        setDebugInfo((prev) => ({
          ...prev,
          error: `Failed to fetch profile: ${response.status}`,
        }));
        return;
      }

      const result = await response.json();
      console.log("Profile data retrieved:", JSON.stringify(result, null, 2));

      setDebugInfo((prev) => ({
        ...prev,
        profileData: result,
      }));

      if (result.data) {
        if (isInstructor) {
          // Update form data with retrieved instructure data
          const instructureData = {
            fullName:
              result.data.full_name ||
              result.data.name ||
              session?.user?.name ||
              "",
            email: result.data.email || emailToUse || "",
            phone: result.data.phone_number || "",
            address: result.data.address || "",
            gender: "",
            birthDate: "",
            jobTitle: "",
            company: "",
            profiency: result.data.profiency || "",
          };

          console.log(
            "Setting instructure form data:",
            JSON.stringify(instructureData, null, 2)
          );
          setFormData(instructureData);

          // Store user type in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("userType", "Instructure");
            console.log("Stored userType as Instructure in localStorage");
          }

          // Check if profile is complete for instructure
          const hasAllRequiredFields =
            !!instructureData.fullName &&
            !!instructureData.phone &&
            !!instructureData.address &&
            !!instructureData.profiency;

          console.log("Instructure profile completeness:", {
            hasAllRequiredFields,
            hasProfile: result.data.hasProfile || false,
          });

          // Set profile complete status and editing mode
          const isComplete = hasAllRequiredFields && result.data.hasProfile;
          setProfileComplete(isComplete);
          setIsEditing(!isComplete);

          // Also check localStorage for manual override
          const hasProfileFlag = typeof window !== "undefined" ? localStorage.getItem("hasProfile") : null;
          if (hasProfileFlag === "true") {
            setProfileComplete(true);
            setIsEditing(false);
          }
        } else {
          // Update form data with retrieved participant data
          setFormData({
            fullName:
              result.data.fullName ||
              result.data.name ||
              session?.user?.name ||
              "",
            email: result.data.email || emailToUse || "",
            phone: result.data.phone_number || "",
            address: result.data.address || "",
            gender: result.data.gender || "",
            birthDate: result.data.birth_date
              ? new Date(result.data.birth_date).toISOString().split("T")[0]
              : "",
            jobTitle: result.data.job_title || "",
            company: result.data.company || "",
            profiency: "",
          });

          // Check if profile is complete
          const requiredFields = [
            "fullName",
            "gender",
            "phone_number",
            "address",
            "birth_date",
          ];
          const hasCompleteProfile = requiredFields.every(
            (field) => !!result.data[field]
          );

          setProfileComplete(hasCompleteProfile && result.data.hasProfile);
          setIsEditing(!hasCompleteProfile || !result.data.hasProfile);
        }

        // Store user type in localStorage if available
        if (result.data.userType) {
          if (typeof window !== "undefined") {
            localStorage.setItem("userType", result.data.userType);
            console.log(
              "Stored userType from API in localStorage:",
              result.data.userType
            );
          }
        }
      } else {
        // If no data returned, at least set the email and name from available sources
        setFormData((prev) => ({
          ...prev,
          email: emailToUse || "",
          fullName: session?.user?.name || "",
        }));

        // Set to editing mode since we don't have profile data
        setIsEditing(true);
        setProfileComplete(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setDebugInfo((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  // Add a special useEffect to handle direct login redirect
  useEffect(() => {
    // Check for direct login redirect
    const checkDirectLogin = () => {
      // Check if we have the X-User-Email header in localStorage
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

      if (userEmail && !formData.email) {
        console.log(
          "Found user email in localStorage from direct login:",
          userEmail
        );

        // Update form data with the email
        setFormData((prev) => ({
          ...prev,
          email: userEmail,
          fullName: session?.user?.name || "", // Add username from session if available
        }));
      }
    };

    // Run this check on mount
    checkDirectLogin();
  }, [formData.email, session?.user?.name]);

  // Separate useEffect to load profile data when email changes
  useEffect(() => {
    if (formData.email) {
      loadProfileData();
    }
  }, [formData.email, loadProfileData]);

  // Load participants awal
  useEffect(() => {
    if (status !== "loading") {
      loadProfileData();
    }
  }, [status, loadProfileData]);

  // Initialize form with URL email parameter
  useEffect(() => {
    // Sederhanakan proses loading dengan langsung mengambil parameter dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");

    if (emailParam) {
      setFormData((prev) => ({
        ...prev,
        email: emailParam,
      }));
    } else if (session?.user?.email) {
      // Jika tidak ada email di URL tapi ada di session
      setFormData((prev) => ({
        ...prev,
        email: session.user.email,
      }));
    } else {
      // Coba dari localStorage (untuk admin)
      const adminEmail = typeof window !== "undefined" ? localStorage.getItem("admin_email") : null;
      if (adminEmail) {
        setFormData((prev) => ({
          ...prev,
          email: adminEmail,
        }));
      }
    }
  }, [session]);

  // Initialize form with session data when available
  useEffect(() => {
    if (status === "authenticated" && session?.user && !formData.fullName) {
      console.log("Setting form data from session:", session.user);
      setFormData((prev) => ({
        ...prev,
        email: session.user.email || prev.email,
        fullName: session.user.name || prev.fullName,
      }));
    }
  }, [session, status, formData.fullName]);

  // Add immediate initialization on component mount
  useEffect(() => {
    // Log all localStorage values for debugging
    if (typeof window !== "undefined") {
      console.log("DEBUG: All localStorage values at profile page load:");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          console.log(`${key}: ${localStorage.getItem(key)}`);
        }
      }
    }

    // Directly check localStorage and cookies on component mount
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;

    // Log what we found
    console.log("DIRECT INIT: Found in localStorage:", { userEmail, username });

    // If we have email in localStorage, use it immediately
    if (userEmail) {
      setFormData((prev) => ({
        ...prev,
        email: userEmail,
        fullName: username || prev.fullName,
      }));

      // Also try to get the username from the API immediately
      fetch(`/api/user/info?email=${encodeURIComponent(userEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.username) {
            console.log("Got username from API:", data.username);
            setFormData((prev) => ({
              ...prev,
              fullName: data.username,
            }));
            // Save username to localStorage for future use
            if (typeof window !== "undefined") {
              localStorage.setItem("username", data.username);
            }

            // Save userType if available
            if (data.userType) {
              if (typeof window !== "undefined") {
                localStorage.setItem("userType", data.userType);
                console.log("Stored userType from user info API:", data.userType);
              }
            }
          }
        })
        .catch((err) => console.error("Error fetching user info:", err));
    }
  }, []); // Empty dependency array to run only once on mount

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "Menyimpan data...", type: "warning" });

    try {
      // Hapus delay yang tidak perlu
      console.log("Submitting profile data with:", formData);

      // Tentukan endpoint berdasarkan role pengguna
      const isInstructor = userRole?.toLowerCase().includes("instruct");
      const endpoint = isInstructor
        ? "/api/instructure/update"
        : "/api/profile/update";

      console.log("Using endpoint:", endpoint, "isInstructor:", isInstructor);

      // Sesuaikan data yang dikirim berdasarkan role
      const dataToSend = isInstructor
        ? {
            email: formData.email,
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            profiency: formData.profiency,
          }
        : formData;

      console.log("Data to send:", JSON.stringify(dataToSend, null, 2));

      let response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      console.log("Profile update response status:", response.status);
      let data = await response.json();
      console.log(
        "Profile update response data:",
        JSON.stringify(data, null, 2)
      );

      if (response.ok) {
        setMessage({ text: "Profil berhasil diperbarui! Silakan login ulang.", type: "success" });

        // Store email in localStorage for persistence
        if (formData.email) {
          if (typeof window !== "undefined") {
            localStorage.setItem("userEmail", formData.email);
          }
        }

        // Store user type in localStorage
        if (isInstructor) {
          if (typeof window !== "undefined") {
            localStorage.setItem("userType", "Instructure");
            console.log("Stored userType as Instructure in localStorage");
          }
        }

        // Set profile as complete and exit editing mode
        setProfileComplete(true);
        setIsEditing(false);

        // Set hasProfile flag in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("hasProfile", "true");
        }

        // Selalu arahkan pengguna ke halaman login setelah mengisi data diri
        setTimeout(() => {
          // Redirect ke halaman login (untuk semua jenis user)
          signOut({ callbackUrl: "/login" });
        }, 1200);
      } else {
        setMessage({
          text: data.error || "Gagal memperbarui profil",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({
        text: "Terjadi kesalahan saat memperbarui profil. Silakan coba lagi.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine data from all possible sources
  const getUserData = (): UserData => {
    // Ambil userType dari localStorage dulu
    const userType = typeof window !== "undefined" ? localStorage.getItem("userType") || "" : "";
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "" : "";
    const username = typeof window !== "undefined" ? localStorage.getItem("username") || "" : "";

    // Fallback ke session jika localStorage kosong
    if (userType) {
      return {
        name: formData.fullName || username || "User",
        email: formData.email || userEmail || "",
        role: userType,
      };
    }
    if (session?.user) {
      return {
        name: session.user.name || username || "",
        email: session.user.email || userEmail || "",
        role: session.user.userType || "participant",
      };
    }
    // Fallback terakhir
    return {
      name: formData.fullName || "User",
      email: formData.email || "",
      role: "participant",
    };
  };

  const userData = getUserData();

  // Tentukan variant sidebar berdasarkan role pengguna
  const getSidebarVariant = (): "admin" | "participant" | "instructure" => {
    const role = userData.role.toLowerCase();

    if (role.includes("admin")) return "admin";
    if (role.includes("instruct")) return "instructure";
    return "participant";
  };

  // Check if we have any user data
  const checkUserLoggedIn = () => {
    // Check session
    if (session?.user) {
      return true;
    }

    // Check localStorage for userEmail
    if (typeof window !== "undefined" && localStorage.getItem("userEmail")) {
      return true;
    }

    // Check cookies for userEmail
    if (typeof window !== "undefined") {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
      };

      if (getCookie("userEmail")) {
        return true;
      }
    }

    // Check form data
    if (formData.email) {
      return true;
    }

    return false;
  };

  const isLoggedIn = checkUserLoggedIn();

  // Add conditional rendering for loading state
  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Show login prompt only if we're sure the user is not logged in

  const userRole = userData.role;

  // Display profile completion banner for incomplete profiles
  const renderProfileCompletionBanner = () => {
    if (!profileComplete) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-yellow-700">
                Selamat Datang di Train4best!
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Silakan lengkapi profil Anda untuk dapat mengakses fitur lengkap
                platform. Informasi profil yang lengkap diperlukan untuk
                pendaftaran kursus dan sertifikasi.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Profile edit form
  const renderProfileForminstructure = () => {
    if (isEditing) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          {message.text && (
            <div
              className={`p-3 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : message.type === "warning"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 bg-gray-100"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keahlian <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="profiency"
                value={formData.profiency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
              required
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      );
    }
    return null;
  };

  const renderProfileForm = () => {
    if (isEditing) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          {message.text && (
            <div
              className={`p-3 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : message.type === "warning"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 bg-gray-100"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                required
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jabatan
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perusahaan
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
              required
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      );
    }
    return null;
  };

  // Render profile content with more debugging
  const renderProfileContent = () => {
    if (!isEditing) {
      // Tentukan apakah pengguna adalah instructure
      const isInstructor = userData.role.toLowerCase().includes("instruct");

      console.log("Rendering profile content:", {
        isInstructor,
        userData,
        formData,
      });

      return (
        <>
          <div className="pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Informasi Pribadi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p className="text-gray-700 flex items-center gap-2">
                <span className="font-medium">Email:</span>
                {formData.email}
              </p>
              <p className="text-gray-700 flex items-center gap-2">
                <span className="font-medium">No. Telepon:</span>
                {formData.phone || "-"}
              </p>

              {!isInstructor && (
                <>
                  <p className="text-gray-700 flex items-center gap-2">
                    <span className="font-medium">Jenis Kelamin:</span>
                    {formData.gender || "-"}
                  </p>
                  <p className="text-gray-700 flex items-center gap-2">
                    <span className="font-medium">Tanggal Lahir:</span>
                    {formData.birthDate
                      ? new Date(formData.birthDate).toLocaleDateString("id-ID")
                      : "-"}
                  </p>
                  {formData.jobTitle && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <span className="font-medium">Jabatan:</span>
                      {formData.jobTitle}
                    </p>
                  )}
                  {formData.company && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <span className="font-medium">Perusahaan:</span>
                      {formData.company}
                    </p>
                  )}
                </>
              )}

              {isInstructor && (
                <p className="text-gray-700 flex items-center gap-2">
                  <span className="font-medium">Keahlian:</span>
                  {formData.profiency || "-"}
                </p>
              )}
            </div>
            <div className="mt-2">
              <p className="text-gray-700 flex items-start gap-2">
                <span className="font-medium">Alamat:</span>
                <span>{formData.address || "-"}</span>
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-sm hover:bg-blue-100"
              >
                Edit Profil
              </button>
            </div>
          </div>
          {renderRoleSpecificContent()}
        </>
      );
    }
    return null;
  };

  const renderRoleSpecificContent = () => {
    // Ensure userRole is defined before trying to access toLowerCase()
    const role = userRole?.toLowerCase() || "participant";

    switch (role) {
      case "admin":
      case "super_admin":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
              Informasi Admin
            </h2>
            <p className="text-gray-700 italic">
              Anda memiliki akses penuh ke semua fitur sistem
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gray-50 rounded-t-lg border-b">
                  <CardTitle className="text-gray-700">
                    Statistik Sistem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Total penguin</span>
                    <span className="font-semibold">100</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Total Kursus</span>
                    <span className="font-semibold">25</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Total Instruktur</span>
                    <span className="font-semibold">15</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Format role name untuk display
  const formatRoleName = (role: string) => {
    if (!role) return "Participant";

    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case "admin":
      case "super_admin":
        return "Admin";
      case "instructor":
      case "instructure":
        return "Instructor";
      default:
        return "Participant";
    }
  };

  // Render debug info in development environment
  

  // Render halaman dengan Layout yang sesuai dengan role pengguna
  return (
    <Layout variant={getSidebarVariant()}>
      <Card className="max-w-4xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
        {renderProfileCompletionBanner()}
        <CardHeader className="flex flex-row items-center gap-6 border-b bg-gray-50 rounded-t-lg">
          <Avatar className="h-24 w-24 ring-2 ring-gray-200 ring-offset-2">
            <AvatarImage src="/default-avatar.png" />
            <AvatarFallback className="bg-gray-200 text-gray-700 text-xl">
             
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <CardTitle className="text-2xl text-gray-700">
             {userData.name}
             </CardTitle>
            <Badge
              variant="outline"
              className="text-sm px-3 py-1 bg-gray-50 border-gray-300"
            >
          
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Log user role outside JSX */}
            {(() => {
                console.log("Rendering form based on role:", userData.role);
                return userData.role.toLowerCase().includes("instruct")
                  ? renderProfileForminstructure()
                  : renderProfileForm();
            })()}
            {!isEditing && renderProfileContent()}
          </div>
        </CardContent>
      </Card>
     
    </Layout>
  );
}
