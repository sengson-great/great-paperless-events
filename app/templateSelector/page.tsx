"use client"

// TemplateSelector.tsx
import React, { useState } from 'react';
import EventTemplateEditor from '@/app/template/page'; // Adjust path as needed
import { Element } from '@/app/template/page'; // Import the Element type
import Elegan from '@/public/Elegant.png';

interface Template {
  name: string;
  previewImage?: string; // Optional: you can add preview thumbnails later
  elements: Element[];
  eventDataDefaults?: Partial<{
    title: string;
    date: string;
    time: string;
    location: string;
  }>;
}

const templates: Record<string, Template[]> = {
  wedding: [
    {
      name: 'Elegant Gold Floral',
      previewImage: '/elegant-preview.png',
      elements: [
        { id: 1, type: 'rectangle', x: 0, y: 0, width: 800, height: 1000, color: '#000', bgColor: '#fdf8f6', locked: true },
        { id: 2, type: 'image', x: 200, y: 200, width: 400, height: 100, imageUrl: "/Elegant-removebg.png" , locked: false },
        { id: 3, type: 'text', x: 235, y: 100, width: 500, height: 80, content: 'សិរីសួស្ដីអាពាហ៍ពិពាហ៍', fontSize: 36, color: '#d4af37', bgColor: 'transparent', locked: false },
        { id: 4, type: 'text', x: 85, y: 300, width: 200, height: 50, content: 'កូនប្រុសនាម', fontSize: 20, color: '#333333', bgColor: 'transparent', locked: false },
        { id: 5, type: 'text', x: 600, y: 300, width: 200, height: 50, content: 'កូនស្រីនាម', fontSize: 20, color: '#333333', bgColor: 'transparent', locked: false },
        { id: 6, type: 'text', x: 85, y: 370, width: 400, height: 50, content: 'ឡេង ស៊ុយតុង', fontSize: 30, color: '#333333', bgColor: 'transparent', locked: false },
        { id: 7, type: 'text', x: 600, y: 370, width: 400, height: 50, content: 'សុខ​ ពិសី', fontSize: 30, color: '#333333', bgColor: 'transparent', locked: false },
        { id: 8, type: 'text', x: 270, y: 480, width: 400, height: 80, content: 'សូមគោរពអញ្ជើញ', fontSize: 36, color: '#d4af37', bgColor: 'transparent', locked: false },
        { id: 9, type: 'rectangle', x: 100, y: 580, width: 600, height: 100, color: '#000', bgColor: '#cac5c3', locked: true },
        { id: 10, type: 'text', x: 130, y: 700, width: 600, height: 80, content: 'ថ្ងៃសុក្រ​ ទី៣០ ខែមករា​ ឆ្នាំ២០២៦ វេលាម៉ោង៥ល្ងាច', fontSize: 28, color: '#d4af37', bgColor: 'transparent', locked: false },
        { id: 11, type: 'text', x: 80, y: 800, width: 800, height: 60, content: 'នៅគេហដ្ឋានខាងស្រី ភូមិតាកែវ ឃុំតាកែវ ស្រុកតាកែវ​ ខេត្តតាកែវ', fontSize: 28, color: '#555555', bgColor: 'transparent', locked: false },
      ],
      eventDataDefaults: { title: 'Emma & James', date: '2026-06-15', time: '4:00 PM', location: 'Rose Garden Venue' },
    },
    {
      name: 'Minimalist Modern',
      elements: [
        { id: 1, type: 'rectangle', x: 0, y: 0, width: 800, height: 1000, color: '#000', bgColor: '#ffffff', locked: true },
        { id: 2, type: 'text', x: 200, y: 200, width: 400, height: 100, content: '{bride}', fontSize: 72, color: '#000000', bgColor: 'transparent', locked: false },
        { id: 3, type: 'text', x: 200, y: 300, width: 400, height: 100, content: '&', fontSize: 72, color: '#000000', bgColor: 'transparent', locked: false },
        { id: 4, type: 'text', x: 200, y: 400, width: 400, height: 100, content: '{groom}', fontSize: 72, color: '#000000', bgColor: 'transparent', locked: false },
        { id: 5, type: 'rectangle', x: 300, y: 550, width: 200, height: 2, color: '#000', bgColor: '#000000', locked: false },
        { id: 6, type: 'text', x: 250, y: 600, width: 300, height: 60, content: '{date}', fontSize: 32, color: '#000000', bgColor: 'transparent', locked: false },
      ],
    },
    {
      name: 'Vintage Romance',
      elements: [
        { id: 1, type: 'rectangle', x: 0, y: 0, width: 800, height: 1000, color: '#000', bgColor: '#f9f5f0', locked: true },
        { id: 2, type: 'image', x: 100, y: 50, width: 600, height: 300, imageUrl: 'https://png.pngtree.com/png-vector/20230817/ourmid/pngtree-vintage-floral-wedding-frame-clipart-png-image_6871443.png', locked: false },
        { id: 3, type: 'text', x: 150, y: 400, width: 500, height: 100, content: 'Together with their families', fontSize: 28, color: '#8b6f47', bgColor: 'transparent', locked: false },
        { id: 4, type: 'text', x: 100, y: 500, width: 600, height: 120, content: '{bride} & {groom}', fontSize: 60, color: '#8b6f47', bgColor: 'transparent', locked: false },
      ],
    },
  ],
  birthday: [
    { name: 'Colorful Party', elements: [/* Add 3 birthday templates */] },
    { name: 'Elegant Black & Gold', elements: [/* ... */] },
    { name: 'Kids Theme', elements: [/* ... */] },
  ],
  conference: [
    { name: 'Professional Blue', elements: [/* ... */] },
    { name: 'Modern Tech', elements: [/* ... */] },
    { name: 'Corporate Classic', elements: [/* ... */] },
  ],
  // Add more event types as needed
};

const eventTypes = [
  { id: 'wedding', label: 'Wedding', icon: '💒' },
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'conference', label: 'Conference', icon: '🏢' },
];

export const TemplateSelector: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  if (selectedTemplate) {
    return <EventTemplateEditor initialElements={selectedTemplate.elements} initialEventData={selectedTemplate.eventDataDefaults} />;
  }

  const currentTemplates = selectedType ? templates[selectedType] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Choose Your Event Template</h1>

      {/* Step 1: Choose Event Type */}
      {!selectedType ? (
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {eventTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="bg-white rounded-xl shadow-lg p-12 hover:shadow-2xl transition-shadow text-center"
              >
                <div className="text-6xl mb-4">{type.icon}</div>
                <h2 className="text-2xl font-semibold">{type.label}</h2>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Back button */}
          <button
            onClick={() => { setSelectedType(null); setSelectedTemplate(null); }}
            className="mb-6 text-blue-600 hover:underline"
          >
            ← Back to event types
          </button>

          {/* Step 2: Choose Template */}
          <h2 className="text-3xl font-bold mb-8">
            Select a {eventTypes.find(t => t.id === selectedType)?.label} Template
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {currentTemplates.map((tmpl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedTemplate(tmpl)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow"
              >
                <div className="bg-gray-200 border-2 border-dashed rounded-t-xl w-full h-96 flex items-center justify-center text-gray-500 overflow-hidden">
  {tmpl.previewImage ? (
    <img src={tmpl.previewImage} alt={tmpl.name} className="w-full h-full object-cover" />
  ) : (
    <span className="text-xl">{tmpl.name}</span>
  )}
</div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-center">{tmpl.name}</h3>
                  <button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                    Use This Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TemplateSelector;