// app/my-events/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth'; // Your Firebase Auth hook
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from 'flowbite-react';

export default function MyEvents() {
  const { user, loading: authLoading } = useAuth(); // Firebase Auth
  const [savedInvites, setSavedInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    if (!user) {
      setLoading(false);
      return;
    }

    // Query saved invitations for current user
    const q = query(
      collection(db, 'users', user.uid, 'savedInvitations'),
      orderBy('savedAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const invites = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSavedInvites(invites);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading saved invitations:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, authLoading]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Saved Invitations</h1>

        {/* Not Signed In */}
        {!user ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-xl mb-6">Please sign in to see your saved invitations</p>
            <Button size="lg">
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        ) : (
          /* Signed In */
          <>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-xl">Loading your invitations...</p>
              </div>
            ) : savedInvites.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <p className="text-xl text-gray-600 mb-6">No saved invitations yet</p>
                <p>Scan a QR code from an invitation to save it here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savedInvites.map((invite) => (
                  <Link href={`/invite/${invite.invitationId}`} key={invite.id}>
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer">
                      <div className="h-64 bg-gray-200 border-2 border-dashed flex items-center justify-center text-gray-500">
                        {invite.previewImage ? (
                          <img
                            src={invite.previewImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">No Preview</span>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg">{invite.title || 'Untitled Invitation'}</h3>
                        <p className="text-sm text-gray-500 mt-2">
                          Saved on{' '}
                          {invite.savedAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}