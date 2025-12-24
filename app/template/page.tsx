"use client";
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { 
  Plus, 
  Type, 
  ImageIcon, 
  Square, 
  Circle, 
  Trash2, 
  Download, 
  Upload, 
  Lock, 
  Unlock, 
  ZoomIn, 
  ZoomOut, 
  Loader2 
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface Element {
  id: number;
  type: 'text' | 'image' | 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  locked: boolean;
  imageUrl?: string | null;
}

interface EventData {
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
}

interface EventTemplateEditorProps {
  initialElements?: Element[];
  initialEventData?: Partial<EventData>;
}

const EventTemplateEditor: React.FC<EventTemplateEditorProps> = ({
  initialElements = [],
  initialEventData = {},
}) => {
  const [elements, setElements] = useState<Element[]>(initialElements);
  const [eventData, setEventData] = useState<EventData>({
    title: 'Annual Tech Conference',
    date: '2025-03-15',
    time: '9:00 AM',
    location: 'Convention Center',
    ...initialEventData,
  });

  const [selectedTool, setSelectedTool] = useState<'text' | 'image' | 'rectangle' | 'circle' | null>(null);
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [savingInvitation, setSavingInvitation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'properties'>('tools');

  const shareUrl = invitationId ? `${window.location.origin}/invite/${invitationId}` : '';

  const tools = [
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'image' as const, icon: ImageIcon, label: 'Image' },
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
  ];

  // Calculate responsive canvas dimensions
  const calculateCanvasDimensions = () => {
    if (!containerRef.current) return { width: 800, height: 1000 };
    
    const containerWidth = containerRef.current.clientWidth - 40; // Account for padding
    const containerHeight = containerRef.current.clientHeight - 40;
    
    // Keep aspect ratio of 8:10
    const width = Math.min(containerWidth, 800);
    const height = width * 1.25; // 1000/800 = 1.25
    
    return { width, height };
  };

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 1000 });

  useLayoutEffect(() => {
    const updateCanvasDimensions = () => {
      const dimensions = calculateCanvasDimensions();
      setCanvasDimensions(dimensions);
      
      // Auto-zoom for mobile
      if (window.innerWidth < 768) {
        const scale = dimensions.width / 800;
        setZoom(Math.max(0.5, Math.min(1, scale)));
      }
    };

    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, []);

  const addElement = (type: 'text' | 'image' | 'rectangle' | 'circle') => {
    const newElement: Element = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      content: type === 'text' ? 'Double click to edit' : '',
      fontSize: 16,
      color: '#000000',
      bgColor: type === 'text' ? 'transparent' : '#e5e7eb',
      locked: false,
      imageUrl: type === 'image' ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400' : null,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setSelectedTool(null);
    setActiveTab('properties');
  };

  const saveAndGenerateLink = async () => {
    if (!user) {
      alert('Please sign in to save your invitation');
      return;
    }

    setSavingInvitation(true);
    try {
      const invitationData = {
        elements,
        eventData,
        createdAt: new Date(),
        organizerId: user.uid,
      };

      const docRef = await addDoc(collection(db, 'invitations'), invitationData);
      setInvitationId(docRef.id);
      setShowShareModal(true);
    } catch (err) {
      console.error('Error saving invitation:', err);
      alert('Failed to save invitation. Please try again.');
    } finally {
      setSavingInvitation(false);
    }
  };

  const updateElement = (id: number, updates: Partial<Element>) => {
    setElements(elements.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  const deleteElement = () => {
    if (selectedElement !== null) {
      setElements(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
      setActiveTab('tools');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool && e.target === canvasRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      const newElement: Element = {
        id: Date.now(),
        type: selectedTool,
        x,
        y,
        width: selectedTool === 'text' ? 200 : 150,
        height: selectedTool === 'text' ? 50 : 150,
        content: selectedTool === 'text' ? 'Double click to edit' : '',
        fontSize: 16,
        color: '#000000',
        bgColor: selectedTool === 'text' ? 'transparent' : '#e5e7eb',
        locked: false,
        imageUrl: selectedTool === 'image' ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400' : null,
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
      setSelectedTool(null);
      setActiveTab('properties');
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, elementId: number) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element?.locked) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setActiveTab('properties');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || selectedElement === null) return;

    const element = elements.find(el => el.id === selectedElement);
    if (!element || element.locked) return;

    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;

    updateElement(selectedElement, {
      x: element.x + dx,
      y: element.y + dy,
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, selectedElement, dragStart]);

  const exportTemplate = () => {
    const data = { elements, eventData };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setElements(data.elements || []);
        setEventData({ ...eventData, ...data.eventData });
      } catch (err) {
        alert('Invalid template file');
      }
    };
    reader.readAsText(file);
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Desktop only */}
        <div className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Tools</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => addElement(tool.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    selectedTool === tool.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <tool.icon size={20} />
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-3">Event Data</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Event Title"
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={eventData.date}
                  onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Time"
                  value={eventData.time}
                  onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={saveAndGenerateLink}
                disabled={savingInvitation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-70 transition text-sm"
              >
                {savingInvitation ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Save & Share
                  </>
                )}
              </button>

              <button
                onClick={exportTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Download size={18} />
                Export Template
              </button>

              <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 cursor-pointer transition text-sm">
                <Upload size={18} />
                Import Template
                <input type="file" accept=".json" onChange={importTemplate} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar with Zoom Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-b">
            <h1 className="text-xl font-bold mb-2 sm:mb-0">Template Editor</h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.3, zoom - 0.25))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  disabled={zoom <= 0.3}
                >
                  <ZoomOut size={20} />
                </button>
                <span className="font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  disabled={zoom >= 2}
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4" ref={containerRef}>
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: 'fit-content',
                height: 'fit-content',
                margin: '0 auto',
                transition: 'transform 0.2s ease',
              }}
            >
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="relative bg-white shadow-2xl"
                style={{ 
                  width: `${canvasDimensions.width}px`, 
                  height: `${canvasDimensions.height}px`,
                  minWidth: '300px',
                  minHeight: '375px',
                }}
              >
                {elements.map((el) => (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    className={`absolute cursor-move ${selectedElement === el.id ? 'ring-2 ring-blue-500' : ''} ${el.locked ? 'cursor-not-allowed' : ''}`}
                    style={{
                      left: `${(el.x / 800) * 100}%`,
                      top: `${(el.y / 1000) * 100}%`,
                      width: `${(el.width / 800) * 100}%`,
                      height: `${(el.height / 1000) * 100}%`,
                    }}
                  >
                    {el.type === 'text' && (
                      <div
                        contentEditable={!el.locked}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                        style={{
                          fontSize: `${(el.fontSize || 16) * (canvasDimensions.width / 800)}px`,
                          color: el.color,
                          backgroundColor: el.bgColor,
                          width: '100%',
                          height: '100%',
                          outline: 'none',
                          padding: '8px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {el.content}
                      </div>
                    )}
                    {el.type === 'rectangle' && (
                      <div style={{ width: '100%', height: '100%', backgroundColor: el.bgColor, border: `2px solid ${el.color}` }} />
                    )}
                    {el.type === 'circle' && (
                      <div style={{ width: '100%', height: '100%', backgroundColor: el.bgColor, border: `2px solid ${el.color}`, borderRadius: '50%' }} />
                    )}
                    {el.type === 'image' && el.imageUrl && (
                      <img 
                        src={el.imageUrl} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150x150?text=Image+Error';
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties (Desktop only) */}
        {selectedEl && (
          <div className="hidden lg:block w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Properties</h2>
              <button onClick={deleteElement} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={Math.round(selectedEl.x)}
                    onChange={(e) => updateElement(selectedEl.id, { x: Number(e.target.value) || 0 })}
                    disabled={selectedEl.locked}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={Math.round(selectedEl.y)}
                    onChange={(e) => updateElement(selectedEl.id, { y: Number(e.target.value) || 0 })}
                    disabled={selectedEl.locked}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="Y"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={Math.round(selectedEl.width)}
                    onChange={(e) => updateElement(selectedEl.id, { width: Number(e.target.value) || 0 })}
                    disabled={selectedEl.locked}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="W"
                  />
                  <input
                    type="number"
                    value={Math.round(selectedEl.height)}
                    onChange={(e) => updateElement(selectedEl.id, { height: Number(e.target.value) || 0 })}
                    disabled={selectedEl.locked}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="H"
                  />
                </div>
              </div>

              {selectedEl.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size</label>
                  <input
                    type="number"
                    value={selectedEl.fontSize}
                    onChange={(e) => updateElement(selectedEl.id, { fontSize: Number(e.target.value) || 16 })}
                    disabled={selectedEl.locked}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  value={selectedEl.color || '#000000'}
                  onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                  disabled={selectedEl.locked}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>

              {selectedEl.type !== 'text' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Background</label>
                  <input
                    type="color"
                    value={selectedEl.bgColor || '#ffffff'}
                    onChange={(e) => updateElement(selectedEl.id, { bgColor: e.target.value })}
                    disabled={selectedEl.locked}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              )}

              {selectedEl.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="text"
                    value={selectedEl.imageUrl || ''}
                    onChange={(e) => updateElement(selectedEl.id, { imageUrl: e.target.value })}
                    disabled={selectedEl.locked}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="https://..."
                  />
                </div>
              )}

              <button
                onClick={() => updateElement(selectedEl.id, { locked: !selectedEl.locked })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                {selectedEl.locked ? <Unlock size={18} /> : <Lock size={18} />}
                {selectedEl.locked ? 'Unlock' : 'Lock'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Mobile only */}
      <div className="lg:hidden border-t border-gray-200 bg-white">
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'tools' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            Tools & Data
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'properties' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            disabled={!selectedEl}
          >
            Properties {selectedEl && `(${selectedEl.type})`}
          </button>
        </div>

        {/* Tabs Content */}
        <div className="p-4 max-h-60 overflow-y-auto">
          {activeTab === 'tools' ? (
            <div>
              {/* Tools Section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Tools</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => addElement(tool.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
                        selectedTool === tool.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <tool.icon size={24} />
                      <span className="text-xs mt-1">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Data Section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Event Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Event Title"
                    value={eventData.title}
                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={eventData.date}
                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Time"
                    value={eventData.time}
                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={saveAndGenerateLink}
                  disabled={savingInvitation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-70 transition text-sm"
                >
                  {savingInvitation ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Save & Share
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={exportTemplate}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    <Download size={16} />
                    Export
                  </button>

                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 cursor-pointer transition text-sm">
                    <Upload size={16} />
                    Import
                    <input type="file" accept=".json" onChange={importTemplate} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            // Properties Tab Content
            <div>
              {selectedEl ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Element Properties</h3>
                    <button onClick={deleteElement} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Position</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">X</div>
                          <input
                            type="number"
                            value={Math.round(selectedEl.x)}
                            onChange={(e) => updateElement(selectedEl.id, { x: Number(e.target.value) || 0 })}
                            disabled={selectedEl.locked}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Y</div>
                          <input
                            type="number"
                            value={Math.round(selectedEl.y)}
                            onChange={(e) => updateElement(selectedEl.id, { y: Number(e.target.value) || 0 })}
                            disabled={selectedEl.locked}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Size</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Width</div>
                          <input
                            type="number"
                            value={Math.round(selectedEl.width)}
                            onChange={(e) => updateElement(selectedEl.id, { width: Number(e.target.value) || 0 })}
                            disabled={selectedEl.locked}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Height</div>
                          <input
                            type="number"
                            value={Math.round(selectedEl.height)}
                            onChange={(e) => updateElement(selectedEl.id, { height: Number(e.target.value) || 0 })}
                            disabled={selectedEl.locked}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {selectedEl.type === 'text' && (
                      <div>
                        <label className="block text-xs font-medium mb-1">Font Size</label>
                        <input
                          type="number"
                          value={selectedEl.fontSize}
                          onChange={(e) => updateElement(selectedEl.id, { fontSize: Number(e.target.value) || 16 })}
                          disabled={selectedEl.locked}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium mb-1">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedEl.color || '#000000'}
                          onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                          disabled={selectedEl.locked}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">{selectedEl.color || '#000000'}</span>
                      </div>
                    </div>

                    {selectedEl.type !== 'text' && (
                      <div>
                        <label className="block text-xs font-medium mb-1">Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedEl.bgColor || '#ffffff'}
                            onChange={(e) => updateElement(selectedEl.id, { bgColor: e.target.value })}
                            disabled={selectedEl.locked}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">{selectedEl.bgColor || '#ffffff'}</span>
                        </div>
                      </div>
                    )}

                    {selectedEl.type === 'image' && (
                      <div>
                        <label className="block text-xs font-medium mb-1">Image URL</label>
                        <input
                          type="text"
                          value={selectedEl.imageUrl || ''}
                          onChange={(e) => updateElement(selectedEl.id, { imageUrl: e.target.value })}
                          disabled={selectedEl.locked}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    <button
                      onClick={() => updateElement(selectedEl.id, { locked: !selectedEl.locked })}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      {selectedEl.locked ? <Unlock size={16} /> : <Lock size={16} />}
                      {selectedEl.locked ? 'Unlock Element' : 'Lock Element'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Select an element to edit its properties
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && invitationId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 text-green-700">
              ✓ Invitation Saved!
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10">
              <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl">
                <QRCode value={shareUrl} size={180} level="H" className="sm:w-56" />
                <p className="text-center text-xs sm:text-sm text-gray-600 mt-4">Scan to view</p>
              </div>

              <div className="text-center md:text-left">
                <p className="font-semibold mb-3">Shareable Link:</p>
                <code className="bg-gray-100 px-3 py-2 rounded-lg block text-xs sm:text-sm break-all mb-4 sm:mb-6">
                  {shareUrl}
                </code>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert('Link copied!');
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
                  >
                    Copy Link
                  </button>

                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center text-sm sm:text-base"
                  >
                    View Invitation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTemplateEditor;