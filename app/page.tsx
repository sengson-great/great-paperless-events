// app/page.tsx
"use client";

import { useState } from "react";
import Logo from "@/public/logo.png";
import Hero from "@/public/hero.jpg";
import Tree from "@/public/tree.jpeg";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Motivation from "./components/motivation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; // ← Your Firebase Auth hook

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isReadMoreVisible, setIsReadMoreVisible] = useState(true);

  const handleToggleReadMoreVisibility = () => {
    setIsReadMoreVisible(!isReadMoreVisible);
  };

  return (
    <div>
      {/* <Navbar /> */}
      <div
        className="w-full min-h-screen bg-bottom bg-no-repeat pt-32 md:pt-48 flex flex-1 justify-between items-center lg:gap-32 px-10 md:px-20"
        style={{
          backgroundImage: `url('/bg.jpg')`,
          backgroundSize: "100% 100%",
        }}
      >
        <div className="flex flex-col gap-5 lg:ms-32 sm:mx-20 lg:w-1/2">
          <div className="text-blue-500 lg:text-4xl text-2xl">
            <p>Organize All Your Khmer Events<br />Paperless & Effortless</p>
          </div>

          <div className="w-full block lg:hidden">
            <img src={Hero.src} alt="Wedding Paper" className="w-full" />
          </div>

          <div className="text-yellow-400 font-bold lg:text-5xl text-4xl">
            <p>Digital Solutions for Every Khmer Event</p>
          </div>

          <div className="text-blue-400 lg:text-4xl text-3xl">
            <p>From Marriage and Engagement to Funeral and Invitations—All in One Place</p>
          </div>

          {/* CTA Button – Works for everyone */}
          <div className="mt-6">
            {loading ? (
              <div className="w-52 h-12 bg-gray-300 rounded-md animate-pulse" />
            ) : user ? (
              // Signed-in → go straight to templates
              <Link href="/templateSelector">
                <button className="text-blue-600 border border-blue-600 rounded-md font-medium text-sm w-52 py-3 hover:bg-blue-50 transition">
                  SEE ALL INVITATION PAPERS
                </button>
              </Link>
            ) : (
              // Not signed-in → go to sign-in page
              <Link href="/auth/signin">
                <button className="text-blue-600 border border-blue-600 rounded-md font-medium text-sm w-52 py-3 hover:bg-blue-50 transition">
                  SEE ALL INVITATION PAPERS
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="hidden lg:flex pe-10">
          <img src={Hero.src} alt="Wedding Paper" className="w-full max-w-2xl" />
        </div>
      </div>

      {/* Mobile-only tree image */}
      <div className="w-full md:hidden block">
        <img src={Tree.src} alt="forest" className="w-full h-full object-cover" />
      </div>

      <Motivation
        isReadMoreVisible={isReadMoreVisible}
        toggleReadMoreVisibity={handleToggleReadMoreVisibility}
      />
      <Footer />
    </div>
  );
}