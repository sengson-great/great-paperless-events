// app/user/events/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar,
  Filter,
  Search,
  MapPin,
  Clock,
  Users,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  CalendarDays,
  Tag,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface UserEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  isPublic: boolean;
  createdAt: any;
  invitationId?: string;
  guestsCount?: number;
  category?: string;
  status?: 'upcoming' | 'past' | 'draft';
  coverImage?: string;
}

type EventFilter = 'all' | 'upcoming' | 'past' | 'public' | 'private';
type EventSort = 'date-asc' | 'date-desc' | 'title-asc' | 'title-desc' | 'created-asc' | 'created-desc';
type ViewMode = 'grid' | 'list';

// Predefined categories
const CATEGORIES = [
  'Wedding',
  'Birthday',
  'Conference',
  'Meeting',
  'Party',
  'Networking',
  'Workshop',
  'Seminar',
  'Celebration',
  'Other'
];

export default function UserEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<{
    from?: string;
    to?: string;
  }>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<EventFilter>('all');
  const [sortBy, setSortBy] = useState<EventSort>('date-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Load events on mount
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, dateFilter, selectedCategories, statusFilter, sortBy]);

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get events created by this user
      const eventsQuery = query(
        collection(db, 'events'),
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(eventsQuery);
      const eventsData: UserEvent[] = [];
      
      snapshot.forEach((doc) => {
        const eventData = doc.data() as any;
        const eventDate = new Date(eventData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Determine event status
        let status: UserEvent['status'] = 'upcoming';
        if (eventDate < today) {
          status = 'past';
        }
        
        eventsData.push({
          id: doc.id,
          ...eventData,
          status
        });
      });

      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term) ||
        event.category?.toLowerCase().includes(term)
      );
    }
    
    // Apply date filter
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        
        if (dateFilter.from) {
          const fromDate = new Date(dateFilter.from);
          fromDate.setHours(0, 0, 0, 0);
          if (eventDate < fromDate) return false;
        }
        
        if (dateFilter.to) {
          const toDate = new Date(dateFilter.to);
          toDate.setHours(23, 59, 59, 999);
          if (eventDate > toDate) return false;
        }
        
        return true;
      });
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => 
        event.category && selectedCategories.includes(event.category)
      );
    }
    
    // Apply status filter
    switch (statusFilter) {
      case 'upcoming':
        filtered = filtered.filter(event => event.status === 'upcoming');
        break;
      case 'past':
        filtered = filtered.filter(event => event.status === 'past');
        break;
      case 'public':
        filtered = filtered.filter(event => event.isPublic === true);
        break;
      case 'private':
        filtered = filtered.filter(event => event.isPublic === false);
        break;
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredEvents(filtered);
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({});
    setSelectedCategories([]);
    setStatusFilter('all');
  };

  // Copy invitation link
  const copyInvitationLink = (invitationId: string) => {
    const link = `${window.location.origin}/invite/${invitationId}`;
    navigator.clipboard.writeText(link);
    alert('📋 Link copied to clipboard!');
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

  // Format time
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString; // You can add time formatting logic here
  };

  // Get event status badge
  const getStatusBadge = (event: UserEvent) => {
    if (event.status === 'past') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <CalendarDays size={12} />
          Past
        </span>
      );
    }
    
    if (event.isPublic) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Globe size={12} />
          Public
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Lock size={12} />
        Private
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
              <p className="text-gray-600 mt-2">Manage and filter your events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.status === 'upcoming').length}
                </div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {events.filter(e => e.status === 'past').length}
                </div>
                <div className="text-sm text-gray-600">Past Events</div>
              </div>
              <CalendarDays className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {events.filter(e => e.invitationId).length}
                </div>
                <div className="text-sm text-gray-600">With Invitations</div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">

              
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <List size={20} />
                </button>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as EventSort)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="date-asc">Date (Earliest First)</option>
                <option value="date-desc">Date (Latest First)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="created-desc">Recently Created</option>
                <option value="created-asc">Oldest First</option>
              </select>
              
              {(searchTerm || dateFilter.from || dateFilter.to || selectedCategories.length > 0 || statusFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateFilter.from || ''}
                      onChange={(e) => setDateFilter({...dateFilter, from: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="From date"
                    />
                    <input
                      type="date"
                      value={dateFilter.to || ''}
                      onChange={(e) => setDateFilter({...dateFilter, to: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="To date"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Event Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as EventFilter)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">All Events</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past Events</option>
                    <option value="public">Public Events</option>
                    <option value="private">Private Events</option>
                  </select>
                </div>

                {/* Quick Date Presets */}
                <div>
                  <label className="block text-sm font-medium mb-2">Quick Filters</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setDateFilter({ from: today });
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const nextWeek = new Date(today);
                        nextWeek.setDate(today.getDate() + 7);
                        setDateFilter({
                          from: today.toISOString().split('T')[0],
                          to: nextWeek.toISOString().split('T')[0]
                        });
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Next 7 Days
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const nextMonth = new Date(today);
                        nextMonth.setMonth(today.getMonth() + 1);
                        setDateFilter({
                          from: today.toISOString().split('T')[0],
                          to: nextMonth.toISOString().split('T')[0]
                        });
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Next 30 Days
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div className="p-3 bg-blue-50 rounded-lg w-full">
                    <div className="text-sm text-blue-800">
                      Showing {filteredEvents.length} of {events.length} events
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedCategories.includes(category)
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        {category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Events Grid/List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || dateFilter.from || dateFilter.to || selectedCategories.length > 0 || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first event to get started'}
            </p>
            <Link
              href="/user/events/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create New Event
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div key={event.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow">
                {event.coverImage ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-blue-300" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">
                        {event.title}
                      </h3>
                      {event.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full mb-2">
                          {event.category}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(event)}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description || 'No description'}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{formatTime(event.time)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Event</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        {event.category && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Tag size={10} />
                            {event.category}
                          </div>
                        )}
                        {event.description && (
                          <div className="text-sm text-gray-600 mt-2 line-clamp-2 max-w-md">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={14} className="text-gray-400" />
                            <span>{formatTime(event.time)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="max-w-xs truncate">{event.location || 'No location'}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(event)}
                        {event.guestsCount !== undefined && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Users size={10} />
                            {event.guestsCount} guests
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination (if needed in future) */}
        {filteredEvents.length > 0 && (
          <div className="mt-6 flex items-center justify-between bg-white px-6 py-3 rounded-xl shadow">
            <div className="text-sm text-gray-600">
              Showing {filteredEvents.length} events
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
                Previous
              </button>
              <span className="px-3 py-1 text-sm">1</span>
              <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}