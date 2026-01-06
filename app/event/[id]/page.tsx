// app/event/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Edit2, Trash2, Loader2, Users, Calendar, MapPin, Clock, X, Globe, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import EventTemplateViewer from '@/app/components/EventTemplateViewer';
import GuestList from '@/app/components/GuestList';
import QRCode from 'react-qr-code';

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  elements: any[];
  eventData: any;
  createdAt: any;
  createdBy: string;
  isPublic: boolean;
  views?: number;
}

const EventDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>({});

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        const docSnap = await getDoc(doc(db, 'events', eventId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEvent({ id: docSnap.id, ...data } as Event);
          setEditedEvent(data);
        } else {
          alert('Event not found');
          router.push('/my-events');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, router]);

  const handleDelete = async () => {
    if (!confirm('Delete this event permanently? This cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
      alert('Event deleted');
      router.push('/my-events');
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handleTogglePublic = async () => {
    if (!event) return;
    
    setSaving(true);
    try {
      const eventRef = doc(db, 'events', eventId);
      const newPublicStatus = !event.isPublic;
      
      await updateDoc(eventRef, {
        isPublic: newPublicStatus,
        updatedAt: new Date().toISOString()
      });
      
      setEvent(prev => prev ? { ...prev, isPublic: newPublicStatus } : null);
      alert(`Event is now ${newPublicStatus ? 'public' : 'private'}`);
    } catch (err) {
      console.error('Error updating event:', err);
      alert('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDesign = () => {
    if (!event) return;
    
    // Navigate to template page with event data for editing
    router.push(`/template?edit=${eventId}`);
    
    // Alternative: Store event data in localStorage for template editor
    if (typeof window !== 'undefined') {
      localStorage.setItem('editEvent', JSON.stringify({
        id: event.id,
        elements: event.elements,
        eventData: event
      }));
    }
  };

  const handleSaveEventDetails = async () => {
    if (!event) return;
    
    setSaving(true);
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...editedEvent,
        updatedAt: new Date().toISOString()
      });
      
      setEvent(prev => prev ? { ...prev, ...editedEvent } : null);
      setIsEditing(false);
      alert('Event updated successfully!');
    } catch (err) {
      console.error('Error updating event:', err);
      alert('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${eventId}` : '';

  const copyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qrcode')?.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 300;
    canvas.height = 300;
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 300, 300);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `event-${event?.title?.replace(/\s+/g, '-') || eventId}-qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!event) return null;

  // Check if user owns this event
  const canEdit = user?.uid === event.createdBy;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push('/my-events')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={20} />
            Back to My Events
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Public/Private Toggle */}
            <button
              onClick={handleTogglePublic}
              disabled={saving || !canEdit}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                event.isPublic
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {event.isPublic ? <Globe size={18} /> : <Lock size={18} />}
              {saving ? 'Saving...' : event.isPublic ? 'Public' : 'Private'}
            </button>

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
            >
              <Share2 size={18} />
              Share
            </button>

            {/* Edit Buttons (only for owner) */}
            {canEdit && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <Edit2 size={18} />
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>

                <button
                  onClick={handleEditDesign}
                  className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
                >
                  <Edit2 size={18} />
                  Edit Design
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invitation Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
              <div className="aspect-[4/5] relative">
                <EventTemplateViewer 
                  elements={event.elements} 
                  eventData={event.eventData} 
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Event Info & Guests */}
          <div className="space-y-6">
            {/* Event Info - Editable */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Event Details</h1>
                {!isEditing && canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      value={editedEvent.title || ''}
                      onChange={(e) => setEditedEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={editedEvent.date || ''}
                        onChange={(e) => setEditedEvent(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="text"
                        value={editedEvent.time || ''}
                        onChange={(e) => setEditedEvent(prev => ({ ...prev, time: e.target.value }))}
                        placeholder="e.g., 6:00 PM"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editedEvent.location || ''}
                      onChange={(e) => setEditedEvent(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editedEvent.description || ''}
                      onChange={(e) => setEditedEvent(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveEventDetails}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedEvent(event);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {event.time && (
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-pink-600" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{event.time}</p>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={20} className="text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.description && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-gray-500 mb-2">Description</p>
                      <p className="text-gray-700">{event.description}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-500 mb-2">Event Status</p>
                    <div className="flex items-center gap-2">
                      {event.isPublic ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Globe size={16} />
                          <span className="font-medium">Public Event</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Lock size={16} />
                          <span className="font-medium">Private Event</span>
                        </div>
                      )}
                      {event.views !== undefined && (
                        <span className="text-sm text-gray-500">
                          • {event.views} views
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guest List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users size={24} />
                  Guest List
                </h2>
              </div>
              <GuestList eventId={eventId} />
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal with QR Code */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Share Event</h3>
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
                    className="flex-1 px-4 py-3 border rounded-lg bg-gray-50 text-sm font-mono"
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
                  <div id="qrcode">
                    <QRCode
                      value={shareUrl}
                      size={200}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Guests can scan this QR code to view the invitation
                </p>
                
                <button
                  onClick={downloadQRCode}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
                >
                  Download QR Code
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sharing Options</h4>
                <div className="space-y-2">
                  {event?.isPublic ? (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      🌍 This event is <strong>public</strong>. Anyone with the link can view it.
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      🔒 This event is <strong>private</strong>. Only people you share the link with can view it.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;