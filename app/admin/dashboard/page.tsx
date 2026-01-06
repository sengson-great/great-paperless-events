"use client";
import React, { useState, useEffect, useMemo, JSX } from 'react';
import { Calendar, Users, ChevronDown } from 'lucide-react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/adminHeader';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Organizer {
  name: string;
  events: number;
  avatar: string;
}

interface ActivityItem {
  count: number;
  description: string;
  icon: string;
  colorClass: string;
}

export default function AdminDashboard() {
  const [totalEventsThisMonth, setTotalEventsThisMonth] = useState(0);
  const [eventsToday, setEventsToday] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [topOrganizers, setTopOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth hook
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
}, [authLoading, isAdmin, router]);


  // Current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  useEffect(() => {
    if (!db) {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    // 1. Total events this month
    const eventsThisMonthQuery = query(
      collection(db, 'events'),
      where('createdDateObj', '>=', startOfMonth),
      where('createdDateObj', '<=', now)
    );

    // 2. Events created today
    const eventsTodayQuery = query(
      collection(db, 'events'),
      where('createdDateObj', '>=', startOfToday),
      where('createdDateObj', '<=', now)
    );

    // 3. All events for organizer ranking
    const allEventsQuery = query(collection(db, 'events'));

    const unsubscribes = [
      onSnapshot(eventsThisMonthQuery, snap => setTotalEventsThisMonth(snap.size), err => setError(err.message)),
      onSnapshot(eventsTodayQuery, snap => setEventsToday(snap.size), err => setError(err.message)),
      onSnapshot(allEventsQuery, (snapshot) => {
        // Build organizer map
        const organizerMap = new Map<string, { count: number; avatar: string }>();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const orgName = data.organizer?.name || 'Unknown';
          const avatar = data.organizer?.avatar || '👤';

          const current = organizerMap.get(orgName) || { count: 0, avatar };
          organizerMap.set(orgName, { count: current.count + 1, avatar });
        });

        // Convert to array and sort
        const organizers = Array.from(organizerMap.entries())
          .map(([name, info]) => ({
            name,
            events: info.count,
            avatar: info.avatar
          }))
          .sort((a, b) => b.events - a.events)
          .slice(0, 7); // Top 7

        setTopOrganizers(organizers);
        setTotalUsers(organizerMap.size); // Unique organizers = active users
        setLoading(false);
      }, err => setError(err.message))
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  // Mock growth data (replace with real daily data later)
  const eventGrowthData = Array.from({ length: now.getDate() }, (_, i) => {
    // Simple mock: more events toward end of month
    return 40 + Math.floor(Math.random() * 40) + (i * 2);
  });

  const userGrowthData = Array.from({ length: now.getDate() }, (_, i) => {
    return 35 + Math.floor(Math.random() * 35) + i;
  });

  const todayActivities: ActivityItem[] = [
    { count: 1206, description: 'invitations sent today', icon: '📧', colorClass: 'text-yellow-600 bg-yellow-100' },
    { count: 15, description: 'new users register today', icon: '👥', colorClass: 'text-yellow-600 bg-yellow-100' },
    { count: eventsToday, description: 'events created today', icon: '📅', colorClass: 'text-yellow-600 bg-yellow-100' }
  ];

  const renderChart = (data: number[], peakLabel: string): JSX.Element => {
    const max = Math.max(...data);
    const normalizedData = data.map(val => (val / max) * 100);

    return (
      <div className="relative h-48 flex items-end gap-1">
        {normalizedData.map((height, i) => (
          <div key={i} className="flex-1 relative group">
            <div
              className="w-full bg-linear-to-t from-blue-200 to-blue-400 rounded-t transition-all hover:opacity-80"
              style={{ height: `${height}%` }}
            >
              {data[i] === max && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {peakLabel}
                </div>
              )}
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
              {i + 1}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">
        <Header />

        <div className="grid grid-cols-3 gap-6">
          {/* Main Charts Section */}
          <div className="col-span-2 space-y-6">
            {/* Event Growth Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Event Growth</h2>
                  <p className="text-gray-600">
                    Total Events This Month: <span className="text-pink-500 font-semibold">{totalEventsThisMonth}</span> events
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50">
                  This Month <ChevronDown size={16} />
                </button>
              </div>
              {renderChart(eventGrowthData, `${Math.max(...eventGrowthData)} events`)}
            </div>

            {/* User Growth Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Total Active Users This Month</h2>
                  <p className="text-gray-600">
                    <span className="text-pink-500 font-semibold">{totalUsers}</span> active organizers
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50">
                  This Month <ChevronDown size={16} />
                </button>
              </div>
              {renderChart(userGrowthData, `${Math.max(...userGrowthData)} users`)}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="text-purple-600" size={20} />
                  </div>
                  <span className="text-gray-600 text-sm">Total Active Users</span>
                </div>
                <div className="text-4xl font-bold text-gray-800">{totalUsers}</div>
                <div className="mt-2 h-1 bg-linear-to-r from-purple-200 to-transparent rounded"></div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-xl">📨</span>
                  </div>
                  <span className="text-gray-600 text-sm">Total Invitations (Estimate)</span>
                </div>
                <div className="text-4xl font-bold text-gray-800">124k</div>
                <div className="mt-2 h-1 bg-linear-to-r from-red-200 to-transparent rounded"></div>
              </div>
            </div>

            {/* Donut Chart - Placeholder (requires event status field) */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Overall Total Events</h2>
              <div className="flex items-center justify-center">
                <div className="relative w-80 h-80">
                  <svg viewBox="0 0 200 200" className="transform -rotate-90">
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#22c55e" strokeWidth="40" strokeDasharray="439.8 439.8" strokeDashoffset="0" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#ec4899" strokeWidth="40" strokeDasharray="439.8 439.8" strokeDashoffset="-151.5" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#8b5cf6" strokeWidth="40" strokeDasharray="439.8 439.8" strokeDashoffset="-311.8" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl font-bold text-gray-800">{totalEventsThisMonth}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Upcoming Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Ongoing Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Completed Events</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Top Organizer */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Top Organizers</h3>
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50">
                  Event Created <ChevronDown size={14} />
                </button>
              </div>
              <div className="space-y-4">
                {topOrganizers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No organizers yet</p>
                ) : (
                  topOrganizers.map((organizer, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                        {organizer.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{organizer.name}</div>
                        <div className="text-sm text-gray-500">{organizer.events} events created</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Today's Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Today's Activity</h3>
              <div className="space-y-4">
                {todayActivities.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${activity.colorClass.split(' ')[1]} rounded-lg flex items-center justify-center`}>
                      <span className={`${activity.colorClass.split(' ')[0]} text-xl`}>{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${activity.colorClass.split(' ')[0]}`}>{activity.count}</div>
                      <div className="text-sm text-gray-500">{activity.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}