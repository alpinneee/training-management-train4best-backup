"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import { Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
import Image from 'next/image';
import Modal from '@/components/common/Modal';

interface PaymentItem {
  id: string;
  registrationId: string;
  participantName: string;
  courseName: string;
  className: string;
  amount: number;
  paymentDate: string;
  status: string;
  paymentProof: string;
}

export default function PaymentVerificationPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('Pending');

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payment?status=${filterStatus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payment data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = (payment: PaymentItem) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleVerifyPayment = async (approved: boolean) => {
    if (!selectedPayment) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/payment/verify/${selectedPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          registrationId: selectedPayment.registrationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      // Show success message
      setSuccessMessage(approved 
        ? 'Payment has been approved successfully!' 
        : 'Payment has been rejected.');
      
      // Refresh payments list after short delay
      setTimeout(() => {
        fetchPayments();
        setIsModalOpen(false);
        setSelectedPayment(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Failed to verify payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) {
      return 'Rp0';
    }
    return `Rp${amount.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Layout variant="admin">
      <div className="p-4 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Payment Verification</h1>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="All">All</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded-md text-center">
            <p>No {filterStatus.toLowerCase()} payments found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.participantName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{payment.courseName}</div>
                      <div className="text-xs text-gray-500">{payment.className}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(payment.amount)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {isModalOpen && selectedPayment && (
          <Modal onClose={closeModal}>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Payment Details</h2>
              
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Participant</p>
                  <p className="font-medium">{selectedPayment.participantName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium">{selectedPayment.courseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="font-medium">{formatDate(selectedPayment.paymentDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${
                    selectedPayment.status === 'Paid' ? 'text-green-600' : 
                    selectedPayment.status === 'Rejected' ? 'text-red-600' : 
                    'text-yellow-600'}`}>
                    {selectedPayment.status}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Payment Proof</p>
                <div className="border rounded-md overflow-hidden">
                  {selectedPayment.paymentProof.endsWith('.pdf') ? (
                    <div className="bg-gray-100 p-4 text-center">
                      <p className="text-sm text-gray-700">PDF Document</p>
                      <a 
                        href={selectedPayment.paymentProof} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View PDF
                      </a>
                    </div>
                  ) : (
                    <div className="relative h-64">
                      <img
                        src={selectedPayment.paymentProof}
                        alt="Payment proof"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {selectedPayment.status === 'Pending' && (
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => handleVerifyPayment(false)}
                    disabled={processing}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerifyPayment(true)}
                    disabled={processing}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
} 