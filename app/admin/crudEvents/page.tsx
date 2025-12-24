"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/adminHeader';
import Pagination from '@/app/components/pagination';
import { useEvents, Event } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const categories = ['All', 'Wedding', 'Funeral', 'Engagement', 'Birthday', 'House Ceremony', 'Conference'];
const sortOptions = [
  { label: 'Date Latest', value: 'date-desc' },
  { label: 'Date Oldest', value: 'date-asc' },
  { label: 'Name A-Z', value: 'name-asc' },
  { label: 'Name Z-A', value: 'name-desc' },
];
const itemsPerPage = 10;

const EventDashboard: React.FC = () => {
  // All state hooks first
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formOrganizerName, setFormOrganizerName] = useState('');
  const [formOrganizerAvatar, setFormOrganizerAvatar] = useState('');
  const [formCategory, setFormCategory] = useState('Wedding');

  // Auth hook
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  // Events hook
  const { events, loading: eventsLoading, error, addEvent, updateEvent, deleteEvent } = useEvents({
    searchTerm,
    category: selectedCategory,
    sortBy,
  });

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  // Combined loading
  const loading = authLoading || eventsLoading;

  // Computed values (hooks) — must come before any early returns
  const filteredAndSortedEvents = useMemo(() => events, [events]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEvents.slice(start, start + itemsPerPage);
  }, [filteredAndSortedEvents, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedEvents.length / itemsPerPage);

  // Early returns — only after ALL hooks
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirect handled by useEffect
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handlers (unchanged)
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const success = await deleteEvent(id);
      if (!success) alert('Failed to delete event. Please try again.');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormName(event.name);
    setFormOrganizerName(event.organizer.name);
    setFormOrganizerAvatar(event.organizer.avatar);
    setFormCategory(event.category);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingEvent(null);
    setFormName('');
    setFormOrganizerName('');
    setFormOrganizerAvatar('');
    setFormCategory('Wedding');
  };

  const handleSave = async () => {
    if (!formName.trim() || !formOrganizerName.trim() || !formOrganizerAvatar.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let success = false;
      if (isAdding) {
        const newEvent = await addEvent({
          name: formName.trim(),
          organizer: { name: formOrganizerName.trim(), avatar: formOrganizerAvatar.trim() },
          category: formCategory,
        });
        success = !!newEvent;
      } else if (editingEvent) {
        success = await updateEvent(editingEvent.id, {
          name: formName.trim(),
          organizer: { name: formOrganizerName.trim(), avatar: formOrganizerAvatar.trim() },
          category: formCategory,
        });
      }

      if (success) {
        setIsAdding(false);
        setEditingEvent(null);
        setFormName('');
        setFormOrganizerName('');
        setFormOrganizerAvatar('');
        setFormCategory('Wedding');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingEvent(null);
    setFormName('');
    setFormOrganizerName('');
    setFormOrganizerAvatar('');
    setFormCategory('Wedding');
  };

  // Main UI
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Header />

          {/* Filters & Add Button */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Event List</h2>
              <button
                onClick={handleAddNew}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={18} />
                <span>Add New Event</span>
              </button>
            </div>

            {/* Search, Category, Sort */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by event name or organizer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {paginatedEvents.length} of {filteredAndSortedEvents.length} events
              </p>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Event ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Event Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Organizer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Created Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono max-w-[120px] truncate">
                      {event.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                      {event.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                          {event.organizer.avatar}
                        </div>
                        <span className="text-sm text-gray-900 max-w-[120px] truncate">
                          {event.organizer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {event.createdDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEdit(event)} 
                          disabled={loading}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)} 
                          disabled={loading}
                          className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedEvents.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-4">No events found matching your criteria.</p>
                {searchTerm || selectedCategory !== 'All' ? (
                  <button 
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Add Your First Event
                  </button>
                ) : null}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page: number) => setCurrentPage(page)}
              />
            )}
          </div>

          {/* Add/Edit Modal */}
          {(isAdding || editingEvent) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-semibold mb-6">
                  {isAdding ? 'Add New Event' : 'Edit Event'}
                </h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter event name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organizer Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter organizer name"
                      value={formOrganizerName}
                      onChange={(e) => setFormOrganizerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organizer Avatar (Emoji) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 👰"
                      value={formOrganizerAvatar}
                      onChange={(e) => setFormOrganizerAvatar(e.target.value)}
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use a single emoji for the avatar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <button 
                    onClick={handleCancel} 
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDashboard;