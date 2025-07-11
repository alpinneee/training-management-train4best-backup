"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const LoginForm = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Login attempt with:", { email });
      
      // Use direct login API instead of NextAuth signIn
      const response = await fetch('/api/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log("Direct login response:", data);
      
      if (!data.success) {
        setError(data.error || "Login failed");
        toast.error(data.error || "Login failed");
        return;
      }
      
      // Login successful
      toast.success("Login successful!");
      
      // Store user data in localStorage
      if (data.user) {
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("username", data.user.name);
        console.log("Stored user data in localStorage:", { 
          email: data.user.email, 
          username: data.user.name 
        });
      }
      
      // Get redirect URL from the response body or header, or use default based on user type
      let redirectPath = data.redirectUrl;
      
      if (!redirectPath) {
        // Fallback to header
        redirectPath = response.headers.get('X-Redirect-URL');
      }
      
      if (!redirectPath) {
        // Fallback to user type based redirect
        const userType = data.user?.userType?.toLowerCase();
        
        if (userType === 'admin') {
          // redirectPath = '/.ldashboard';
          
          console.log("Admin user detected, redirecting to /user");
        } else if (userType === 'instructure') {
          redirectPath = '/instructure-dashboard';
          console.log("Instructor user detected, redirecting to /instructure-dashboard");
        } else if (userType === 'participant') {
          redirectPath = '/participant-dashboard';
          console.log("Participant user detected, redirecting to /participant-dashboard");
        } else if (userType === 'unassigned') {
          redirectPath = '/profile';
          console.log("Unassigned user detected, redirecting to profile page to complete registration");
        } else {
          redirectPath = '/dashboard-static';
          console.log("Unknown user type, redirecting to /dashboard-static");
        }
      }
      
      console.log("Redirecting to:", redirectPath, "for user type:", data.user?.userType);
      
      // Special handling for admin users
      const isAdmin = data.user?.userType?.toLowerCase() === 'admin';
      const delay = isAdmin ? 1200 : 800; // Longer delay for admin users
      
      if (isAdmin) {
        console.log("ADMIN LOGIN: Using longer delay for admin redirect:", delay, "ms");
        
        // For admin users, we'll use a more direct approach
        console.log("ADMIN LOGIN: Adding special admin flag to localStorage");
        localStorage.setItem("admin_login_timestamp", Date.now().toString());
        localStorage.setItem("admin_email", data.user.email);
        
        // Override redirectPath for admin
        redirectPath = "/dashboard";
      } else if (data.user?.userType?.toLowerCase() === 'participant') {
        // Ensure participant users go to the participant dashboard
        console.log("PARTICIPANT LOGIN: Ensuring participant dashboard redirect");
        redirectPath = "/participant/dashboard";
        
        // Store user email in localStorage for participant dashboard usage
        localStorage.setItem("userEmail", data.user.email);
      }
      
      // Add a delay to ensure cookies are set
      setTimeout(() => {
        // Use window.location for a hard redirect to avoid client-side routing issues
        if (isAdmin) {
          console.log("ADMIN LOGIN: Executing redirect to", redirectPath);
          
          // For admin, use a different approach - direct URL with reload
          window.location.replace(redirectPath);
        } else {
          window.location.href = redirectPath;
        }
      }, delay);
      
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Display link to debug login
 

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-3 sm:px-8 relative h-screen lg:overflow-hidden bg-[#373A8D] xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600 before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-[#373A8D]/20 before:rounded-[100%] before:dark:bg-darkmode-400 after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:bg-[#373A8D] after:rounded-[100%] after:dark:bg-darkmode-700"
    >
      <div className="container relative z-10 sm:px-10">
        <div className="block grid-cols-2 gap-4 xl:grid">
          {/* BEGIN: Login Info */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden min-h-screen flex-col xl:flex"
          > 
            <Link href="/" className="-intro-x flex items-start pl-5 pt-5">
              <Image
                src="/img/LogoT4B.png"
                alt="Logo"
                width={150}
                height={150}
                className="w-35 h-35"
              />
            </Link>
            <div className="my-auto">
              <Image
                src="/img/illustration.svg"
                alt="Login Illustration"
                width={400}
                height={300}
                className="-intro-x -mt-16 w-1/2"
              />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="-intro-x mt-10 text-4xl font-medium leading-tight text-white"
              >
                Welcome to Train4best
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="-intro-x mt-5 text-lg text-white text-opacity-70 dark:text-slate-400"
              >
                Customer service: +62 821-3023-7117
              </motion.div>
            </div>
          </motion.div>
          {/* END: Login Info */}

          {/* BEGIN: Login Form */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="my-10 flex h-screen py-5 xl:my-0 xl:h-auto xl:py-0"
          >
            <div className="mx-auto my-auto w-full rounded-md bg-white px-5 py-8 shadow-md dark:bg-darkmode-600 sm:w-3/4 sm:px-8 lg:w-2/4 xl:ml-20 xl:w-auto xl:bg-transparent xl:p-0 xl:shadow-none">
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="intro-x text-center text-2xl font-bold text-black xl:text-left xl:text-3xl"
              >
                Login
              </motion.h2>
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="intro-x mt-2 text-center text-slate-400 xl:hidden"
              >
                Welcome to Train4best
              </motion.div>

              {error && (
                <div className="intro-x mt-4 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="intro-x mt-8"
                >
                  <input
                    type="text"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="intro-x block min-w-full px-4 py-3 xl:min-w-[350px] disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-darkmode-800/50 dark:disabled:border-transparent transition duration-200 ease-in-out w-full text-sm border-slate-200 shadow-sm rounded-md placeholder:text-slate-400/90 focus:ring-4 focus:ring-[#373A8D] focus:ring-opacity-20 focus:border-[#373A8D] focus:border-opacity-40 dark:bg-darkmode-800 dark:border-transparent dark:focus:ring-slate-700 dark:focus:ring-opacity-50 dark:placeholder:text-slate-500/80 text-black"
                  />
                  <div className="intro-x mt-4 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block min-w-full px-4 py-3 xl:min-w-[350px] disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-darkmode-800/50 dark:disabled:border-transparent transition duration-200 ease-in-out w-full text-sm border-slate-200 shadow-sm rounded-md placeholder:text-slate-400/90 focus:ring-4 focus:ring-[#373A8D] focus:ring-opacity-20 focus:border-[#373A8D] focus:border-opacity-40 dark:bg-darkmode-800 dark:border-transparent dark:focus:ring-slate-700 dark:focus:ring-opacity-50 dark:placeholder:text-slate-500/80 text-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="intro-x mt-4 flex text-xs text-slate-600 dark:text-slate-500 sm:text-sm"
                >
          
                  <Link href="/reset-password" className="text-[#373A8D]">
                    Forgot Password?
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="intro-x mt-5 text-center xl:mt-8 xl:text-left"
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 align-top xl:mr-3 xl:w-32 transition duration-200 border shadow-sm inline-flex items-center justify-center rounded-md font-medium cursor-pointer focus:ring-4 focus:ring-[#373A8D] focus:ring-opacity-20 focus-visible:outline-none dark:focus:ring-slate-700 dark:focus:ring-opacity-50 [&:hover:not(:disabled)]:bg-opacity-90 [&:hover:not(:disabled)]:border-opacity-90 bg-[#373A8D] border-[#373A8D] text-white disabled:opacity-70"
                  >
                    {loading ? "Loading..." : "Login"}
                  </button>
                  <Link
                    href="/register"
                    className="mt-3 w-full px-4 py-3 align-top xl:mt-0 xl:w-32 transition duration-200 border shadow-sm inline-flex items-center justify-center rounded-md font-medium cursor-pointer focus:ring-4 focus:ring-[#373A8D] focus:ring-opacity-20 focus-visible:outline-none dark:focus:ring-slate-700 dark:focus:ring-opacity-50 [&:hover:not(:disabled)]:bg-opacity-90 [&:hover:not(:disabled)]:border-opacity-90 border-secondary text-slate-700 dark:border-darkmode-100/40 dark:text-slate-700 [&:hover:not(:disabled)]:bg-secondary/20 [&:hover:not(:disabled)]:dark:bg-darkmode-100/10"
                  >
                    Register
                  </Link>
                </motion.div>
              </form>

            </div>
          </motion.div>
          {/* END: Login Form */}
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
