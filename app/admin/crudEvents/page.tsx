"use client";
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Loader2, LayoutTemplate, 
  X, Menu
} from 'lucide-react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/adminHeader';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDocs, orderBy, query, serverTimestamp
} from 'firebase/firestore';
import EventTemplateEditor from '@/app/components/EventTemplateEditor';

// TypeScript interfaces for data structures
interface Category {
  id: string;
  name: string;
  order: number;
}

interface Element {
  id: number;
  type: 'text' | 'image' | 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  rotation?: number;
  imageUrl?: string;
  locked?: boolean;
}

interface Template {
  id: string;
  name: string;
  categoryId: string;
  elements: Element[];
  placeholders: string[];
  previewImage?: string;
  description?: string;
  isActive: boolean;
  createdAt: any;
}

const EventDashboard: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'templates'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // Template form modal state
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Responsive breakpoints
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Debug effect
  useEffect(() => {
    console.log("Categories updated:", categories);
    console.log("Templates updated:", templates);
  }, [categories, templates]);

  // Main data fetching effect
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching categories...");
        
        const catQuery = query(collection(db, 'categories'), orderBy('order'));
        const catSnap = await getDocs(catQuery);
        
        if (catSnap.empty) {
          console.log("No categories found");
          setCategories([]);
          setTemplates([]);
          setLoading(false);
          return;
        }
        
        const cats = catSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        setCategories(cats);
        
        const templatePromises = cats.map(async (cat) => {
          try {
            const tempQuery = query(
              collection(db, `categories/${cat.id}/templates`), 
              orderBy('createdAt', 'desc')
            );
            const tempSnap = await getDocs(tempQuery);
            
            return tempSnap.docs.map(doc => ({
              id: doc.id,
              categoryId: cat.id,
              ...doc.data()
            })) as Template[];
          } catch (error) {
            console.error(`Error fetching templates for category ${cat.id}:`, error);
            return [];
          }
        });
        
        const templateResults = await Promise.all(templatePromises);
        const allTemplates = templateResults.flat();
        
        setTemplates(allTemplates);
        console.log("Loaded:", cats.length, "categories and", allTemplates.length, "templates");
        
      } catch (err: any) {
        console.error("Fetch error:", err);
        alert(`Failed to load data: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Category handlers
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      const categoryData = {
        name: categoryName.trim(),
        order: editingCategory ? editingCategory.order : categories.length + 1,
        updatedAt: serverTimestamp(),
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? { ...cat, name: categoryName.trim() } : cat
        ));
      } else {
        const docRef = await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: serverTimestamp(),
        });
        setCategories([...categories, { id: docRef.id, name: categoryName.trim(), order: categories.length + 1 }]);
      }

      alert('Category saved successfully!');
      setShowCategoryModal(false);
      setCategoryName('');
      setEditingCategory(null);
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? This will also delete all templates in this category.')) return;
    
    try {
      const templateQuery = query(collection(db, `categories/${id}/templates`));
      const templateSnap = await getDocs(templateQuery);
      
      const deletePromises = templateSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      await deleteDoc(doc(db, 'categories', id));
      
      setCategories(categories.filter(cat => cat.id !== id));
      setTemplates(templates.filter(template => template.categoryId !== id));
      
      alert('Category and its templates deleted successfully!');
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string, categoryId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteDoc(doc(db, 'categories', categoryId, 'templates', templateId));
      setTemplates(templates.filter(t => t.id !== templateId));
      alert('Template deleted successfully!');
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateCategory('');
    setTemplateDescription('');
    setPreviewImage(null);
    setEditingTemplate(null);
  };

  // Responsive layout helpers
  const getGridColumns = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  // Loading and auth checks
  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have admin permissions to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 p-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold">Template Dashboard</h1>
        <div className="w-10"></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white">
            <Sidebar />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen pt-16 lg:pt-0 overflow-auto">
        <div className="p-4 lg:p-6">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-6">
            <Header />
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 lg:mb-8">
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:border-b">
              <button 
                onClick={() => setActiveTab('categories')} 
                className={`flex-shrink-0 pb-3 px-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
              >
                Categories <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-sm">({categories.length})</span>
              </button>
              <button 
                onClick={() => setActiveTab('templates')} 
                className={`flex-shrink-0 pb-3 px-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'templates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
              >
                Templates <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-sm">({templates.length})</span>
              </button>
            </div>
          </div>

          {/* Categories Tab Content */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Categories</h2>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName('');
                    setShowCategoryModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Category
                </button>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {categories.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-6 text-center">
                    <div className="text-gray-500 mb-4">
                      <LayoutTemplate className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-lg font-medium">No categories found</p>
                      <p className="text-gray-600 mt-2">Create your first category to get started</p>
                    </div>
                  </div>
                ) : (
                  categories.map((category) => {
                    const categoryTemplates = templates.filter(t => t.categoryId === category.id);
                    return (
                      <div key={category.id} className="bg-white rounded-xl shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                #{category.order}
                              </span>
                              <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4 border-t">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryName(category.name);
                              setShowCategoryModal(true);
                            }}
                            className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Order</th>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Name</th>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Templates</th>
                      <th className="text-left p-4 font-medium text-sm text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          No categories found. Create your first category!
                        </td>
                      </tr>
                    ) : (
                      categories.map((category) => {
                        const categoryTemplates = templates.filter(t => t.categoryId === category.id);
                        return (
                          <tr key={category.id} className="border-t hover:bg-gray-50">
                            <td className="p-4">{category.order}</td>
                            <td className="p-4 font-medium">{category.name}</td>
                            <td className="p-4">
                              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                {categoryTemplates.length} templates
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setCategoryName(category.name);
                                    setShowCategoryModal(true);
                                  }}
                                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Templates Tab Content */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Predefined Templates</h2>
                <button
                  onClick={() => {
                    setShowTemplateForm(true);
                    resetTemplateForm();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Create Template
                </button>
              </div>

              {/* Template Grid */}
              <div className={`grid ${getGridColumns()} gap-4 lg:gap-6`}>
                {templates.length === 0 ? (
                  <div className="col-span-full bg-white rounded-xl shadow p-8 text-center">
                    <LayoutTemplate className="mx-auto mb-4 text-gray-300" size={isMobile ? 48 : 64} />
                    <h3 className="text-lg lg:text-xl font-semibold mb-2">No Templates Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Create your first template to get started
                    </p>
                    <button
                      onClick={() => setShowTemplateForm(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Template
                    </button>
                  </div>
                ) : (
                  templates.map(template => {
                    const category = categories.find(c => c.id === template.categoryId);
                    return (
                      <div key={template.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200">
                        {/* Template Preview */}
                        <div className={`${isMobile ? 'h-48' : isTablet ? 'h-56' : 'h-64'} bg-gray-100 relative`}>
                          {template.previewImage ? (
                            <img 
                              src={template.previewImage} 
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <LayoutTemplate size={isMobile ? 32 : 48} className="text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 rounded-full text-xs ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Template Info */}
                        <div className="p-4 lg:p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 line-clamp-1">
                              {template.name}
                            </h3>
                            <div className="flex gap-1 lg:gap-2">
                              <button
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setTemplateName(template.name);
                                  setTemplateCategory(template.categoryId);
                                  setTemplateDescription(template.description || '');
                                  setPreviewImage(template.previewImage || null);
                                  setShowTemplateForm(true);
                                }}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit template"
                              >
                                <Edit2 size={isMobile ? 16 : 18} />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id, template.categoryId)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete template"
                              >
                                <Trash2 size={isMobile ? 16 : 18} />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {template.description || 'No description'}
                          </p>
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
                            <span className="bg-gray-100 px-3 py-1 rounded text-gray-700">
                              {category?.name || 'Uncategorized'}
                            </span>
                            <span className="text-gray-500">
                              {template.elements?.length || 0} elements
                            </span>
                          </div>
                          
                          {/* Placeholders (only show on larger screens) */}
                          {!isMobile && template.placeholders && template.placeholders.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-gray-500 mb-1">Placeholders:</p>
                              <div className="flex flex-wrap gap-1">
                                {template.placeholders.slice(0, 3).map((ph, i) => (
                                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    {ph}
                                  </span>
                                ))}
                                {template.placeholders.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{template.placeholders.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal - Responsive */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start lg:items-center justify-center p-4 lg:p-6 z-50">
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4 lg:mb-6">
                <h3 className="text-lg lg:text-xl font-bold">
                  {editingCategory ? 'Edit' : 'Add'} Category
                </h3>
                <button 
                  onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2 text-sm lg:text-base">Category Name *</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg text-base"
                    placeholder="E.g., Wedding Invitations"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={handleSaveCategory}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save Category
                  </button>
                  <button
                    onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Designer Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 z-50">
          <EventTemplateEditor
            isAdminMode={true}
            initialElements={editingTemplate?.elements || []}
            initialEventData={{
              title: "Sample Event Title",
              date: "2025-01-01",
              time: "7:00 PM",
              location: "Sample Location"
            }}
            adminTemplateName={editingTemplate?.name || ''}
            adminTemplateDescription={editingTemplate?.description || ''}
            adminTemplateCategory={editingTemplate?.categoryId || templateCategory}
            adminCategories={categories}
            onAdminSave={async (elements, templateData) => {
              try {
                // Clean elements before saving
                const cleanedElements = elements.map(el => {
                  const cleaned: any = {};
                  for (const [key, value] of Object.entries(el)) {
                    if (value !== undefined && value !== null && value !== '') {
                      cleaned[key] = value;
                    }
                  }
                  // Ensure ID is number
                  if (typeof cleaned.id === 'string') {
                    cleaned.id = Number(cleaned.id) || Date.now();
                  }
                  // Ensure locked is boolean
                  if (cleaned.locked === undefined) {
                    cleaned.locked = false;
                  }
                  return cleaned;
                });

                // Prepare template data
                const firestoreData: any = {
                  name: templateData.name,
                  categoryId: templateData.category || templateCategory,
                  elements: cleanedElements,
                  previewImage: templateData.previewImage || null,
                  description: templateData.description || null,
                  isActive: true,
                  updatedAt: serverTimestamp(),
                };

                // Clean undefined values
                Object.keys(firestoreData).forEach(key => {
                  if (firestoreData[key] === undefined) {
                    delete firestoreData[key];
                  }
                });

                console.log('Saving template with category:', templateData.category || templateCategory);

                if (editingTemplate) {
                  // Update existing template
                  await updateDoc(
                    doc(db, 'categories', editingTemplate.categoryId, 'templates', editingTemplate.id),
                    firestoreData
                  );
                } else {
                  // Create new template
                  const categoryId = templateData.category || templateCategory;
                  if (!categoryId) {
                    throw new Error('Category is required');
                  }
                  
                  await addDoc(
                    collection(db, 'categories', categoryId, 'templates'),
                    { ...firestoreData, createdAt: serverTimestamp() }
                  );
                }

                setShowTemplateForm(false);
                resetTemplateForm();
                
                // Refresh templates list
                const fetchTemplates = async () => {
                  const templatePromises = categories.map(async (cat) => {
                    const tempQuery = query(
                      collection(db, `categories/${cat.id}/templates`), 
                      orderBy('createdAt', 'desc')
                    );
                    const tempSnap = await getDocs(tempQuery);
                    return tempSnap.docs.map(doc => ({
                      id: doc.id,
                      categoryId: cat.id,
                      ...doc.data()
                    })) as Template[];
                  });
                  
                  const templateResults = await Promise.all(templatePromises);
                  const allTemplates = templateResults.flat();
                  setTemplates(allTemplates);
                };
                
                fetchTemplates();
                
              } catch (error: any) {
                console.error('Failed to save template:', error);
                alert(`Error: ${error.message}`);
                throw error;
              }
            }}
            onAdminCancel={() => {
              setShowTemplateForm(false);
              resetTemplateForm();
            }}
            isLoading={false}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>
      )}
    </div>
  );
};

export default EventDashboard;