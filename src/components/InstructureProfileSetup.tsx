"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/button";
import { toast } from "react-hot-toast";

interface InstructureProfileSetupProps {
  userId: string;
  username: string;
}

const proficiencyCategories = [
  "Programming",
  "Web Development",
  "Data Science",
  "Mobile Development",
  "UI/UX Design",
];

const InstructureProfileSetup = ({
  userId,
  username,
}: InstructureProfileSetupProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: username || "",
    phoneNumber: "",
    proficiency: "",
    address: "",
    email: "",
    birthDate: "",
  });

  // Check if instructure profile needs to be completed
  useEffect(() => {
    const checkInstructureProfile = async () => {
      try {
        const response = await fetch(
          `/api/instructure/profile/check?userId=${userId}`
        );
        const data = await response.json();

        if (data.needsSetup) {
          setIsOpen(true);

          // Pre-fill with existing data if available
          if (data.instructure) {
            setFormData({
              fullName: data.instructure.full_name || username,
              phoneNumber: data.instructure.phone_number || "",
              proficiency: data.instructure.profiency || "",
              address: data.instructure.address || "",
              email: data.instructure.email || "",
              birthDate: data.instructure.birth_date
                ? new Date(data.instructure.birth_date)
                    .toISOString()
                    .split("T")[0]
                : "",
            });
          }
        }
      } catch (error) {
        console.error("Error checking instructure profile:", error);
      }
    };

    checkInstructureProfile();
  }, [userId, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/instructure/profile/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...formData,
          profiency: formData.proficiency, // Match database field name
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setIsOpen(false);
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <Modal onClose={() => {}}>
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Complete Your Instructure Profile
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Please complete your instructure profile information to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Date
            </label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proficiency
            </label>
            <input
              type="text"
              name="proficiency"
              value={formData.proficiency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Enter your proficiency"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="primary"
              size="small"
              type="submit"
              className="text-sm px-4 py-2"
              disabled={loading}
            >
              {loading ? "Saving..." : "Complete Profile"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default InstructureProfileSetup;
