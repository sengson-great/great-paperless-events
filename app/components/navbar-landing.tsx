// app/components/navbar-landing.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/public/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useActiveSection } from "@/hooks/useScrollAnimation";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
];

export default function NavbarLanding() {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeSection = useActiveSection(['home', 'features', 'about', 'contact']);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // Account for fixed navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
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
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src={Logo.src}
                alt="Logo"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
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
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-teal-600 to-cyan-600 transition-all ${
                      activeSection === link.href.substring(1)
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              {loading ? (
                <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
              ) : user ? (
                <Link href="/templateSelector">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold text-sm hover:from-teal-700 hover:to-cyan-700 transition-all hover:shadow-lg">
                    Templates
                  </button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold text-sm hover:from-teal-700 hover:to-cyan-700 transition-all hover:shadow-lg">
                    Sign In
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-20 right-0 left-0 bg-white shadow-2xl transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="px-6 py-8 space-y-6">
            {/* Navigation Links */}
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className={`block w-full text-left text-lg font-medium transition-colors ${
                  activeSection === link.href.substring(1)
                    ? "text-teal-600"
                    : "text-gray-600"
                }`}
              >
                {link.name}
              </button>
            ))}

            {/* Mobile CTA */}
            <div className="pt-4 border-t border-gray-200">
              {loading ? (
                <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />
              ) : user ? (
                <Link href="/templateSelector" className="block">
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all">
                    Templates
                  </button>
                </Link>
              ) : (
                <Link href="/auth/signin" className="block">
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all">
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
