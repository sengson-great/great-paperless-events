"use client";
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
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
  AlertCircle,
  GripVertical,
  Move,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import QRCode from "react-qr-code";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface Element {
  id: number;
  type: "text" | "image" | "rectangle" | "circle";
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
  initialElements?: any[];
  initialEventData?: Partial<EventData>;
  // Admin mode props
  isAdminMode?: boolean;
  onAdminSave?: (elements: Element[], templateData: {
    name: string;
    description?: string;
    category?: string;
    previewImage?: string;
  }) => Promise<void>;
  onAdminCancel?: () => void;
  adminTemplateName?: string;
  adminTemplateDescription?: string;
  adminTemplateCategory?: string;
  adminCategories?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}

const EventTemplateEditor: React.FC<EventTemplateEditorProps> = ({
  initialElements = [],
  initialEventData = {},
  // Admin mode props
  isAdminMode = false,
  onAdminSave,
  onAdminCancel,
  adminTemplateName = "",
  adminTemplateDescription = "",
  adminTemplateCategory = "",
  adminCategories = [],
  isLoading = false,
}) => {
  const [elements, setElements] = useState<Element[]>(initialElements);
  const [eventData, setEventData] = useState<EventData>({
    title: "Annual Tech Conference",
    date: "2025-03-15",
    time: "9:00 AM",
    location: "Convention Center",
    ...initialEventData,
  });

  const [selectedTool, setSelectedTool] = useState<
    "text" | "image" | "rectangle" | "circle" | null
  >(null);
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    elementX: 0,
    elementY: 0,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    elementX: 0,
    elementY: 0,
    corner: "",
  });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [savingInvitation, setSavingInvitation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"tools" | "properties">("tools");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [imageUploadMethod, setImageUploadMethod] = useState<"file" | "url">(
    "url"
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [privatePin, setPrivatePin] = useState("");

  // Admin mode state
  const [templateName, setTemplateName] = useState(adminTemplateName);
  const [templateDescription, setTemplateDescription] = useState(adminTemplateDescription);
  const [templateCategory, setTemplateCategory] = useState(adminTemplateCategory);
  const [templatePreviewImage, setTemplatePreviewImage] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showEventData, setShowEventData] = useState(false);

  const shareUrl = invitationId
    ? `${window.location.origin}/invite/${invitationId}`
    : "";

  const tools = [
    { id: "text" as const, icon: Type, label: "Text" },
    { id: "image" as const, icon: ImageIcon, label: "Image" },
    { id: "rectangle" as const, icon: Square, label: "Rectangle" },
    { id: "circle" as const, icon: Circle, label: "Circle" },
  ];

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && selectedElement !== null) {
        handleDrag(e);
      }
      if (isResizing && selectedElement !== null) {
        handleResize(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
      if (isResizing) {
        setIsResizing(false);
      }
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, selectedElement, zoom]);

  const handleDrag = (e: MouseEvent) => {
    if (!canvasRef.current || !selectedElement) return;

    const element = elements.find((el) => el.id === selectedElement);
    if (!element || element.locked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoom;
    const deltaX = (e.clientX - dragStart.x) / scale;
    const deltaY = (e.clientY - dragStart.y) / scale;

    const canvasWidth = canvasRef.current.offsetWidth / scale;
    const canvasHeight = canvasRef.current.offsetHeight / scale;

    const newX = Math.max(
      0,
      Math.min(canvasWidth - element.width, dragStart.elementX + deltaX)
    );
    const newY = Math.max(
      0,
      Math.min(canvasHeight - element.height, dragStart.elementY + deltaY)
    );

    updateElement(selectedElement, { x: newX, y: newY });
  };

  const handleResize = (e: MouseEvent) => {
    if (!canvasRef.current || !selectedElement || !isResizing) return;

    const element = elements.find((el) => el.id === selectedElement);
    if (!element || element.locked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoom;
    const deltaX = (e.clientX - resizeStart.x) / scale;
    const deltaY = (e.clientY - resizeStart.y) / scale;

    const canvasWidth = canvasRef.current.offsetWidth / scale;
    const canvasHeight = canvasRef.current.offsetHeight / scale;

    let newX = element.x;
    let newY = element.y;
    let newWidth = element.width;
    let newHeight = element.height;

    switch (resizeStart.corner) {
      case "se": // Bottom-right
        newWidth = Math.max(50, resizeStart.width + deltaX);
        newHeight = Math.max(50, resizeStart.height + deltaY);
        break;
      case "sw": // Bottom-left
        newWidth = Math.max(50, resizeStart.width - deltaX);
        newHeight = Math.max(50, resizeStart.height + deltaY);
        newX = Math.max(0, resizeStart.elementX + deltaX);
        break;
      case "ne": // Top-right
        newWidth = Math.max(50, resizeStart.width + deltaX);
        newHeight = Math.max(50, resizeStart.height - deltaY);
        newY = Math.max(0, resizeStart.elementY + deltaY);
        break;
      case "nw": // Top-left
        newWidth = Math.max(50, resizeStart.width - deltaX);
        newHeight = Math.max(50, resizeStart.height - deltaY);
        newX = Math.max(0, resizeStart.elementX + deltaX);
        newY = Math.max(0, resizeStart.elementY + deltaY);
        break;
    }

    // Keep within canvas bounds
    if (newX + newWidth > canvasWidth) {
      newWidth = canvasWidth - newX;
    }
    if (newY + newHeight > canvasHeight) {
      newHeight = canvasHeight - newY;
    }

    // Ensure minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(50, newHeight);

    updateElement(selectedElement, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const startDrag = (e: React.MouseEvent, elementId: number) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.locked) return;

    setSelectedElement(elementId);
    setIsDragging(true);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom;

      setDragStart({
        x: e.clientX,
        y: e.clientY,
        elementX: element.x,
        elementY: element.y,
      });
    }
  };

  const startResize = (
    e: React.MouseEvent,
    elementId: number,
    corner: string
  ) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.locked) return;

    setSelectedElement(elementId);
    setIsResizing(true);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom;

      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height,
        elementX: element.x,
        elementY: element.y,
        corner: corner,
      });
    }
  };

  // Upload image to Firebase Storage
  const uploadImageToFirebase = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error("Please sign in to upload images"));
        return;
      }

      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const filename = `images/${user.uid}/${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, filename);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
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

  // Convert to Base64
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
  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      alert("Please select an image file (JPEG, PNG, GIF, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      let imageUrl: string;

      if (user) {
        imageUrl = await uploadImageToFirebase(file);
      } else {
        imageUrl = await convertImageToBase64(file);
        alert(
          "Note: Image stored locally. Sign in to save images permanently."
        );
      }

      createImageElement(imageUrl);
      setShowImageUploadModal(false);
    } catch (error: any) {
      console.error("Error uploading image:", error);

      try {
        const base64Image = await convertImageToBase64(file);
        createImageElement(base64Image);
        setShowImageUploadModal(false);
        alert("Uploaded locally. Firebase upload failed: " + error.message);
      } catch (fallbackError) {
        setUploadError(
          `Upload failed: ${error.message}. Try using URL method.`
        );
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle URL image input
  const handleUrlImageSubmit = () => {
    if (!tempImageUrl.trim()) {
      alert("Please enter an image URL");
      return;
    }

    try {
      new URL(tempImageUrl);

      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
      ];
      const isImageUrl = imageExtensions.some((ext) =>
        tempImageUrl.toLowerCase().includes(ext)
      );

      if (
        !isImageUrl &&
        !confirm("This might not be an image URL. Continue anyway?")
      ) {
        return;
      }

      createImageElement(tempImageUrl);
      setShowImageUploadModal(false);
      setTempImageUrl("");
      setImagePreview(null);
    } catch (error) {
      alert("Please enter a valid URL (e.g., https://example.com/image.jpg)");
    }
  };

  // Create image element
  const createImageElement = (imageUrl: string) => {
    const newElement: Element = {
      id: Date.now(),
      type: "image",
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      content: "",
      fontSize: 16,
      color: "#000000",
      bgColor: "transparent",
      locked: false,
      imageUrl: imageUrl,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setSelectedTool(null);
    setActiveTab("properties");
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

  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 1000,
  });

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
    window.addEventListener("resize", updateCanvasDimensions);

    return () => window.removeEventListener("resize", updateCanvasDimensions);
  }, []);

  const addElement = (type: "text" | "image" | "rectangle" | "circle") => {
    if (type === "image") {
      handleImageToolClick();
      return;
    }

    const newElement: Element = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: type === "text" ? 200 : 150,
      height: type === "text" ? 50 : 150,
      content: type === "text" ? "Double click to edit" : "",
      fontSize: 16,
      color: "#000000",
      bgColor: type === "text" ? "" : "#e5e7eb",
      locked: false,
      imageUrl: null,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setSelectedTool(null);
    setActiveTab("properties");
  };

  const saveAndGenerateLink = async () => {
    if (!user) {
      alert("Please sign in to save your invitation");
      return;
    }

    if (!isPublic && !privatePin) {
        alert("Please set a PIN for your private invitation");
        return;
    }

    setSavingInvitation(true);
    try {
      const invitationData = {
        eventId: "",
        elements,
        eventData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        isPublic: isPublic,
        privatePin: !isPublic && privatePin ? privatePin : null,
      };

      const invitationRef = await addDoc(
        collection(db, "invitations"),
        invitationData
      );

      const simpleEventData = {
        title: eventData.title,
        description: eventData.description || "",
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        isPublic: isPublic,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        invitationId: invitationRef.id,
      };

      const eventRef = await addDoc(collection(db, "events"), simpleEventData);

      await updateDoc(invitationRef, {
        eventId: eventRef.id,
      });

      setInvitationId(invitationRef.id);
      setShowShareModal(true);
      alert("✅ Event and invitation saved!");
    } catch (err: any) {
      console.error("Error saving:", err);
      alert(`❌ Failed to save: ${err.message}`);
    } finally {
      setSavingInvitation(false);
    }
  };

  const updateElement = (id: number, updates: Partial<Element>) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = () => {
    if (selectedElement !== null) {
      setElements(elements.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
      setActiveTab("tools");
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === "image" && e.target === canvasRef.current) {
      setShowImageUploadModal(true);
      return;
    }

    if (
      selectedTool &&
      selectedTool !== "image" &&
      e.target === canvasRef.current
    ) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scale = zoom;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newElement: Element = {
        id: Date.now(),
        type: selectedTool,
        x,
        y,
        width: selectedTool === "text" ? 200 : 150,
        height: selectedTool === "text" ? 50 : 150,
        content: selectedTool === "text" ? "Double click to edit" : "",
        fontSize: 16,
        color: "#000000",
        bgColor: selectedTool === "text" ? "" : "#e5e7eb",
        locked: false,
        imageUrl: null,
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
      setSelectedTool(null);
      setActiveTab("properties");
    }

    // Deselect if clicking on canvas background
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
    }
  };

  const selectedEl = elements.find((el) => el.id === selectedElement);

  // Admin save function
const handleAdminSave = async () => {
    if (!templateName.trim()) {
      alert('Template name is required');
      return;
    }
  
    if (!onAdminSave) return;
  
    setSavingTemplate(true);
    try {
      let previewImageUrl = templatePreviewImage;
  
      // If previewImage is a base64 data URL (starts with data:), upload it to storage
      if (templatePreviewImage && templatePreviewImage.startsWith('data:')) {
        try {
          const response = await fetch(templatePreviewImage);
          const blob = await response.blob();
          
          // Upload to Firebase Storage
          const timestamp = Date.now();
          const filename = `template-previews/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const storageRef = ref(storage, filename);
          
          await uploadBytes(storageRef, blob);
          previewImageUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error('Failed to upload preview image:', uploadError);
        }
      }
  
      await onAdminSave(elements, {
        name: templateName.trim(),
        description: templateDescription.trim(),
        category: templateCategory,
        previewImage: previewImageUrl || undefined
      });
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    } finally {
      setSavingTemplate(false);
    }
  };

  // Open image upload modal
  const handleImageToolClick = () => {
    setShowImageUploadModal(true);
    setImagePreview(null);
    setImageUploadMethod("url");
    setTempImageUrl("");
    setUploadError(null);
  };

  // Preview URL image
  const previewImageUrl = () => {
    if (!tempImageUrl.trim()) {
      alert("Please enter an image URL");
      return;
    }

    try {
      new URL(tempImageUrl);
      setImagePreview(tempImageUrl);
      setUploadError(null);
    } catch (error) {
      setUploadError("Please enter a valid URL");
    }
  };

  // Cancel and close modal
  const cancelUpload = () => {
    setUploadingImage(false);
    setUploadError(null);
    setUploadProgress(0);
    setShowImageUploadModal(false);
  };

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
              {selectedElement !== null ? "Change Image" : "Add Image"}
            </h3>

            {/* Upload Method Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => !uploadingImage && setImageUploadMethod("url")}
                disabled={uploadingImage}
                className={`flex-1 py-3 font-medium ${
                  imageUploadMethod === "url"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                } ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                From URL
              </button>
              <button
                onClick={() => !uploadingImage && setImageUploadMethod("file")}
                disabled={uploadingImage}
                className={`flex-1 py-3 font-medium ${
                  imageUploadMethod === "file"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                } ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Upload File
              </button>
            </div>

            {/* File Upload Method */}
            {imageUploadMethod === "file" ? (
              <div className="space-y-4">
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <div className="text-sm">{uploadError}</div>
                  </div>
                )}

                {uploadingImage ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                    <p className="text-gray-700 font-medium mb-2">
                      Uploading Image...
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {Math.round(uploadProgress)}% uploaded
                    </p>
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
                      <Upload
                        className="mx-auto mb-4 text-gray-400"
                        size={48}
                      />
                      <p className="text-gray-600 mb-2">
                        Click to select image file
                      </p>
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
                          setImageUploadMethod("url");
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
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
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
                        onClick={() => setTempImageUrl("")}
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
                          setUploadError("Failed to load image from URL");
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setImageUploadMethod("file");
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
        {/* Left Sidebar - Different for admin mode */}
        {isAdminMode ? (
          <div className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => window.history.back()} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold">Template Details</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="E.g., Elegant Wedding"
                  disabled={savingTemplate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Template description..."
                  disabled={savingTemplate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={savingTemplate}
                >
                  <option value="">Select category</option>
                  {adminCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preview Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {templatePreviewImage ? (
                    <>
                      <img 
                        src={templatePreviewImage} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <button
                        onClick={() => setTemplatePreviewImage(null)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="py-6">
                        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Upload preview image</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setTemplatePreviewImage(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="preview-image-upload"
                      />
                      <label
                        htmlFor="preview-image-upload"
                        className="inline-block mt-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm cursor-pointer"
                      >
                        Upload Image
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Event Data Section */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowEventData(!showEventData)}
                  className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                >
                  <span className="font-medium">Sample Event Data</span>
                  {showEventData ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                
                {showEventData && (
                  <div className="p-4 space-y-3!">
                    <input
                      type="text"
                      placeholder="Event Title"
                      value={eventData.title}
                      onChange={(e) =>
                        setEventData({ ...eventData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="date"
                      value={eventData.date}
                      onChange={(e) =>
                        setEventData({ ...eventData, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Time"
                      value={eventData.time}
                      onChange={(e) =>
                        setEventData({ ...eventData, time: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={eventData.location}
                      onChange={(e) =>
                        setEventData({ ...eventData, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Tools Section */}
              <div>
                <h3 className="font-medium mb-3">Add Elements</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => addElement(tool.id)}
                      className="flex flex-col items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={savingTemplate}
                    >
                      <tool.icon size={20} />
                      <span className="text-xs mt-1">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t">
              <div className="flex gap-3">
                <button
                  onClick={onAdminCancel}
                  disabled={savingTemplate}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminSave}
                  disabled={savingTemplate || !templateName.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingTemplate ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Original left sidebar for non-admin mode
          <div className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200">
            <div className="p-4 border-b flex items-center gap-3">
              <h2 className="text-lg font-bold hover:cursor-pointer bg-blue-300 w-10 h-10 text-center" onClick={()=>location.reload()}> { "<" } </h2>
              <h2 className="text-lg font-bold">Tools</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      if (tool.id === "image") {
                        handleImageToolClick();
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      selectedTool === tool.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <tool.icon size={20} />
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const name = prompt("Save template name:");
                  if (name) {
                    localStorage.setItem(
                      name,
                      JSON.stringify({ elements, eventData })
                    );
                    alert("Saved!");
                  }
                }}
                className="px-3 py-2 me-3 my-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                💾 Save
              </button>

              <button
                onClick={() => {
                  const name = prompt("Load template name:");
                  if (name) {
                    const data = localStorage.getItem(name);
                    if (data) {
                      const {
                        elements: savedElements,
                        eventData: savedEventData,
                      } = JSON.parse(data);
                      setElements(savedElements);
                      setEventData(savedEventData);
                      alert("Loaded!");
                    } else {
                      alert("Not found!");
                    }
                  }
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                📂 Load
              </button>

              <div className="mt-8">
                <h3 className="font-semibold mb-3">Event Data</h3>
                <div className="space-y-3!">
                  <input
                    type="text"
                    placeholder="Event Title"
                    value={eventData.title}
                    onChange={(e) =>
                      setEventData({ ...eventData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={eventData.date}
                    onChange={(e) =>
                      setEventData({ ...eventData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Time"
                    value={eventData.time}
                    onChange={(e) =>
                      setEventData({ ...eventData, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={eventData.location}
                    onChange={(e) =>
                      setEventData({ ...eventData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Public/Private Toggle - Desktop */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isPublic" className="cursor-pointer flex-1">
                    <div className="font-bold text-lg text-gray-800">
                      {isPublic ? "🌐 Public Event" : "🔒 Private Event"}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {isPublic
                        ? "Anyone with the link or QR code can view this invitation"
                        : "Only you and people you directly share with can view it"}
                    </p>
                  </label>
                </div>
              </div>

              {!isPublic && (
                <div className="mt-6 p-6 bg-red-50 rounded-2xl border border-red-200">
                  <label className="block font-semibold text-red-800 mb-2">
                    Private Access PIN (4-6 digits)
                  </label>
                  <input
                    type="text"
                    required
                    value={privatePin}
                    onChange={(e) =>
                      setPrivatePin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="e.g., 1234"
                    className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    maxLength={6}
                  />
                  <p className="text-sm text-red-700 mt-2">
                    Guests must enter this PIN to view the invitation
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <button
                  onClick={saveAndGenerateLink}
                  disabled={savingInvitation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-70 transition text-sm"
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
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-b">
            <h1 className="text-xl font-bold mb-2 sm:mb-0">
              {isAdminMode ? "Template Editor (Admin)" : "Template Editor"}
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.3, zoom - 0.25))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  disabled={zoom <= 0.3}
                >
                  <ZoomOut size={20} />
                </button>
                <span className="font-medium w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
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
          <div
            className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4"
            ref={containerRef}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                width: "fit-content",
                height: "fit-content",
                margin: "0 auto",
                transition: "transform 0.2s ease",
              }}
            >
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="relative bg-white shadow-2xl"
                style={{
                  width: `${canvasDimensions.width}px`,
                  height: `${canvasDimensions.height}px`,
                  minWidth: "300px",
                  minHeight: "375px",
                  cursor: isDragging || isResizing ? "grabbing" : "default",
                }}
              >
                {elements.map((el) => (
                  <div
                    key={el.id}
                    className={`absolute ${
                      selectedElement === el.id ? "ring-2 ring-blue-500" : ""
                    } ${el.locked ? "cursor-not-allowed" : ""}`}
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      cursor: el.locked
                        ? "not-allowed"
                        : isDragging || isResizing
                        ? "grabbing"
                        : "grab",
                    }}
                    onMouseDown={(e) => startDrag(e, el.id)}
                  >
                    {/* Drag Handle */}
                    {!el.locked && (
                      <div
                        className="absolute -top-2 -left-2 bg-blue-500 text-white p-1 rounded-full cursor-move hover:bg-blue-600 z-10"
                        onMouseDown={(e) => {
                          startDrag(e, el.id);
                          e.stopPropagation();
                        }}
                        title="Drag to move"
                      >
                        <GripVertical size={12} />
                      </div>
                    )}

                    {/* Resize Handles */}
                    {!el.locked && selectedElement === el.id && (
                      <>
                        {/* SE corner */}
                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-sm"
                          onMouseDown={(e) => startResize(e, el.id, "se")}
                        />
                        {/* SW corner */}
                        <div
                          className="absolute bottom-0 left-0 w-4 h-4 bg-blue-500 cursor-sw-resize rounded-sm"
                          onMouseDown={(e) => startResize(e, el.id, "sw")}
                        />
                        {/* NE corner */}
                        <div
                          className="absolute top-0 right-0 w-4 h-4 bg-blue-500 cursor-ne-resize rounded-sm"
                          onMouseDown={(e) => startResize(e, el.id, "ne")}
                        />
                        {/* NW corner */}
                        <div
                          className="absolute top-0 left-0 w-4 h-4 bg-blue-500 cursor-nw-resize rounded-sm"
                          onMouseDown={(e) => startResize(e, el.id, "nw")}
                        />
                      </>
                    )}

                    {el.type === "text" && (
                      <div
                        contentEditable={!el.locked}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                            // Get the HTML content
                            const html = e.currentTarget.innerHTML;
                            
                            // Convert HTML line breaks to \n
                            let text = html
                              .replace(/<div>/gi, '\n') // Start of new div = newline
                              .replace(/<\/div>/gi, '') // Remove closing div
                              .replace(/<br\s*\/?>/gi, '\n') // <br> = newline
                              .replace(/<\/p><p>/gi, '\n') // Paragraph breaks
                              .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
                              .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
                              .trim();
                            
                            console.log('HTML:', html);
                            console.log('Converted text:', JSON.stringify(text));
                            
                            updateElement(el.id, {
                              content: text
                            });
                          }}
                        style={{
                          fontSize: `${el.fontSize || 16}px`,
                          color: el.color,
                          backgroundColor: el.bgColor || 'transparent',
                          width: "100%",
                          height: "100%",
                          outline: "none",
                          padding: "8px",
                          boxSizing: "border-box",
                          pointerEvents: el.locked ? "none" : "auto",
                        }}
                        onClick={(e) => {
                          if (!el.locked) {
                            setSelectedElement(el.id);
                            setActiveTab("properties");
                          }
                          e.stopPropagation();
                        }}
                      >
                        {el.content}
                      </div>
                    )}
                    {el.type === "rectangle" && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: el.bgColor || 'transparent',
                          border: `2px solid ${el.color || '#000000'}`,
                        }}
                        onClick={(e) => {
                          if (!el.locked) {
                            setSelectedElement(el.id);
                            setActiveTab("properties");
                          }
                          e.stopPropagation();
                        }}
                      />
                    )}
                    {el.type === "circle" && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: el.bgColor || 'transparent',
                          border: `2px solid ${el.color || '#000000'}`,
                          borderRadius: "50%",
                        }}
                        onClick={(e) => {
                          if (!el.locked) {
                            setSelectedElement(el.id);
                            setActiveTab("properties");
                          }
                          e.stopPropagation();
                        }}
                      />
                    )}
                    {el.type === "image" && el.imageUrl && (
                      <img
                        src={el.imageUrl}
                        alt="User uploaded"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          pointerEvents: el.locked ? "none" : "auto",
                        }}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/200x200?text=Image+Error";
                          updateElement(el.id, {
                            imageUrl:
                              "https://via.placeholder.com/200x200?text=Image+Error",
                          });
                        }}
                        onClick={(e) => {
                          if (!el.locked) {
                            setSelectedElement(el.id);
                            setActiveTab("properties");
                          }
                          e.stopPropagation();
                        }}
                      />
                    )}
                    {el.type === "image" && !el.imageUrl && (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500"
                        onClick={(e) => {
                          if (!el.locked) {
                            setSelectedElement(el.id);
                            setActiveTab("properties");
                          }
                          e.stopPropagation();
                        }}
                      >
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
      <button
        onClick={deleteElement}
        className="p-2 text-red-500 hover:bg-red-50 rounded"
      >
        <Trash2 size={18} />
      </button>
    </div>

    <div className="space-y-4">
      {/* Position */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={Math.round(selectedEl.x)}
            onChange={(e) =>
              updateElement(selectedEl.id, {
                x: Number(e.target.value) || 0,
              })
            }
            disabled={selectedEl.locked}
            className="px-2 py-1 border rounded text-sm"
            placeholder="X"
          />
          <input
            type="number"
            value={Math.round(selectedEl.y)}
            onChange={(e) =>
              updateElement(selectedEl.id, {
                y: Number(e.target.value) || 0,
              })
            }
            disabled={selectedEl.locked}
            className="px-2 py-1 border rounded text-sm"
            placeholder="Y"
          />
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm font-medium mb-1">Size</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={Math.round(selectedEl.width)}
            onChange={(e) =>
              updateElement(selectedEl.id, {
                width: Number(e.target.value) || 0,
              })
            }
            disabled={selectedEl.locked}
            className="px-2 py-1 border rounded text-sm"
            placeholder="W"
          />
          <input
            type="number"
            value={Math.round(selectedEl.height)}
            onChange={(e) =>
              updateElement(selectedEl.id, {
                height: Number(e.target.value) || 0,
              })
            }
            disabled={selectedEl.locked}
            className="px-2 py-1 border rounded text-sm"
            placeholder="H"
          />
        </div>
      </div>

      {selectedEl.type === "text" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Font Size
          </label>
          <input
            type="number"
            value={selectedEl.fontSize}
            onChange={(e) =>
              updateElement(selectedEl.id, {
                fontSize: Number(e.target.value) || 16,
              })
            }
            disabled={selectedEl.locked}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Color</label>
        <input
          type="color"
          value={selectedEl.color || "#000000"}
          onChange={(e) =>
            updateElement(selectedEl.id, { color: e.target.value })
          }
          disabled={selectedEl.locked}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>

      {selectedEl.type !== "text" && selectedEl.type !== "image" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Background
          </label>
          <input
            type="color"
            value={selectedEl.bgColor && selectedEl.bgColor.startsWith('#') 
              ? selectedEl.bgColor 
              : '#ffffff'}
            onChange={(e) =>
              updateElement(selectedEl.id, { bgColor: e.target.value })
            }
            disabled={selectedEl.locked}
            className="w-full h-10 rounded cursor-pointer"
          />
          <button
            onClick={() => updateElement(selectedEl.id, { bgColor: '' })}
            className="mt-2 w-full px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            disabled={selectedEl.locked}
          >
            Clear Background
          </button>
        </div>
      )}

      {selectedEl.type === "image" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Image
          </label>
          <div className="space-y-3">
            {selectedEl.imageUrl && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">
                  Current Image:
                </p>
                <img
                  src={selectedEl.imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/200x200?text=Image+Error";
                  }}
                />
              </div>
            )}

            <button
              onClick={() => setShowImageUploadModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              <Upload size={16} />
              {selectedEl.imageUrl ? "Change Image" : "Add Image"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() =>
          updateElement(selectedEl.id, { locked: !selectedEl.locked })
        }
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        {selectedEl.locked ? <Unlock size={18} /> : <Lock size={18} />}
        {selectedEl.locked ? "Unlock" : "Lock"}
      </button>

      {/* Drag Instructions */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Drag Controls:</p>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <GripVertical size={12} className="text-blue-500" />
          <span>Drag handle to move</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span>Drag corners to resize</span>
        </div>
      </div>
    </div>
  </div>
)}
      </div>

      {/* Bottom Navigation Bar - Mobile only - Hide in admin mode */}
{isAdminMode ? (
  <div className="lg:hidden border-t border-gray-200 bg-white">
    {/* Tabs Navigation for Admin Mobile */}
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => setActiveTab("tools")}
        className={`flex-1 py-3 text-sm font-medium ${
          activeTab === "tools"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500"
        }`}
      >
        Template Details
      </button>
      <button
        onClick={() => setActiveTab("properties")}
        className={`flex-1 py-3 text-sm font-medium ${
          activeTab === "properties"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500"
        }`}
        disabled={!selectedEl}
      >
        Properties {selectedEl && `(${selectedEl.type})`}
      </button>
    </div>

    {/* Tabs Content for Admin Mobile */}
    <div className="p-4 max-h-60 overflow-y-auto">
      {activeTab === "tools" ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Template Name *</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="E.g., Elegant Wedding"
              disabled={savingTemplate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Template description..."
              disabled={savingTemplate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={savingTemplate}
            >
              <option value="">Select category</option>
              {adminCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Tools Section */}
          <div>
            <h3 className="font-medium mb-3">Add Elements</h3>
            <div className="grid grid-cols-4 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => addElement(tool.id)}
                  className="flex flex-col items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={savingTemplate}
                >
                  <tool.icon size={20} />
                  <span className="text-xs mt-1">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Save Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onAdminCancel}
              disabled={savingTemplate}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdminSave}
              disabled={savingTemplate || !templateName.trim()}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingTemplate ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Properties tab for mobile (same as existing properties)
        <div>
          {selectedEl ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Element Properties</h3>
                <button
                  onClick={deleteElement}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">X</div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.x)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            x: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Y</div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.y)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            y: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Width
                      </div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.width)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            width: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Height
                      </div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.height)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            height: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                {selectedEl.type === "text" && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedEl.fontSize || 16}
                      onChange={(e) =>
                        updateElement(selectedEl.id, {
                          fontSize: Number(e.target.value) || 16,
                        })
                      }
                      disabled={selectedEl.locked}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedEl.color || "#000000"}
                      onChange={(e) =>
                        updateElement(selectedEl.id, {
                          color: e.target.value,
                        })
                      }
                      disabled={selectedEl.locked}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-600">
                      {selectedEl.color || "#000000"}
                    </span>
                  </div>
                </div>

                {selectedEl.type !== "text" &&
                  selectedEl.type !== "image" && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Background
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedEl.bgColor && selectedEl.bgColor.startsWith('#') 
                            ? selectedEl.bgColor 
                            : '#ffffff'}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              bgColor: e.target.value,
                            })
                          }
                          disabled={selectedEl.locked}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">
                          {selectedEl.bgColor || "transparent"}
                        </span>
                      </div>
                      <button
                        onClick={() => updateElement(selectedEl.id, { bgColor: '' })}
                        className="mt-2 w-full px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        disabled={selectedEl.locked}
                      >
                        Clear Background
                      </button>
                    </div>
                  )}

                {selectedEl.type === "image" && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Image
                    </label>
                    <button
                      onClick={() => setShowImageUploadModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      <Upload size={16} />
                      {selectedEl.imageUrl ? "Change Image" : "Add Image"}
                    </button>
                  </div>
                )}

                <button
                  onClick={() =>
                    updateElement(selectedEl.id, {
                      locked: !selectedEl.locked,
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  {selectedEl.locked ? (
                    <Unlock size={16} />
                  ) : (
                    <Lock size={16} />
                  )}
                  {selectedEl.locked ? "Unlock Element" : "Lock Element"}
                </button>

                {/* Mobile Drag Instructions */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Drag Controls:
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <GripVertical
                        size={12}
                        className="text-blue-500 shrink-0"
                      />
                      <span>Use drag handle to move</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm shrink-0"></div>
                      <span>Use corners to resize</span>
                    </div>
                  </div>
                </div>
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
) : (
  // Original non-admin mobile interface
  <div className="lg:hidden border-t border-gray-200 bg-white">
    {/* Tabs Navigation */}
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => setActiveTab("tools")}
        className={`flex-1 py-3 text-sm font-medium ${
          activeTab === "tools"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500"
        }`}
      >
        Tools & Data
      </button>
      <button
        onClick={() => setActiveTab("properties")}
        className={`flex-1 py-3 text-sm font-medium ${
          activeTab === "properties"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500"
        }`}
        disabled={!selectedEl}
      >
        Properties {selectedEl && `(${selectedEl.type})`}
      </button>
    </div>

    {/* Tabs Content */}
    <div className="p-4 max-h-60 overflow-y-auto">
      {activeTab === "tools" ? (
        <div>
          {/* Tools Section */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Tools</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (tool.id === "image") {
                      handleImageToolClick();
                    } else {
                      addElement(tool.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
                    selectedTool === tool.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <tool.icon size={24} />
                  <span className="text-xs mt-1">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              const name = prompt("Save template name:");
              if (name) {
                localStorage.setItem(
                  name,
                  JSON.stringify({ elements, eventData })
                );
                alert("Saved!");
              }
            }}
            className="px-3 py-2 me-3 my-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            💾 Save
          </button>

          <button
            onClick={() => {
              const name = prompt("Load template name:");
              if (name) {
                const data = localStorage.getItem(name);
                if (data) {
                  const {
                    elements: savedElements,
                    eventData: savedEventData,
                  } = JSON.parse(data);
                  setElements(savedElements);
                  setEventData(savedEventData);
                  alert("Loaded!");
                } else {
                  alert("Not found!");
                }
              }
            }}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            📂 Load
          </button>

          {/* Event Data Section */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Event Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Event Title"
                value={eventData.title}
                onChange={(e) =>
                  setEventData({ ...eventData, title: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="date"
                value={eventData.date}
                onChange={(e) =>
                  setEventData({ ...eventData, date: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Time"
                value={eventData.time}
                onChange={(e) =>
                  setEventData({ ...eventData, time: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Location Link"
                value={eventData.location}
                onChange={(e) =>
                  setEventData({ ...eventData, location: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Public/Private Toggle - Mobile */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-gray-800">
                  {isPublic ? "Public Event" : "Private Event"}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {isPublic
                    ? "Visible to anyone with link"
                    : "Only visible to you"}
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={saveAndGenerateLink}
              disabled={savingInvitation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-70 transition text-sm"
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
                <button
                  onClick={deleteElement}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">X</div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.x)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            x: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Y</div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.y)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            y: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Width
                      </div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.width)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            width: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Height
                      </div>
                      <input
                        type="number"
                        value={Math.round(selectedEl.height)}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            height: Number(e.target.value) || 0,
                          })
                        }
                        disabled={selectedEl.locked}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                {selectedEl.type === "text" && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedEl.fontSize || 16}
                      onChange={(e) =>
                        updateElement(selectedEl.id, {
                          fontSize: Number(e.target.value) || 16,
                        })
                      }
                      disabled={selectedEl.locked}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedEl.color || "#000000"}
                      onChange={(e) =>
                        updateElement(selectedEl.id, {
                          color: e.target.value,
                        })
                      }
                      disabled={selectedEl.locked}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-600">
                      {selectedEl.color || "#000000"}
                    </span>
                  </div>
                </div>

                {selectedEl.type !== "text" &&
                  selectedEl.type !== "image" && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Background
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedEl.bgColor && selectedEl.bgColor.startsWith('#') 
                            ? selectedEl.bgColor 
                            : '#ffffff'}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              bgColor: e.target.value,
                            })
                          }
                          disabled={selectedEl.locked}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">
                          {selectedEl.bgColor || "transparent"}
                        </span>
                      </div>
                      <button
                        onClick={() => updateElement(selectedEl.id, { bgColor: '' })}
                        className="mt-2 w-full px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        disabled={selectedEl.locked}
                      >
                        Clear Background
                      </button>
                    </div>
                  )}

                {selectedEl.type === "image" && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Image
                    </label>
                    <button
                      onClick={() => setShowImageUploadModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      <Upload size={16} />
                      {selectedEl.imageUrl ? "Change Image" : "Add Image"}
                    </button>
                  </div>
                )}

                <button
                  onClick={() =>
                    updateElement(selectedEl.id, {
                      locked: !selectedEl.locked,
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  {selectedEl.locked ? (
                    <Unlock size={16} />
                  ) : (
                    <Lock size={16} />
                  )}
                  {selectedEl.locked ? "Unlock Element" : "Lock Element"}
                </button>

                {/* Mobile Drag Instructions */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Drag Controls:
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <GripVertical
                        size={12}
                        className="text-blue-500 shrink-0"
                      />
                      <span>Use drag handle to move</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm shrink-0"></div>
                      <span>Use corners to resize</span>
                    </div>
                  </div>
                </div>
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
)}

      {/* Share Modal - Hide in admin mode */}
      {!isAdminMode && showShareModal && invitationId && (
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
                <QRCode
                  value={shareUrl}
                  size={180}
                  level="H"
                  className="sm:w-56"
                />
                <p className="text-center text-xs sm:text-sm text-gray-600 mt-4">
                  Scan to view
                </p>
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
                      alert("Link copied!");
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