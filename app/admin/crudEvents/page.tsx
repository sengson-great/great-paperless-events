"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Loader2, LayoutTemplate, 
  Save, X, Move, Image as ImageIcon, Type, RotateCw, Upload
} from 'lucide-react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/adminHeader';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDocs, orderBy, query, serverTimestamp
} from 'firebase/firestore';

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

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // Template form modal
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Canvas elements
  const [elements, setElements] = useState<Element[]>([
    { id: Date.now(), type: 'rectangle', x: 0, y: 0, width: 800, height: 1000, bgColor: '#ffffff', locked: true }
  ]);
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);

  // Placeholders
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [newPlaceholderLabel, setNewPlaceholderLabel] = useState('');

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    console.log("Categories updated:", categories);
    console.log("Templates updated:", templates);
  }, [categories, templates]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching categories...");
        
        // Fetch categories
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
        
        // Fetch all templates - Use Promise.all for parallel fetching
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
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
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
      // First, get all templates in this category
      const templateQuery = query(collection(db, `categories/${id}/templates`));
      const templateSnap = await getDocs(templateQuery);
      
      // Delete all templates
      const deletePromises = templateSnap.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      
      // Delete the category
      await deleteDoc(doc(db, 'categories', id));
      
      // Update state
      setCategories(categories.filter(cat => cat.id !== id));
      setTemplates(templates.filter(template => template.categoryId !== id));
      
      alert('Category and its templates deleted successfully!');
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  // Element management
  const addTextElement = () => {
    const newEl: Element = {
      id: Date.now(),
      type: 'text',
      x: 100,
      y: 100,
      width: 400,
      height: 80,
      content: 'Click to edit · Use placeholders like {brideName}',
      fontSize: 32,
      color: '#000000',
      bgColor: 'transparent',
    };
    setElements([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addImageElement = () => {
    const newEl: Element = {
      id: Date.now(),
      type: 'image',
      x: 100,
      y: 300,
      width: 600,
      height: 400,
      imageUrl: 'https://via.placeholder.com/600x400/cccccc/666666?text=Click+to+upload+image',
    };
    setElements([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleImageUpload = (elementId: number, file: File) => {
    setUploadingImage(true);
    
    // Create a FileReader to read the image
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
      // Update the element with the new image
      setElements(elements.map(el => 
        el.id === elementId ? { ...el, imageUrl } : el
      ));
      
      setUploadingImage(false);
    };
    
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  const updateElement = (id: number, updates: Partial<Element>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: number) => {
    // Prevent deleting the background rectangle
    const elementToDelete = elements.find(el => el.id === id);
    if (elementToDelete?.locked) {
      alert('Cannot delete locked background element');
      return;
    }
    
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Placeholder helpers
  const generateKey = (label: string): string => {
    return label.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  };

  const addPlaceholder = () => {
    if (!newPlaceholderLabel.trim()) return;
    const key = generateKey(newPlaceholderLabel.trim());
    if (placeholders.includes(key)) {
      alert('Placeholder already exists');
      return;
    }
    setPlaceholders([...placeholders, key]);
    setNewPlaceholderLabel('');
  };

  const removePlaceholder = (key: string) => {
    setPlaceholders(placeholders.filter(p => p !== key));
  };

  // Template save
// Template save - FIXED VERSION
const handleSaveTemplate = async () => {
  if (!templateName.trim() || !templateCategory || elements.length <= 1) {
    alert('Name, category, and at least one element required');
    return;
  }

  try {
    const templateData = {
      name: templateName.trim(),
      categoryId: templateCategory,
      elements: elements.map(el => ({
        ...el,
        // Convert id to string for consistency
        id: typeof el.id === 'number' ? el.id.toString() : el.id
      })),
      placeholders,
      previewImage: previewImage || null,
      description: templateDescription.trim() || null,
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    console.log('Saving template:', {
      editingTemplate: editingTemplate,
      templateData: templateData,
      templateCategory: templateCategory,
      editingTemplateCategory: editingTemplate?.categoryId
    });

    if (editingTemplate && editingTemplate.id) {
      // CRITICAL FIX: Use editingTemplate.categoryId for the document path
      // but use the NEW templateCategory in the data
      const categoryIdForPath = editingTemplate.categoryId;
      const templateId = editingTemplate.id;
      
      console.log('Updating template:', {
        categoryIdForPath: categoryIdForPath,
        templateId: templateId,
        newCategoryIdInData: templateCategory
      });

      // Check if category was changed
      if (categoryIdForPath !== templateCategory) {
        // If category changed, we need to:
        // 1. Create new document in new category
        // 2. Delete old document from old category
        const newDocRef = await addDoc(
          collection(db, 'categories', templateCategory, 'templates'), 
          { ...templateData, createdAt: serverTimestamp() }
        );
        
        // Delete old document
        await deleteDoc(doc(db, 'categories', categoryIdForPath, 'templates', templateId));
        
        alert('Template moved to new category and updated successfully!');
      } else {
        // Same category, just update
        await updateDoc(
          doc(db, 'categories', categoryIdForPath, 'templates', templateId), 
          templateData
        );
        alert('Template updated successfully!');
      }
    } else {
      // Create new template
      await addDoc(collection(db, 'categories', templateCategory, 'templates'), {
        ...templateData,
        createdAt: serverTimestamp(),
      });
      alert('Template created successfully!');
    }

    setShowTemplateForm(false);
    resetTemplateForm();
    
    // Refresh data
    const fetchData = async () => {
      const catQuery = query(collection(db, 'categories'), orderBy('order'));
      const catSnap = await getDocs(catQuery);
      const cats = catSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(cats);

      const templatePromises = cats.map(async (cat) => {
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
    
    // Add delay to ensure Firebase has processed the update
    setTimeout(() => {
      fetchData();
    }, 1000);
    
  } catch (err: any) {
    console.error('Save error details:', {
      error: err,
      code: err.code,
      message: err.message,
      editingTemplate: editingTemplate,
      templateCategory: templateCategory
    });
    
    if (err.code === 'not-found') {
      alert(`Error: Template not found. It may have been deleted. 
      
Try creating it as a new template instead.`);
    } else {
      alert(`Failed: ${err.message}`);
    }
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
    setPlaceholders([]);
    setNewPlaceholderLabel('');
    setElements([{ id: Date.now(), type: 'rectangle', x: 0, y: 0, width: 800, height: 1000, bgColor: '#ffffff', locked: true }]);
    setSelectedElementId(null);
    setEditingTemplate(null);
  };

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Header />

          {/* Tabs */}
          <div className="flex gap-6 mb-8 border-b">
            <button 
              onClick={() => setActiveTab('categories')} 
              className={`pb-3 px-2 border-b-2 font-medium ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
            >
              Categories ({categories.length})
            </button>
            <button 
              onClick={() => setActiveTab('templates')} 
              className={`pb-3 px-2 border-b-2 font-medium ${activeTab === 'templates' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
            >
              Templates ({templates.length})
            </button>
          </div>

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold">Categories</h2>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName('');
                    setShowCategoryModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Category
                </button>
              </div>

              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium">Order</th>
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Templates</th>
                      <th className="text-left p-4 font-medium">Actions</th>
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
                      categories.map((category, index) => {
                        const categoryTemplates = templates.filter(t => t.categoryId === category.id);
                        return (
                          <tr key={category.id} className="border-t hover:bg-gray-50">
                            <td className="p-4">{category.order}</td>
                            <td className="p-4 font-medium">{category.name}</td>
                            <td className="p-4">
                              <span className="bg-gray-100 px-3 py-1 rounded-full">
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
                                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
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

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold">Predefined Templates</h2>
                <button
                  onClick={() => {
                    setShowTemplateForm(true);
                    resetTemplateForm();
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Create Template
                </button>
              </div>

              {/* Debug info - remove after testing */}
              <div className="mb-4 p-4 bg-gray-100 rounded">
                <p className="text-sm">Categories: {categories.length}, Templates: {templates.length}</p>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.length === 0 ? (
                  <div className="col-span-3 text-center py-12">
                    <LayoutTemplate className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-semibold mb-2">No Templates Yet</h3>
                    <p className="text-gray-600 mb-6">Create your first template to get started</p>
                    <button
                      onClick={() => setShowTemplateForm(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg"
                    >
                      Create Template
                    </button>
                  </div>
                ) : (
                  templates.map(template => {
                    const category = categories.find(c => c.id === template.categoryId);
                    return (
                      <div key={template.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                        <div className="h-96 bg-gray-200 relative">
                          {template.previewImage ? (
                            <img 
                              src={template.previewImage} 
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <LayoutTemplate size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 rounded-full text-sm ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold">{template.name}</h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setTemplateName(template.name);
                                  setTemplateCategory(template.categoryId);
                                  setTemplateDescription(template.description || '');
                                  setPreviewImage(template.previewImage || null);
                                  setElements(template.elements || []);
                                  setPlaceholders(template.placeholders || []);
                                  setShowTemplateForm(true);
                                }}
                                className="p-2 text-gray-600 hover:text-blue-600"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id, template.categoryId)}
                                className="p-2 text-gray-600 hover:text-red-600"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{template.description || 'No description'}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="bg-gray-100 px-3 py-1 rounded">
                              {category?.name || 'Uncategorized'}
                            </span>
                            <span className="text-gray-500">
                              {template.elements?.length || 0} elements
                            </span>
                          </div>
                          {template.placeholders && template.placeholders.length > 0 && (
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

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {editingCategory ? 'Edit' : 'Add'} Category
              </h3>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}>
                <X size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Category Name *</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="E.g., Wedding Invitations"
                />
              </div>
              <div className="flex gap-3 pt-4">
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
      )}

      {/* Template Designer Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex overflow-hidden">
            {/* Left Panel - Form & Controls */}
            <div className="w-96 bg-gray-50 p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  {editingTemplate ? 'Edit' : 'Design'} Template
                </h3>
                <button onClick={() => { setShowTemplateForm(false); resetTemplateForm(); }}>
                  <X size={24} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-medium mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="Elegant Wedding"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Category *</label>
                  <select
                    value={templateCategory}
                    onChange={e => setTemplateCategory(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-2">Description</label>
                  <textarea
                    value={templateDescription}
                    onChange={e => setTemplateDescription(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="Template description..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Preview Image</label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="mx-auto max-h-48 rounded" />
                    ) : (
                      <p className="text-gray-500">Upload image for template preview</p>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="mt-4" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setPreviewImage(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-3">Add Elements</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={addTextElement}
                      className="flex items-center justify-center gap-2 py-4 border-2 border-dashed rounded-xl hover:bg-gray-100"
                    >
                      <Type size={24} />
                      Text
                    </button>
                    <button
                      onClick={addImageElement}
                      className="flex items-center justify-center gap-2 py-4 border-2 border-dashed rounded-xl hover:bg-gray-100"
                    >
                      <ImageIcon size={24} />
                      Image
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveTemplate}
                  className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-3"
                >
                  <Save size={24} />
                  Save Template
                </button>
              </div>
            </div>

            {/* Right Panel - Canvas */}
            <div className="flex-1 bg-gray-100 p-8 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <h4 className="text-lg font-medium mb-4">Live Preview</h4>
                <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
                  <div className="relative" style={{ width: '800px', height: '1000px', margin: '0 auto' }}>
                    {elements.map(el => (
                      <div
                        key={el.id}
                        className={`absolute border-2 ${selectedElementId === el.id ? 'border-blue-500' : 'border-transparent'} hover:border-blue-300 cursor-move`}
                        style={{
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none',
                          backgroundColor: el.bgColor || 'transparent',
                        }}
                        onClick={() => setSelectedElementId(el.id)}
                      >
                        {el.type === 'text' && (
                          <div
                            className="w-full h-full flex items-center justify-center p-4 text-center overflow-hidden"
                            style={{ fontSize: el.fontSize || 24, color: el.color || '#000' }}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                          >
                            {el.content || 'Click to edit'}
                          </div>
                        )}
                        {el.type === 'image' && (
                          <div className="w-full h-full">
                            {el.imageUrl ? (
                              <img src={el.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <ImageIcon size={48} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                        )}
                        {/* Always visible delete button */}
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            deleteElement(el.id); 
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow-lg"
                          title="Delete element"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Element Controls */}
                {selectedElement && (
                  <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h4 className="font-medium mb-4">
                      Edit Selected Element ({selectedElement.type})
                      {selectedElement.locked && <span className="ml-2 text-sm text-gray-500">(Locked)</span>}
                    </h4>
                    
                    {selectedElement.type === 'image' && (
                      <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                        <label className="block font-medium mb-2">Image Upload</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(selectedElement.id, file);
                              }
                            }}
                            className="flex-1"
                            disabled={uploadingImage}
                          />
                          {uploadingImage && <Loader2 className="animate-spin" size={20} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Supported formats: JPG, PNG, GIF
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-xs">X Position</label>
                        <input
                          type="number"
                          value={selectedElement.x}
                          onChange={e => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                          className="w-full px-3 py-2 border rounded"
                          disabled={selectedElement.locked}
                        />
                      </div>
                      <div>
                        <label className="text-xs">Y Position</label>
                        <input
                          type="number"
                          value={selectedElement.y}
                          onChange={e => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                          className="w-full px-3 py-2 border rounded"
                          disabled={selectedElement.locked}
                        />
                      </div>
                      <div>
                        <label className="text-xs">Width</label>
                        <input
                          type="number"
                          value={selectedElement.width}
                          onChange={e => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                          className="w-full px-3 py-2 border rounded"
                          disabled={selectedElement.locked}
                        />
                      </div>
                      <div>
                        <label className="text-xs">Height</label>
                        <input
                          type="number"
                          value={selectedElement.height}
                          onChange={e => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                          className="w-full px-3 py-2 border rounded"
                          disabled={selectedElement.locked}
                        />
                      </div>
                    </div>
                    
                    {selectedElement.type === 'text' && (
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs">Font Size</label>
                            <input
                              type="number"
                              value={selectedElement.fontSize || 24}
                              onChange={e => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs">Text Color</label>
                            <input
                              type="color"
                              value={selectedElement.color || '#000000'}
                              onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
                              className="w-full h-10 rounded"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="text-xs">Background Color</label>
                          <input
                            type="color"
                            value={selectedElement.bgColor || 'transparent'}
                            onChange={e => updateElement(selectedElement.id, { bgColor: e.target.value })}
                            className="w-full h-10 rounded"
                          />
                        </div>
                      </div>
                    )}
                    
                    {selectedElement.type === 'rectangle' && (
                      <div className="mb-4">
                        <label className="text-xs">Background Color</label>
                        <input
                          type="color"
                          value={selectedElement.bgColor || '#ffffff'}
                          onChange={e => updateElement(selectedElement.id, { bgColor: e.target.value })}
                          className="w-full h-10 rounded"
                          disabled={selectedElement.locked}
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="text-xs">Rotation: {selectedElement.rotation || 0}°</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedElement.rotation || 0}
                        onChange={e => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                        className="w-full"
                        disabled={selectedElement.locked}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0°</span>
                        <span>180°</span>
                        <span>360°</span>
                      </div>
                    </div>
                    
                    {!selectedElement.locked && (
                      <button
                        onClick={() => deleteElement(selectedElement.id)}
                        className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium w-full"
                      >
                        Delete Element
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;