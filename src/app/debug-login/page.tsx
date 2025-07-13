"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import LogoutModal from "@/components/common/LogoutModal";

export default function DebugLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setLoggedIn(true);
      setResult({
        success: true,
        user: session.user,
        message: "User is authenticated via NextAuth"
      });
    } else if (status === "unauthenticated") {
      setLoggedIn(false);
      setResult(null);
    }
  }, [session, status]);

  const handleDebugSessionCheck = async (silent = false) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/debug-session');
      const data = await response.json();
      
      if (!silent) {
        setResult(data);
      }
      
      console.log("Debug session check result:", data);
      
      if (data.hasToken || data.hasSession) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking session:", error);
      if (!silent) {
        setError("Error checking session");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // Use NextAuth signIn
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      if (result?.ok) {
        setResult({
          success: true,
          message: "Login successful via NextAuth - Redirecting to profile page in 2 seconds..."
        });
        
        // Get session data to verify login
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (sessionData?.user) {
          console.log("Login successful, redirecting to profile page...");
          setTimeout(() => {
            window.location.href = `/profile?email=${encodeURIComponent(sessionData.user.email)}`;
          }, 1500);
        } else {
          setError('Login successful but session not stored. Please try again.');
          console.error("Login failed: Session not stored");
        }
      } else {
        setError("Login failed");
      }
    } catch (error: any) {
      setError('Login error: ' + (error?.message || 'Unknown error'));
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Add direct profile access function
  const goToProfile = () => {
    if (session?.user?.email) {
      window.location.href = `/profile?email=${encodeURIComponent(session.user.email)}`;
    } else {
      window.location.href = '/profile';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
          <h1 className="text-xl font-semibold text-gray-800 mb-6">Debug Login</h1>
          
          {loggedIn ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
              <p className="font-medium">Status: <span className="text-green-600">Already Logged In</span></p>
              <p className="text-sm mt-1">You can directly access the profile page.</p>
              <button
                onClick={goToProfile}
                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Go to Profile &rarr;
              </button>
            </div>
          ) : null}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex gap-2">
              {!loggedIn ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  {loading ? 'Processing...' : 'Login'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  {loading ? 'Processing...' : 'Logout'}
                </button>
              )}
              
              <button
                type="button"
                onClick={(e) => handleDebugSessionCheck(false)}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Check Session
              </button>
            </div>
          </form>
          
          {loggedIn && (
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={goToProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full"
              >
                Continue to Profile Page
              </button>
            </div>
          )}
          
          {result && (
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Result:</h3>
              <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.success && result.user && result.user.email && (
                <button
                  onClick={() => window.location.href = `/profile?email=${encodeURIComponent(result.user!.email!)}`}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Access Profile Now
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => router.push('/profile')}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Profile
          </button>
        </div>
      </div>
      
      {/* Logout Modal */}
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
} 