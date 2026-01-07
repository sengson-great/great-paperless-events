// app/admin/events/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';

interface AdminEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  isPublic: boolean;
  createdAt: any;
  createdBy: string;
  // NEW: Link to existing invitation (optional)
  invitationId?: string;
}

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  // Simple form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    isPublic: true
  });

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'events'));
      const eventsData: AdminEvent[] = [];
      
      snapshot.forEach((doc) => {
        eventsData.push({
          id: doc.id,
          ...doc.data()
        } as AdminEvent);
      });

      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Event title is required');
      return;
    }

    try {
      const eventData = {
        ...formData,
        createdBy: user?.uid || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingEvent) {
        // Update event
        await updateDoc(doc(db, 'events', editingEvent.id), eventData);
        alert('✅ Event updated!');
      } else {
        // Create new event
        await addDoc(collection(db, 'events'), eventData);
        alert('✅ Event created!');
      }

      // Reset and reload
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('❌ Failed to save event');
    }
  };

  // Handle edit
  const handleEdit = (event: AdminEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      location: event.location,
      isPublic: event.isPublic
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    
    try {
      await deleteDoc(doc(db, 'events', id));
      alert('✅ Event deleted!');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('❌ Failed to delete event');
    }
  };

  // Copy invitation link
  const copyInvitationLink = (invitationId: string) => {
    const link = `${window.location.origin}/invite/${invitationId}`;
    navigator.clipboard.writeText(link);
    alert('📋 Link copied to clipboard!');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      isPublic: true
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
    <div className=" bg-gray-50 p-4 w-full">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Events Management</h1>
          <p className="text-gray-600 mt-2">Create and manage public events</p>
          
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add New Event
            </button>
            
            <span className="text-gray-500">
              {events.length} {events.length === 1 ? 'event' : 'events'} total
            </span>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {editingEvent ? 'Edit Event' : 'Create Event'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter event description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Time</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter event location"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                      className="h-5 w-5"
                    />
                    <label htmlFor="isPublic" className="cursor-pointer">
                      <div className="font-medium">Public Event</div>
                      <p className="text-sm text-gray-600">Visible to everyone</p>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingEvent ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Event</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">No events yet</p>
                        <p className="text-sm mt-2">Create your first event to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            📍 {event.location}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{event.date ? formatDate(event.date) : 'No date'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={14} className="text-gray-400" />
                            <span>{event.time || 'No time'}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {event.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle size={12} />
                            Private
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit event"
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete event"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          {event.invitationId && (
                            <>
                              <button
                                onClick={() => copyInvitationLink(event.invitationId!)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Copy invitation link"
                              >
                                <Copy size={16} />
                              </button>
                              
                              <Link
                                href={`/invite/${event.invitationId}`}
                                target="_blank"
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="View invitation"
                              >
                                <ExternalLink size={16} />
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simple Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{events.length}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.isPublic).length}
            </div>
            <div className="text-sm text-gray-600">Public Events</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {events.filter(e => !e.isPublic).length}
            </div>
            <div className="text-sm text-gray-600">Private Events</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}