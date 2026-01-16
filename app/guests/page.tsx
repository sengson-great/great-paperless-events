// app/user/guests/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  UserX,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  FileText,
  QrCode,
  Share2,
  Copy,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  status: 'invited' | 'confirmed' | 'declined' | 'attended';
  rsvpDate?: string;
  plusOne?: boolean;
  plusOneName?: string;
  dietaryRestrictions?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  userId: string;
  invitationSent?: boolean;
  lastReminderSent?: any;
}

interface UserEvent {
  id: string;
  title: string;
  date: string;
  isPublic: boolean;
  invitationId?: string;
}

type GuestFilter = 'all' | 'invited' | 'confirmed' | 'declined' | 'attended';
type SortField = 'name' | 'event' | 'date' | 'status';

export default function UserGuestsPage() {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    eventId: '',
    plusOne: false,
    plusOneName: '',
    dietaryRestrictions: '',
    notes: '',
    status: 'invited' as Guest['status']
  });

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    applyFilters();
  }, [guests, selectedEvent, searchTerm, filter, sortField, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadEvents(), loadGuests()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      // Get events created by this user
      const eventsQuery = query(
        collection(db, 'events'),
        where('createdBy', '==', user.uid)
      );
      const snapshot = await getDocs(eventsQuery);
      const eventsData: UserEvent[] = [];
      
      snapshot.forEach((doc) => {
        eventsData.push({
          id: doc.id,
          ...doc.data()
        } as UserEvent);
      });

      // Sort events by date (upcoming first)
      eventsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setUserEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadGuests = async () => {
    if (!user) return;
    
    try {
      // Get guests created by this user
      const guestsQuery = query(
        collection(db, 'guests'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(guestsQuery);
      const guestsData: Guest[] = [];
      
      snapshot.forEach((doc) => {
        guestsData.push({
          id: doc.id,
          ...doc.data()
        } as Guest);
      });

      setGuests(guestsData);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...guests];
    
    // Filter by selected event
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(guest => guest.eventId === selectedEvent);
    }
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(guest => guest.status === filter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(guest => 
        guest.firstName.toLowerCase().includes(term) ||
        guest.lastName.toLowerCase().includes(term) ||
        guest.email.toLowerCase().includes(term) ||
        guest.eventTitle.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'event':
          aValue = a.eventTitle.toLowerCase();
          bValue = b.eventTitle.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.eventDate || '').getTime();
          bValue = new Date(b.eventDate || '').getTime();
          break;
        case 'status':
          const statusOrder = { 'attended': 0, 'confirmed': 1, 'invited': 2, 'declined': 3 };
          aValue = statusOrder[a.status] || 4;
          bValue = statusOrder[b.status] || 4;
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredGuests(filtered);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('First name and last name are required');
      return;
    }
    
    if (!formData.email.trim()) {
      alert('Email is required');
      return;
    }
    
    if (!formData.eventId) {
      alert('Please select an event');
      return;
    }

    try {
      const selectedEventData = userEvents.find(e => e.id === formData.eventId);
      if (!selectedEventData) {
        alert('Selected event not found');
        return;
      }

      const guestData = {
        ...formData,
        eventTitle: selectedEventData.title,
        eventDate: selectedEventData.date,
        userId: user!.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        invitationSent: false
      };

      if (editingGuest) {
        // Update guest
        await updateDoc(doc(db, 'guests', editingGuest.id), {
          ...guestData,
          updatedAt: Timestamp.now()
        });
        alert('✅ Guest updated successfully!');
      } else {
        // Create new guest
        await addDoc(collection(db, 'guests'), guestData);
        alert('✅ Guest added successfully!');
      }

      resetForm();
      loadGuests();
    } catch (error) {
      console.error('Error saving guest:', error);
      alert('❌ Failed to save guest');
    }
  };

  // Handle edit
  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone || '',
      eventId: guest.eventId,
      plusOne: guest.plusOne || false,
      plusOneName: guest.plusOneName || '',
      dietaryRestrictions: guest.dietaryRestrictions || '',
      notes: guest.notes || '',
      status: guest.status
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guest?')) return;
    
    try {
      await deleteDoc(doc(db, 'guests', id));
      alert('✅ Guest deleted successfully!');
      loadGuests();
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('❌ Failed to delete guest');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!selectedGuests.length) {
      alert('Please select guests to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedGuests.length} guest(s)?`)) return;
    
    try {
      const promises = selectedGuests.map(id => deleteDoc(doc(db, 'guests', id)));
      await Promise.all(promises);
      alert(`✅ ${selectedGuests.length} guest(s) deleted successfully!`);
      setSelectedGuests([]);
      setShowBulkActions(false);
      loadGuests();
    } catch (error) {
      console.error('Error deleting guests:', error);
      alert('❌ Failed to delete guests');
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (status: Guest['status']) => {
    if (!selectedGuests.length) {
      alert('Please select guests to update');
      return;
    }
    
    try {
      const promises = selectedGuests.map(id => 
        updateDoc(doc(db, 'guests', id), {
          status,
          updatedAt: Timestamp.now(),
          rsvpDate: status !== 'invited' ? Timestamp.now() : null
        })
      );
      await Promise.all(promises);
      alert(`✅ ${selectedGuests.length} guest(s) updated to ${status}!`);
      setSelectedGuests([]);
      setShowBulkActions(false);
      loadGuests();
    } catch (error) {
      console.error('Error updating guests:', error);
      alert('❌ Failed to update guests');
    }
  };

  // Import CSV
  const handleCsvImport = async () => {
    if (!csvData.trim()) {
      alert('Please paste CSV data');
      return;
    }
    
    if (!formData.eventId) {
      alert('Please select an event for import');
      return;
    }
    
    const selectedEventData = userEvents.find(e => e.id === formData.eventId);
    if (!selectedEventData) {
      alert('Selected event not found');
      return;
    }
    
    setImporting(true);
    setImportSuccess(0);
    setImportErrors([]);
    
    try {
      const lines = csvData.split('\n');
      const errors: string[] = [];
      let successCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || i === 0) continue; // Skip header and empty lines
        
        const [firstName, lastName, email, phone = ''] = line.split(',').map(field => field.trim());
        
        if (!firstName || !lastName || !email) {
          errors.push(`Line ${i + 1}: Missing required fields (first name, last name, or email)`);
          continue;
        }
        
        try {
          await addDoc(collection(db, 'guests'), {
            firstName,
            lastName,
            email,
            phone,
            eventId: formData.eventId,
            eventTitle: selectedEventData.title,
            eventDate: selectedEventData.date,
            status: 'invited',
            userId: user!.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            invitationSent: false
          });
          successCount++;
        } catch (error) {
          errors.push(`Line ${i + 1}: Failed to save - ${error}`);
        }
      }
      
      setImportSuccess(successCount);
      setImportErrors(errors);
      
      if (successCount > 0) {
        alert(`✅ ${successCount} guest(s) imported successfully!`);
        setShowImportModal(false);
        setCsvData('');
        loadGuests();
      }
      
      if (errors.length > 0) {
        alert(`Some errors occurred:\n\n${errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('❌ Failed to import CSV data');
    } finally {
      setImporting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Event', 'Status', 'RSVP Date', 'Plus One', 'Dietary Restrictions', 'Notes'];
    const csvRows = filteredGuests.map(guest => [
      guest.firstName,
      guest.lastName,
      guest.email,
      guest.phone || '',
      guest.eventTitle,
      guest.status,
      guest.rsvpDate || '',
      guest.plusOne ? 'Yes' : 'No',
      guest.dietaryRestrictions || '',
      guest.notes || ''
    ].map(field => `"${field}"`).join(','));
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('✅ CSV exported successfully!');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      eventId: '',
      plusOne: false,
      plusOneName: '',
      dietaryRestrictions: '',
      notes: '',
      status: 'invited'
    });
    setEditingGuest(null);
    setShowForm(false);
  };

  // Toggle guest selection
  const toggleGuestSelection = (id: string) => {
    setSelectedGuests(prev => 
      prev.includes(id) 
        ? prev.filter(guestId => guestId !== id)
        : [...prev, id]
    );
  };

  // Select all guests
  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map(guest => guest.id));
    }
  };

  // Get status icon
  const getStatusIcon = (status: Guest['status']) => {
    switch (status) {
      case 'confirmed':
        return <UserCheck size={14} className="text-green-600" />;
      case 'attended':
        return <CheckCircle size={14} className="text-blue-600" />;
      case 'declined':
        return <UserX size={14} className="text-red-600" />;
      default:
        return <Users size={14} className="text-gray-600" />;
    }
  };

  // Get status color
  const getStatusColor = (status: Guest['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'attended': return 'bg-blue-100 text-blue-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  // If not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to manage your guests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
              <p className="text-gray-600 mt-2">Manage your event guests and invitations</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download size={20} />
                Export
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add Guest
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{guests.length}</div>
                <div className="text-sm text-gray-600">Total Guests</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {guests.filter(g => g.status === 'confirmed').length}
                </div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {guests.filter(g => g.status === 'invited').length}
                </div>
                <div className="text-sm text-gray-600">Invited</div>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {guests.filter(g => g.status === 'declined').length}
                </div>
                <div className="text-sm text-gray-600">Declined</div>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Event Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Filter by Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All Events</option>
                {userEvents.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title} ({formatDate(event.date)})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as GuestFilter)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="invited">Invited</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="attended">Attended</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search guests..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="name">Sort by Name</option>
                <option value="event">Sort by Event</option>
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedGuests.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-blue-800">
                    {selectedGuests.length} guest(s) selected
                  </span>
                  <button
                    onClick={() => setSelectedGuests([])}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleBulkStatusUpdate('confirmed')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Mark as Confirmed
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('declined')}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Mark as Declined
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    <input
                      type="checkbox"
                      checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Guest</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Event</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">No guests found</p>
                        <p className="text-sm mt-2">
                          {searchTerm || selectedEvent !== 'all' || filter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Add your first guest to get started'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(guest.id)}
                          onChange={() => toggleGuestSelection(guest.id)}
                          className="h-4 w-4 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {guest.firstName} {guest.lastName}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={12} className="text-gray-400" />
                            <span>{guest.email}</span>
                          </div>
                          {guest.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={12} className="text-gray-400" />
                              <span>{guest.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium">{guest.eventTitle}</div>
                          {guest.eventDate && (
                            <div className="flex items-center gap-2 text-gray-500 mt-1">
                              <Calendar size={12} />
                              <span>{formatDate(guest.eventDate)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(guest.status)}`}>
                          {getStatusIcon(guest.status)}
                          {guest.status.charAt(0).toUpperCase() + guest.status.slice(1)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(guest)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit guest"
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(guest.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete guest"
                          >
                            <Trash2 size={16} />
                          </button>
                                    
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Guest Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingGuest ? 'Edit Guest' : 'Add New Guest'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Event *</label>
                  <select
                    value={formData.eventId}
                    onChange={(e) => setFormData({...formData, eventId: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select an event</option>
                    {userEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({formatDate(event.date)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as Guest['status']})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="invited">Invited</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="attended">Attended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dietary Restrictions</label>
                  <textarea
                    value={formData.dietaryRestrictions}
                    onChange={(e) => setFormData({...formData, dietaryRestrictions: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Any dietary restrictions or preferences"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Additional notes"
                    rows={2}
                  />
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
                    {editingGuest ? 'Update Guest' : 'Add Guest'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}