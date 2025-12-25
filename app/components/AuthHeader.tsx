// app/components/AuthHeader.tsx
"use client"; // ← Must be the very first line

import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { LogOut, LogIn } from "lucide-react";

export default function AuthHeader() {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="flex justify-end items-center p-4 gap-4 h-28 bg-blue-400 z-20">
      {loading ? (
        <div className="w-32 h-10 bg-gray-300 rounded-full animate-pulse" />
      ) : user ? (
        <>
            <span className="text-white text-sm hidden sm:block">
                Hello, {user.displayName || user.email?.split("@")[0]}
            </span>
            <Link href='/my-events' className="flex items-center gap-2 bg-white text-blue-600 rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-gray-100 transition">My Events</Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white text-blue-600 rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-gray-100 transition"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </>
      ) : (
        <Link
          href="/auth/signin"
          className="flex items-center gap-2 bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-[#5a3be0] transition"
        >
          <LogIn size={18} />
          Sign In
        </Link>
      )}
    </header>
  );
}