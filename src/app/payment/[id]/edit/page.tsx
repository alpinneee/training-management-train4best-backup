"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/common/Layout";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface RegistrationOption {
  id: string;
  name: string;
}

export default function PaymentEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNewPayment = params.id === "new";
  const [loading, setLoading] = useState(!isNewPayment);
  const [saving, setSaving] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationOption[]>([]);
  const [formData, setFormData] = useState({
    paymentDate: "",
    amount: "",
    paymentMethod: "Transfer Bank",
    referenceNumber: "",
    status: "Unpaid",
    registrationId: "",
  });

  // Fetch payment details if editing
  useEffect(() => {
    async function fetchPayment() {
      try {
        const response = await fetch(`/api/payment/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Payment not found");
            router.push("/payment-report");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Format dates for input fields
        const formattedData = {
          paymentDate: data.paymentDate.split('T')[0],
          amount: data.amount.toString(),
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          status: data.status,
          registrationId: data.registrationId,
        };
        
        setFormData(formattedData);
      } catch (error) {
        console.error("Failed to fetch payment:", error);
        toast.error("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    }

    // Fetch course registrations
    async function fetchRegistrations() {
      try {
        // This is a placeholder - in a real app, you'd fetch from an API
        // Fetch registrations from your API
        const registrationsResponse = await fetch("/api/course-registration");
        if (registrationsResponse.ok) {
          const registrationsData = await registrationsResponse.json();
          setRegistrations(registrationsData.map((r: any) => ({
            id: r.id,
            name: r.participant?.full_name || `Registration #${r.id.substring(0, 6)}`
          })));
        } else {
          // If API doesn't exist yet, use placeholder data
          setRegistrations([
            { id: "reg-1", name: "Ilham Ramadhan" },
            { id: "reg-2", name: "Risky Febriana" },
            { id: "reg-3", name: "Affine Makarizo" },
            { id: "reg-4", name: "Cyntia Febiola" },
            { id: "reg-5", name: "Saska Khairani" },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch registrations:", error);
        // Fallback to placeholder data
        setRegistrations([
          { id: "reg-1", name: "Ilham Ramadhan" },
          { id: "reg-2", name: "Risky Febriana" },
          { id: "reg-3", name: "Affine Makarizo" },
          { id: "reg-4", name: "Cyntia Febiola" },
          { id: "reg-5", name: "Saska Khairani" },
        ]);
      }
    }

    fetchRegistrations();
    
    if (!isNewPayment) {
      fetchPayment();
    } else {
      // Set default values for new payment
      setFormData({
        ...formData,
        paymentDate: new Date().toISOString().split('T')[0],
      });
      setLoading(false);
    }
  }, [params.id, router, isNewPayment, formData.registrationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate form data
      if (!formData.paymentDate || !formData.amount || !formData.paymentMethod || !formData.referenceNumber || !formData.registrationId) {
        toast.error("Please fill all required fields");
        setSaving(false);
        return;
      }

      // Prepare request
      const method = isNewPayment ? "POST" : "PUT";
      const url = isNewPayment 
        ? "/api/payment" 
        : `/api/payment/${params.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      toast.success(isNewPayment 
        ? "Payment created successfully" 
        : "Payment updated successfully"
      );
      
      // Redirect to payment report page
      router.push("/payment-report");
    } catch (error) {
      console.error("Failed to save payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const generateReferenceNumber = () => {
    if (formData.referenceNumber && !isNewPayment) return;
    
    const prefix = formData.paymentMethod === "Transfer Bank" 
      ? "TRF" 
      : formData.paymentMethod === "E-Wallet" 
        ? "EWL" 
        : "CC";
        
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setFormData(prev => ({
      ...prev,
      referenceNumber: `${prefix}-${date}-${random}`
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link 
              href="/payment-report"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </Link>
            <h1 className="text-xl font-semibold ml-2">
              {isNewPayment ? "Create New Payment" : "Edit Payment"}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Payment Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="registrationId" className="block text-sm font-medium text-gray-700 mb-1">
                      Participant Registration <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="registrationId"
                      name="registrationId"
                      value={formData.registrationId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Participant Registration</option>
                      {registrations.map((registration) => (
                        <option key={registration.id} value={registration.id}>
                          {registration.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (IDR) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      id="paymentDate"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Payment Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="E-Wallet">E-Wallet</option>
                      <option value="Kartu Kredit">Kartu Kredit</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number <span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="referenceNumber"
                        name="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateReferenceNumber}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link 
                href="/payment-report"
                className="px-4 py-2 mr-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 