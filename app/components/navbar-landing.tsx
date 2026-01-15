// app/components/navbar-landing.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useActiveSection } from "@/hooks/useScrollAnimation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Navigation links for the landing page
const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
];

export default function NavbarLanding() {
  // Authentication hook to get user info
  const { user, loading, isAdmin } = useAuth();
  
  // State for scroll effect
  const [isScrolled, setIsScrolled] = useState(false);
  
  // State for mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Hook to track which section is currently active based on scroll position
  const activeSection = useActiveSection(['home', 'features', 'about', 'contact']);

  // Effect to add/remove scroll listener for navbar background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); // Navbar changes style after 20px scroll
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Smooth scrolls to a section on the page
   * @param href - The CSS selector for the section (e.g., "#home")
   */
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // Offset to account for fixed navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after clicking a link
  };

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/"; // Redirect to homepage after logout
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out.");
    }
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group mt-3">
              <Image
                src={Logo}
                alt="Logo"
                width={120}
                height={120}
                className="transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 ml-3">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className={`text-sm font-medium transition-colors relative group ${
                    activeSection === link.href.substring(1)
                      ? "text-teal-600"
                      : "text-gray-600 hover:text-teal-600"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-linear-to-r from-teal-600 to-cyan-600 transition-all ${
                      activeSection === link.href.substring(1)
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4 ml-3">
              {loading ? (
                <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
              ) : user ? (
                <>
                  {/* Admin Dashboard Button - Only for admins */}
                  {isAdmin && (
                    <Link href="/admin/public-events">
                      <button className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all hover:shadow-lg">
                        Admin Dashboard
                      </button>
                    </Link>
                  )}

                  <Link href="/my-events">
                    <button className="px-6 py-2.5 border border-teal-600 text-teal-600 rounded-lg font-semibold text-sm hover:bg-teal-50 transition">
                      My Events
                    </button>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-lg font-semibold text-sm hover:from-red-600 hover:to-pink-700 transition-all hover:shadow-lg"
                  >
                    Logout
                  </button>
                  <Link href="/chat"
                    className="px-6 py-2.5 bg-linear-to-r from-blue-500 to-teal-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-teal-700 transition text-center"
                  >
                    AI Assistant
                  </Link>
                </>
              ) : (
                <Link href="/auth/signin">
                  <button className="px-6 py-2.5 bg-linear-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold text-sm hover:from-teal-700 hover:to-cyan-700 transition-all hover:shadow-lg">
                    Sign In
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Background overlay that closes menu when clicked */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile menu panel */}
        <div
          className={`absolute top-20 right-0 left-0 bg-white shadow-2xl transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="px-6 py-8 space-y-6">
            {/* Mobile navigation links */}
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className={`block w-full text-left text-lg font-medium transition-colors ${
                  activeSection === link.href.substring(1) ? "text-teal-600" : "text-gray-600"
                }`}
              >
                {link.name}
              </button>
            ))}

            {/* Mobile authentication buttons */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              {loading ? (
                <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />
              ) : user ? (
                <>
                  {/* Admin Dashboard in Mobile - Only for admins */}
                  {isAdmin && (
                    <Link href="/admin/events" className="block">
                      <button className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition">
                        Admin Dashboard
                      </button>
                    </Link>
                  )}

                  <Link href="/my-events" className="block">
                    <button className="w-full px-6 py-3 border border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition">
                      My Events
                    </button>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full mb-3! px-6 py-3 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition"
                  >
                    Logout
                  </button>
                  <Link href="/chat" className="block">
                    <button
                      className="w-full px-6 py-3 bg-linear-to-r from-blue-500 to-teal-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-teal-700 transition"
                    >
                      AI Assistant
                    </button>
                  </Link>
                </>
              ) : (
                <Link href="/auth/signin" className="block">
                  <button className="w-full px-6 py-3 bg-linear-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-700 hover:to-cyan-700 transition mt-3!">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}