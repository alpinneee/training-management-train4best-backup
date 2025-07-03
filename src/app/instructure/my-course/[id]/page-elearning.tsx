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

interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  day: number;
  size?: number;
  createdAt: string;
  updatedAt: string;
}

interface ELearningTabProps {
  courseId: string;
}

const ELearningTab: React.FC<ELearningTabProps> = ({ courseId }) => {
  // E-learning materials state
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);
  const [materialData, setMaterialData] = useState<{
    id?: string;
    title: string;
    description: string;
    day: string;
    file: File | null;
    fileUrl?: string;
  }>({
    title: '',
    description: '',
    day: '1',
    file: null
  });
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [groupedMaterials, setGroupedMaterials] = useState<Record<string, CourseMaterial[]>>({});
  const [materialLoading, setMaterialLoading] = useState(false);

  // Fetch course materials
  const fetchCourseMaterials = async () => {
    setMaterialLoading(true);
    try {
      const response = await fetch(`/api/course-schedule/${courseId}/material`);
      if (!response.ok) throw new Error('Failed to fetch materials');
      
      const data = await response.json();
      setCourseMaterials(data.materials || []);
      
      // Group materials by day
      const grouped = (data.materials || []).reduce((acc: Record<string, CourseMaterial[]>, material: CourseMaterial) => {
        const day = material.day.toString();
        if (!acc[day]) acc[day] = [];
        acc[day].push(material);
        return acc;
      }, {});
      
      setGroupedMaterials(grouped);
    } catch (error) {
      console.error('Error fetching course materials:', error);
      // Create empty data structure if fetch fails
      setCourseMaterials([]);
      setGroupedMaterials({});
    } finally {
      setMaterialLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseMaterials();
  }, [courseId]);

  // Material handlers
  const handleEditMaterial = (material: CourseMaterial) => {
    setSelectedMaterial(material);
    setMaterialData({
      id: material.id,
      title: material.title,
      description: material.description || '',
      day: material.day.toString(),
      file: null,
      fileUrl: material.fileUrl
    });
    setIsEditMaterialModalOpen(true);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      setMaterialLoading(true);
      fetch(`/api/course-schedule/${courseId}/material/${materialId}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to delete material');
          return response.json();
        })
        .then(() => {
          toast.success("Material deleted successfully");
          fetchCourseMaterials();
        })
        .catch(error => {
          console.error('Error deleting material:', error);
          toast.error("Failed to delete material");
        })
        .finally(() => {
          setMaterialLoading(false);
        });
    }
  };

  const handleMaterialInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMaterialData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMaterialData(prev => ({
        ...prev,
        file: e.target.files![0]
      }));
    }
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialLoading(true);
    
    try {
      // First create or update the material metadata
      const endpoint = materialData.id 
        ? `/api/course-schedule/${courseId}/material/${materialData.id}`
        : `/api/course-schedule/${courseId}/material`;
      
      const method = materialData.id ? 'PUT' : 'POST';
      
      const metadataResponse = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: materialData.title,
          description: materialData.description,
          day: parseInt(materialData.day)
        })
      });
      
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Failed to save material metadata');
      }
      
      const createdMaterial = await metadataResponse.json();
      
      // If we have a file, upload it
      if (materialData.file) {
        const formData = new FormData();
        formData.append('file', materialData.file);
        formData.append('materialId', createdMaterial.id);
        
        const uploadResponse = await fetch('/api/upload/course-material', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          const uploadErrorData = await uploadResponse.json();
          console.error('Material file upload failed:', uploadErrorData.error);
          toast.error('Material metadata saved but file upload failed');
        }
      }
      
      // Reset form and fetch updated materials
      setMaterialData({
        title: '',
        description: '',
        day: '1',
        file: null
      });
      
      setIsAddMaterialModalOpen(false);
      setIsEditMaterialModalOpen(false);
      fetchCourseMaterials();
      
      toast.success(materialData.id ? "Material updated successfully" : "Material added successfully");
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save material');
    } finally {
      setMaterialLoading(false);
    }
  };

  return (
    <>
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
            Start adding learning materials for your students
          </p>
          <Button
            variant="outline"
            size="small" 
            onClick={() => setIsAddMaterialModalOpen(true)}
            className="mx-auto"
          >
            Add First Material
          </Button>
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
                    </div>
                    
                    <div className="p-3">
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <span className="mr-2">PDF File</span>
                        {material.size && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {formatFileSize(material.size)}
                          </span>
                        )}
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
                          <FileText size={12} className="mr-1" /> View PDF
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
      {(isAddMaterialModalOpen || isEditMaterialModalOpen) && (
        <Modal onClose={() => {
          setIsAddMaterialModalOpen(false);
          setIsEditMaterialModalOpen(false);
          setSelectedMaterial(null);
          setMaterialData({
            title: '',
            description: '',
            day: '1',
            file: null
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
                  <label className="block text-xs text-gray-700 mb-1">PDF File</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleMaterialFileChange}
                      className="text-xs flex-1"
                    />
                    {materialData.fileUrl && !materialData.file && (
                      <a
                        href={materialData.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View current file
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isEditMaterialModalOpen && !materialData.file
                      ? 'Only upload a new file if you want to replace the existing one.'
                      : 'Upload a PDF file for the learning material.'}
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
                      file: null
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