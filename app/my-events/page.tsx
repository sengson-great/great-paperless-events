// app/my-events/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from 'flowbite-react';

interface Invitation {
  id: string;
  invitationId: string;
  title?: string;
  previewImage?: string;
  savedAt: any;
}

interface CreatedEvent {
  id: string;
  title: string;
  date?: string;
  location?: string;
  previewImage?: string;
  createdAt: any;
}

export default function MyEvents() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
  const [createdEvents, setCreatedEvents] = useState<CreatedEvent[]>([]);
  const [savedInvites, setSavedInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch user's CREATED events
    const createdQuery = query(
      collection(db, 'events'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubCreated = onSnapshot(createdQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CreatedEvent));
      setCreatedEvents(events);
    });

    // Fetch user's SAVED invitations
    const savedQuery = query(
      collection(db, 'users', user.uid, 'savedInvitations'),
      orderBy('savedAt', 'desc')
    );

    const unsubSaved = onSnapshot(savedQuery, (snapshot) => {
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Invitation));
      setSavedInvites(invites);
      setLoading(false);
    });

    return () => {
      unsubCreated();
      unsubSaved();
    };
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 bg-white rounded-xl shadow max-w-md">
          <p className="text-xl mb-6">Please sign in to view your events</p>
          <Button size="lg">
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Events</h1>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b">
          <button
            onClick={() => setActiveTab('created')}
            className={`pb-4 px-2 border-b-4 font-medium transition ${
              activeTab === 'created' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
          >
            Created by Me ({createdEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-4 px-2 border-b-4 font-medium transition ${
              activeTab === 'saved' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
          >
            Saved Invitations ({savedInvites.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl">Loading...</p>
          </div>
        ) : activeTab === 'created' ? (
          createdEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-xl text-gray-600 mb-6">You haven't created any events yet</p>
              <Link href="/create-event">
                <Button size="lg">Create Your First Event</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {createdEvents.map((event) => (
                <Link href={`/event/${event.id}`} key={event.id}>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer">
                    <div className="h-64 bg-gray-200 border-2 border-dashed flex items-center justify-center">
                      {event.previewImage ? (
                        <img src={event.previewImage} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500">No Preview</span>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        Created {event.createdAt?.toDate?.().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          savedInvites.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-xl text-gray-600 mb-6">No saved invitations yet</p>
              <p>Scan a QR code from an invitation to save it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedInvites.map((invite) => (
                <Link href={`/invite/${invite.invitationId}`} key={invite.id}>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer">
                    <div className="h-64 bg-gray-200 border-2 border-dashed flex items-center justify-center">
                      {invite.previewImage ? (
                        <img src={invite.previewImage} alt="Invitation" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500">No Preview</span>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg">{invite.title || 'Untitled Invitation'}</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Saved {invite.savedAt?.toDate?.().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}