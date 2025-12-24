"use client";
import { useState } from 'react';
import { Home, Calendar, Users, ChevronDown, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/public/logo.png'

export default function Sidebar() {
    const pathname = usePathname();
    
    const isActive = (menuPath: string) => {
      return pathname.includes(menuPath);
    }

    return (
        <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
            <img src={Logo.src} alt="Logo" className=" w-full"/>
        </div>

        <nav className="mt-6">
          <Link href={"/admin/dashboard"}
            className={`w-full flex items-center px-6 py-3 text-gray-700! no-underline! hover:bg-gray-100 ${
              isActive('/admin/dashboard') ? 'text-white! bg-blue-400 hover:bg-blue-400! hover:text-white!' : ''
            }`}
          >
            <Home size={20} className="mr-3" />
            <span>Home</span>
          </Link>

          <Link href={"/admin/crudEvents"}
            className={`w-full flex items-center px-6 py-3 text-gray-700! no-underline! hover:bg-gray-100 ${
              isActive('/admin/crudEvents') ? 'text-white! bg-blue-400 hover:bg-blue-400! hover:text-white!' : ''
            }`}
          >
            <FileText size={20} className="mr-3" />
            <span>Event</span>
            <ChevronDown size={16} className="ml-auto" />
          </Link>

          <Link href={"/admin/crudUsers"}
            className={`w-full flex items-center px-6 py-3 text-gray-700! no-underline! hover:bg-gray-100 hover:text-gray-700! ${
              isActive('/admin/crudUsers') ? 'text-white! bg-blue-400 hover:bg-blue-400! hover:text-white!' : ''
            }`}
          >
            <Users size={20} className="mr-3" />
            <span>User</span>
            <ChevronDown size={16} className="ml-auto" />
          </Link>
        </nav>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-4 left-4 bg-blue-400 text-white p-3 rounded-lg shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
              👤
            </div>
            <div className="text-xs">
              <p className="font-semibold">UNG Sreysopea</p>
              <p className="text-blue-100">ungsreysopea@contact</p>
              <p className="text-blue-100">@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    )
}