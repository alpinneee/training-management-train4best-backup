"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/common/button";
import {
  FileText,
  Edit,
  Trash2,
  History,
  UserCheck,
  Award,
  FileSignature,
  BarChart,
  Info,
  XCircle,
  Menu,
  ArrowUp,
  ArrowDown,
  Users,
  UserPlus,
  BookOpen,
} from "lucide-react";
import Modal from "@/components/common/Modal";
import Layout from "@/components/common/Layout";
import Image from "next/image";
import InstructorSelectionTable from "../../../components/common/InstructorSelectionTable";
import { toast } from "react-hot-toast";
import ELearningTab from "@/components/training/ELearningTab";
import { useSession } from "next-auth/react";

interface Participant {
  id: string;
  name: string;
  participantId: string;
  presentDay: string;
  paymentStatus: string;
  regStatus: string;
  phone_number?: string;
}

interface Instructure {
  id: string;
  name: string;
  instructureId: string;
  phoneNumber: string;
  profiency: string;
  photo: string;
}

interface AvailableParticipant {
  id: string;
  name: string;
  phone_number?: string;
}

interface AvailableInstructure {
  id: string;
  full_name: string;
  phone_number: string;
  profiency: string;
}

interface CourseSchedule {
  id: string;
  className: string;
  date: string;
  registrationDate: string;
  location: string;
  room: string;
  price: number;
  quota: number;
  status: string;
  courseId: string;
  participants: Participant[];
  instructures: Instructure[];
  // Raw data for edit form
  startDate: string;
  endDate: string;
  startRegDate: string;
  endRegDate: string;
  durationDay: number;
}

// Tambahkan state untuk modal sertifikat instructure
type InstructureForCertificate = {
  id: string;
  name: string;
  instructureId: string;
};

