// app/invite/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Your Firebase Auth hook
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EventTemplateViewer from '@/app/components/EventTemplateViewer';
import { Button } from 'flowbite-react'; // Or replace with your preferred UI library
import { Heart, LogIn } from 'lucide-react';

export default function InvitePage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth(); // Firebase Auth
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchInvitation = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'invitations', id as string));
        if (docSnap.exists()) {
          setInvitation({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id]);

  const saveToMyEvents = async () => {
    if (!user) {
      alert('Please sign in to save this invitation');
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'savedInvitations', id as string), // ← Fixed: user.uid
        {
          invitationId: id,
          savedAt: new Date(),
          title: invitation?.eventData?.title || 'Event Invitation',
          previewImage:
            invitation?.elements?.find((e: any) => e.type === 'image')?.imageUrl || null,
        },
        { merge: true }
      );
      setSaved(true);
    } catch (err) {
      alert('Failed to save invitation. Please try again.');
      console.error(err);
    }
    setSaving(false);
  };

  // Loading states
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <p className="text-xl">Loading beautiful invitation...</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <p className="text-xl text-gray-600">Invitation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4">
  <div className="max-w-4xl mx-auto">
    <div className="bg-white rounded-3xl shadow-2xl p-8 flex justify-center items-center mb-5">
      <EventTemplateViewer elements={invitation.elements} eventData={invitation.eventData} />
    </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-6">
          {user ? (
            // Signed In
            saved ? (
              <Button size="lg" disabled className="bg-green-600">
                <Heart className="mr-2 fill-current" /> Saved to My Events
              </Button>
            ) : (
              <Button onClick={saveToMyEvents} disabled={saving} size="lg">
                <Heart className="mr-2" />
                {saving ? 'Saving...' : 'Save to My Events'}
              </Button>
            )
          ) : (
            // Not Signed In
            <Button size="lg">
              <a href={`/auth/signin?redirect=${encodeURIComponent(`/invite/${id}`)}`}>
                <LogIn className="mr-2" /> Sign in to Save
              </a>
            </Button>
          )}

          {/* Share Link */}
          <p className="text-center text-gray-600 mt-4">
            Share this invitation:
            <br />
            <code className="bg-gray-200 px-4 py-2 rounded-lg block mt-2 break-all text-sm">
              {typeof window !== 'undefined' && window.location.href}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}