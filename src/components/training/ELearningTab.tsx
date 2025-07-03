"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/common/button";
import { FileText, Edit, Trash2, BookOpen } from "lucide-react";
import Modal from "@/components/common/Modal";
import { toast } from "react-hot-toast";

// Utility function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if a URL is a Google Drive link
const isGoogleDriveLink = (url: string): boolean => {
  return url?.includes('drive.google.com') || 
         url?.includes('docs.google.com') || 
         url?.includes('sheets.google.com') || 
         url?.includes('slides.google.com');
};

// Local storage key for materials
const getStorageKey = (courseId: string) => `materials_${courseId}`;

interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  day: number;
  size?: number;
  createdAt: string;
  updatedAt: string;
  courseScheduleId?: string;
}

interface ELearningTabProps {
  courseId: string;
  isParticipant?: boolean;
}

const ELearningTab: React.FC<ELearningTabProps> = ({ courseId, isParticipant = false }) => {
  // E-learning materials state
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);
  const [materialData, setMaterialData] = useState<{
    id?: string;
    title: string;
    description: string;
    day: string;
    fileUrl: string;
  }>({
    title: '',
    description: '',
    day: '1',
    fileUrl: ''
  });
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [groupedMaterials, setGroupedMaterials] = useState<Record<string, CourseMaterial[]>>({});
  const [materialLoading, setMaterialLoading] = useState(false);

  // Load stored materials from localStorage or fetch from API
  useEffect(() => {
    fetchCourseMaterials();
  }, [courseId]);

  // Group materials by day
  useEffect(() => {
    if (courseMaterials.length > 0) {
      const grouped = courseMaterials.reduce((acc: Record<string, CourseMaterial[]>, material: CourseMaterial) => {
        const day = (material.day || 1).toString();
        if (!acc[day]) acc[day] = [];
        acc[day].push(material);
        return acc;
      }, {});
      
      setGroupedMaterials(grouped);
    } else {
      setGroupedMaterials({});
    }
  }, [courseMaterials]);

  // Save materials to localStorage
  const saveMaterialsToStorage = (materials: CourseMaterial[]) => {
    try {
      localStorage.setItem(getStorageKey(courseId), JSON.stringify(materials));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  // Load materials from localStorage
  const loadMaterialsFromStorage = (): CourseMaterial[] => {
    try {
      const stored = localStorage.getItem(getStorageKey(courseId));
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return [];
    }
  };

  // Fetch course materials
  const fetchCourseMaterials = async () => {
    setMaterialLoading(true);
    try {
      // First try to load from localStorage
      const storedMaterials = loadMaterialsFromStorage();
      
      if (storedMaterials && storedMaterials.length > 0) {
        // If we have locally stored materials, use them
        console.log('Using locally stored materials:', storedMaterials);
        setCourseMaterials(storedMaterials);
        setMaterialLoading(false);
        return;
      }
      
      // If no local storage, try the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(`/api/course-schedule/${courseId}/material`);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', await response.text());
        throw new Error('Server returned invalid response format');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || `Server error: ${response.status}`;
        console.error('API error:', errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('Materials data received:', data);
      
      // Ensure data.materials is an array even if API returns null/undefined
      const materials = Array.isArray(data.materials) ? data.materials : [];
      
      // Save to localStorage for future use
      saveMaterialsToStorage(materials);
      
      setCourseMaterials(materials);

    } catch (error) {
      console.error('Error fetching course materials:', error);
      toast.error('Failed to load course materials');
      // Create empty data structure if fetch fails
      setCourseMaterials([]);
    } finally {
      setMaterialLoading(false);
    }
  };

  // Material handlers
  const handleEditMaterial = (material: CourseMaterial) => {
    setSelectedMaterial(material);
    setMaterialData({
      id: material.id,
      title: material.title,
      description: material.description || '',
      day: material.day.toString(),
      fileUrl: material.fileUrl
    });
    setIsEditMaterialModalOpen(true);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      setMaterialLoading(true);
      
      try {
        // Remove from local state
        const updatedMaterials = courseMaterials.filter(m => m.id !== materialId);
        setCourseMaterials(updatedMaterials);
        
        // Save to localStorage
        saveMaterialsToStorage(updatedMaterials);
        
        toast.success("Material deleted successfully");
      } catch (error) {
        console.error('Error deleting material:', error);
        toast.error("Failed to delete material");
      } finally {
        setMaterialLoading(false);
      }
    }
  };

  const handleMaterialInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMaterialData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialLoading(true);
    
    // Validate URL format
    if (!materialData.fileUrl.startsWith('http')) {
      toast.error('Please enter a valid URL (starting with http:// or https://)');
      setMaterialLoading(false);
      return;
    }
    
    try {
      const now = new Date().toISOString();
      
      if (materialData.id) {
        // Update existing material
        const updatedMaterials = courseMaterials.map(material => {
          if (material.id === materialData.id) {
            return {
              ...material,
              title: materialData.title,
              description: materialData.description,
              day: parseInt(materialData.day),
              fileUrl: materialData.fileUrl,
              updatedAt: now
            };
          }
          return material;
        });
        
        setCourseMaterials(updatedMaterials);
        saveMaterialsToStorage(updatedMaterials);
        toast.success("Material updated successfully");
      } else {
        // Create new material
        const newMaterial: CourseMaterial = {
          id: `material-${Date.now()}`,
          title: materialData.title,
          description: materialData.description,
          day: parseInt(materialData.day),
          fileUrl: materialData.fileUrl,
          createdAt: now,
          updatedAt: now,
          courseScheduleId: courseId
        };
        
        const updatedMaterials = [...courseMaterials, newMaterial];
        setCourseMaterials(updatedMaterials);
        saveMaterialsToStorage(updatedMaterials);
        toast.success("Material added successfully");
      }
      
      // Reset form
      setMaterialData({
        title: '',
        description: '',
        day: '1',
        fileUrl: ''
      });
      
      // Close modals
      setIsAddMaterialModalOpen(false);
      setIsEditMaterialModalOpen(false);
      
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save material');
    } finally {
      setMaterialLoading(false);
    }
  };

  return (
    <>
      {!isParticipant && (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-4">
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsAddMaterialModalOpen(true)}
            className="w-full sm:w-auto text-xs"
          >
            Add New Material
          </Button>
          <div className="text-xs text-gray-600">
            {courseMaterials.length} Course Materials
          </div>
        </div>
      )}

      {materialLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : courseMaterials.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <BookOpen size={48} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Materials Yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            {isParticipant 
              ? "No learning materials have been added yet." 
              : "Start adding learning materials for your students"}
          </p>
          {!isParticipant && (
            <Button
              variant="outline"
              size="small" 
              onClick={() => setIsAddMaterialModalOpen(true)}
              className="mx-auto"
            >
              Add First Material
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group materials by day */}
          {Object.entries(groupedMaterials).sort(([dayA], [dayB]) => 
            parseInt(dayA) - parseInt(dayB)
          ).map(([day, materials]) => (
            <div key={day} className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center border-b pb-2">
                Day {day}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(materials as CourseMaterial[]).map((material: CourseMaterial) => (
                  <div key={material.id} className="border rounded-lg overflow-hidden bg-gray-50">
                    <div className="bg-blue-50 p-3 border-b flex justify-between items-center">
                      <h4 className="text-sm font-medium text-blue-800 truncate" title={material.title}>
                        {material.title}
                      </h4>
                      {!isParticipant && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            type="button"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <span className="mr-2">
                          {isGoogleDriveLink(material.fileUrl) ? "Google Drive Link" : "PDF File"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2" title={material.description}>
                        {material.description || "No description provided"}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 inline-flex items-center"
                        >
                          <FileText size={12} className="mr-1" /> 
                          {isGoogleDriveLink(material.fileUrl) ? "Open Drive" : "View PDF"}
                        </a>
                        <span className="text-xs text-gray-500">
                          Added {new Date(material.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    
      {/* Add/Edit Material Modal */}
      {!isParticipant && (isAddMaterialModalOpen || isEditMaterialModalOpen) && (
        <Modal onClose={() => {
          setIsAddMaterialModalOpen(false);
          setIsEditMaterialModalOpen(false);
          setSelectedMaterial(null);
          setMaterialData({
            title: '',
            description: '',
            day: '1',
            fileUrl: ''
          });
        }}>
          <div className="p-2">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {isEditMaterialModalOpen ? 'Edit Material' : 'Add New Material'}
            </h2>
            
            <form onSubmit={handleMaterialSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={materialData.title}
                    onChange={handleMaterialInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={materialData.description}
                    onChange={handleMaterialInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Day</label>
                  <select
                    name="day"
                    value={materialData.day}
                    onChange={handleMaterialInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  >
                    {[...Array(15)].map((_, i) => (
                      <option key={i} value={(i + 1).toString()}>{i + 1}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Material Link (Google Drive or PDF URL)</label>
                  <input
                    type="text"
                    name="fileUrl"
                    value={materialData.fileUrl}
                    onChange={handleMaterialInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    placeholder="https://drive.google.com/..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a Google Drive link or direct URL to a PDF document
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="border rounded px-4 py-1 text-xs bg-gray-50 text-gray-700"
                  onClick={() => {
                    setIsAddMaterialModalOpen(false);
                    setIsEditMaterialModalOpen(false);
                    setSelectedMaterial(null);
                    setMaterialData({
                      title: '',
                      description: '',
                      day: '1',
                      fileUrl: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white rounded px-4 py-1 text-xs"
                  disabled={materialLoading}
                >
                  {materialLoading 
                    ? (isEditMaterialModalOpen ? 'Updating...' : 'Adding...') 
                    : (isEditMaterialModalOpen ? 'Update Material' : 'Add Material')}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ELearningTab; 