const CourseScheduleDetail = () => {
  const params = useParams() as { id: string };
  const router = useRouter();
  const scheduleId = params.id;

  const [courseDetails, setCourseDetails] = useState<CourseSchedule | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("participant");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isInstructureModalOpen, setIsInstructureModalOpen] = useState(false);
  const [availableParticipants, setAvailableParticipants] = useState<
    AvailableParticipant[]
  >([]);
  const [availableInstructures, setAvailableInstructures] = useState<
    AvailableInstructure[]
  >([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<
    AvailableParticipant[]
  >([]);
  const [selectedInstructureId, setSelectedInstructureId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<
    "participant" | "instructure" | null
  >(null);

  const [editedCourse, setEditedCourse] = useState({
    courseId: "",
    startDate: "",
    endDate: "",
    startRegDate: "",
    endRegDate: "",
    location: "",
    room: "",
    price: "",
    quota: "",
    durationDay: "",
    status: "Active",
  });

  const [isInstructorSelectionModalOpen, setIsInstructorSelectionModalOpen] =
    useState(false);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>(
    []
  );
  const [allInstructors, setAllInstructors] = useState<any[]>([]);

  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [
    selectedParticipantForCertificate,
    setSelectedParticipantForCertificate,
  ] = useState<Participant | null>(null);
  const [certificateData, setCertificateData] = useState({
    certificateNumber: "",
    issueDate: "",
    pdfFile: null as File | null,
    pdfUrl: "",
    driveLink: "",
  });
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [
    selectedParticipantForRegistration,
    setSelectedParticipantForRegistration,
  ] = useState<Participant | null>(null);
  const [registrationData, setRegistrationData] = useState({
    registrationDate: "",
    paymentDate: "",
    paymentMethod: "",
    payment: "",
    presentDay: "",
    paymentDetail: "",
    paymentEvidence: "",
  });
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [selectedParticipantForValue, setSelectedParticipantForValue] =
    useState<Participant | null>(null);
  const [valueData, setValueData] = useState<
    Array<{ id: string; valueType: string; remark: string; value: string }>
  >([]);
  const [newValue, setNewValue] = useState({
    valueType: "",
    remark: "",
    value: "",
  });
  const [valuePage, setValuePage] = useState(1);
  const [totalValuePages, setTotalValuePages] = useState(1);
  const [valueLoading, setValueLoading] = useState(false);
  const [valueError, setValueError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedParticipantForDetail, setSelectedParticipantForDetail] =
    useState<Participant | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isEditValueModalOpen, setIsEditValueModalOpen] = useState(false);
  const [selectedValueForEdit, setSelectedValueForEdit] = useState<{
    id: string;
    valueType: string;
    remark: string;
    value: string;
  } | null>(null);
  const [editValueLoading, setEditValueLoading] = useState(false);
  const [editValueError, setEditValueError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [isAbsenModalOpen, setIsAbsenModalOpen] = useState(false);
  const [selectedAbsenParticipant, setSelectedAbsenParticipant] =
    useState<Participant | null>(null);
  const [absenStatus, setAbsenStatus] = useState<string>("hadir");
  const [absenMode, setAbsenMode] = useState<string>("offline");
  const [absenLoading, setAbsenLoading] = useState(false);
  const [absenError, setAbsenError] = useState<string | null>(null);
  const [isAttendanceDetailModalOpen, setIsAttendanceDetailModalOpen] =
    useState(false);
  const [attendanceDetail, setAttendanceDetail] = useState<any[]>([]);
  const [attendanceDetailLoading, setAttendanceDetailLoading] = useState(false);
  const [attendanceDetailError, setAttendanceDetailError] = useState<
    string | null
  >(null);
  const [selectedAttendanceParticipant, setSelectedAttendanceParticipant] =
    useState<Participant | null>(null);
  const [absenDate, setAbsenDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [absenTime, setAbsenTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // format HH:mm
  });
  // Tambah state untuk edit dan delete attendance
  const [isEditAttendanceModalOpen, setIsEditAttendanceModalOpen] =
    useState(false);
  const [editAttendanceData, setEditAttendanceData] = useState<any>(null);
  const [isDeleteAttendanceModalOpen, setIsDeleteAttendanceModalOpen] =
    useState(false);
  const [deleteAttendanceId, setDeleteAttendanceId] = useState<any>(null);
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false);

  // Tambahkan state untuk modal sertifikat instructure
  const [
    isInstructureCertificateModalOpen,
    setIsInstructureCertificateModalOpen,
  ] = useState(false);
  const [
    selectedInstructureForCertificate,
    setSelectedInstructureForCertificate,
  ] = useState<InstructureForCertificate | null>(null);
  const [instructureCertificateData, setInstructureCertificateData] = useState({
    certificateNumber: "",
    issueDate: "",
    pdfFile: null as File | null,
    pdfUrl: "",
    driveLink: "",
  });
  const [instructureCertificateLoading, setInstructureCertificateLoading] =
    useState(false);
  const [instructureCertificateError, setInstructureCertificateError] =
    useState<string | null>(null);

  const fetchAllParticipants = async () => {
    try {
      setIsLoadingParticipants(true);
      console.log("Fetching all participants");
      const response = await fetch(`/api/participant?limit=100`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error (${response.status}):`, errorText);
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API response:", data);

      if (!data.data || !Array.isArray(data.data)) {
        console.error("Invalid API response format:", data);
        return [];
      }

      // Map the response data to the expected format
      const participants = data.data.map((participant: any) => ({
        id: participant.id,
        name: participant.fullName || participant.name || "Unknown",
        phone_number: participant.phone_number,
      }));

      setAvailableParticipants(participants);
      return participants;
    } catch (error) {
      console.error("Error fetching participants:", error);
      setAvailableParticipants([]);
      return [];
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const searchParticipants = async (query: string) => {
    try {
      console.log("Filtering participants with query:", query);
      if (query.length < 2) {
        // If query is too short, fetch all participants
        return await fetchAllParticipants();
      }

      const response = await fetch(
        `/api/participant?search=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error (${response.status}):`, errorText);
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API response:", data);

      if (!data.data || !Array.isArray(data.data)) {
        console.error("Invalid API response format:", data);
        return [];
      }

      // Map the response data to the expected format
      return data.data.map((participant: any) => ({
        id: participant.id,
        name: participant.fullName || participant.name || "Unknown",
        phone_number: participant.phone_number,
      }));
    } catch (error) {
      console.error("Error searching participants:", error);
      return [];
    }
  };

  const searchInstructures = async (query: string) => {
    try {
      const response = await fetch(
        `/api/instructure?search=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      return data.data.map((instructure: any) => ({
        id: instructure.id,
        full_name: instructure.name,
        phone_number: instructure.phone_number,
        profiency: instructure.profiency,
      }));
    } catch (error) {
      console.error("Error searching instructures:", error);
      return [];
    }
  };

  const fetchCourseSchedule = async () => {
    setLoading(true);
    try {
      console.log(`Fetching schedule with ID: ${scheduleId}`);
      const response = await fetch(`/api/course-schedule/${scheduleId}`);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(`API error: ${response.status}`, errorData);
        throw new Error(
          `Server responded with ${response.status}: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      console.log("Schedule data received successfully");
      setCourseDetails(data);

      // Initialize edit form with current values
      setEditedCourse({
        courseId: data.courseId,
        startDate: new Date(data.startDate).toISOString().split("T")[0],
        endDate: new Date(data.endDate).toISOString().split("T")[0],
        startRegDate: new Date(data.startRegDate).toISOString().split("T")[0],
        endRegDate: new Date(data.endRegDate).toISOString().split("T")[0],
        location: data.location,
        room: data.room,
        price: data.price.toString(),
        quota: data.quota.toString(),
        durationDay: data.durationDay.toString(),
        status: data.status,
      });

      if (data.instructures) {
        setSelectedInstructorIds(
          data.instructures.map(
            (instructor: { instructureId: string }) => instructor.instructureId
          )
        );
      }
    } catch (err) {
      console.error("Error in fetchCourseSchedule:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load course schedule"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInstructors = async () => {
    try {
      console.log("Fetching all instructors...");
      const response = await fetch("/api/instructure?limit=100");
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      console.log("Instructors API response:", data);

      // Create dummy data if no instructors are returned
      if (!data.data || data.data.length === 0) {
        console.log("No instructors found, creating dummy data");
        const dummyInstructors = [
          {
            id: "1",
            full_name: "John Doe",
            phone_number: "123-456-7890",
            profiency: "Web Development",
          },
          {
            id: "2",
            full_name: "Jane Smith",
            phone_number: "234-567-8901",
            profiency: "Data Science",
          },
          {
            id: "3",
            full_name: "Bob Johnson",
            phone_number: "345-678-9012",
            profiency: "Mobile Development",
          },
        ];
        setAllInstructors(dummyInstructors);
        return;
      }

      // Transform the data to match the Instructor interface
      const instructors = data.data.map((instructor: any) => {
        console.log("Processing instructor:", instructor);
        return {
          id: instructor.id,
          full_name: instructor.fullName || instructor.name || "Unknown",
          phone_number:
            instructor.phone_number || instructor.phoneNumber || "-",
          profiency: instructor.profiency || instructor.proficiency || "",
        };
      });

      console.log("Transformed instructors:", instructors);
      setAllInstructors(instructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      // Set dummy data in case of error
      const dummyInstructors = [
        {
          id: "1",
          full_name: "John Doe",
          phone_number: "123-456-7890",
          profiency: "Web Development",
        },
        {
          id: "2",
          full_name: "Jane Smith",
          phone_number: "234-567-8901",
          profiency: "Data Science",
        },
        {
          id: "3",
          full_name: "Bob Johnson",
          phone_number: "345-678-9012",
          profiency: "Mobile Development",
        },
      ];
      setAllInstructors(dummyInstructors);
    }
  };

  useEffect(() => {
    fetchCourseSchedule();
    fetchAllInstructors();
  }, [scheduleId]);

  // Fungsi untuk memperbarui jumlah kehadiran untuk semua peserta
  const updateAllAttendanceCounts = async () => {
    if (!courseDetails?.participants?.length) return;

    for (const participant of courseDetails.participants) {
      try {
        const response = await fetch(
          `/api/course-schedule/${scheduleId}/participant/attendance?participantId=${participant.participantId}`
        );
        if (response.ok) {
          const data = await response.json();
          const presentCount = (data.attendances || []).filter(
            (att: any) => att.status === "present"
          ).length;

          // Update presentDay di database
          await fetch(
            `/api/course-schedule/${scheduleId}/participant/update-present-day`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                participantId: participant.participantId,
                presentDay: presentCount,
              }),
            }
          );

          // Update presentDay di UI
          setCourseDetails((prevDetails) => {
            if (!prevDetails) return null;
            return {
              ...prevDetails,
              participants: prevDetails.participants.map((p) =>
                p.participantId === participant.participantId
                  ? { ...p, presentDay: `${presentCount} days` }
                  : p
              )
            } as CourseSchedule;
          });
        }
      } catch (error) {
        console.error(
          `Error updating attendance for ${participant.name}:`,
          error
        );
      }
    }
  };

  // Perbarui jumlah kehadiran saat data peserta tersedia
  useEffect(() => {
    if (courseDetails?.participants?.length && courseDetails.participants.length > 0) {
      updateAllAttendanceCounts();
    }
  }, [courseDetails?.participants]);

  useEffect(() => {
    if (courseDetails?.instructures) {
      setSelectedInstructorIds(
        courseDetails.instructures.map(
          (instructor: { instructureId: string }) => instructor.instructureId
        )
      );
    }
  }, [courseDetails]);

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/course-schedule/${scheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedCourse),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update schedule");
      }

      // Refresh data and close modal
      fetchCourseSchedule();
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleParticipantSearch = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length === 0) {
      // If search is cleared, show all participants
      fetchAllParticipants();
    } else {
      // Filter the participants locally based on the query
      try {
        console.log("Filtering participants with query:", query);
        // Filter from already loaded participants if available
        if (availableParticipants.length > 0) {
          const filteredResults = availableParticipants.filter((p) =>
            p.name.toLowerCase().includes(query)
          );
          console.log("Filtered results:", filteredResults);
          setAvailableParticipants(filteredResults);
        } else {
          // If no participants are loaded yet, fetch from API
          const results = await searchParticipants(query);
          console.log("Search results from API:", results);
          setAvailableParticipants(results);
        }
      } catch (error) {
        console.error("Error filtering participants:", error);
      }
    }
  };

  const handleInstructureSearch = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    if (query.length > 1) {
      const results = await searchInstructures(query);
      setAvailableInstructures(results);
    } else {
      setAvailableInstructures([]);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParticipants.length === 0) {
      alert("Please select at least one participant");
      return;
    }

    try {
      // Add all selected participants
      for (const participant of selectedParticipants) {
        const response = await fetch(
          `/api/course-schedule/${scheduleId}/participant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ participantId: participant.id }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || `Failed to add participant ${participant.name}`
          );
        }
      }

      // Refresh data and close modal
      fetchCourseSchedule();
      setIsParticipantModalOpen(false);
      setSelectedParticipantId("");
      setSelectedParticipants([]);
      setAvailableParticipants([]);

      alert(`Successfully added ${selectedParticipants.length} participant(s)`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleAddInstructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructureId) {
      alert("Please select an instructor");
      return;
    }

    try {
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/instructure`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ instructureId: selectedInstructureId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add instructor");
      }

      // Refresh data and close modal
      fetchCourseSchedule();
      setIsInstructureModalOpen(false);
      setSelectedInstructureId("");
      setAvailableInstructures([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const openDeleteModal = (id: string, type: "participant" | "instructure") => {
    setSelectedItemId(id);
    setDeleteType(type);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItemId || !deleteType) return;

    try {
      let response;
      if (deleteType === "participant") {
        response = await fetch(
          `/api/course-schedule/${scheduleId}/participant?registrationId=${selectedItemId}`,
          {
            method: "DELETE",
          }
        );
      } else {
        response = await fetch(
          `/api/course-schedule/${scheduleId}/instructure?assignmentId=${selectedItemId}`,
          {
            method: "DELETE",
          }
        );
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to remove ${deleteType}`);
      }

      // Refresh data and close modal
      fetchCourseSchedule();
      setIsDeleteModalOpen(false);
      setSelectedItemId(null);
      setDeleteType(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSelectInstructor = async (instructorId: string) => {
    try {
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/instructure`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instructureId: instructorId,
          }),
        }
      );

      if (response.ok) {
        setSelectedInstructorIds((prev) => [...prev, instructorId]);
        // Update the course schedule to reflect the change
        fetchCourseSchedule();
      } else {
        console.error("Failed to add instructor");
      }
    } catch (error) {
      console.error("Error adding instructor:", error);
    }
  };

  const handleRemoveInstructor = async (instructorId: string) => {
    try {
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/instructure/${instructorId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSelectedInstructorIds((prev) =>
          prev.filter((id) => id !== instructorId)
        );
        // Update the course schedule to reflect the change
        fetchCourseSchedule();
      } else {
        console.error("Failed to remove instructor");
      }
    } catch (error) {
      console.error("Error removing instructor:", error);
    }
  };

  const handleOpenCertificateModal = async (participant: Participant) => {
    setSelectedParticipantForCertificate(participant);
    setIsCertificateModalOpen(true);
    setCertificateLoading(true);
    setCertificateError(null);

    try {
      // Fetch existing certificate data if available
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/certificate?participantId=${participant.participantId}`
      );

      if (response.ok) {
        const data = await response.json();
        setCertificateData({
          certificateNumber: data.certificateNumber || "",
          issueDate: data.issueDate
            ? new Date(data.issueDate).toISOString().split("T")[0]
            : "",
          pdfFile: null,
          pdfUrl: data.pdfUrl || "",
          driveLink: data.driveLink || "",
        });
      } else {
        // If no certificate exists yet, initialize with empty values
        setCertificateData({
          certificateNumber: "",
          issueDate: "",
          pdfFile: null,
          pdfUrl: "",
          driveLink: "",
        });
      }
    } catch (error) {
      console.error("Error fetching certificate data:", error);
      setCertificateError("Failed to load certificate data");
    } finally {
      setCertificateLoading(false);
    }
  };

  const handleCertificateInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCertificateData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCertificateFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateData((prev) => ({
        ...prev,
        pdfFile: e.target.files![0],
      }));
    }
  };

  const handleCertificateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantForCertificate) return;

    setCertificateLoading(true);
    setCertificateError(null);

    try {
      // Create or update the certificate
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/certificate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participantId: selectedParticipantForCertificate.participantId,
            certificateNumber: certificateData.certificateNumber,
            issueDate: certificateData.issueDate,
            pdfUrl: certificateData.pdfUrl,
            driveLink: certificateData.driveLink, // Include driveLink in request
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save certificate");
      }

      const createdCertificate = await response.json();

      // If we have a PDF file, upload it to storage and update the certificate
      if (certificateData.pdfFile) {
        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append("file", certificateData.pdfFile);
          formData.append("certificateId", createdCertificate.id);

          // Upload the PDF file
          const uploadResponse = await fetch("/api/certificate/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const uploadErrorData = await uploadResponse.json();
            console.error(
              "Certificate PDF upload failed:",
              uploadErrorData.error
            );
            toast.error("Certificate saved but PDF upload failed");
          } else {
            // Get the URL of the uploaded PDF
            const uploadData = await uploadResponse.json();

            // Update the certificate with the PDF URL
            const updateResponse = await fetch(
              `/api/certificate/${createdCertificate.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  pdfUrl: uploadData.fileUrl,
                }),
              }
            );

            if (updateResponse.ok) {
              toast.success("Certificate and PDF saved successfully");
            } else {
              toast.error("Certificate saved but PDF URL update failed");
            }
          }
        } catch (uploadError) {
          console.error("Error uploading PDF:", uploadError);
          toast.error("Certificate saved but PDF upload failed");
        }
      }

      // Success - close modal and refresh data
      setIsCertificateModalOpen(false);
      setSelectedParticipantForCertificate(null);
      fetchCourseSchedule();

      // Show success message
      toast.success("Certificate saved successfully");
    } catch (error) {
      console.error("Error saving certificate:", error);
      setCertificateError(
        error instanceof Error ? error.message : "Failed to save certificate"
      );
    } finally {
      setCertificateLoading(false);
    }
  };

  // Function to send certificate email manually
  const handleSendCertificateEmail = async () => {
    if (!selectedParticipantForCertificate) {
      toast.error("No participant selected");
      return;
    }

    setCertificateLoading(true);
    try {
      // Use the dedicated send-email endpoint
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/certificate/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participantId: selectedParticipantForCertificate.participantId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send certificate email");
      }

      toast.success(`Certificate email sent successfully to ${data.email}!`);
    } catch (error) {
      console.error("Error sending certificate email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send certificate email"
      );
    } finally {
      setCertificateLoading(false);
    }
  };

  // Function to send certificate email manually for instructor
  const handleSendInstructureCertificateEmail = async () => {
    if (!selectedInstructureForCertificate) {
      toast.error("No instructor selected");
      return;
    }

    setInstructureCertificateLoading(true);
    try {
      // Use the dedicated send-email endpoint for instructor
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/instructure/certificate/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instructureId: selectedInstructureForCertificate.instructureId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send certificate email");
      }

      toast.success(`Certificate email sent successfully to ${data.email}!`);
    } catch (error) {
      console.error("Error sending instructor certificate email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send certificate email"
      );
    } finally {
      setInstructureCertificateLoading(false);
    }
  };

  const handleOpenRegistrationModal = async (participant: Participant) => {
    setSelectedParticipantForRegistration(participant);
    setIsRegistrationModalOpen(true);
    setRegistrationLoading(true);
    setRegistrationError(null);

    try {
      // Fetch existing registration data
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/registration?participantId=${participant.participantId}`
      );

      if (response.ok) {
        const data = await response.json();
        setRegistrationData({
          registrationDate: data.registrationDate
            ? new Date(data.registrationDate).toISOString().split("T")[0]
            : "",
          paymentDate: data.paymentDate
            ? new Date(data.paymentDate).toISOString().split("T")[0]
            : "",
          paymentMethod: data.paymentMethod || "",
          payment: data.payment ? data.payment.toString() : "",
          presentDay: data.presentDay ? data.presentDay.toString() : "",
          paymentDetail: data.paymentDetail || "",
          paymentEvidence: data.paymentEvidence || "",
        });
      } else {
        // If error fetching data, initialize with empty values
        setRegistrationData({
          registrationDate: "",
          paymentDate: "",
          paymentMethod: "",
          payment: "",
          presentDay: "",
          paymentDetail: "",
          paymentEvidence: "",
        });
      }
    } catch (error) {
      console.error("Error fetching registration data:", error);
      setRegistrationError("Failed to load registration data");
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleRegistrationInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegistrationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantForRegistration) return;

    setRegistrationLoading(true);
    setRegistrationError(null);

    try {
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participantId: selectedParticipantForRegistration.participantId,
            registrationDate: registrationData.registrationDate,
            paymentDate: registrationData.paymentDate,
            paymentMethod: registrationData.paymentMethod,
            payment: registrationData.payment,
            presentDay: registrationData.presentDay,
            paymentDetail: registrationData.paymentDetail,
            paymentEvidence: registrationData.paymentEvidence,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update registration");
      }

      // Close modal and refresh data
      setIsRegistrationModalOpen(false);
      setSelectedParticipantForRegistration(null);
      fetchCourseSchedule(); // Refresh data
    } catch (error) {
      console.error("Error updating registration:", error);
      setRegistrationError(
        error instanceof Error ? error.message : "Failed to update registration"
      );
    } finally {
      setRegistrationLoading(false);
    }
  };

  const fetchParticipantValues = async (
    participantId: string,
    page: number
  ) => {
    setValueLoading(true);
    setValueError(null);

    try {
      const valueResponse = await fetch(
        `/api/course-schedule/${scheduleId}/participant/value?participantId=${participantId}&page=${page}`
      );

      if (!valueResponse.ok) {
        throw new Error("Failed to fetch values");
      }

      const data = await valueResponse.json();
      // Update to match the actual API response structure
      setValueData(data.values || []);
      setTotalValuePages(data.totalPages || 1);
      setValuePage(page);
    } catch (error) {
      console.error("Error fetching values:", error);
      setValueError(
        error instanceof Error ? error.message : "Failed to fetch values"
      );
    } finally {
      setValueLoading(false);
    }
  };

  const handleOpenValueModal = async (participant: Participant) => {
    setSelectedParticipantForValue(participant);
    setIsValueModalOpen(true);
    setValueLoading(true);
    setValueError(null);

    await fetchParticipantValues(participant.participantId, 1);
  };

  const handleValueInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewValue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddValue = async () => {
    if (!selectedParticipantForValue) return;
    if (!newValue.valueType || !newValue.value) {
      setValueError("Value type and value are required");
      return;
    }

    setValueLoading(true);
    setValueError(null);

    try {
      // Use the new alternative API endpoint
      const response = await fetch(`/api/participant/value-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId: selectedParticipantForValue.participantId,
          scheduleId: scheduleId, // Pass the current scheduleId
          valueType: newValue.valueType,
          remark: newValue.remark,
          value: newValue.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add value");
      }

      // Reset form and refresh values
      setNewValue({
        valueType: "",
        remark: "",
        value: "",
      });
      await fetchParticipantValues(
        selectedParticipantForValue.participantId,
        1
      );
    } catch (error) {
      console.error("Error adding value:", error);
      setValueError(
        error instanceof Error ? error.message : "Failed to add value"
      );

      // Add additional debugging for the error
      if (error instanceof Error) {
        console.log("Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
    } finally {
      setValueLoading(false);
    }
  };

  const handleEditValue = async (valueId: string) => {
    // Find the value item to edit
    const valueToEdit = valueData.find((item) => item.id === valueId);
    if (!valueToEdit) return;

    // Set the selected value for editing
    setSelectedValueForEdit(valueToEdit);
    setIsEditValueModalOpen(true);
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm("Are you sure you want to delete this value?")) return;

    setValueLoading(true);
    setValueError(null);

    try {
      // Delete the value using the API
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/value/${valueId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete value");
      }

      // Refresh the values list after deletion
      if (selectedParticipantForValue) {
        await fetchParticipantValues(
          selectedParticipantForValue.participantId,
          valuePage
        );
      }
    } catch (error) {
      console.error("Error deleting value:", error);
      setValueError(
        error instanceof Error ? error.message : "Failed to delete value"
      );
    } finally {
      setValueLoading(false);
    }
  };

  const handleEditValueInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (!selectedValueForEdit) return;

    setSelectedValueForEdit((prev) => ({
      ...prev!,
      [name]: value,
    }));
  };

  const handleEditValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedValueForEdit) return;

    setEditValueLoading(true);
    setEditValueError(null);

    try {
      const response = await fetch(`/api/participant/value-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedValueForEdit.id,
          valueType: selectedValueForEdit.valueType,
          remark: selectedValueForEdit.remark,
          value: selectedValueForEdit.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update value");
      }

      // Close modal and refresh values
      setIsEditValueModalOpen(false);
      setSelectedValueForEdit(null);

      if (selectedParticipantForValue) {
        await fetchParticipantValues(
          selectedParticipantForValue.participantId,
          valuePage
        );
      }
    } catch (error) {
      console.error("Error updating value:", error);
      setEditValueError(
        error instanceof Error ? error.message : "Failed to update value"
      );
    } finally {
      setEditValueLoading(false);
    }
  };

  const handleChangePage = async (newPage: number) => {
    if (!selectedParticipantForValue) return;
    if (newPage < 1 || newPage > totalValuePages) return;

    await fetchParticipantValues(
      selectedParticipantForValue.participantId,
      newPage
    );
  };

  const handleOpenDetailModal = async (participant: Participant) => {
    setSelectedParticipantForDetail(participant);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);

    try {
      console.log(
        `Fetching details for participant: ${participant.participantId}`
      );

      // Periksa apakah participant.participantId ada sebelum melakukan fetch
      if (!participant.participantId) {
        throw new Error("Participant ID tidak ditemukan");
      }

      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/detail?participantId=${participant.participantId}`
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API error response:", errorData);
        throw new Error(
          errorData.error || `Server responded with status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Detail data received:", data);

      // Pastikan data yang diterima valid
      if (
        !data ||
        (typeof data === "object" && Object.keys(data).length === 0)
      ) {
        throw new Error("Data tidak ditemukan atau kosong");
      }

      setDetailData(data);
    } catch (error) {
      console.error("Error fetching participant details:", error);
      setDetailError(
        error instanceof Error
          ? error.message
          : "Failed to fetch participant details"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // Handler untuk membuka modal absen
  const handleOpenAbsenModal = (participant: Participant) => {
    setSelectedAbsenParticipant(participant);
    setIsAbsenModalOpen(true);
    setAbsenStatus("hadir");
    setAbsenMode("offline");
    setAbsenDate(new Date().toISOString().slice(0, 10));
    setAbsenError(null);
    setAbsenTime(new Date().toTimeString().slice(0, 5)); // format HH:mm
  };

  // Handler submit absen
  const handleSubmitAbsen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsenParticipant) return;
    setAbsenLoading(true);
    setAbsenError(null);
    try {
      const absenDateTime = absenDate + "T" + absenTime + ":00";
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/attendance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: selectedAbsenParticipant.participantId,
            status: absenStatus === "hadir" ? "present" : "absent",
            mode: absenMode,
            date: absenDateTime,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit attendance");
      }

      const data = await response.json();

              // Update presentDay di UI
        if (data.presentCount !== undefined) {
          setCourseDetails((prevDetails) => {
            if (!prevDetails) return null;
            return {
              ...prevDetails,
              participants: prevDetails.participants.map((p) =>
                p.participantId === selectedAbsenParticipant?.participantId
                  ? { ...p, presentDay: `${data.presentCount} days` }
                  : p
              )
            } as CourseSchedule;
          });
        }

      setIsAbsenModalOpen(false); 
      setSelectedAbsenParticipant(null);
    } catch (err: any) {
      setAbsenError(err.message || "Failed to submit attendance");
    } finally {
      setAbsenLoading(false);
    }
  };

  const handleOpenAttendanceDetail = async (participant: Participant) => {
    setSelectedAttendanceParticipant(participant);
    setIsAttendanceDetailModalOpen(true);
    setAttendanceDetailLoading(true);
    setAttendanceDetailError(null);
    try {
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/participant/attendance?participantId=${participant.participantId}`
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch attendance detail");
      }
      const data = await response.json();
      setAttendanceDetail(data.attendances || []);

      // Hitung jumlah kehadiran dengan status "present"
      const presentCount = (data.attendances || []).filter(
        (att: any) => att.status === "present"
      ).length;

      // Update presentDay di UI
      setCourseDetails((prevDetails) => {
        if (!prevDetails) return prevDetails;
        return prevDetails as CourseSchedule;
      });

      // Perbarui nilai present_day di database
      await fetch(
        `/api/course-schedule/${scheduleId}/participant/update-present-day`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: participant.participantId,
            presentDay: presentCount,
          }),
        }
      );
    } catch (err: any) {
      setAttendanceDetailError(
        err.message || "Failed to fetch attendance detail"
      );
    } finally {
      setAttendanceDetailLoading(false);
    }
  };

  // Handler buka modal edit
  const handleOpenEditAttendance = (att: any) => {
    setEditAttendanceData({ ...att });
    setIsEditAttendanceModalOpen(true);
  };
  // Handler buka modal delete
  const handleOpenDeleteAttendance = (id: any) => {
    setDeleteAttendanceId(id);
    setIsDeleteAttendanceModalOpen(true);
  };
  // Handler update attendance
  const handleUpdateAttendance = async (e: any) => {
    e.preventDefault();
    setAttendanceActionLoading(true);
    try {
      const absenDate = editAttendanceData.date.slice(0, 10);
      const absenTime = new Date(editAttendanceData.date)
        .toTimeString()
        .slice(0, 5);
      const absenDateTime = absenDate + "T" + absenTime + ":00";
      const res = await fetch(
        `/api/course-schedule/${scheduleId}/participant/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendanceId: editAttendanceData.id,
            status: editAttendanceData.status,
            mode: editAttendanceData.mode,
            date: absenDateTime,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update attendance");

      const data = await res.json();

      // Update presentDay di UI
      if (data.presentCount !== undefined && selectedAttendanceParticipant) {
        setCourseDetails((prevDetails) => {
          if (!prevDetails) return null;
          return {
            ...prevDetails,
            participants: prevDetails.participants.map((p) =>
              p.participantId === selectedAttendanceParticipant?.participantId
                ? { ...p, presentDay: `${data.presentCount} days` }
                : p
            )
          } as CourseSchedule;
        });
      }

      setIsEditAttendanceModalOpen(false);
      setEditAttendanceData(null);
      if (selectedAttendanceParticipant) {
        await handleOpenAttendanceDetail(selectedAttendanceParticipant);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAttendanceActionLoading(false);
    }
  };
  // Handler delete attendance
  const handleDeleteAttendance = async () => {
    setAttendanceActionLoading(true);
    try {
      const res = await fetch(
        `/api/course-schedule/${scheduleId}/participant/attendance`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendanceId: deleteAttendanceId }),
        }
      );
      if (!res.ok) throw new Error("Failed to delete attendance");

      const data = await res.json();

      // Update presentDay di UI
      if (data.presentCount !== undefined && selectedAttendanceParticipant) {
        setCourseDetails((prevDetails) => {
          if (!prevDetails) return null;
          return {
            ...prevDetails,
            participants: prevDetails.participants.map((p) =>
              p.participantId === selectedAttendanceParticipant?.participantId
                ? { ...p, presentDay: `${data.presentCount} days` }
                : p
            )
          } as CourseSchedule;
        });
      }

      setIsDeleteAttendanceModalOpen(false);
      setDeleteAttendanceId(null);
      if (selectedAttendanceParticipant) {
        await handleOpenAttendanceDetail(selectedAttendanceParticipant);
      }
    } catch (err) {       
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAttendanceActionLoading(false);
    }
  };

  // Handler buka modal sertifikat instructure
  const handleOpenInstructureCertificateModal = async (
    instructure: Instructure
  ) => {
    setSelectedInstructureForCertificate(instructure);
    setIsInstructureCertificateModalOpen(true);
    setInstructureCertificateLoading(true);
    setInstructureCertificateError(null);
    try {
      // Fetch existing certificate data if available
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/instructure/certificate?instructureId=${instructure.instructureId}`
      );
      if (response.ok) {
        const data = await response.json();
        setInstructureCertificateData({
          certificateNumber: data.certificateNumber || "",
          issueDate: data.issueDate
            ? new Date(data.issueDate).toISOString().split("T")[0]
            : "",
          pdfFile: null,
          pdfUrl: data.pdfUrl || "",
          driveLink: data.driveLink || "",
        });
      } else {
        setInstructureCertificateData({
          certificateNumber: "",
          issueDate: "",
          pdfFile: null,
          pdfUrl: "",
          driveLink: "",
        });
      }
    } catch (error) {
      setInstructureCertificateError("Failed to load certificate data");
    } finally {
      setInstructureCertificateLoading(false);
    }
  };

  const handleInstructureCertificateInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setInstructureCertificateData((prev) => ({ ...prev, [name]: value }));
  };
  const handleInstructureCertificateFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setInstructureCertificateData((prev) => ({
        ...prev,
        pdfFile: e.target.files![0],
      }));
    }
  };
  const handleInstructureCertificateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructureForCertificate) return;
    setInstructureCertificateLoading(true);
    setInstructureCertificateError(null);
    try {
      // Create or update the certificate
      const response = await fetch(
        `/api/course-schedule/${scheduleId}/instructure/certificate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instructureId: selectedInstructureForCertificate.instructureId,
            certificateNumber: instructureCertificateData.certificateNumber,
            issueDate: instructureCertificateData.issueDate,
            pdfUrl: instructureCertificateData.pdfUrl,
            driveLink: instructureCertificateData.driveLink,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save certificate");
      }
      const createdCertificate = await response.json();

      // Jika ada file PDF, upload
      if (instructureCertificateData.pdfFile) {
        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append("file", instructureCertificateData.pdfFile);
          formData.append("certificateId", createdCertificate.id);

          // Upload the PDF file
          const uploadResponse = await fetch("/api/certificate/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const uploadErrorData = await uploadResponse.json();
            console.error(
              "Certificate PDF upload failed:",
              uploadErrorData.error
            );
            toast.error("Sertifikat disimpan tetapi gagal mengunggah PDF");
          } else {
            // Get the URL of the uploaded PDF
            const uploadData = await uploadResponse.json();

            // Update the certificate with the PDF URL
            const updateResponse = await fetch(
              `/api/certificate/${createdCertificate.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  pdfUrl: uploadData.fileUrl,
                }),
              }
            );

            if (updateResponse.ok) {
              toast.success("Sertifikat dan PDF berhasil disimpan");
            } else {
              toast.error(
                "Sertifikat disimpan tetapi gagal memperbarui URL PDF"
              );
            }
          }
        } catch (uploadError) {
          console.error("Error uploading PDF:", uploadError);
          toast.error("Sertifikat disimpan tetapi gagal mengunggah PDF");
        }
      } else {
        toast.success("Sertifikat berhasil disimpan");
      }

      setIsInstructureCertificateModalOpen(false);
      setSelectedInstructureForCertificate(null);
      fetchCourseSchedule();
    } catch (error) {
      setInstructureCertificateError(
        error instanceof Error ? error.message : "Failed to save certificate"
      );
    } finally {
      setInstructureCertificateLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => router.push("/course-schedule")}
            className="text-xs px-2 py-1"
          >
            Back to Schedules
          </Button>
        </div>
      </Layout>
    );
  }

  if (!courseDetails) {
    return (
      <Layout>
        <div className="p-2">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-4">
            Course schedule not found
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => router.push("/course-schedule")}
            className="text-xs px-2 py-1"
          >
            Back to Schedules
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="admin">
      <div className="p-2">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-lg md:text-xl text-gray-700">
            Course Schedule Detail
          </h1>
          <Button
            variant="gray"
            size="small"
            onClick={() => router.push("/course-schedule")}
            className="text-xs px-2 py-1"
          >
            Back
          </Button>
        </div>

        {/* Course Details Card */}
        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <h2 className="text-base md:text-lg text-gray-700 mb-2">
            {courseDetails.className}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="text-xs sm:text-sm">
              <p className="text-gray-600 mb-1">Date :</p>
              <p className="text-gray-600 mb-1">Registration Date :</p>
              <p className="text-gray-600 mb-1">Location :</p>
              <p className="text-gray-600 mb-1">Room :</p>
              <p className="text-gray-600 mb-1">Price :</p>
              <p className="text-gray-600 mb-1">Quota :</p>
              <p className="text-gray-600 mb-1">Status :</p>
            </div>
            <div className="text-xs sm:text-sm">
              <p className="text-gray-800 mb-1">{courseDetails.date}</p>
              <p className="text-gray-800 mb-1">
                {courseDetails.registrationDate}
              </p>
              <p className="text-gray-800 mb-1">{courseDetails.location}</p>
              <p className="text-gray-800 mb-1">{courseDetails.room}</p>
              <p className="text-gray-800 mb-1">
                Rp {courseDetails.price.toLocaleString("id-ID")}
              </p>
              <p className="text-gray-800 mb-1">
                {courseDetails.quota} participants
              </p>
              <p className="text-gray-800 mb-2">
                <span
                  className={`px-2 py-1 rounded-full ${
                    courseDetails.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : courseDetails.status === "Completed"
                      ? "bg-blue-100 text-blue-800"
                      : courseDetails.status === "Canceled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {courseDetails.status}
                </span>
              </p>
              <Button
                className="w-full sm:w-auto text-xs float-right"
                variant="green"
                size="small"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Schedule
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-3">
          <button
            className={`px-3 py-2 text-center flex-1 text-xs ${
              activeTab === "participant"
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-gray-600"
            } rounded-l-lg`}
            onClick={() => setActiveTab("participant")}
          >
            Participant
          </button>
          <button
            className={`px-3 py-2 flex-1 text-xs ${
              activeTab === "instructure"
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setActiveTab("instructure")}
          >
            Instructure
          </button>
          <button
            className={`px-3 py-2 flex-1 text-xs ${
              activeTab === "elearning"
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-gray-600"
            } rounded-r-lg`}
            onClick={() => setActiveTab("elearning")}
          >
            E-Learning
          </button>
        </div>

        {/* Participant List */}
        {activeTab === "participant" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
              <Button
                variant="primary"
                size="small"
                onClick={() => {
                  setIsParticipantModalOpen(true);
                  fetchAllParticipants();
                }}
                className="w-full sm:w-auto text-xs"
              >
                Add Participant
              </Button>
              <div className="text-xs text-gray-600">
                {courseDetails.participants.length} Participants
              </div>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs text-gray-700">No</th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Participant
                    </th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Present
                    </th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Payment Status
                    </th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseDetails.participants.length > 0 ? (
                    courseDetails.participants.map((participant, index) => (
                      <tr
                        key={participant.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2 text-xs text-gray-700">
                          {index + 1}
                        </td>
                        <td className="p-2 text-xs text-gray-700">
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                            {participant.name}
                          </div>
                        </td>
                        <td className="p-2 text-xs text-gray-700">
                          {participant.presentDay}
                        </td>
                        <td className="p-2 text-xs text-gray-700">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              participant.paymentStatus === "Paid"
                                ? "bg-green-100 text-green-800"
                                : participant.paymentStatus === "Partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {participant.paymentStatus}
                          </span>
                        </td>
                        <td className="p-0 text-center">
                          <div className="flex gap-1">
                            <button
                              className="p-1 border rounded hover:bg-gray-100"
                              title="Certificate"
                              onClick={() =>
                                handleOpenCertificateModal(participant)
                              }
                            >
                              <Award size={14} className="text-blue-500" />
                            </button>

                            <button
                              className="p-1 border rounded hover:bg-gray-100"
                              title="Value"
                              onClick={() => handleOpenValueModal(participant)}
                            >
                              <BarChart size={14} className="text-purple-500" />
                            </button>
                            <button
                              className="p-1 border rounded hover:bg-gray-100"
                              title="Detail"
                              onClick={() => handleOpenDetailModal(participant)}
                            >
                              <Info size={14} className="text-teal-500" />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              title="Remove Participant"
                              onClick={() =>
                                openDeleteModal(participant.id, "participant")
                              }
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                            <button
                              className="p-1 border rounded hover:bg-blue-100"
                              title="Absen"
                              onClick={() => handleOpenAbsenModal(participant)}
                            >
                              <UserCheck size={14} className="text-blue-500" />
                            </button>
                            <button
                              className="p-1 border rounded hover:bg-amber-100"
                              title="View Attendance Detail"
                              onClick={() =>
                                handleOpenAttendanceDetail(participant)
                              }
                            >
                              <History size={14} className="text-amber-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-gray-500 text-xs"
                      >
                        No participants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <pre className="text-xs text-gray-400 bg-gray-50 p-2 mt-2 rounded">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructure Tab Content */}
        {activeTab === "instructure" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
              <Button
                variant="primary"
                size="small"
                onClick={() => setIsInstructorSelectionModalOpen(true)}
                className="w-full sm:w-auto text-xs"
              >
                Add Instructors
              </Button>
              <div className="text-xs text-gray-600">
                {courseDetails.instructures.length} Instructors
              </div>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs text-gray-700">No</th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Instructor
                    </th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Phone
                    </th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Profiency
                    </th>
                    <th className="text-left p-2 text-xs text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseDetails.instructures.length > 0 ? (
                    courseDetails.instructures.map((instructure, index) => (
                      <tr
                        key={instructure.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2 text-xs text-gray-700">
                          {index + 1}
                        </td>
                        <td className="p-2 text-xs text-gray-700">
                          <div className="flex items-center gap-1">
                            {instructure.photo ? (
                              <Image
                                src={instructure.photo}
                                alt={instructure.name}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                            )}
                            {instructure.name}
                          </div>
                        </td>
                        <td className="p-2 text-xs text-gray-700">
                          {instructure.phoneNumber || "-"}
                        </td>
                        <td className="p-2 text-xs text-gray-700">
                          {instructure.profiency || "-"}
                        </td>
                        <td className="p-2 text-xs text-gray-700">
                          <div className="flex gap-1">
                            <button
                              className="p-1 border rounded hover:bg-gray-100"
                              title="Give Certificate"
                              onClick={() =>
                                handleOpenInstructureCertificateModal(
                                  instructure
                                )
                              }
                            >
                              <Award size={14} className="text-blue-500" />
                            </button>
                            <button
                              className="p-1 border rounded hover:bg-gray-100"
                              title="Delete"
                              onClick={() =>
                                openDeleteModal(instructure.id, "instructure")
                              }
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-gray-500 text-xs"
                      >
                        No instructors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* E-Learning Tab Content */}
        {activeTab === "elearning" && (
          <div>
            <ELearningTab courseId={scheduleId} />
          </div>
        )}

        {/* Edit Schedule Modal */}
        {isEditModalOpen && (
          <Modal onClose={() => setIsEditModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Edit Course Schedule
            </h2>
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editedCourse.status}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={editedCourse.startDate}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={editedCourse.endDate}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Registration Start Date
                  </label>
                  <input
                    type="date"
                    name="startRegDate"
                    value={editedCourse.startRegDate}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Registration End Date
                  </label>
                  <input
                    type="date"
                    name="endRegDate"
                    value={editedCourse.endRegDate}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={editedCourse.location}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={editedCourse.room}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={editedCourse.price}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Quota
                  </label>
                  <input
                    type="number"
                    name="quota"
                    value={editedCourse.quota}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    name="durationDay"
                    value={editedCourse.durationDay}
                    onChange={handleEditInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="green"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Participant Modal */}
        {isParticipantModalOpen && (
          <Modal
            onClose={() => {
              setIsParticipantModalOpen(false);
              setAvailableParticipants([]);
              setSelectedParticipantId("");
              setSelectedParticipants([]);
            }}
          >
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              Add Participant
            </h2>
            <form onSubmit={handleAddParticipant}>
              <div className="space-y-3">
                <div className="mt-2 max-h-60 overflow-y-auto border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                          No
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                          Select
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingParticipants ? (
                        <tr>
                          <td colSpan={4} className="px-2 py-8 text-center">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Loading participants...
                            </p>
                          </td>
                        </tr>
                      ) : availableParticipants.length > 0 ? (
                        availableParticipants.map((participant, index) => (
                          <tr key={participant.id}>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                              {index + 1}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                              {participant.name}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                              {participant.phone_number || "-"}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedParticipants((prev) => [
                                      ...prev,
                                      participant,
                                    ]);
                                  } else {
                                    setSelectedParticipants((prev) =>
                                      prev.filter(
                                        (p) => p.id !== participant.id
                                      )
                                    );
                                  }
                                }}
                                checked={selectedParticipants.some(
                                  (p) => p.id === participant.id
                                )}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-2 py-4 text-center text-xs text-gray-500"
                          >
                            No participants found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedParticipants.length > 0 && (
                  <div className="p-2 border rounded bg-gray-50">
                    <p className="text-xs font-medium">
                      Selected Participants: {selectedParticipants.length}
                    </p>
                    <div className="max-h-20 overflow-y-auto mt-1">
                      {selectedParticipants.map((p) => (
                        <div
                          key={p.id}
                          className="text-xs flex justify-between items-center py-1"
                        >
                          <span>{p.name}</span>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() =>
                              setSelectedParticipants((prev) =>
                                prev.filter((sp) => sp.id !== p.id)
                              )
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => {
                    setIsParticipantModalOpen(false);
                    setAvailableParticipants([]);
                    setSelectedParticipantId("");
                    setSelectedParticipants([]);
                  }}
                  className="px-4 py-2 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  disabled={selectedParticipants.length === 0}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedParticipants.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Add {selectedParticipants.length} Participant
                  {selectedParticipants.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Instructor Selection Modal */}
        {isInstructorSelectionModalOpen && (
          <Modal onClose={() => setIsInstructorSelectionModalOpen(false)}>
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              Manage Instructors
            </h2>
            <div className="space-y-3">
              <div className="mt-2 max-h-60 overflow-y-auto border rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        No
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        Select
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allInstructors.length > 0 ? (
                      allInstructors.map((instructor, index) => {
                        console.log("Rendering instructor:", instructor);
                        return (
                          <tr key={instructor.id}>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                              {index + 1}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                              {instructor.full_name ||
                                instructor.name ||
                                "Unknown"}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                              {instructor.phone_number ||
                                instructor.phoneNumber ||
                                "-"}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleSelectInstructor(instructor.id);
                                  } else {
                                    handleRemoveInstructor(instructor.id);
                                  }
                                }}
                                checked={selectedInstructorIds.includes(
                                  instructor.id
                                )}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-2 py-4 text-center text-xs text-gray-500"
                        >
                          No instructors found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedInstructorIds.length > 0 && (
                <div className="p-2 border rounded bg-gray-50">
                  <p className="text-xs font-medium">
                    Selected Instructors: {selectedInstructorIds.length}
                  </p>
                  <div className="max-h-20 overflow-y-auto mt-1">
                    {selectedInstructorIds.map((id) => {
                      const instructor = allInstructors.find(
                        (i) => i.id === id
                      );
                      return instructor ? (
                        <div
                          key={id}
                          className="text-xs flex justify-between items-center py-1"
                        >
                          <span>{instructor.full_name}</span>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveInstructor(id)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="primary"
                size="small"
                onClick={() => setIsInstructorSelectionModalOpen(false)}
                className="text-xs px-4 py-1"
              >
                Done
              </Button>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && deleteType && (
          <Modal
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedItemId(null);
              setDeleteType(null);
            }}
          >
            <h2 className="text-base font-semibold text-gray-700">
              Confirm Delete
            </h2>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to remove this {deleteType}?
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="gray"
                size="small"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedItemId(null);
                  setDeleteType(null);
                }}
                className="text-xs px-2 py-1"
              >
                Cancel
              </Button>
              <Button
                variant="red"
                size="small"
                onClick={handleDeleteConfirm}
                className="text-xs px-2 py-1"
              >
                Delete
              </Button>
            </div>
          </Modal>
        )}

        {/* Certificate Modal */}
        {isCertificateModalOpen && selectedParticipantForCertificate && (
          <Modal
            onClose={() => {
              setIsCertificateModalOpen(false);
              setSelectedParticipantForCertificate(null);
            }}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Issue Certificate
            </h2>
            <form onSubmit={handleCertificateSubmit} className="space-y-4">
              <p className="text-gray-600">
                Issuing certificate for{" "}
                <span className="font-semibold">
                  {selectedParticipantForCertificate.name}
                </span>
              </p>

              <div>
                <label
                  htmlFor="certificateNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Certificate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="certificateNumber"
                  name="certificateNumber"
                  required
                  placeholder="e.g. CERT/2023/001"
                  value={certificateData.certificateNumber}
                  onChange={handleCertificateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="issueDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  required
                  value={certificateData.issueDate}
                  onChange={handleCertificateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="driveLink"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Google Drive Link
                </label>
                <input
                  type="url"
                  id="driveLink"
                  name="driveLink"
                  placeholder="https://drive.google.com/file/d/..."
                  value={certificateData.driveLink}
                  onChange={handleCertificateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Paste Google Drive link to share with participant
                </p>
              </div>

              {certificateError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {certificateError}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  onClick={() => {
                    setIsCertificateModalOpen(false);
                    setSelectedParticipantForCertificate(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  disabled={certificateLoading}
                >
                  {certificateLoading ? (
                    <>
                      <span className="inline-block mr-2 animate-spin">↻</span>{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Certificate"
                  )}
                </button>
              </div>
              
              {/* Send Email Button - Only show if certificate exists */}
              {certificateData.certificateNumber && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Send certificate notification to participant
                    </p>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 flex items-center gap-2"
                      onClick={handleSendCertificateEmail}
                      disabled={certificateLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Email
                    </button>
                  </div>
                </div>
              )}
            </form>
          </Modal>
        )}

        {/* Value Modal */}
        {isValueModalOpen && selectedParticipantForValue && (
          <Modal
            onClose={() => {
              setIsValueModalOpen(false);
              setSelectedParticipantForValue(null);
            }}
          >
            <div className="p-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Value</h2>
              </div>

              {valueError && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded text-xs mb-4">
                  {valueError}
                </div>
              )}

              {/* Add Value Form */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-medium mb-2 text-gray-700">
                  Add New Value
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Value Type
                    </label>
                    <input
                      type="text"
                      name="valueType"
                      placeholder=""
                      value={newValue.valueType}
                      onChange={handleValueInputChange}
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Remark
                    </label>
                    <input
                      type="text"
                      name="remark"
                      placeholder=""
                      value={newValue.remark}
                      onChange={handleValueInputChange}
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      name="value"
                      placeholder=""
                      value={newValue.value}
                      onChange={handleValueInputChange}
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring- focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                    onClick={handleAddValue}
                    disabled={valueLoading}
                  >
                    {valueLoading ? "Adding..." : "Add Value"}
                  </button>
                </div>
              </div>

              <div className="mb-4 flex justify-end">
                <button
                  className="bg-green-600 text-white px-4 py-1 rounded text-xs flex items-center gap-1"
                  onClick={() =>
                    selectedParticipantForValue &&
                    fetchParticipantValues(
                      selectedParticipantForValue.participantId,
                      valuePage
                    )
                  }
                  disabled={valueLoading}
                >
                  Refresh
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>

              {valueLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-lg shadow-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-xs text-gray-700 w-16">
                            NO
                          </th>
                          <th className="text-left p-2 text-xs text-gray-700">
                            Value Type
                          </th>
                          <th className="text-left p-2 text-xs text-gray-700">
                            Remark
                          </th>
                          <th className="text-left p-2 text-xs text-gray-700">
                            Value
                          </th>
                          <th className="text-left p-2 text-xs text-gray-700 w-24">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {valueData.length > 0 ? (
                          valueData.map((item, index) => (
                            <tr
                              key={item.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-2 text-xs text-gray-700">
                                {index + 1}
                              </td>
                              <td className="p-2 text-xs text-gray-700">
                                {item.valueType}
                              </td>
                              <td className="p-2 text-xs text-gray-700">
                                {item.remark}
                              </td>
                              <td className="p-2 text-xs text-gray-700">
                                {item.value}
                              </td>
                              <td className="p-2 flex gap-2">
                                <button
                                  className="flex items-center gap-1 text-xs text-gray-700"
                                  onClick={() => handleEditValue(item.id)}
                                >
                                  <Edit size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-red-600"
                                  onClick={() => handleDeleteValue(item.id)}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-4 text-center text-gray-500 text-xs"
                            >
                              No values found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-1">
                      <button
                        className="p-1 border rounded text-xs text-gray-500"
                        onClick={() => handleChangePage(1)}
                        disabled={valuePage === 1}
                      >
                        «
                      </button>
                      <button
                        className="p-1 border rounded text-xs text-gray-500"
                        onClick={() => handleChangePage(valuePage - 1)}
                        disabled={valuePage === 1}
                      >
                        ‹
                      </button>

                      {/* Page numbers */}
                      {Array.from(
                        { length: Math.min(5, totalValuePages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              className={`p-1 border rounded text-xs ${
                                valuePage === pageNum
                                  ? "bg-gray-100"
                                  : "text-gray-500"
                              }`}
                              onClick={() => handleChangePage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}

                      <button
                        className="p-1 border rounded text-xs text-gray-500"
                        onClick={() => handleChangePage(valuePage + 1)}
                        disabled={valuePage === totalValuePages}
                      >
                        ›
                      </button>
                      <button
                        className="p-1 border rounded text-xs text-gray-500"
                        onClick={() => handleChangePage(totalValuePages)}
                        disabled={valuePage === totalValuePages}
                      >
                        »
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="border rounded px-4 py-1 text-xs bg-gray-50 text-gray-700"
                        onClick={() => {
                          setIsValueModalOpen(false);
                          setSelectedParticipantForValue(null);
                        }}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}

        {/* Detail Modal */}

        {isDetailModalOpen && selectedParticipantForDetail && (
          <Modal
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedParticipantForDetail(null);
            }}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Participant Detail
            </h2>

            {detailLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : detailError ? (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                <p className="font-medium">Error:</p>
                <p className="mb-3">{detailError}</p>
                <div className="flex justify-center">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : detailData ? (
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserCheck size={24} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">
                      {detailData?.personalInfo?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {detailData?.personalInfo?.email}
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="font-medium mb-2 text-gray-700">
                    Personal Information
                  </h3>
                  {detailData?.personalInfo ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Full Name</p>
                        <p className="text-gray-700">
                          {detailData?.personalInfo?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="text-gray-700">
                          {detailData?.personalInfo?.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="text-gray-700">
                          {detailData?.personalInfo?.phone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Address</p>
                        <p className="text-gray-700">
                          {detailData?.personalInfo?.address || "N/A"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Informasi personal tidak tersedia
                    </p>
                  )}
                </div>

                {/* Course Information */}
                <div>
                  <h3 className="font-medium mb-2 text-gray-700">
                    Course Information
                  </h3>
                  {detailData?.courseInfo ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Present Days</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.presentDays || "0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Days</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.totalDays || "0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Status</p>
                        <p
                          className={`${
                            detailData?.courseInfo?.paymentStatus === "Paid"
                              ? "text-green-600"
                              : detailData?.courseInfo?.paymentStatus ===
                                "Partial"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {detailData?.courseInfo?.paymentStatus || "Unpaid"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Registration Status</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.regStatus || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Joined Date</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.joinedDate
                            ? new Date(
                                detailData.courseInfo.joinedDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Informasi kursus tidak tersedia
                    </p>
                  )}
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="font-medium mb-2 text-gray-700">
                    Payment Information
                  </h3>
                  {detailData?.courseInfo?.payment ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Amount Paid</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.payment?.amount
                            ? `${detailData.courseInfo.payment.amount.toLocaleString()} Rp`
                            : "0 Rp"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Price</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.payment?.total
                            ? `${detailData.courseInfo.payment.total.toLocaleString()} Rp`
                            : "0 Rp"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.payment?.method || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Date</p>
                        <p className="text-gray-700">
                          {detailData?.courseInfo?.payment?.date
                            ? new Date(
                                detailData.courseInfo.payment.date
                              ).toLocaleDateString()
                            : "Not paid yet"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Informasi pembayaran tidak tersedia
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="gray"
                    size="small"
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setSelectedParticipantForDetail(null);
                    }}
                    className="text-xs px-6 py-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </Modal>
        )}

        {/* Edit Value Modal */}
        {isEditValueModalOpen && selectedValueForEdit && (
          <Modal
            onClose={() => {
              setIsEditValueModalOpen(false);
              setSelectedValueForEdit(null);
            }}
          >
            <div className="p-2">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Edit Value
              </h2>

              {editValueError && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded text-xs mb-4">
                  {editValueError}
                </div>
              )}

              <form onSubmit={handleEditValueSubmit}>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Value Type
                    </label>
                    <input
                      type="text"
                      name="valueType"
                      value={selectedValueForEdit.valueType}
                      onChange={handleEditValueInputChange}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Remark
                    </label>
                    <input
                      type="text"
                      name="remark"
                      value={selectedValueForEdit.remark}
                      onChange={handleEditValueInputChange}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      name="value"
                      value={selectedValueForEdit.value}
                      onChange={handleEditValueInputChange}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="border rounded px-4 py-1 text-xs bg-gray-50"
                    onClick={() => {
                      setIsEditValueModalOpen(false);
                      setSelectedValueForEdit(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white rounded px-4 py-1 text-xs"
                    disabled={editValueLoading}
                  >
                    {editValueLoading ? "Updating..." : "Update Value"}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {isAbsenModalOpen && selectedAbsenParticipant && (
          <Modal onClose={() => setIsAbsenModalOpen(false)}>
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              Mark Attendance
            </h2>
            <form onSubmit={handleSubmitAbsen} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Participant Name
                </label>
                <div className="font-semibold text-sm text-gray-800 mb-2">
                  {selectedAbsenParticipant.name}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Attendance Status
                </label>
                <div className="flex gap-4 mt-1">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="absenStatus"
                      value="hadir"
                      checked={absenStatus === "hadir"}
                      onChange={() => setAbsenStatus("hadir")}
                      className="form-radio h-4 w-4 text-green-600"
                    />
                    <span className="ml-2 text-sm">Present</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="absenStatus"
                      value="tidak_hadir"
                      checked={absenStatus === "tidak_hadir"}
                      onChange={() => setAbsenStatus("tidak_hadir")}
                      className="form-radio h-4 w-4 text-red-600"
                    />
                    <span className="ml-2 text-sm">Absent</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Attendance Mode
                </label>
                <select
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={absenMode}
                  onChange={(e) => setAbsenMode(e.target.value)}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={absenDate}
                  onChange={(e) => setAbsenDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Attendance Time
                </label>
                <input
                  type="time"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={absenTime}
                  onChange={(e) => setAbsenTime(e.target.value)}
                  required
                />
              </div>
              {absenError && (
                <div className="text-xs text-red-600">{absenError}</div>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="gray"
                  size="small"
                  type="button"
                  onClick={() => setIsAbsenModalOpen(false)}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="green"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={absenLoading}
                >
                  {absenLoading ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {isAttendanceDetailModalOpen && selectedAttendanceParticipant && (
          <Modal onClose={() => setIsAttendanceDetailModalOpen(false)}>
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              Attendance Detail
            </h2>
            <div className="mb-2 text-sm font-medium text-gray-800">
              {selectedAttendanceParticipant.name}
            </div>
            {attendanceDetailLoading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : attendanceDetailError ? (
              <div className="text-xs text-red-600">
                {attendanceDetailError}
              </div>
            ) : attendanceDetail.length === 0 ? (
              <div className="text-xs text-gray-500">
                No attendance records found.
              </div>
            ) : (
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr>
                    <th className="text-left p-1">Date</th>
                    <th className="text-left p-1">Status</th>
                    <th className="text-left p-1">Mode</th>
                    <th className="text-left p-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceDetail.map((att) => (
                    <tr key={att.id}>
                      <td className="p-1">
                        {new Date(att.date).toLocaleString()}
                      </td>
                      <td className="p-1">{att.status}</td>
                      <td className="p-1">{att.mode}</td>
                      <td className="p-1">
                        <button
                          className="text-blue-600 underline mr-2"
                          onClick={() => handleOpenEditAttendance(att)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 underline"
                          onClick={() => handleOpenDeleteAttendance(att.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-end mt-4">
              <Button
                variant="gray"
                size="small"
                onClick={() => setIsAttendanceDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </Modal>
        )}
        {isEditAttendanceModalOpen && editAttendanceData && (
          <Modal onClose={() => setIsEditAttendanceModalOpen(false)}>
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              Edit Attendance
            </h2>
            <form onSubmit={handleUpdateAttendance} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-2 py-1 text-xs border rounded"
                  value={editAttendanceData.status}
                  onChange={(e) =>
                    setEditAttendanceData({
                      ...editAttendanceData,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Mode</label>
                <select
                  className="w-full px-2 py-1 text-xs border rounded"
                  value={editAttendanceData.mode}
                  onChange={(e) =>
                    setEditAttendanceData({
                      ...editAttendanceData,
                      mode: e.target.value,
                    })
                  }
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-2 py-1 text-xs border rounded"
                  value={editAttendanceData.date.slice(0, 10)}
                  onChange={(e) =>
                    setEditAttendanceData({
                      ...editAttendanceData,
                      date:
                        e.target.value +
                        "T" +
                        new Date(editAttendanceData.date)
                          .toTimeString()
                          .slice(0, 5) +
                        ":00",
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  className="w-full px-2 py-1 text-xs border rounded"
                  value={new Date(editAttendanceData.date)
                    .toTimeString()
                    .slice(0, 5)}
                  onChange={(e) =>
                    setEditAttendanceData({
                      ...editAttendanceData,
                      date:
                        editAttendanceData.date.slice(0, 10) +
                        "T" +
                        e.target.value +
                        ":00",
                    })
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="gray"
                  size="small"
                  type="button"
                  onClick={() => setIsEditAttendanceModalOpen(false)}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="green"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={attendanceActionLoading}
                >
                  {attendanceActionLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
        {isDeleteAttendanceModalOpen && (
          <Modal onClose={() => setIsDeleteAttendanceModalOpen(false)}>
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              Delete Attendance
            </h2>
            <div className="mb-4">
              Are you sure you want to delete this attendance?
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="gray"
                size="small"
                onClick={() => setIsDeleteAttendanceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="red"
                size="small"
                onClick={handleDeleteAttendance}
                disabled={attendanceActionLoading}
              >
                {attendanceActionLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </Modal>
        )}
        {/* Modal Sertifikat Instructure */}
        {isInstructureCertificateModalOpen &&
          selectedInstructureForCertificate && (
            <Modal
              onClose={() => {
                setIsInstructureCertificateModalOpen(false);
                setSelectedInstructureForCertificate(null);
              }}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Issue Certificate for Instructure
              </h2>
              <form
                onSubmit={handleInstructureCertificateSubmit}
                className="space-y-4"
              >
                <p className="text-gray-600">
                  Issuing certificate for{" "}
                  <span className="font-semibold">
                    {selectedInstructureForCertificate.name}
                  </span>
                </p>
                <div>
                  <label
                    htmlFor="certificateNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Certificate Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="certificateNumber"
                    name="certificateNumber"
                    required
                    placeholder="e.g. CERT/2023/001"
                    value={instructureCertificateData.certificateNumber}
                    onChange={handleInstructureCertificateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="issueDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    required
                    value={instructureCertificateData.issueDate}
                    onChange={handleInstructureCertificateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pdfFile"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Upload Certificate PDF
                  </label>
                  <input
                    type="file"
                    id="pdfFile"
                    name="pdfFile"
                    accept="application/pdf"
                    onChange={handleInstructureCertificateFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                  />
                  {instructureCertificateData.pdfUrl && (
                    <div className="mt-2 text-xs text-gray-600">
                      <a
                        href={instructureCertificateData.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                          />
                        </svg>
                        Existing PDF file
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="driveLink"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Google Drive Link (optional)
                  </label>
                  <input
                    type="text"
                    id="driveLink"
                    name="driveLink"
                    placeholder="e.g. https://drive.google.com/file/d/..."
                    value={instructureCertificateData.driveLink || ""}
                    onChange={handleInstructureCertificateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                  />
                </div>

                {instructureCertificateError && (
                  <div className="text-red-500 text-xs mt-2">
                    {instructureCertificateError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    onClick={() => {
                      setIsInstructureCertificateModalOpen(false);
                      setSelectedInstructureForCertificate(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    disabled={instructureCertificateLoading}
                  >
                    {instructureCertificateLoading ? (
                      <>
                        <span className="inline-block mr-2 animate-spin">
                          ↻
                        </span>{" "}
                        Saving...
                      </>
                    ) : (
                      "Save Certificate"
                    )}
                  </button>
                </div>
                
                {/* Send Email Button for Instructor - Only show if certificate exists */}
                {instructureCertificateData.certificateNumber && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Send certificate notification to instructor
                      </p>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 flex items-center gap-2"
                        onClick={handleSendInstructureCertificateEmail}
                        disabled={instructureCertificateLoading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Email
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </Modal>
          )}
      </div>
    </Layout>
  );
};

export default CourseScheduleDetail;
