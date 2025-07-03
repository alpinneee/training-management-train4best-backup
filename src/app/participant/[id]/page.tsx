"use client";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  MapPin,
  Award,
  Book,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Certificate {
  id: string;
  certificateNumber: string;
  name: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  course?: {
    course_name: string;
  };
}

interface Course {
  id: string;
  course_name: string;
  start_date?: string | Date;
  end_date?: string | Date;
  status?: string;
  location?: string;
  present_day?: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string | Date;
  paymentMethod: string;
  referenceNumber: string;
  status: string;
  registrationId: string;
}

interface Participant {
  id: string;
  full_name: string;
  photo?: string;
  job_title?: string;
  company?: string;
  phone_number: string;
  email?: string;
  username?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
  certificates?: Certificate[];
  courses?: Course[];
  payments?: Payment[];
}

const ParticipantDetail = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const fetchParticipant = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/participant/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Participant not found");
            router.push("/participant");
            return;
          }
          throw new Error("Failed to fetch participant data");
        }

        const data = await response.json();
        console.log("Participant data:", data);
        setParticipant(data);
      } catch (err) {
        console.error("Error fetching participant:", err);
        toast.error("Failed to load participant data");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchParticipant();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!participant) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-gray-500">Participant not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="admin">
      <div className="p-2 max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
          <div className="flex items-start gap-3">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              {participant.full_name ? (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {participant.full_name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <Image
                  src="/default-avatar.png"
                  alt="Default"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-base font-medium text-gray-700">
                {participant.full_name}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-gray-600">
                {participant.job_title && (
                  <div className="flex items-center gap-1">
                    <Briefcase size={12} />
                    <span>{participant.job_title}</span>
                  </div>
                )}
                {participant.company && (
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{participant.company}</span>
                  </div>
                )}
                {participant.phone_number && (
                  <div className="flex items-center gap-1">
                    <Phone size={12} />
                    <span>{participant.phone_number}</span>
                  </div>
                )}
                {participant.email && (
                  <div className="flex items-center gap-1">
                    <Mail size={12} />
                    <span>{participant.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto mb-3 bg-white rounded-md shadow-sm text-xs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-2 whitespace-nowrap ${
              activeTab === "dashboard"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-3 py-2 whitespace-nowrap ${
              activeTab === "courses"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            className={`px-3 py-2 whitespace-nowrap ${
              activeTab === "certificates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Certificates
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3 py-2 whitespace-nowrap ${
              activeTab === "payments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Payments
          </button>
        </div>

        {/* Content Section */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Personal Info */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Personal Information
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-500" />
                  <div>
                    <span className="text-gray-500">Full Name:</span>
                    <span className="ml-1 text-gray-700">
                      {participant.full_name}
                    </span>
                  </div>
                </div>
                {participant.gender && (
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-500" />
                    <div>
                      <span className="text-gray-500">Gender:</span>
                      <span className="ml-1 text-gray-700">
                        {participant.gender}
                      </span>
                    </div>
                  </div>
                )}
                {participant.birth_date && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <div>
                      <span className="text-gray-500">Birth Date:</span>
                      <span className="ml-1 text-gray-700">
                        {new Date(participant.birth_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                {participant.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-500" />
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <span className="ml-1 text-gray-700">
                        {participant.address}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Summary
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="flex items-center gap-1 text-blue-600 mb-1">
                    <Book size={14} />
                    <span className="text-xs font-medium">Courses</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-700">
                    {participant.courses?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="flex items-center gap-1 text-green-600 mb-1">
                    <Award size={14} />
                    <span className="text-xs font-medium">Certificates</span>
                  </div>
                  <p className="text-lg font-semibold text-green-700">
                    {participant.certificates?.length || 0}
                  </p>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="flex items-center gap-1 text-purple-600 mb-1">
                    <CreditCard size={14} />
                    <span className="text-xs font-medium">Payments</span>
                  </div>
                  <p className="text-lg font-semibold text-purple-700">
                    {participant.payments?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-sm font-medium text-gray-700 mb-2">
              Enrolled Courses
            </h2>
            {participant.courses && participant.courses.length > 0 ? (
              <div className="space-y-2">
                {participant.courses.map((course: Course) => (
                  <div key={course.id} className="border rounded p-2 text-xs">
                    <div className="font-medium text-gray-700">
                      {course.course_name}
                    </div>
                    <div className="text-gray-500 mt-1">
                      {course.start_date && (
                        <span>
                          {new Date(course.start_date).toLocaleDateString()} -
                          {course.end_date &&
                            new Date(course.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No courses enrolled</p>
            )}
          </div>
        )}

        {activeTab === "certificates" && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-sm font-medium text-gray-700 mb-2">
              Certificates
            </h2>
            {participant.certificates && participant.certificates.length > 0 ? (
              <div className="space-y-2">
                {participant.certificates.map((cert: Certificate) => (
                  <div key={cert.id} className="border rounded p-2 text-xs">
                    <div className="font-medium text-gray-700">{cert.name}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">
                        {cert.certificateNumber}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs ${
                          cert.status === "Valid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No certificates found</p>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h2 className="text-sm font-medium text-gray-700 mb-2">
              Payment History
            </h2>
            {participant.payments && participant.payments.length > 0 ? (
              <div className="space-y-2">
                {participant.payments.map((payment: Payment) => (
                  <div key={payment.id} className="border rounded p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">
                        {payment.referenceNumber}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs ${
                          payment.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-gray-500 mt-1">
                      {new Date(payment.paymentDate).toLocaleDateString()} - $
                      {payment.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No payment records found</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ParticipantDetail;
