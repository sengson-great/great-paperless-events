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
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [savingInvitation, setSavingInvitation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'properties'>('tools');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [imageUploadMethod, setImageUploadMethod] = useState<'file' | 'url'>('url');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const shareUrl = invitationId ? `${window.location.origin}/invite/${invitationId}` : '';

  const tools = [
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'image' as const, icon: ImageIcon, label: 'Image' },
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
  ];

  // Upload image to Firebase Storage
  const uploadImageToFirebase = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error('Please sign in to upload images'));
        return;
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const filename = `images/${user.uid}/${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, filename);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setUploadError(`Upload failed: ${error.message}`);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadProgress(100);
            setTimeout(() => setUploadProgress(0), 500);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  // Alternative: Convert to Base64 (for small images or when user is not signed in)
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle image file upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      alert('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      let imageUrl: string;

      if (user) {
        // Try Firebase Storage first
        imageUrl = await uploadImageToFirebase(file);
      } else {
        // If not signed in, use Base64
        imageUrl = await convertImageToBase64(file);
        alert('Note: Image stored locally. Sign in to save images permanently.');
      }

      createImageElement(imageUrl);
      setShowImageUploadModal(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Fallback to base64 if Firebase fails
      try {
        const base64Image = await convertImageToBase64(file);
        createImageElement(base64Image);
        setShowImageUploadModal(false);
        alert('Uploaded locally. Firebase upload failed: ' + error.message);
      } catch (fallbackError) {
        setUploadError(`Upload failed: ${error.message}. Try using URL method.`);
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle URL image input
  const handleUrlImageSubmit = () => {
    if (!tempImageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }

    try {
      new URL(tempImageUrl);
      
      // Check if it looks like an image URL
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const isImageUrl = imageExtensions.some(ext => 
        tempImageUrl.toLowerCase().includes(ext)
      );
      
      if (!isImageUrl && !confirm('This might not be an image URL. Continue anyway?')) {
        return;
      }

      createImageElement(tempImageUrl);
      setShowImageUploadModal(false);
      setTempImageUrl('');
      setImagePreview(null);
    } catch (error) {
      alert('Please enter a valid URL (e.g., https://example.com/image.jpg)');
    }
  };

  // Create image element
  const createImageElement = (imageUrl: string) => {
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
      imageUrl: imageUrl,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setSelectedTool(null);
    setActiveTab('properties');
  };

  // Update existing element's image
  const updateElementImage = (imageUrl: string) => {
    if (selectedElement !== null) {
      updateElement(selectedElement, { imageUrl });
      setShowImageUploadModal(false);
      setTempImageUrl('');
      setImagePreview(null);
    }
  };

  // Open image upload modal
  const handleImageToolClick = () => {
    setShowImageUploadModal(true);
    setImagePreview(null);
    setImageUploadMethod('url');
    setTempImageUrl('');
    setUploadError(null);
  };

  // Preview URL image
  const previewImageUrl = () => {
    if (!tempImageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }
    
    try {
      new URL(tempImageUrl);
      setImagePreview(tempImageUrl);
      setUploadError(null);
    } catch (error) {
      setUploadError('Please enter a valid URL');
    }
  };

  // Cancel and close modal
  const cancelUpload = () => {
    setUploadingImage(false);
    setUploadError(null);
    setUploadProgress(0);
    setShowImageUploadModal(false);
  };

  // Calculate responsive canvas dimensions
  const calculateCanvasDimensions = () => {
    if (!containerRef.current) return { width: 800, height: 1000 };
    
    const containerWidth = containerRef.current.clientWidth - 40;
    const containerHeight = containerRef.current.clientHeight - 40;
    
    const width = Math.min(containerWidth, 800);
    const height = width * 1.25;
    
    return { width, height };
  };

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 1000 });

  useLayoutEffect(() => {
    const updateCanvasDimensions = () => {
      const dimensions = calculateCanvasDimensions();
      setCanvasDimensions(dimensions);
      
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
    if (type === 'image') {
      handleImageToolClick();
      return;
    }
    
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
      imageUrl: null,
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
    // If image tool is selected and clicking on canvas background
    if (selectedTool === 'image' && e.target === canvasRef.current) {
      setShowImageUploadModal(true);
      return;
    }
    
    // If other tool is selected and clicking on canvas background
    if (selectedTool && selectedTool !== 'image' && e.target === canvasRef.current) {
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
        imageUrl: null,
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

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={cancelUpload}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={uploadingImage}
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-bold mb-4 text-center">
              {selectedElement !== null ? 'Change Image' : 'Add Image'}
            </h3>

            {/* Upload Method Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => !uploadingImage && setImageUploadMethod('url')}
                disabled={uploadingImage}
                className={`flex-1 py-3 font-medium ${imageUploadMethod === 'url' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'} ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                From URL
              </button>
              <button
                onClick={() => !uploadingImage && setImageUploadMethod('file')}
                disabled={uploadingImage}
                className={`flex-1 py-3 font-medium ${imageUploadMethod === 'file' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'} ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Upload File
              </button>
            </div>

            {/* File Upload Method */}
            {imageUploadMethod === 'file' ? (
              <div className="space-y-4">
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                    <div className="text-sm">{uploadError}</div>
                  </div>
                )}

                {uploadingImage ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                    <p className="text-gray-700 font-medium mb-2">Uploading Image...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{Math.round(uploadProgress)}% uploaded</p>
                    {!user && (
                      <p className="text-xs text-yellow-600 mt-2">
                        Not signed in. Image will be stored locally.
                      </p>
                    )}
                    <button
                      onClick={cancelUpload}
                      className="mt-4 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Cancel Upload
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                      <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 mb-2">Click to select image file</p>
                      <p className="text-sm text-gray-500 mb-4">
                        JPG, PNG, GIF (max 5MB)
                      </p>
                      {!user && (
                        <p className="text-sm text-yellow-600 mb-3">
                          Sign in to save images permanently
                        </p>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileUpload}
                        accept="image/*"
                        className="hidden"
                        id="image-file-input"
                      />
                      <label
                        htmlFor="image-file-input"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Select Image
                      </label>
                    </div>
                    
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setImageUploadMethod('url');
                          setUploadError(null);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        ← Use image URL instead
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* URL Method */
              <div className="space-y-4">
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                    <div className="text-sm">{uploadError}</div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={tempImageUrl}
                      onChange={(e) => {
                        setTempImageUrl(e.target.value);
                        setUploadError(null);
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 border rounded-lg pr-10"
                      disabled={uploadingImage}
                    />
                    {tempImageUrl && (
                      <button
                        onClick={() => setTempImageUrl('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={previewImageUrl}
                      disabled={!tempImageUrl.trim() || uploadingImage}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Preview
                    </button>
                    <button
                      onClick={handleUrlImageSubmit}
                      disabled={!tempImageUrl.trim() || uploadingImage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Use Image
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="border rounded-lg p-4">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded"
                        onError={() => {
                          setImagePreview(null);
                          setUploadError('Failed to load image from URL');
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setImageUploadMethod('file');
                      setUploadError(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    ← Upload from computer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                  onClick={() => {
                    setSelectedTool(tool.id);
                    if (tool.id === 'image') {
                      handleImageToolClick();
                    }
                  }}
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
                        alt="User uploaded" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image+Error';
                          updateElement(el.id, { imageUrl: 'https://via.placeholder.com/200x200?text=Image+Error' });
                        }}
                      />
                    )}
                    {el.type === 'image' && !el.imageUrl && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500">
                        <ImageIcon size={32} />
                        <span className="text-sm mt-2">No Image</span>
                      </div>
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

              {selectedEl.type !== 'text' && selectedEl.type !== 'image' && (
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
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <div className="space-y-3">
                    {/* Current image preview */}
                    {selectedEl.imageUrl && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Current Image:</p>
                        <img 
                          src={selectedEl.imageUrl} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image+Error';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Change image button */}
                    <button
                      onClick={() => setShowImageUploadModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      <Upload size={16} />
                      {selectedEl.imageUrl ? 'Change Image' : 'Add Image'}
                    </button>
                  </div>
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
                      onClick={() => {
                        if (tool.id === 'image') {
                          handleImageToolClick();
                        } else {
                          addElement(tool.id);
                        }
                      }}
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

                    {selectedEl.type !== 'text' && selectedEl.type !== 'image' && (
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
                        <label className="block text-xs font-medium mb-1">Image</label>
                        <button
                          onClick={() => setShowImageUploadModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                        >
                          <Upload size={16} />
                          {selectedEl.imageUrl ? 'Change Image' : 'Add Image'}
                        </button>
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