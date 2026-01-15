// app/event/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Type,
  ImageIcon,
  Square,
  Circle,
  Trash2,
  Edit2,
  Upload,
  X,
  AlertCircle,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Grid,
  Maximize2,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import QRCode from "react-qr-code";

interface Element {
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

const EditEventPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsFix, setNeedsFix] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  // Event data
  const [eventData, setEventData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });

  // Design elements
  const [elements, setElements] = useState<Element[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [privatePin, setPrivatePin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Canvas state
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize] = useState({ width: 800, height: 1000 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    loadEventData();
  }, [eventId, user, authLoading]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading event with ID:", eventId);
      console.log("Current user UID:", user?.uid);

      // 1. First, get the event document from 'events' collection
      const eventDoc = await getDoc(doc(db, "events", eventId));

      if (!eventDoc.exists()) {
        setError("Event not found");
        setLoading(false);
        return;
      }

      const eventDataFromDb = eventDoc.data();
      console.log("Event data from Firestore:", eventDataFromDb);

      // Check ownership
      if (eventDataFromDb.createdBy !== user?.uid) {
        setError("You do not have permission to edit this event");
        setLoading(false);
        return;
      }

      // 2. Get the invitationId from the event document - CRITICAL!
      const invitationId = eventDataFromDb.invitationId;
      console.log("Found invitation ID:", invitationId);

      if (!invitationId) {
        setError("No invitation design linked to this event");
        setLoading(false);
        return;
      }

      // Store invitationId in state
      setInvitationId(invitationId); // Add this line if you have this state

      // 3. Load the invitation document which contains the elements
      const invitationDoc = await getDoc(doc(db, "invitations", invitationId));

      if (!invitationDoc.exists()) {
        setError("Invitation design not found");
        setLoading(false);
        return;
      }

      const invitationData = invitationDoc.data();
      console.log("Invitation data:", invitationData);

      // 4. Set event data
      setEventData({
        title: eventDataFromDb.title || "",
        date: eventDataFromDb.date || "",
        time: eventDataFromDb.time || "",
        location: eventDataFromDb.location || "",
        description: eventDataFromDb.description || "",
      });

      // 5. Set design elements
      setElements(invitationData.elements || []);

      // 6. Set privacy settings
      setIsPublic(eventDataFromDb.isPublic || false);
      setPrivatePin(eventDataFromDb.privatePin || "");
    } catch (err: any) {
      console.error("Error loading event:", err);
      setError("Failed to load event: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fixMissingElements = async () => {
    try {
      console.log("Fixing missing elements for event:", eventId);

      const eventRef = doc(db, "events", eventId);

      // Get current data
      const docSnap = await getDoc(eventRef);
      const data = docSnap.data();

      // Create initial elements based on event data
      const initialElements: Element[] = [
        {
          id: Date.now(),
          type: "text",
          x: 200,
          y: 150,
          width: 400,
          height: 80,
          content: data?.title || "Event Title",
          fontSize: 48,
          color: "#1e40af",
          bgColor: "transparent",
          locked: false,
        },
        {
          id: Date.now() + 1,
          type: "text",
          x: 200,
          y: 250,
          width: 400,
          height: 40,
          content: `📅 ${data?.date || "Date"} | ⏰ ${data?.time || "Time"}`,
          fontSize: 24,
          color: "#374151",
          bgColor: "transparent",
          locked: false,
        },
        {
          id: Date.now() + 2,
          type: "text",
          x: 200,
          y: 310,
          width: 400,
          height: 40,
          content: `📍 ${data?.location || "Location"}`,
          fontSize: 24,
          color: "#374151",
          bgColor: "transparent",
          locked: false,
        },
        {
          id: Date.now() + 3,
          type: "rectangle",
          x: 180,
          y: 130,
          width: 440,
          height: 240,
          content: "",
          fontSize: 16,
          color: "#3b82f6",
          bgColor: "rgba(59, 130, 246, 0.1)",
          locked: false,
        },
        {
          id: Date.now() + 4,
          type: "text",
          x: 200,
          y: 400,
          width: 400,
          height: 60,
          content: "You're Invited!",
          fontSize: 36,
          color: "#7c3aed",
          bgColor: "transparent",
          locked: false,
        },
      ];

      // Update the event with elements
      await updateDoc(eventRef, {
        elements: initialElements,
        updatedAt: new Date().toISOString(),
      });

      console.log("Added initial elements:", initialElements);

      // Update local state
      setElements(initialElements);
      setNeedsFix(false);

      alert("✅ Event fixed! Initial design elements have been added.");
    } catch (err: any) {
      console.error("Error fixing event:", err);
      alert("❌ Failed to fix event: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!eventData.title.trim()) {
      alert("Event title is required");
      return;
    }

    // Validate PIN for private events
    if (!isPublic && !privatePin) {
      alert("Please set a PIN for your private event");
      return;
    }

    // Validate PIN format (4-6 digits)
    if (!isPublic && privatePin && !/^\d{4,6}$/.test(privatePin)) {
      alert("Please enter a valid PIN (4-6 digits)");
      return;
    }

    setSaving(true);
    try {
      // 1. Get the event document to find invitationId
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventDataFromDb = eventDoc.data();
      const invitationId = eventDataFromDb?.invitationId;

      if (!invitationId) {
        alert("Error: No invitation design linked to this event");
        return;
      }

      // 2. Update the EVENT document (basic info + PIN)
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        title: eventData.title.trim(),
        description: eventData.description?.trim() || "",
        date: eventData.date,
        time: eventData.time.trim(),
        location: eventData.location.trim(),
        isPublic: isPublic,
        privatePin: !isPublic ? privatePin : null, // Store PIN only if private
        updatedAt: new Date().toISOString(),
      });

      // 3. Update the INVITATION document (design elements + PIN)
      const invitationRef = doc(db, "invitations", invitationId);
      await updateDoc(invitationRef, {
        elements: elements,
        eventData: {
          title: eventData.title.trim(),
          description: eventData.description?.trim() || "",
          date: eventData.date,
          time: eventData.time.trim(),
          location: eventData.location.trim(),
        },
        isPublic: isPublic,
        privatePin: !isPublic ? privatePin : null, // Store PIN only if private
        updatedAt: new Date().toISOString(),
      });

      alert("✅ Event and design updated successfully!");
    } catch (err: any) {
      console.error("Error saving:", err);
      alert("❌ Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "events", eventId));
      alert("Event deleted successfully");
      router.push("/my-events");
    } catch (err: any) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event: " + err.message);
    }
  };

  const addElement = (type: "text" | "image" | "rectangle" | "circle") => {
    if (type === "image") {
      fileInputRef.current?.click();
      return;
    }

    const newElement: Element = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: type === "text" ? 200 : 150,
      height: type === "text" ? 50 : 150,
      content: type === "text" ? "Edit text" : "",
      fontSize: 24,
      color: "#000000",
      bgColor: type === "text" ? "transparent" : "#3b82f6",
      locked: false,
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: number, updates: Partial<Element>) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(elements.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const filename = `images/${user.uid}/${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, filename);

      const snapshot = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

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
        imageUrl: downloadURL,
      };

      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    }
  };

  // In your EditEventPage component
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${invitationId}${
          !isPublic && privatePin ? `?pin=${privatePin}` : ""
        }`
      : "";

  const copyLink = () => {
    if (shareUrl && invitationId) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert("Cannot generate link yet. Please save the event first.");
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
                onClick={() => router.push("/my-events")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft size={18} />
                My Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedEl = elements.find((el) => el.id === selectedElement);

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
            onClick={() => router.push(`/my-events`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            <ArrowLeft size={18} />
            Back to Event
          </button>

          <div className="flex items-center gap-3">
            {needsFix && (
              <button
                onClick={fixMissingElements}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <Wrench size={16} />
                Fix Event Design
              </button>
            )}

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
        {/* Notification Banner - Show when elements are missing */}
        {needsFix && elements.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={24} />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">
                  Design Setup Required
                </h3>
                <p className="text-yellow-700 text-sm mt-1">
                  This event doesn't have a design yet. Click "Fix Event Design"
                  above to add initial design elements, or add elements manually
                  using the tools.
                </p>
              </div>
              <button
                onClick={fixMissingElements}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm whitespace-nowrap"
              >
                <Wrench size={16} />
                Auto Setup Design
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tools Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium text-gray-800 mb-3">Design Tools</h3>

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => addElement("text")}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    selectedTool === "text"
                      ? "bg-blue-100 border-blue-500"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Type size={20} className="text-gray-600 mb-1" />
                  <span className="text-xs">Text</span>
                </button>

                <button
                  onClick={() => addElement("image")}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    selectedTool === "image"
                      ? "bg-blue-100 border-blue-500"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <ImageIcon size={20} className="text-gray-600 mb-1" />
                  <span className="text-xs">Image</span>
                </button>

                <button
                  onClick={() => addElement("rectangle")}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    selectedTool === "rectangle"
                      ? "bg-blue-100 border-blue-500"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Square size={20} className="text-gray-600 mb-1" />
                  <span className="text-xs">Box</span>
                </button>

                <button
                  onClick={() => addElement("circle")}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    selectedTool === "circle"
                      ? "bg-blue-100 border-blue-500"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
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
                    <span className="text-sm w-12 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
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
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                    showGrid
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <Grid size={16} />
                  <span className="text-sm">
                    {showGrid ? "Hide Grid" : "Show Grid"}
                  </span>
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
                    onChange={(e) =>
                      setEventData({ ...eventData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Event title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={eventData.date}
                    onChange={(e) =>
                      setEventData({ ...eventData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />

                  <input
                    type="text"
                    value={eventData.time}
                    onChange={(e) =>
                      setEventData({ ...eventData, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Time"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={eventData.location}
                    onChange={(e) =>
                      setEventData({ ...eventData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Location"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="text-green-600" size={20} />
                  ) : (
                    <Lock className="text-gray-600" size={20} />
                  )}
                  <span className="font-medium">
                    {isPublic ? "Public" : "Private"}
                  </span>
                </div>

                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isPublic ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                      isPublic ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {!isPublic && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Private Access PIN (4-6 digits)
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={privatePin}
                      onChange={(e) =>
                        setPrivatePin(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
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

          {/* Main Canvas Area */}
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
                    onClick={() => {
                      if (!invitationId) {
                        alert(
                          "Please save the event first to generate a shareable link"
                        );
                        return;
                      }
                      setShowShareModal(true);
                    }}
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

              {/* Canvas Container - SIMPLE FIXED VERSION */}
              <div
                ref={canvasContainerRef}
                className="relative bg-gray-50 rounded-lg border-2 border-gray-300 p-4"
                style={{
                  maxHeight: "70vh",
                  minHeight: "300px",
                  overflow: "auto",
                }}
              >
                {/* Canvas */}
                <div
                  ref={canvasRef}
                  className="relative bg-white mx-auto"
                  style={{
                    width: `${canvasSize.width * zoom}px`,
                    height: `${canvasSize.height * zoom}px`,
                    minWidth: `${canvasSize.width * zoom}px`,
                    minHeight: `${canvasSize.height * zoom}px`,
                    position: "relative",
                  }}
                >
                  {/* Grid */}
                  {showGrid && (
                    <div
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #94a3b8 1px, transparent 1px),
                          linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
                        `,
                        backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                      }}
                    />
                  )}

                  {/* Elements */}
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      className={`absolute ${
                        selectedElement === el.id
                          ? "ring-2 ring-blue-500 ring-offset-1"
                          : "hover:ring-1 hover:ring-gray-300"
                      }`}
                      style={{
                        left: `${el.x * zoom}px`,
                        top: `${el.y * zoom}px`,
                        width: `${el.width * zoom}px`,
                        height: `${el.height * zoom}px`,
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedElement(el.id)}
                    >
                      {el.type === "text" && (
                        <div
                          className="relative w-full h-full"
                          onClick={(e) => e.stopPropagation()} // Prevent triggering parent click
                        >
                          {/* Display layer - not editable */}
                          <div
                            className="absolute inset-0"
                            style={{
                              fontSize: `${(el.fontSize || 16) * zoom}px`, // Apply zoom to display
                              color: el.color,
                              backgroundColor: el.bgColor,
                              padding: `${8 * zoom}px`,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: "1.2",
                            }}
                          >
                            {el.content || "Edit text"}
                          </div>

                          {/* Editable overlay - only when selected */}
                          {selectedElement === el.id && (
                            <textarea
                              value={el.content || ""}
                              onChange={(e) =>
                                updateElement(el.id, {
                                  content: e.target.value,
                                })
                              }
                              className="absolute inset-0 outline-none resize-none bg-transparent"
                              style={{
                                fontSize: `${(el.fontSize || 16) * zoom}px`, // Apply zoom to editor too
                                color: el.color,
                                backgroundColor: el.bgColor,
                                padding: `${8 * zoom}px`,
                                lineHeight: "1.2",
                                // Match the display styling
                                fontFamily: "inherit",
                                border: "none",
                                overflow: "hidden",
                              }}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                // Prevent Enter from submitting
                                if (e.key === "Enter") e.preventDefault();
                              }}
                              onInput={(e) => {
                                // Auto-resize textarea
                                const textarea = e.currentTarget;
                                textarea.style.height = "auto";
                                textarea.style.height = `${textarea.scrollHeight}px`;

                                // Update element height if needed
                                if (textarea.scrollHeight > el.height * zoom) {
                                  updateElement(el.id, {
                                    height: textarea.scrollHeight / zoom,
                                  });
                                }
                              }}
                              autoFocus
                            />
                          )}
                        </div>
                      )}

                      {el.type === "image" && el.imageUrl && (
                        <img
                          src={el.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}

                      {el.type === "rectangle" && (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: el.bgColor,
                            border: `2px solid ${el.color}`,
                          }}
                        />
                      )}

                      {el.type === "circle" && (
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

                {/* Empty State - Only show when truly empty */}
                {elements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl">
                      <Edit2 className="text-gray-300 mx-auto mb-4" size={48} />
                      <h4 className="text-lg font-medium text-gray-600 mb-2">
                        Start Designing
                      </h4>
                      <p className="text-gray-500 text-sm mb-4">
                        Add elements from the toolbar to create your invitation
                      </p>
                      <button
                        onClick={fixMissingElements}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mx-auto"
                      >
                        <Wrench size={16} />
                        Add Starter Template
                      </button>
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
                      <label className="block text-xs text-gray-600 mb-1">
                        Size
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={selectedEl.width}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              width: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Width"
                        />
                        <input
                          type="number"
                          value={selectedEl.height}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              height: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Height"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Position
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={selectedEl.x}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              x: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={selectedEl.y}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              y: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Y"
                        />
                      </div>
                    </div>

                    {selectedEl.type === "text" && (
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">
                          Font Size
                        </label>
                        <input
                          type="range"
                          min="8"
                          max="72"
                          value={selectedEl.fontSize || 16}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              fontSize: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <div className="text-xs text-center text-gray-500 mt-1">
                          {selectedEl.fontSize || 16}px
                        </div>
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Color
                      </label>
                      <input
                        type="color"
                        value={selectedEl.color || "#000000"}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            color: e.target.value,
                          })
                        }
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>

                    {(selectedEl.type === "rectangle" ||
                      selectedEl.type === "circle") && (
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">
                          Background
                        </label>
                        <input
                          type="color"
                          value={selectedEl.bgColor || "#ffffff"}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              bgColor: e.target.value,
                            })
                          }
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
                <label className="block text-sm font-medium mb-2">
                  Share Link
                </label>
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
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white border rounded-xl p-6 mb-4 flex justify-center items-center">
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
                    const svg = document.querySelector("#qrcode svg");
                    if (svg) {
                      // QR code download logic here
                      alert("QR code download feature coming soon!");
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

              <div
                className="bg-white border-2 border-gray-200 rounded-xl p-4 mx-auto"
                style={{ maxWidth: "800px" }}
              >
                <div
                  className="relative bg-white"
                  style={{ width: "800px", height: "1000px" }}
                >
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
                      {el.type === "text" && (
                        <div
                          style={{
                            fontSize: `${el.fontSize}px`,
                            color: el.color,
                            backgroundColor: el.bgColor,
                            width: "100%",
                            height: "100%",
                            padding: "8px",
                          }}
                        >
                          {el.content}
                        </div>
                      )}

                      {el.type === "image" && el.imageUrl && (
                        <img
                          src={el.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}

                      {el.type === "rectangle" && (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: el.bgColor,
                            border: `2px solid ${el.color}`,
                          }}
                        />
                      )}

                      {el.type === "circle" && (
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
