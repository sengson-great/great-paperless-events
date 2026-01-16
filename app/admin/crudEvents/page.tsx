"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Loader2, LayoutTemplate, 
  Save, X, Move, Image as ImageIcon,
} from 'lucide-react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/adminHeader';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDocs, orderBy, query, serverTimestamp
} from 'firebase/firestore';
import AdminTemplateBuilder from '@/app/components/AdminTemplateBuilder';
import EventTemplateEditor from '@/app/components/EventTemplateEditor';

// TypeScript interfaces for data structures
interface Category {
  id: string;
  name: string;
  order: number;
}

interface Element {
  id: number;
  type: 'text' | 'image' | 'rectangle';  // Types of design elements
  x: number;  // X position on canvas
  y: number;  // Y position on canvas
  width: number;  // Element width
  height: number;  // Element height
  content?: string;  // Text content for text elements
  fontSize?: number;  // Font size for text
  color?: string;  // Text color
  bgColor?: string;  // Background color
  rotation?: number;  // Rotation angle in degrees
  imageUrl?: string;  // URL for image elements
  locked?: boolean;  // Whether element can be edited/moved
}

interface Template {
  id: string;
  name: string;
  categoryId: string;  // ID of parent category
  elements: Element[];  // Array of canvas elements
  placeholders: string[];  // Template placeholders for dynamic content
  previewImage?: string;  // Template preview thumbnail
  description?: string;  // Template description
  isActive: boolean;  // Whether template is active/usable
  createdAt: any;  // Creation timestamp
}

const EventDashboard: React.FC = () => {
  // Authentication hook to check admin status
  const { isAdmin, loading: authLoading } = useAuth();
  
  // State for active tab (categories or templates view)
  const [activeTab, setActiveTab] = useState<'categories' | 'templates'>('categories');
  
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

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
  
  // Canvas elements state - starts with a default background rectangle
  const [elements, setElements] = useState<Element[]>([
    { 
      id: Date.now(), 
      type: 'rectangle', 
      x: 0, y: 0, 
      width: 800, height: 1000, 
      bgColor: '#ffffff', 
      locked: true  // Background is locked by default
    }
  ]);
  
  // Currently selected element ID
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  
  // Drag state for element movement
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });  // Mouse start position
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });  // Element start position
  
  // Resize state for element resizing
  const [resizing, setResizing] = useState<{ 
    elementId: number | null; 
    corner: string | null  // Which corner is being dragged (nw, ne, sw, se)
  }>({ elementId: null, corner: null });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Canvas container ref for calculating relative positions
  const canvasRef = useRef<HTMLDivElement>(null);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("Categories updated:", categories);
    console.log("Templates updated:", templates);
  }, [categories, templates]);

  // Main data fetching effect
  useEffect(() => {
    if (!isAdmin) return;  // Only fetch if user is admin

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching categories...");
        
        // Fetch categories ordered by their order field
        const catQuery = query(collection(db, 'categories'), orderBy('order'));
        const catSnap = await getDocs(catQuery);
        
        if (catSnap.empty) {
          console.log("No categories found");
          setCategories([]);
          setTemplates([]);
          setLoading(false);
          return;
        }
        
        // Map Firestore documents to Category objects
        const cats = catSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        setCategories(cats);
        
        // Fetch templates for each category in parallel
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
        // Flatten array of arrays into single array
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

  // ==================== DRAG AND DROP HANDLERS ====================

  /**
   * Handles start of drag operation on an element
   * @param e - Mouse event
   * @param elementId - ID of element being dragged
   */
  const handleDragStart = (e: React.MouseEvent, elementId: number) => {
    if (!canvasRef.current) return;
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;  // Don't drag locked elements
    
    e.preventDefault();
    setIsDragging(true);
    setSelectedElementId(elementId);
    
    // Calculate mouse position relative to canvas
    const canvasRect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top
    });
    setElementStart({
      x: element.x,
      y: element.y
    });
  };

  /**
   * Handles drag movement
   * @param e - Mouse event
   */
  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    // Calculate how far mouse has moved
    const deltaX = e.clientX - canvasRect.left - dragStart.x;
    const deltaY = e.clientY - canvasRect.top - dragStart.y;
    
    // Calculate new position, constrained within canvas bounds
    const element = elements.find(el => el.id === selectedElementId)!;
    const newX = Math.max(0, Math.min(800 - element.width, elementStart.x + deltaX));
    const newY = Math.max(0, Math.min(1000 - element.height, elementStart.y + deltaY));
    
    // Update element position
    updateElement(selectedElementId, { x: newX, y: newY });
  };

  /**
   * Ends drag operation
   */
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // ==================== RESIZE HANDLERS ====================

  /**
   * Starts resizing an element from a specific corner
   * @param e - Mouse event
   * @param elementId - ID of element to resize
   * @param corner - Which corner to resize from (nw, ne, sw, se)
   */
  const handleResizeStart = (e: React.MouseEvent, elementId: number, corner: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;  // Don't resize locked elements
    
    setResizing({ elementId, corner });
    setSelectedElementId(elementId);
    
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top
      });
      // Store starting dimensions
      setElementStart({
        x: element.width,
        y: element.height
      });
    }
  };

  /**
   * Handles resizing movement
   * @param e - Mouse event
   */
  const handleResize = (e: React.MouseEvent) => {
    if (!resizing.elementId || !canvasRef.current) return;
    
    const element = elements.find(el => el.id === resizing.elementId);
    if (!element) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const deltaX = e.clientX - canvasRect.left - dragStart.x;
    const deltaY = e.clientY - canvasRect.top - dragStart.y;
    
    let newWidth = element.width;
    let newHeight = element.height;
    let newX = element.x;
    let newY = element.y;
    
    // Calculate new dimensions based on which corner is being dragged
    // Each corner requires different calculations for position and size
    switch (resizing.corner) {
      case 'se':  // Southeast corner - resize width and height, keep position
        newWidth = Math.max(50, elementStart.x + deltaX);
        newHeight = Math.max(50, elementStart.y + deltaY);
        break;
      case 'sw':  // Southwest corner - resize width and height, adjust X position
        newWidth = Math.max(50, elementStart.x - deltaX);
        newHeight = Math.max(50, elementStart.y + deltaY);
        newX = element.x + deltaX;
        break;
      case 'ne':  // Northeast corner - resize width and height, adjust Y position
        newWidth = Math.max(50, elementStart.x + deltaX);
        newHeight = Math.max(50, elementStart.y - deltaY);
        newY = element.y + deltaY;
        break;
      case 'nw':  // Northwest corner - resize width and height, adjust both X and Y
        newWidth = Math.max(50, elementStart.x - deltaX);
        newHeight = Math.max(50, elementStart.y - deltaY);
        newX = element.x + deltaX;
        newY = element.y + deltaY;
        break;
    }
    
    // Keep element within canvas bounds
    if (newX < 0) {
      newWidth += newX;
      newX = 0;
    }
    if (newY < 0) {
      newHeight += newY;
      newY = 0;
    }
    if (newX + newWidth > 800) {
      newWidth = 800 - newX;
    }
    if (newY + newHeight > 1000) {
      newHeight = 1000 - newY;
    }
    
    // Ensure minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(50, newHeight);
    
    updateElement(element.id, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  };

  /**
   * Ends resizing operation
   */
  const handleResizeEnd = () => {
    setResizing({ elementId: null, corner: null });
  };

  // ==================== GLOBAL MOUSE EVENT LISTENERS ====================

  /**
   * Sets up global mouse event listeners for drag and resize operations
   * This allows dragging/resizing to continue even if mouse leaves the element
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDrag(e as unknown as React.MouseEvent);
      }
      if (resizing.elementId) {
        handleResize(e as unknown as React.MouseEvent);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
      if (resizing.elementId) {
        handleResizeEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizing]);

  // ==================== CATEGORY HANDLERS ====================

  /**
   * Saves a new category or updates an existing one
   */
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
        // Update existing category
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? { ...cat, name: categoryName.trim() } : cat
        ));
      } else {
        // Create new category
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

  /**
   * Deletes a category and all its templates
   * @param id - Category ID to delete
   */
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

  // ==================== ELEMENT MANAGEMENT ====================

  /**
   * Adds a new text element to the canvas
   */
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

  /**
   * Adds a new image element to the canvas
   */
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

  /**
   * Handles image upload for an image element
   * @param elementId - ID of element to update
   * @param file - Image file to upload
   */
  const handleImageUpload = (elementId: number, file: File) => {
    setUploadingImage(true);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
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

  /**
   * Updates a specific element's properties
   * @param id - Element ID to update
   * @param updates - Partial element object with new values
   */
  const updateElement = (id: number, updates: Partial<Element>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  /**
   * Deletes an element from the canvas
   * @param id - Element ID to delete
   */
  const deleteElement = (id: number) => {
    const elementToDelete = elements.find(el => el.id === id);
    if (elementToDelete?.locked) {
      alert('Cannot delete locked background element');
      return;
    }
    
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  /**
   * Toggles the lock state of an element
   * @param id - Element ID to toggle lock
   */
  const toggleElementLock = (id: number) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      updateElement(id, { locked: !element.locked });
    }
  };

  // Get the currently selected element
  const selectedElement = elements.find(el => el.id === selectedElementId);

  // ==================== TEMPLATE SAVE ====================

  /**
   * Generates a key from a placeholder label
   * @param label - Placeholder label
   * @returns Sanitized key string
   */
  const generateKey = (label: string): string => {
    return label.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  };

  /**
   * Saves or updates a template
   */
  const handleSaveTemplate = async (templateElements: any[], metadata: any) => {
    try {
      // Clean the data - remove undefined values
      const cleanedElements = templateElements.map(el => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(el)) {
          if (value !== undefined && value !== null) {
            cleaned[key] = value;
          }
        }
        return cleaned;
      });
  
      const templateData = {
        name: templateName.trim(),
        categoryId: templateCategory,
        elements: cleanedElements,
        previewImage: previewImage || null,
        description: templateDescription.trim() || null,
        isActive: true,
        updatedAt: serverTimestamp(),
        // Ensure no undefined values in metadata
        metadata: metadata || {},
      };
  
      // Remove any undefined values from templateData
      const cleanedTemplateData: any = {};
      for (const [key, value] of Object.entries(templateData)) {
        if (value !== undefined) {
          cleanedTemplateData[key] = value;
        }
      }
  
      if (editingTemplate && editingTemplate.id) {
        const categoryIdForPath = editingTemplate.categoryId;
        const templateId = editingTemplate.id;
        
        if (categoryIdForPath !== templateCategory) {
          // Category changed - create new template in new category and delete old one
          const newDocRef = await addDoc(
            collection(db, 'categories', templateCategory, 'templates'), 
            { ...cleanedTemplateData, createdAt: serverTimestamp() }
          );
          
          await deleteDoc(doc(db, 'categories', categoryIdForPath, 'templates', templateId));
          
          alert('Template moved to new category and updated successfully!');
        } else {
          // Same category - just update
          await updateDoc(
            doc(db, 'categories', categoryIdForPath, 'templates', templateId), 
            cleanedTemplateData
          );
          alert('Template updated successfully!');
        }
      } else {
        // Create new template
        await addDoc(collection(db, 'categories', templateCategory, 'templates'), {
          ...cleanedTemplateData,
          createdAt: serverTimestamp(),
        });
        alert('Template created successfully!');
      }
  
      setShowTemplateForm(false);
      resetTemplateForm();
      
      // Refresh data after save
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
      
      setTimeout(() => {
        fetchData();
      }, 1000);
      
    } catch (err: any) {
      if (err.code === 'not-found') {
        alert(`Error: Template not found. It may have been deleted. 
        
  Try creating it as a new template instead.`);
      } else {
        alert(`Failed: ${err.message}`);
      }
    }
  };

  /**
   * Deletes a template
   * @param templateId - Template ID to delete
   * @param categoryId - Parent category ID
   */
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

  /**
   * Resets the template form to initial state
   */
  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateCategory('');
    setTemplateDescription('');
    setPreviewImage(null);
    setEditingTemplate(null);
  };

  // ==================== RENDER ====================

  // Show loading spinner while checking auth or loading data
  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
  }

  // Don't render if user is not admin
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Header />

          {/* Tab Navigation */}
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

          {/* Categories Tab Content */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between flex-col sm:flex-row mb-6">
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

              <div className="bg-white rounded-xl shadow overflow-scroll">
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
                              <span className="bg-gray-100 px-1 py-1 rounded-full flex flex-wrap justify-center items-center">
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

          {/* Templates Tab Content */}
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

      {/* Template Designer Modal with Drag & Drop */}
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

                if (editingTemplate) {
                  // Update existing template
                  await updateDoc(
                    doc(db, 'categories', editingTemplate.categoryId, 'templates', editingTemplate.id),
                    firestoreData
                  );
                } else {
                  // Create new template
                  await addDoc(
                    collection(db, 'categories', templateCategory, 'templates'),
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
          />
        </div>
)}
    </div>
  );
};

export default EventDashboard;