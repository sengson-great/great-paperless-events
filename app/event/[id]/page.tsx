// app/event/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Globe, Lock, Eye, EyeOff, 
  Loader2, Calendar, Clock, MapPin, Type, 
  ImageIcon, Square, Circle, Trash2, 
  Edit2, Upload, X, AlertCircle, Download,
  Share2, ZoomIn, ZoomOut, Grid, Maximize2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import QRCode from 'react-qr-code';

interface Element {
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

const EditEventPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const eventId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Event data
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: ''
  });
  
  // Design elements
  const [elements, setElements] = useState<Element[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [privatePin, setPrivatePin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  // Canvas state
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize] = useState({ width: 800, height: 1000 }); // Fixed canvas size
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadEventData();
  }, [eventId, user, authLoading]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading event with ID:', eventId);
      console.log('Current user UID:', user?.uid);
      
      const docSnap = await getDoc(doc(db, 'events', eventId));
      
      if (!docSnap.exists()) {
        setError('Event not found');
        setLoading(false);
        return;
      }
      
      const data = docSnap.data();
      console.log('Event data from Firestore:', data);
      console.log('Event createdBy:', data.createdBy);
      console.log('User UID:', user?.uid);
      
      // Check ownership - Add admin check
      if (data.createdBy !== user?.uid) {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', user?.uid || ''));
        const userData = userDoc.data();
        const isAdmin = userData?.role === 'admin';
        
        if (!isAdmin) {
          setError('You do not have permission to edit this event');
          setLoading(false);
          return;
        }
        console.log('Admin access granted');
      }
      
      // Set event data
      setEventData({
        title: data.title || '',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        description: data.description || ''
      });
      
      // Set design elements
      setElements(data.elements || []);
      
      // Set privacy settings
      setIsPublic(data.isPublic || false);
      setPrivatePin(data.privatePin || '');
      
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError('Failed to load event: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!eventData.title.trim()) {
      alert('Event title is required');
      return;
    }
    
    setSaving(true);
    try {
      const eventRef = doc(db, 'events', eventId);
      const updateData = {
        title: eventData.title.trim(),
        description: eventData.description?.trim() || '',
        date: eventData.date,
        time: eventData.time.trim(),
        location: eventData.location.trim(),
        elements: elements,
        isPublic: isPublic,
        privatePin: isPublic ? '' : privatePin,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(eventRef, updateData);
      alert('Event updated successfully!');
      
    } catch (err: any) {
      console.error('Error saving:', err);
      alert('Failed to save event: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      return;
    }
    
    try {
      // Check user permissions before deleting
      const docSnap = await getDoc(doc(db, 'events', eventId));
      const data = docSnap.data();
      
      if (data?.createdBy !== user?.uid) {
        // Check admin permission
        const userDoc = await getDoc(doc(db, 'users', user?.uid || ''));
        const userData = userDoc.data();
        const isAdmin = userData?.role === 'admin';
        
        if (!isAdmin) {
          alert('You do not have permission to delete this event');
          return;
        }
      }
      
      await deleteDoc(doc(db, 'events', eventId));
      alert('Event deleted successfully');
      router.push('/my-events');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event: ' + err.message);
    }
  };

  const addElement = (type: 'text' | 'image' | 'rectangle' | 'circle') => {
    if (type === 'image') {
      fileInputRef.current?.click();
      return;
    }
    
    const newElement: Element = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      content: type === 'text' ? 'Edit text' : '',
      fontSize: 24,
      color: '#000000',
      bgColor: type === 'text' ? 'transparent' : '#3b82f6',
      locked: false,
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: number, updates: Partial<Element>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const filename = `images/${user.uid}/${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, filename);
      
      const snapshot = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newElement: Element = {
        id: Date.now(),
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        content: '',
        fontSize: 16,
        color: '#000000',
        bgColor: 'transparent',
        locked: false,
        imageUrl: downloadURL,
      };
      
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/invite/${eventId}${!isPublic && privatePin ? `?pin=${privatePin}` : ''}`
    : '';

  const copyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h1 className="text-xl font-bold">Error</h1>
            </div>
            
            <p className="text-gray-700 mb-6">{error}</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push(`/event/${eventId}`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowLeft size={18} />
                View Event
              </button>
              
              <button
                onClick={() => router.push('/my-events')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft size={18} />
                My Events
              </button>
              
              {/* Debug button - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    console.log('Debug info:');
                    console.log('Event ID:', eventId);
                    console.log('User UID:', user?.uid);
                    loadEventData();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Debug Info
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            <ArrowLeft size={18} />
            Back to Event
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {user?.email} {user?.uid === elements.find(e => true)?.id ? '(Owner)' : '(Admin)'}
            </span>
            
            <button
              onClick={() => setShowPreview(true)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Preview
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tools Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium text-gray-800 mb-3">Design Tools</h3>
              
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => addElement('text')}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${selectedTool === 'text' ? 'bg-blue-100 border-blue-500' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  <Type size={20} className="text-gray-600 mb-1" />
                  <span className="text-xs">Text</span>
                </button>
                
                <button
                  onClick={() => addElement('image')}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${selectedTool === 'image' ? 'bg-blue-100 border-blue-500' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  <ImageIcon size={20} className="text-gray-600 mb-1" />
                  <span className="text-xs">Image</span>
                </button>
                
                <button
                  onClick={() => addElement('rectangle')}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${selectedTool === 'rectangle' ? 'bg-blue-100 border-blue-500' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  <Square size={20} className="text-gray-600 mb-1" />
                  <span className="text-xs">Box</span>
                </button>
                
                <button
                  onClick={() => addElement('circle')}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${selectedTool === 'circle' ? 'bg-blue-100 border-blue-500' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  <Circle size={20} className="text-gray-600 mb-1" />
                  <span className="text-xs">Circle</span>
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-700">Canvas Tools</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={zoom <= 0.25}
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                      onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={zoom >= 2}
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <Grid size={16} />
                  <span className="text-sm">{showGrid ? 'Hide Grid' : 'Show Grid'}</span>
                </button>
              </div>
            </div>

            {/* Event Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium text-gray-800 mb-3">Event Details</h3>
              
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Event title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={eventData.date}
                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  
                  <input
                    type="text"
                    value={eventData.time}
                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Time"
                  />
                </div>
                
                <div>
                  <input
                    type="text"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Location"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="text-green-600" size={20} />
                  ) : (
                    <Lock className="text-gray-600" size={20} />
                  )}
                  <span className="font-medium">
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              
              {!isPublic && (
                <div>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={privatePin}
                      onChange={(e) => setPrivatePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm pr-10"
                      placeholder="Enter PIN"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Guests will need this PIN to view
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Canvas Area - Responsive version */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-4 h-full">
              {/* Canvas Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-800">Design Canvas</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {elements.length} elements
                  </span>
                  <span className="text-xs text-gray-500">
                    {canvasSize.width} × {canvasSize.height}px
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 text-sm"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                  
                  <button
                    onClick={handleDeleteEvent}
                    className="flex items-center gap-2 px-3 py-1.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                  >
                    <Trash2 size={16} />
                    Delete Event
                  </button>
                </div>
              </div>

              {/* Canvas Container - Responsive wrapper */}
              <div 
                ref={canvasContainerRef}
                className="relative bg-gray-50 rounded-lg border-2 border-gray-300 p-4 overflow-auto flex items-center justify-center"
                style={{ 
                  maxHeight: '70vh',
                  minHeight: '300px'
                }}
              >
                {/* Canvas - Scales with container */}
                <div 
                  ref={canvasRef}
                  className="relative bg-white"
                  style={{
                    width: `${canvasSize.width * zoom}px`,
                    height: `${canvasSize.height * zoom}px`,
                    minWidth: `${canvasSize.width * zoom}px`,
                    minHeight: `${canvasSize.height * zoom}px`,
                    position: 'relative',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                >
                  {/* Grid */}
                  {showGrid && (
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #94a3b8 1px, transparent 1px),
                          linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
                        `,
                        backgroundSize: `${50 * zoom}px ${50 * zoom}px`
                      }}
                    />
                  )}

                  {/* Elements */}
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      className={`absolute ${selectedElement === el.id ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-gray-300'}`}
                      style={{
                        left: `${el.x * zoom}px`,
                        top: `${el.y * zoom}px`,
                        width: `${el.width * zoom}px`,
                        height: `${el.height * zoom}px`,
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedElement(el.id)}
                    >
                      {el.type === 'text' && (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateElement(el.id, { 
                            content: e.currentTarget.textContent || '' 
                          })}
                          className="w-full h-full outline-none p-2"
                          style={{
                            fontSize: `${(el.fontSize || 16) * zoom}px`,
                            color: el.color,
                            backgroundColor: el.bgColor,
                          }}
                        >
                          {el.content || 'Edit text'}
                        </div>
                      )}
                      
                      {el.type === 'image' && el.imageUrl && (
                        <img
                          src={el.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {el.type === 'rectangle' && (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: el.bgColor,
                            border: `2px solid ${el.color}`,
                          }}
                        />
                      )}
                      
                      {el.type === 'circle' && (
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            backgroundColor: el.bgColor,
                            border: `2px solid ${el.color}`,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {elements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl">
                      <Edit2 className="text-gray-300 mx-auto mb-4" size={48} />
                      <h4 className="text-lg font-medium text-gray-600 mb-2">Start Designing</h4>
                      <p className="text-gray-500 text-sm">
                        Add elements from the toolbar to create your invitation
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={zoom <= 0.25}
                >
                  <ZoomOut size={18} />
                </button>
                
                <div className="w-32">
                  <input
                    type="range"
                    min="0.25"
                    max="2"
                    step="0.25"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {Math.round(zoom * 100)}%
                  </div>
                </div>
                
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={zoom >= 2}
                >
                  <ZoomIn size={18} />
                </button>
                
                <button
                  onClick={() => setZoom(1)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Reset Zoom
                </button>
              </div>

              {/* Selected Element Controls */}
              {selectedEl && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">
                      Edit {selectedEl.type}
                    </h4>
                    <button
                      onClick={deleteSelectedElement}
                      className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                    >
                      <Trash2 size={14} />
                      Delete Element
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Size</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={selectedEl.width}
                          onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Width"
                        />
                        <input
                          type="number"
                          value={selectedEl.height}
                          onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Height"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Position</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={selectedEl.x}
                          onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={selectedEl.y}
                          onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Y"
                        />
                      </div>
                    </div>
                    
                    {selectedEl.type === 'text' && (
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                        <input
                          type="range"
                          min="8"
                          max="72"
                          value={selectedEl.fontSize || 16}
                          onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="text-xs text-center text-gray-500 mt-1">
                          {selectedEl.fontSize || 16}px
                        </div>
                      </div>
                    )}
                    
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Color</label>
                      <input
                        type="color"
                        value={selectedEl.color || '#000000'}
                        onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                    
                    {(selectedEl.type === 'rectangle' || selectedEl.type === 'circle') && (
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Background</label>
                        <input
                          type="color"
                          value={selectedEl.bgColor || '#ffffff'}
                          onChange={(e) => updateElement(selectedEl.id, { bgColor: e.target.value })}
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Share Event</h3>
              <button onClick={() => setShowShareModal(false)}>
                <X size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 border rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-white border rounded-xl p-6 mb-4">
                  <QRCode
                    value={shareUrl}
                    size={200}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                
                <button
                  onClick={() => {
                    const svg = document.querySelector('#qrcode svg');
                    if (svg) {
                      // QR code download logic here
                      alert('QR code download feature coming soon!');
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 mx-auto"
                >
                  <Download size={20} />
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Preview</h3>
                <button onClick={() => setShowPreview(false)}>
                  <X size={24} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mx-auto" style={{ maxWidth: '800px' }}>
                <div className="relative bg-white" style={{ width: '800px', height: '1000px' }}>
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      className="absolute"
                      style={{
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                      }}
                    >
                      {el.type === 'text' && (
                        <div
                          style={{
                            fontSize: `${el.fontSize}px`,
                            color: el.color,
                            backgroundColor: el.bgColor,
                            width: '100%',
                            height: '100%',
                            padding: '8px',
                          }}
                        >
                          {el.content}
                        </div>
                      )}
                      
                      {el.type === 'image' && el.imageUrl && (
                        <img
                          src={el.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {el.type === 'rectangle' && (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: el.bgColor,
                            border: `2px solid ${el.color}`,
                          }}
                        />
                      )}
                      
                      {el.type === 'circle' && (
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            backgroundColor: el.bgColor,
                            border: `2px solid ${el.color}`,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEventPage;