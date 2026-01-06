"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDocs, orderBy, query, serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

interface Guest {
  id: string;
  name: string;
  phone: string;
  createdAt: any;
}

interface GuestListProps {
  eventId: string;
}

const GuestList: React.FC<GuestListProps> = ({ eventId }) => {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch guests
  useEffect(() => {
    const fetchGuests = async () => {
      if (!eventId) return;
      try {
        const q = query(collection(db, `events/${eventId}/guests`), orderBy('createdAt'));
        const snap = await getDocs(q);
        const guestList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Guest));
        setGuests(guestList);
      } catch (err) {
        console.error(err);
        alert('Failed to load guests');
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, [eventId]);

  // Save guest (create or update)
  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      alert('Name and phone are required');
      return;
    }

    setSaving(true);
    try {
      const guestData = {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingGuest) {
        await updateDoc(doc(db, `events/${eventId}/guests`, editingGuest.id), guestData);
      } else {
        await addDoc(collection(db, `events/${eventId}/guests`), {
          ...guestData,
          createdAt: serverTimestamp(),
        });
      }

      // Refresh list
      const q = query(collection(db, `events/${eventId}/guests`), orderBy('createdAt'));
      const snap = await getDocs(q);
      setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Guest)));

      // Reset form
      setShowModal(false);
      setName('');
      setPhone('');
      setEditingGuest(null);
    } catch (err) {
      alert('Failed to save guest');
    } finally {
      setSaving(false);
    }
  };

  // Delete guest
  const handleDelete = async (guestId: string) => {
    if (!confirm('Delete this guest?')) return;

    try {
      await deleteDoc(doc(db, `events/${eventId}/guests`, guestId));
      setGuests(guests.filter(g => g.id !== guestId));
    } catch (err) {
      alert('Failed to delete guest');
    }
  };

  // Open edit modal
  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setName(guest.name);
    setPhone(guest.phone);
    setShowModal(true);
  };

  // Open add modal
  const openAdd = () => {
    setEditingGuest(null);
    setName('');
    setPhone('');
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" size={32} /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Guest List ({guests.length})</h3>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Guest
        </button>
      </div>

      {guests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No guests yet</p>
          <button
            onClick={openAdd}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Add First Guest
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guests.map(guest => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{guest.name}</td>
                  <td className="px-6 py-4 text-gray-600">{guest.phone}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(guest)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(guest.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Sok Pisey"
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g., 012 345 678"
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={18} />}
                Save Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;