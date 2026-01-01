// app/admin/users/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Trash2, Shield, User, Plus } from 'lucide-react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/adminHeader';
import { useAuth } from '@/hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'Admin' | 'User';
}

const UserManagement: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Create form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'User'>('User');

  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const listUsers = httpsCallable(functions, 'listAllUsers');
        const result = await listUsers();
        const data = result.data as { users: any[] };

        const formatted: AppUser[] = data.users.map(u => ({
          uid: u.uid,
          displayName: u.displayName || 'No name',
          email: u.email,
          photoURL: u.photoURL,
          role: u.isAdmin ? 'Admin' : 'User',
        }));

        setUsers(formatted);
      } catch (err) {
        console.error(err);
        alert('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const createUser = async () => {
    if (!newEmail || !newPassword || !newName) {
      alert('All fields required');
      return;
    }

    setProcessing('create');
    try {
      const create = httpsCallable(functions, 'createUser');
      await create({
        email: newEmail,
        password: newPassword,
        displayName: newName,
      });

      // Refresh list
      const listUsers = httpsCallable(functions, 'listAllUsers');
      const result = await listUsers();
      const data = result.data as { users: any[] };
      setUsers(data.users.map(u => ({
        uid: u.uid,
        displayName: u.displayName || 'No name',
        email: u.email,
        photoURL: u.photoURL,
        role: u.isAdmin ? 'Admin' : 'User',
      })));

      setShowCreateModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
    } catch (err) {
      alert('Failed to create user');
    } finally {
      setProcessing(null);
    }
  };

  const toggleRole = async (uid: string, currentRole: 'Admin' | 'User') => {
    setProcessing(uid);
    try {
      const newRole = currentRole === 'Admin' ? 'user' : 'admin';
      const setRole = httpsCallable(functions, 'setUserRole');
      await setRole({ uid, role: newRole });

      setUsers(users.map(u => 
        u.uid === uid ? { ...u, role: newRole === 'admin' ? 'Admin' : 'User' } : u
      ));
    } catch (err) {
      alert('Failed to update role');
    } finally {
      setProcessing(null);
    }
  };

  const deleteUser = async (uid: string) => {
    if (!confirm('Delete this user permanently?')) return;

    setProcessing(uid);
    try {
      const del = httpsCallable(functions, 'deleteUser');
      await del({ uid });

      setUsers(users.filter(u => u.uid !== uid));
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setProcessing(null);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600 text-2xl">Access Denied</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Header />
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">User Management</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              Create User
            </button>
          </div>

          <div className="mb-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-center">Role</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{user.displayName?.[0] || '👤'}</span>
                          )}
                        </div>
                        <span className="font-medium">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-600">{user.email}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                        user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'Admin' ? <Shield size={16} className="inline mr-1" /> : <User size={16} className="inline mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => toggleRole(user.uid, user.role)}
                          disabled={processing === user.uid}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-70"
                        >
                          {processing === user.uid ? '...' : user.role === 'Admin' ? 'Make User' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => deleteUser(user.uid)}
                          disabled={processing === user.uid}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold mb-6">Create New User</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'Admin' | 'User')}
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={processing === 'create'}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
              >
                {processing === 'create' ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;