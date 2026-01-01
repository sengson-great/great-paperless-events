// app/invite/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EventTemplateViewer from '@/app/components/EventTemplateViewer';
import { Heart, LogIn, Share2, Copy, Check, Home, Calendar } from 'lucide-react';

export default function InvitePage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

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
        doc(db, 'users', user.uid, 'savedInvitations', id as string),
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

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading states
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading beautiful invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invitation Not Found</h2>
            <p className="text-gray-600 mb-6">The invitation you're looking for doesn't exist or has been removed.</p>
            <a 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              <Home size={20} />
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const eventTitle = invitation?.eventData?.title || 'Event Invitation';
  const eventDate = invitation?.eventData?.date ? new Date(invitation.eventData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Mobile Header */}
      <div className="lg:hidden mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{eventTitle}</h1>
          {eventDate && (
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <Calendar size={16} />
              <span>{eventDate}</span>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Created by {invitation?.organizerId?.substring(0, 8)}...
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Main Content - Canvas Viewer */}
          <div className="lg:flex-1">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:p-4 lg:p-6 overflow-hidden">
          <div className="aspect-4/5 min-h-[500px] sm:min-h-[600px]">
            <EventTemplateViewer 
              elements={invitation.elements} 
              eventData={invitation.eventData} 
            />
          </div>
        </div>
      </div>

          {/* Sidebar - Event Info & Actions */}
          <div className="lg:w-96">
            {/* Desktop Event Info */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{eventTitle}</h1>
              {eventDate && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Calendar size={18} />
                  <span className="font-medium">{eventDate}</span>
                </div>
              )}
              <div className="space-y-3 mb-6">
                {invitation?.eventData?.time && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 font-bold">⏰</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{invitation.eventData.time}</p>
                    </div>
                  </div>
                )}
                {invitation?.eventData?.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-bold">📍</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{invitation.eventData.location}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500 pt-4 border-t">
                Invitation ID: <span className="font-mono">{id}</span>
              </div>
            </div>

            {/* Action Cards */}
            <div className="space-y-4">
              {/* Save Button Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">Save This Invitation</h3>
                {user ? (
                  saved ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-100 to-green-50 text-green-700 rounded-xl font-medium border border-green-200"
                    >
                      <Heart className="fill-current" size={20} />
                      Saved to My Events
                    </button>
                  ) : (
                    <button
                      onClick={saveToMyEvents}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-70"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Heart size={20} />
                          Save to My Events
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <a
                    href={`/auth/signin?redirect=${encodeURIComponent(`/invite/${id}`)}`}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition"
                  >
                    <LogIn size={20} />
                    Sign in to Save
                  </a>
                )}
              </div>

              {/* Share Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Share2 className="text-purple-600" size={20} />
                  <h3 className="font-bold text-lg">Share Invitation</h3>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share this link:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono break-all"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      {copied ? (
                        <Check className="text-green-600" size={18} />
                      ) : (
                        <Copy className="text-gray-500" size={18} />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                      <Check size={14} /> Copied to clipboard!
                    </p>
                  )}
                </div>

                {/* Social Share Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Join me at ${eventTitle}!`)}`, '_blank')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90 transition text-sm"
                  >
                    <span className="font-bold">X</span>
                    Share
                  </button>
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:opacity-90 transition text-sm"
                  >
                    <span className="font-bold">f</span>
                    Share
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me at ${eventTitle}! ${window.location.href}`)}`, '_blank')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:opacity-90 transition text-sm"
                  >
                    <span className="font-bold">WA</span>
                    Share
                  </button>
                </div>
              </div>

              {/* Event Details Card - Mobile only */}
              <div className="lg:hidden bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">Event Details</h3>
                <div className="space-y-4">
                  {invitation?.eventData?.time && (
                    <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-pink-600 text-lg">⏰</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{invitation.eventData.time}</p>
                      </div>
                    </div>
                  )}
                  {invitation?.eventData?.location && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-lg">📍</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{invitation.eventData.location}</p>
                      </div>
                    </div>
                  )}
                  {invitation?.eventData?.description && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700">{invitation.eventData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back to Home */}
              <div className="text-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition"
                >
                  <Home size={18} />
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This invitation was created with Event Invitation Designer</p>
          <p className="mt-1">
            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
              Invitation ID: {id}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}