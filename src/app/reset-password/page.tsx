"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });

  // Request password reset (step 1)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", content: "Please enter your email address" });
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: "", content: "" });

      const response = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for specific error about email not found
        if (data.code === "not_found" || data.message?.toLowerCase().includes("not found") || data.message?.toLowerCase().includes("tidak terdaftar")) {
          throw new Error("Email is not registered in our system");
        }
        throw new Error(data.message || "Failed to send reset link");
      }

      setMessage({
        type: "success",
        content: "Reset password link has been sent to your email.",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      setMessage({
        type: "error",
        content: error.message || "An error occurred. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with token (step 2)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setMessage({ type: "error", content: "Please fill in all fields" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", content: "Passwords do not match" });
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: "error",
        content: "Password must be at least 8 characters long",
      });
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: "", content: "" });

      const response = await fetch("/api/auth/reset-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setMessage({
        type: "success",
        content: "Password successfully reset. You can now login with your new password.",
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage({
        type: "error",
        content: "Invalid or expired token. Please request a new reset link.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {token ? "Reset Your Password" : "Forgot Your Password?"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {token
              ? "Please enter your new password"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>
        
        {message.content && (
          <div
            className={`p-4 rounded-md ${
              message.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message.content}
          </div>
        )}

        {token ? (
          // Reset password form (with token)
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="new-password" className="sr-only">
                  New Password
                </label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  required
                  className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md bg-blue-600 py-2 px-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
              >
                {isLoading ? "Processing..." : "Reset Password"}
              </button>
            </div>
          </form>
        ) : (
          // Request reset form (email entry)
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md bg-blue-600 py-2 px-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        )}

        <div className="text-sm text-center mt-4">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
