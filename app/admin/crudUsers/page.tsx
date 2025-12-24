"use client";
import React, { useState } from 'react';
import { Search, Plus, ChevronDown, Edit2, Trash2, Home, FileText, Users, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/adminHeader';

interface User {
  id: string;
  name: string;
  role: 'Admin' | 'User';
  avatar: string;
}

const initialUsers: User[] = [
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'UNG Sreysopea',
    role: 'Admin',
    avatar: '👤'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'SENG Vengchoung',
    role: 'Admin',
    avatar: '🎂'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'Keo Ratanak',
    role: 'Admin',
    avatar: '👨‍💼'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'Leng Suytong',
    role: 'Admin',
    avatar: '👨‍🦱'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'Tong Borey',
    role: 'Admin',
    avatar: '🧑'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'Lim Gechpeak',
    role: 'User',
    avatar: '👨‍💻'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'Bun Seavlang',
    role: 'User',
    avatar: '👰'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'Seng sengly',
    role: 'User',
    avatar: '👩'
  },
  {
    id: '656d78e34f6b2c1d0e9a8b7c',
    name: 'Van Sophon',
    role: 'User',
    avatar: '👨'
  }
];

const UserDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState('User');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Header />

          {/* Search and Add Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Event List</h2>
            <div className="flex items-center space-x-4">
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort By:</span>
                <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50">
                  <span className="text-blue-500">Role</span>
                  <ChevronDown size={16} className="text-blue-500" />
                </button>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <UserPlus size={18} />
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Account ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">User Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-blue-50">
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{user.id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === 'Admin' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                          {user.avatar}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2 py-4 border-t">
              <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button className="px-3 py-1 bg-blue-500 text-white rounded">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">3</button>
              <span className="px-2">...</span>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">99</button>
              <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;