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
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle,
  Copy,
  ExternalLink,
  Globe,
  X,
  Menu
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
  invitationId?: string;
}

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [publicEvents, setPublicEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simple form state - ALWAYS public
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  });

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Filter to only public events
  useEffect(() => {
    const publicOnly = events.filter(event => event.isPublic === true);
    setPublicEvents(publicOnly);
  }, [events]);

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
        isPublic: true, // ALWAYS public
        createdBy: user?.uid || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingEvent) {
        // Update event - ensure it stays public
        await updateDoc(doc(db, 'events', editingEvent.id), {
          ...eventData,
          isPublic: true // Force to stay public
        });
        alert('✅ Public event updated!');
      } else {
        // Create new event - ALWAYS public
        await addDoc(collection(db, 'events'), eventData);
        alert('✅ Public event created!');
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
    // Only allow editing if event is public
    if (!event.isPublic) {
      alert('Cannot edit private events here. Use the invitations section.');
      return;
    }
    
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      location: event.location,
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
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 p-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold">Events Management</h1>
        <div className="w-10"></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white">
            <Sidebar />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen pt-16 lg:pt-0 overflow-auto">
        <div className="p-4 lg:p-6">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Public Events Management</h1>
            <p className="text-gray-600 mt-2">Create and manage public events only</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus size={20} />
              Add New Event
            </button>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg w-full sm:w-auto">
              <Globe size={16} className="text-green-600 flex-shrink-0" />
              <span className="text-green-700 font-medium text-sm lg:text-base">
                {publicEvents.length} public {publicEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start lg:items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full my-auto lg:my-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                      {editingEvent ? 'Edit Public Event' : 'Create Public Event'}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
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

                    {/* Always show as public */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800">Public Event</div>
                        <p className="text-sm text-blue-600">This event will be visible to everyone</p>
                      </div>
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

          {/* Events Cards for Mobile */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            ) : publicEvents.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-700">No public events yet</p>
                <p className="text-gray-500 mt-2">Create your first public event to get started</p>
              </div>
            ) : (
              publicEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={10} />
                      Public
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{event.date ? formatDate(event.date) : 'No date'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{event.time || 'No time'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{event.location || 'No location'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit event"
                      >
                        <Edit size={18} />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete event"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    {event.invitationId && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyInvitationLink(event.invitationId!)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Copy invitation link"
                        >
                          <Copy size={18} />
                        </button>
                        
                        <Link
                          href={`/invite/${event.invitationId}`}
                          target="_blank"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="View invitation"
                        >
                          <ExternalLink size={18} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Events Table for Desktop */}
          <div className="hidden lg:block bg-white rounded-xl shadow overflow-hidden">
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
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : publicEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg">No public events yet</p>
                          <p className="text-sm mt-2">Create your first public event to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    publicEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{event.title}</div>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin size={12} />
                              <span className="truncate max-w-xs">{event.location || 'No location specified'}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                              <span>{event.date ? formatDate(event.date) : 'No date'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={14} className="text-gray-400 flex-shrink-0" />
                              <span>{event.time || 'No time'}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} />
                            Public
                          </span>
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

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{events.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">
                {publicEvents.length}
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