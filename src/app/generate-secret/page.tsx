"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function GenerateSecretPage() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secretLength, setSecretLength] = useState(32);
  const [copied, setCopied] = useState(false);

  const generateSecret = async () => {
    setLoading(true);
    setError("");
    setCopied(false);
    
    try {
      const response = await fetch("/api/generate-secret");
      const data = await response.json();
      
      if (data.success) {
        setSecret(data.secret);
      } else {
        setError(data.error || "Failed to generate secret");
      }
    } catch (error) {
      setError("Error generating secret");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCustomSecret = async () => {
    setLoading(true);
    setError("");
    setCopied(false);
    
    try {
      const response = await fetch("/api/generate-secret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ length: secretLength }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSecret(data.secret);
      } else {
        setError(data.error || "Failed to generate secret");
      }
    } catch (error) {
      setError("Error generating secret");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  const createEnvFile = () => {
    const envContent = `# NextAuth Configuration
NEXTAUTH_SECRET=${secret}
NEXTAUTH_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=${secret}
JWT_EXPIRES_IN=86400

# Application Settings
NODE_ENV=development
`;

    const blob = new Blob([envContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env.local";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">NextAuth Secret Generator</h1>
          <p className="text-gray-600 mt-2">
            Generate a secure random string for use as your NextAuth secret
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Secret Length (bytes)
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="16"
              max="64"
              value={secretLength}
              onChange={(e) => setSecretLength(parseInt(e.target.value))}
              className="w-full mr-4"
            />
            <span className="text-gray-700 font-medium">{secretLength}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 32 bytes or more for production
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={generateSecret}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors disabled:bg-blue-300"
          >
            {loading ? "Generating..." : "Generate Default Secret"}
          </button>
          
          <button
            onClick={generateCustomSecret}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors disabled:bg-green-300"
          >
            {loading ? "Generating..." : `Generate ${secretLength}-byte Secret`}
          </button>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4">
              <p>{error}</p>
            </div>
          )}
          
          {secret && (
            <div className="mt-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Generated Secret
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={secret}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-200 hover:bg-gray-300 px-4 rounded-r-md transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={createEnvFile}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition-colors flex-1"
                >
                  Download .env.local
                </button>
              </div>
              
              <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-700">
                <h3 className="font-bold">Installation Instructions:</h3>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Place the .env.local file in your project root</li>
                  <li>Restart your development server</li>
                  <li>For production, set this as an environment variable</li>
                </ol>
              </div>
            </div>
          )}
          
          <Link href="/login" className="text-center text-blue-500 hover:underline mt-4">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 