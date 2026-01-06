// app/admin/public-events/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, Eye, EyeOff, Loader2, Search, AlertCircle, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface PublicEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  createdBy: string;
  createdAt: any;
  elements: any[];
  eventData: any;
}

const AdminPublicEventsPage: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPublicEvents = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'events'),
          where('isPublic', '==', true)
        );
        const snapshot = await getDocs(q);
        const publicEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PublicEvent));
        
        // Sort by newest first
        publicEvents.sort((a, b) => 
          b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime()
        );
        
        setEvents(publicEvents);
      } catch (err) {
        console.error('Error fetching public events:', err);
        alert('Failed to load public events');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicEvents();
  }, [isAdmin]);

  const handleMakePrivate = async (eventId: string) => {
    if (!confirm('Make this event private? It will no longer be publicly visible.')) return;

    setTogglingId(eventId);
    try {
      await updateDoc(doc(db, 'events', eventId), {
        isPublic: false
      });
      setEvents(events.filter(e => e.id !== eventId));
      alert('Event is now private');
    } catch (err) {
      alert('Failed to update event');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Permanently delete this public event? This cannot be undone.')) return;

    setDeletingId(eventId);
    try {
      await deleteDoc(doc(db, 'events', eventId));
      setEvents(events.filter(e => e.id !== eventId));
      alert('Event deleted successfully');
    } catch (err) {
      alert('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin: Manage Public Events</h1>
          <p className="text-gray-600">View and moderate all publicly shared invitations</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading public events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Eye className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold mb-2">No Public Events</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No events match your search' : 'There are no public events yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition">
                {/* Preview */}
                <div className="h-48 bg-gray-100 border-b flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Eye size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Public Invitation</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.title || 'Untitled Event'}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {event.date && (
                      <p className="flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    )}
                    {event.location && (
                      <p className="flex items-center gap-2">
                        <MapPin size={16} />
                        {event.location}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      <Link href={`/event/${event.id}`} target="_blank">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                          View Public
                        </button>
                      </Link>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMakePrivate(event.id)}
                        disabled={togglingId === event.id}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title="Make Private"
                      >
                        {togglingId === event.id ? <Loader2 className="animate-spin" size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Permanently"
                      >
                        {deletingId === event.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPublicEventsPage;