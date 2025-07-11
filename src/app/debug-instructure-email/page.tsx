"use client";

import React, { useState } from 'react';
import Button from '@/components/common/button';
import Layout from '@/components/common/Layout';

const DebugInstructorEmail = () => {
  const [instructureId, setInstructureId] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDebug = async (fix = false) => {
    if (!instructureId.trim()) {
      setError('Instructor ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugResult(null);

    try {
      const url = `/api/debug-instructure-email?instructureId=${encodeURIComponent(instructureId)}${fix ? '&fix=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to debug instructor email');
      }

      setDebugResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Debug Instructor Email Issues
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Enter Instructor ID
          </h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={instructureId}
              onChange={(e) => setInstructureId(e.target.value)}
              placeholder="Enter instructor ID..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              variant="primary"
              onClick={() => handleDebug(false)}
              disabled={loading}
              className="px-6"
            >
              {loading ? 'Debugging...' : 'Debug'}
            </Button>
            <Button
              variant="green"
              onClick={() => handleDebug(true)}
              disabled={loading}
              className="px-6"
            >
              {loading ? 'Fixing...' : 'Debug & Fix'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {debugResult && (
          <div className="space-y-6">
            {/* Instructor Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Instructor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="font-medium">{debugResult.instructor.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{debugResult.instructor.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{debugResult.instructor.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proficiency</p>
                  <p className="font-medium">{debugResult.instructor.profiency}</p>
                </div>
              </div>
            </div>

            {/* Email Issues */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Email Issues Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${debugResult.emailIssues.hasEmailInRelation ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Has email in relation: {debugResult.emailIssues.hasEmailInRelation ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${debugResult.emailIssues.hasDirectUserEmail ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Has direct user email: {debugResult.emailIssues.hasDirectUserEmail ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${debugResult.emailIssues.recommendedEmail ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Recommended email: {debugResult.emailIssues.recommendedEmail || 'None'}</span>
                </div>
              </div>
            </div>

            {/* User Accounts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                User Accounts ({debugResult.instructor.userCount})
              </h3>
              {debugResult.instructor.users.length > 0 ? (
                <div className="space-y-3">
                  {debugResult.instructor.users.map((user: any, index: number) => (
                    <div key={user.id} className="border rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Username</p>
                          <p className="font-medium">{user.username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">User Type</p>
                          <p className="font-medium">{user.userType}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No user accounts found</p>
              )}
            </div>

            {/* Direct User */}
            {debugResult.directUser && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  Direct User Account
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{debugResult.directUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Username</p>
                    <p className="font-medium">{debugResult.directUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User Type</p>
                    <p className="font-medium">{debugResult.directUser.userType}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Certificates */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Certificates ({debugResult.certificates.length})
              </h3>
              {debugResult.certificates.length > 0 ? (
                <div className="space-y-3">
                  {debugResult.certificates.map((cert: any) => (
                    <div key={cert.id} className="border rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <p className="text-sm text-gray-600">Certificate Number</p>
                          <p className="font-medium">{cert.certificateNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Course</p>
                          <p className="font-medium">{cert.courseName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Issue Date</p>
                          <p className="font-medium">{new Date(cert.issueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No certificates found</p>
              )}
            </div>

            {/* Fix Results */}
            {debugResult.fixAttempted && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  Fix Results
                </h3>
                {debugResult.fixSuccess ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    <p className="font-medium">Fix successful!</p>
                    <p className="mt-1">{debugResult.message}</p>
                    {debugResult.newUser && (
                      <div className="mt-3 p-3 bg-green-100 rounded">
                        <p className="text-sm font-medium">New user created:</p>
                        <p className="text-sm">Email: {debugResult.newUser.email}</p>
                        <p className="text-sm">Username: {debugResult.newUser.username}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p className="font-medium">Fix failed</p>
                    <p className="mt-1">{debugResult.fixError}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DebugInstructorEmail; 