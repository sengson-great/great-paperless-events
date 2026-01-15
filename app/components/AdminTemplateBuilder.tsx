// components/AdminTemplateBuilder.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Type, ImageIcon, Square, Circle, Trash2, 
  Download, Upload, Lock, Unlock, ZoomIn, ZoomOut,
  Plus, GripVertical, Move, Save, Loader2,
  X, Grid, Layers, Copy, Eye, EyeOff
} from 'lucide-react';
import { Element } from './EventTemplateEditor';

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  locked: boolean;
  visible?: boolean;
  imageUrl?: string;
  placeholder?: string;
}

interface AdminTemplateBuilderProps {
  initialElements?: any[];
  canvasWidth?: number;
  canvasHeight?: number;
  onSave?: (elements: TemplateElement[], metadata: any) => void;
  onCancel?: () => void;
}

const AdminTemplateBuilder: React.FC<AdminTemplateBuilderProps> = ({
  initialElements = [],
  canvasWidth = 800,
  canvasHeight = 1000,
  onSave,
  onCancel
}) => {
  const [elements, setElements] = useState<TemplateElement[]>(() => {
    // Handle empty case - create default background
    if (initialElements.length === 0) {
      return [{
        id: 'background',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        bgColor: '#ffffff',
        locked: true,
        visible: true
      }];
    }
    
    // Convert all elements to TemplateElement format
    return initialElements.map(element => {
      // Check if it's an old Element type (has number id)
      const isOldElement = (el: any): el is Element => {
        return typeof el.id === 'number';
      };
      
      if (isOldElement(element)) {
        // Convert Element (old) to TemplateElement (new)
        return {
          id: element.id.toString(),
          type: element.type as TemplateElement['type'],
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          content: element.content,
          fontSize: element.fontSize,
          color: element.color || '#000000',
          bgColor: element.bgColor,
          locked: element.locked || false,
          visible: true,
          imageUrl: element.imageUrl || undefined,
          opacity: 1,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center' as const
        };
      }
      
      // Already TemplateElement, ensure it has all required properties
      const templateElement = element as TemplateElement;
      return {
        id: String(templateElement.id),
        type: templateElement.type,
        x: templateElement.x,
        y: templateElement.y,
        width: templateElement.width,
        height: templateElement.height,
        content: templateElement.content,
        fontSize: templateElement.fontSize,
        color: templateElement.color || '#000000',
        bgColor: templateElement.bgColor,
        locked: templateElement.locked || false,
        visible: templateElement.visible !== false, // Default to true if not explicitly false
        imageUrl: templateElement.imageUrl,
        opacity: templateElement.opacity || 1,
        fontFamily: templateElement.fontFamily || 'Inter, sans-serif',
        textAlign: templateElement.textAlign || 'center' as const,
        placeholder: templateElement.placeholder,
        borderColor: templateElement.borderColor,
        borderWidth: templateElement.borderWidth,
        borderRadius: templateElement.borderRadius,
        rotation: templateElement.rotation
      };
    });
  });
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [saving, setSaving] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Tool definitions
  const tools = [
    { id: 'select', icon: Move, label: 'Select', shortcut: 'V' },
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { id: 'image', icon: ImageIcon, label: 'Image', shortcut: 'I' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
    { id: 'hand', icon: GripVertical, label: 'Pan', shortcut: 'H' },
  ];

  // Global mouse handlers for dragging/resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if ((isDragging || isResizing) && selectedElementId && canvasRef.current) {
        handleCanvasMouseMove(e as unknown as React.MouseEvent);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        handleCanvasMouseUp();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, selectedElementId]);

  // Mouse handlers for canvas
  const handleMouseDown = (e: React.MouseEvent, elementId: string, action: 'drag' | 'resize', corner?: string) => {
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (element.x * zoom),
        y: e.clientY - (element.y * zoom)
      });
    } else if (action === 'resize' && corner) {
      setIsResizing(true);
      setResizeCorner(corner);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
    
    setSelectedElementId(elementId);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!selectedElementId || !canvasRef.current) return;

    const element = elements.find(el => el.id === selectedElementId);
    if (!element || element.locked) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging) {
      const newX = (e.clientX - dragStart.x) / zoom;
      const newY = (e.clientY - dragStart.y) / zoom;
      
      // Snap to grid if enabled
      const snappedX = snapToGrid ? Math.round(newX / gridSize) * gridSize : newX;
      const snappedY = snapToGrid ? Math.round(newY / gridSize) * gridSize : newY;
      
      updateElement(selectedElementId, {
        x: Math.max(0, Math.min(canvasWidth - element.width, snappedX)),
        y: Math.max(0, Math.min(canvasHeight - element.height, snappedY))
      });
    } else if (isResizing) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;
      
      let newX = element.x;
      let newY = element.y;
      let newWidth = element.width;
      let newHeight = element.height;
      
      // Calculate resize based on corner
      switch (resizeCorner) {
        case 'se':
          newWidth = Math.max(20, element.width + deltaX);
          newHeight = Math.max(20, element.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(20, element.width - deltaX);
          newHeight = Math.max(20, element.height + deltaY);
          newX = element.x + deltaX;
          break;
        case 'ne':
          newWidth = Math.max(20, element.width + deltaX);
          newHeight = Math.max(20, element.height - deltaY);
          newY = element.y + deltaY;
          break;
        case 'nw':
          newWidth = Math.max(20, element.width - deltaX);
          newHeight = Math.max(20, element.height - deltaY);
          newX = element.x + deltaX;
          newY = element.y + deltaY;
          break;
      }
      
      // Constrain within canvas
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      newWidth = Math.min(newWidth, canvasWidth - newX);
      newHeight = Math.min(newHeight, canvasHeight - newY);
      
      updateElement(selectedElementId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Element management
  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 50,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 40 : 150,
      locked: false,
      visible: true,
      opacity: 1,
      
      // Default styles
      color: '#000000',
      bgColor: type === 'text' ? 'transparent' : '#e5e7eb',
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center' as const
    };
    
    if (type === 'text') {
      newElement.content = 'Double-click to edit';
      newElement.placeholder = '{dynamicText}';
    }
    
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
  };

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const duplicated = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 20,
      y: element.y + 20
    };
    
    setElements([...elements, duplicated]);
    setSelectedElementId(duplicated.id);
  };

  const toggleLock = (id: string) => {
    updateElement(id, { locked: !elements.find(el => el.id === id)?.locked });
  };

  const toggleVisibility = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    // Toggle visibility: undefined or true → false, false → true
    const newVisibility = element.visible !== false ? false : true;
    updateElement(id, { visible: newVisibility });
  };

  const copyStyle = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    // Store style in localStorage for cross-tab copying
    localStorage.setItem('copiedStyle', JSON.stringify({
      color: element.color,
      bgColor: element.bgColor,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      textAlign: element.textAlign,
      borderColor: element.borderColor,
      borderWidth: element.borderWidth,
      borderRadius: element.borderRadius,
      opacity: element.opacity
    }));
  };

  const pasteStyle = (id: string) => {
    const style = localStorage.getItem('copiedStyle');
    if (!style) return;
    
    try {
      const styleObj = JSON.parse(style);
      updateElement(id, styleObj);
    } catch (error) {
      console.error('Failed to paste style:', error);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElementId(null);
      setActiveTool('select');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata = {
        name: `Template_${new Date().toISOString().split('T')[0]}`,
        createdAt: new Date().toISOString(),
        canvasSize: { width: canvasWidth, height: canvasHeight }
      };
      
      if (onSave) {
        await onSave(elements, metadata);
      }
      
      // Show success message
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteElement = (id: string) => {
    if (id === 'background') return;
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Left Panel - Tools & Properties */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        {/* Tools Panel */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Grid size={20} />
            Tools
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                  activeTool === tool.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                title={`${tool.label} (${tool.shortcut})`}
              >
                <tool.icon size={20} />
                <span className="text-xs mt-1">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Element Properties */}
        <div className="flex-1 overflow-auto p-4">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Properties</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="p-2 hover:bg-gray-800 rounded"
                    title="Duplicate (Ctrl+D)"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => toggleVisibility(selectedElement.id)}
                    className="p-2 hover:bg-gray-800 rounded"
                    title="Toggle Visibility (H)"
                  >
                    {selectedElement.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => toggleLock(selectedElement.id)}
                    className="p-2 hover:bg-gray-800 rounded"
                    title="Toggle Lock (L)"
                  >
                    {selectedElement.locked ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-2 hover:bg-red-800 rounded text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400">X</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={e => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                    disabled={selectedElement.locked}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={e => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                    disabled={selectedElement.locked}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400">Width</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={e => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                    disabled={selectedElement.locked}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Height</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={e => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                    disabled={selectedElement.locked}
                  />
                </div>
              </div>

              {/* Type-specific properties */}
              {selectedElement.type === 'text' && (
                <>
                  <div>
                    <label className="text-xs text-gray-400">Content</label>
                    <textarea
                      value={selectedElement.content || ''}
                      onChange={e => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                      rows={3}
                      disabled={selectedElement.locked}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Placeholder</label>
                    <input
                      type="text"
                      value={selectedElement.placeholder || ''}
                      onChange={e => updateElement(selectedElement.id, { placeholder: e.target.value })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                      placeholder="e.g., {brideName}"
                      disabled={selectedElement.locked}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Font Size</label>
                    <input
                      type="number"
                      value={selectedElement.fontSize || 16}
                      onChange={e => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                      disabled={selectedElement.locked}
                    />
                  </div>
                </>
              )}

              {selectedElement.type === 'image' && (
                <div>
                  <label className="text-xs text-gray-400">Image URL</label>
                  <input
                    type="text"
                    value={selectedElement.imageUrl || ''}
                    onChange={e => updateElement(selectedElement.id, { imageUrl: e.target.value })}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                    disabled={selectedElement.locked}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    disabled={selectedElement.locked}
                  >
                    Upload Image
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400">Background Color</label>
                <input
                  type="color"
                  value={selectedElement.bgColor || '#ffffff'}
                  onChange={e => updateElement(selectedElement.id, { bgColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                  disabled={selectedElement.locked}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Text/Stroke Color</label>
                <input
                  type="color"
                  value={selectedElement.color || '#000000'}
                  onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                  disabled={selectedElement.locked}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select an element to edit properties
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showGrid"
              checked={showGrid}
              onChange={e => setShowGrid(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showGrid" className="text-sm">Show Grid</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="snapToGrid"
              checked={snapToGrid}
              onChange={e => setSnapToGrid(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="snapToGrid" className="text-sm">Snap to Grid</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Template Builder</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
                className="p-2 hover:bg-gray-800 rounded"
                disabled={zoom <= 0.3}
              >
                <ZoomOut size={20} />
              </button>
              <span className="w-16 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="p-2 hover:bg-gray-800 rounded"
                disabled={zoom >= 2}
              >
                <ZoomIn size={20} />
              </button>
            </div>
            <div className="text-sm text-gray-400">
              {canvasWidth} × {canvasHeight}
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          <div className="inline-block bg-gray-800 rounded-lg p-4 shadow-2xl">
            <div
              ref={canvasRef}
              className="relative bg-white"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                cursor: isDragging ? 'grabbing' : 'default'
              }}
              onClick={handleCanvasClick}
            >
              {/* Grid Background */}
              {showGrid && (
                <div className="absolute inset-0" 
                  style={{
                    backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                                     linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
                    backgroundSize: `${gridSize}px ${gridSize}px`
                  }}
                />
              )}

              {/* Render Elements */}
              {elements
                .filter(el => el.visible !== false) // Only show if visible is not false
                .map(element => (
                  <div
                    key={element.id}
                    className={`absolute ${selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      backgroundColor: element.bgColor,
                      color: element.color,
                      borderColor: element.borderColor,
                      borderWidth: element.borderWidth,
                      borderRadius: element.borderRadius,
                      opacity: element.opacity || 1,
                      transform: element.rotation ? `rotate(${element.rotation}deg)` : 'none',
                      cursor: element.locked ? 'not-allowed' : (isDragging && selectedElementId === element.id) ? 'grabbing' : 'grab',
                      pointerEvents: element.locked ? 'none' : 'auto'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id, 'drag')}
                  >
                    {/* Drag Handle */}
                    {!element.locked && (
                      <div
                        className="absolute -top-2 -left-2 bg-blue-500 text-white p-1 rounded-full cursor-move z-10"
                        onMouseDown={(e) => handleMouseDown(e, element.id, 'drag')}
                      >
                        <GripVertical size={12} />
                      </div>
                    )}

                    {/* Resize Handles */}
                    {!element.locked && selectedElementId === element.id && (
                      <>
                        {['nw', 'ne', 'sw', 'se'].map(corner => (
                          <div
                            key={corner}
                            className={`absolute w-3 h-3 bg-blue-500 rounded-sm ${
                              corner === 'nw' ? 'top-0 left-0 cursor-nw-resize -translate-x-1/2 -translate-y-1/2' :
                              corner === 'ne' ? 'top-0 right-0 cursor-ne-resize translate-x-1/2 -translate-y-1/2' :
                              corner === 'sw' ? 'bottom-0 left-0 cursor-sw-resize -translate-x-1/2 translate-y-1/2' :
                              'bottom-0 right-0 cursor-se-resize translate-x-1/2 translate-y-1/2'
                            }`}
                            onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', corner)}
                          />
                        ))}
                      </>
                    )}

                    {/* Element Content */}
                    {element.type === 'text' && (
                      <div
                        className="w-full h-full p-2 overflow-hidden"
                        style={{
                          fontSize: element.fontSize,
                          fontFamily: element.fontFamily,
                          fontWeight: element.fontWeight,
                          textAlign: element.textAlign,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: element.textAlign === 'center' ? 'center' : 
                                        element.textAlign === 'right' ? 'flex-end' : 'flex-start'
                        }}
                        contentEditable={!element.locked}
                        suppressContentEditableWarning
                        onBlur={(e) => updateElement(element.id, { 
                          content: e.currentTarget.textContent || '' 
                        })}
                      >
                        {element.content}
                      </div>
                    )}

                    {element.type === 'image' && element.imageUrl && (
                      <img
                        src={element.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Error';
                        }}
                      />
                    )}

                    {element.type === 'image' && !element.imageUrl && (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                        <ImageIcon size={32} />
                      </div>
                    )}

                    {element.type === 'rectangle' && (
                      <div className="w-full h-full" />
                    )}

                    {element.type === 'circle' && (
                      <div className="w-full h-full rounded-full" />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Elements List & Quick Add */}
      <div className="w-64 border-l border-gray-800 p-4">
        <div className="mb-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Layers size={20} />
            Elements ({elements.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {elements.map(element => (
              <div
                key={element.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                  selectedElementId === element.id 
                    ? 'bg-blue-600' 
                    : 'hover:bg-gray-800'
                }`}
                onClick={() => setSelectedElementId(element.id)}
              >
                <div className="w-4 h-4 rounded" style={{ backgroundColor: element.bgColor || 'transparent' }} />
                <span className="text-sm truncate">
                  {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
                  {element.id === 'background' && ' (Background)'}
                </span>
                {element.locked && <Lock size={12} className="ml-auto text-gray-400" />}
                {element.visible === false && <EyeOff size={12} className="ml-auto text-gray-400" />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">Quick Add</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addElement('text')}
              className="flex flex-col items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              <Type size={24} />
              <span className="text-xs mt-1">Text</span>
            </button>
            <button
              onClick={() => addElement('image')}
              className="flex flex-col items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              <ImageIcon size={24} />
              <span className="text-xs mt-1">Image</span>
            </button>
            <button
              onClick={() => addElement('rectangle')}
              className="flex flex-col items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              <Square size={24} />
              <span className="text-xs mt-1">Rectangle</span>
            </button>
            <button
              onClick={() => addElement('circle')}
              className="flex flex-col items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              <Circle size={24} />
              <span className="text-xs mt-1">Circle</span>
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && selectedElementId) {
              const reader = new FileReader();
              reader.onload = (event) => {
                updateElement(selectedElementId, { imageUrl: event.target?.result as string });
              };
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>
    </div>
  );
};

export default AdminTemplateBuilder;