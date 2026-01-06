"use client"

import React, { useState, useEffect } from 'react';
import EventTemplateEditor from '@/app/template/page';
import { Element } from '@/app/template/page';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Define Template interface matching your Firebase structure
interface FirebaseTemplate {
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

// Define Template for TemplateSelector (compatible with existing code)
interface Template {
  id?: string;
  name: string;
  previewImage?: string;
  elements: Element[];
  eventDataDefaults?: Partial<{
    title: string;
    date: string;
    time: string;
    location: string;
  }>;
  category?: string;
  categoryId?: string; // Add this
  description?: string;
}

// Interface for Category
interface Category {
  id: string;
  name: string;
  order: number;
}

const TemplateSelector: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groupedByCategory, setGroupedByCategory] = useState<Record<string, Template[]>>({});

  // Fetch categories and templates from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const catQuery = query(collection(db, 'categories'), orderBy('order'));
        const catSnap = await getDocs(catQuery);
        
        if (catSnap.empty) {
          console.log("No categories found");
          setLoading(false);
          return;
        }
        
        const cats = catSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        setCategories(cats);
        
        // Fetch all templates
        const allTemplates: Template[] = [];
        const grouped: Record<string, Template[]> = {};
        
        // Initialize groups for all categories
        cats.forEach(cat => {
          grouped[cat.id] = [];
        });
        
        for (const cat of cats) {
          try {
            const tempQuery = query(collection(db, `categories/${cat.id}/templates`), orderBy('createdAt', 'desc'));
            const tempSnap = await getDocs(tempQuery);
            
            tempSnap.docs.forEach(doc => {
              const firebaseTemplate = doc.data() as FirebaseTemplate;
              
              const template: Template = {
                id: doc.id,
                name: firebaseTemplate.name,
                previewImage: firebaseTemplate.previewImage,
                elements: firebaseTemplate.elements || [],
                category: cat.name,
                categoryId: cat.id, // Store category ID
                description: firebaseTemplate.description,
                eventDataDefaults: {
                  title: firebaseTemplate.name,
                  date: new Date().toISOString().split('T')[0],
                  time: '18:00',
                  location: 'https://maps.app.goo.gl/EzaCs7ybbjdohnwj9'
                }
              };
              
              allTemplates.push(template);
              
              // Group by actual category ID
              if (!grouped[cat.id]) {
                grouped[cat.id] = [];
              }
              grouped[cat.id].push(template);
            });
          } catch (error) {
            console.error(`Error fetching templates for category ${cat.id}:`, error);
          }
        }
        
        setTemplates(allTemplates);
        setGroupedByCategory(grouped);
        
        console.log('Templates grouped by actual categories:', Object.keys(grouped));
        
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // If template is selected, open the editor
  if (selectedTemplate) {
    return <EventTemplateEditor 
      initialElements={selectedTemplate.elements} 
      initialEventData={selectedTemplate.eventDataDefaults} 
    />;
  }

  // Get templates for selected category
  const currentTemplates = selectedCategory ? groupedByCategory[selectedCategory] || [] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  // If no categories, show message
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 text-gray-300">📁</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Categories Found</h1>
          <p className="text-gray-600 mb-8">Create categories and templates in the admin dashboard first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Choose Your Event Template
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select from professionally designed templates for any occasion. 
            Customize every detail to match your unique style.
          </p>
        </header>

        {/* Step 1: Choose Category */}
        {!selectedCategory ? (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8 text-gray-700">
              Browse Templates by Category
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => {
                const categoryTemplates = groupedByCategory[category.id] || [];
                const templateCount = categoryTemplates.length;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 text-center group hover:-translate-y-1 border border-gray-100"
                  >
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      {getCategoryIcon(category.name)}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {templateCount > 0 
                        ? `${templateCount} template${templateCount !== 1 ? 's' : ''} available`
                        : 'No templates yet'
                      }
                    </p>
                    {templateCount > 0 && (
                      <div className="mt-4 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium inline-block">
                        Browse Templates
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Summary of all templates */}
            <div className="mt-12 p-6 bg-white rounded-xl shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">All Templates</h3>
                  <p className="text-gray-600 text-sm">
                    Browse all {templates.length} templates across {categories.length} categories
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  View All Templates ({templates.length})
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={() => { setSelectedCategory(null); setSelectedTemplate(null); }}
              className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to categories
            </button>

            {/* Step 2: Choose Template */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {selectedCategory === 'all' 
                  ? 'All Available Templates' 
                  : `${categories.find(c => c.id === selectedCategory)?.name} Templates`
                }
              </h2>
              <p className="text-gray-600">
                {selectedCategory === 'all'
                  ? `Browse all ${templates.length} templates from all categories`
                  : `Select a template to customize for your event`
                }
              </p>
            </div>

            {(selectedCategory === 'all' ? templates : currentTemplates).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-6 text-gray-300">🎨</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  No templates available
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {selectedCategory === 'all'
                    ? "No templates have been created yet. Check back later or create your own in the admin dashboard."
                    : `No templates available in this category yet.`
                  }
                </p>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Categories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(selectedCategory === 'all' ? templates : currentTemplates).map((tmpl, idx) => {
                  const category = categories.find(c => c.id === tmpl.categoryId);
                  return (
                    <div
                      key={tmpl.id || idx}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                    >
                      <div className="h-64 bg-linear-to-br from-gray-50 to-gray-100 border-b border-gray-200 relative overflow-hidden">
                        {tmpl.previewImage ? (
                          <img 
                            src={tmpl.previewImage} 
                            alt={tmpl.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6">
                            <div className="text-4xl mb-4 text-gray-300">📄</div>
                            <span className="text-gray-400 text-center text-lg font-medium">{tmpl.name}</span>
                          </div>
                        )}
                        {category && (
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full shadow-sm">
                              {category.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{tmpl.name}</h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {tmpl.elements?.length || 0} elements
                          </span>
                        </div>
                        
                        {tmpl.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {tmpl.description}
                          </p>
                        )}
                        
                        <button className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all group-hover:shadow-lg">
                          Use This Template
                        </button>
                        
                        {/* Preview placeholders if available */}
                        {tmpl.elements && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Sample content:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {tmpl.elements
                                .filter(el => el.type === 'text')
                                .slice(0, 3)
                                .map((el, i) => (
                                  <span 
                                    key={i} 
                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded truncate max-w-[120px]"
                                    title={el.content}
                                  >
                                    {el.content?.substring(0, 15)}{el.content && el.content.length > 15 ? '...' : ''}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* View all templates button when viewing a specific category */}
            {selectedCategory !== 'all' && templates.length > 0 && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  View All Templates ({templates.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to get icon based on category name
const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('wedding') || name.includes('marriage')) {
    return '💒';
  }
  if (name.includes('birthday')) {
    return '🎂';
  }
  if (name.includes('conference') || name.includes('business')) {
    return '🏢';
  }
  if (name.includes('graduation')) {
    return '🎓';
  }
  if (name.includes('anniversary')) {
    return '💝';
  }
  if (name.includes('party')) {
    return '🎉';
  }
  
  return '📁'; // Default icon
};

export default TemplateSelector;