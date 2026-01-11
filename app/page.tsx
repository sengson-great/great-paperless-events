/* eslint-disable react-hooks/refs */
// app/page.tsx
"use client";

import { useState } from "react";
import Logo from "@/public/logo.png";
import Hero from "@/public/hero.jpg";
import Tree from "@/public/tree.jpeg";
import Footer from "./components/footer";
import Motivation from "./components/motivation";
import NavbarLanding from "./components/navbar-landing";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ArrowRight, Sparkles, Leaf, Calendar, Heart, Send, Zap, Share2, Globe } from "lucide-react";
import TelegramNewsletterSimple from "./components/TelegramNewsletterSimple";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isReadMoreVisible, setIsReadMoreVisible] = useState(true);

  const handleToggleReadMoreVisibility = () => {
    setIsReadMoreVisible(!isReadMoreVisible);
  };

  // Scroll animations for different sections
  const heroAnimation = useScrollAnimation({ threshold: 0.2 });
  const featuresAnimation = useScrollAnimation({ threshold: 0.1 });
  const statsAnimation = useScrollAnimation({ threshold: 0.3 });

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navigation */}
      <NavbarLanding />

      {/* Hero Section - Modern Gradient Theme */}
      <section id="home" className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-32 bg-linear-to-br from-slate-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div 
              ref={heroAnimation.ref}
              className={`space-y-8 ${heroAnimation.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            >
              {/* Badge - Modern Gradient */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-teal-50 to-purple-50 border border-teal-100 rounded-full">
                <Leaf className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium bg-linear-to-r from-teal-700 to-purple-700 bg-clip-text text-transparent">100% Paperless & Eco-Friendly</span>
              </div>

              {/* Main Heading - Gradient Accent */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900">
                Beautiful Digital Invitations
                <span className="block bg-linear-to-r from-teal-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  for Khmer Events
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
                Create stunning, paperless invitations for weddings, birthdays, and celebrations—all in one place.
              </p>

              {/* CTA Button - Modern Gradient */}
              <div className="pt-4">
                {loading ? (
                  <div className="w-full sm:w-auto h-14 bg-gray-100 rounded-xl animate-pulse" />
                ) : user ? (
                  <Link href="/templateSelector" className="inline-block no-underline">
                    <button className="px-8 py-4 bg-linear-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center gap-3 group shadow-lg hover:shadow-xl">
                      <Send className="w-5 h-5" />
                      <span className="no-underline">Send Invitation</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                ) : (
                  <Link href="/auth/signin" className="inline-block no-underline">
                    <button className="px-8 py-4 bg-linear-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center gap-3 group shadow-lg hover:shadow-xl">
                      <Send className="w-5 h-5" />
                      <span className="no-underline">Get Started Free</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                )}
              </div>

              {/* Features Grid - Gradient Icons */}
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold">Beautiful Templates</span>
                  </div>
                  <p className="text-sm text-gray-600">Professionally designed</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-5 h-5 text-cyan-600" />
                    <span className="font-semibold">Easy Sharing</span>
                  </div>
                  <p className="text-sm text-gray-600">QR codes & links</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Leaf className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold">Eco-Friendly</span>
                  </div>
                  <p className="text-sm text-gray-600">Zero paper waste</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Heart className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">Free Forever</span>
                  </div>
                  <p className="text-sm text-gray-600">No hidden costs</p>
                </div>
              </div>
            </div>

            {/* Right Image - Original Display with Animation */}
            <div className={`relative lg:order-last order-first ${heroAnimation.isVisible ? 'animate-fade-in animation-delay-400' : 'opacity-0'}`}>
              <div className="relative w-full max-w-md mx-auto">
                <img 
                  src={Hero.src} 
                  alt="Beautiful Khmer Wedding Invitation" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Gradients */}
      <section id="features" className="py-24 px-6 md:px-12 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div 
            ref={featuresAnimation.ref}
            className={`text-center mb-16 ${featuresAnimation.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features to make your event invitations stand out
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className={`group p-8 bg-linear-to-br from-white to-teal-50/30 rounded-xl hover:shadow-lg transition-all border border-gray-100 ${featuresAnimation.isVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
              <div className="w-14 h-14 bg-linear-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Beautiful Templates</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose from hundreds of professionally designed templates perfect for any Khmer event.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className={`group p-8 bg-linear-to-br from-white to-cyan-50/30 rounded-xl hover:shadow-lg transition-all border border-gray-100 ${featuresAnimation.isVisible ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'}`}>
              <div className="w-14 h-14 bg-linear-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Sharing</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your invitations instantly via QR codes, links, or social media platforms.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className={`group p-8 bg-linear-to-br from-white to-emerald-50/30 rounded-xl hover:shadow-lg transition-all border border-gray-100 ${featuresAnimation.isVisible ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'}`}>
              <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Eco-Friendly</h3>
              <p className="text-gray-600 leading-relaxed">
                Go paperless and help protect our environment while saving money on printing costs.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className={`group p-8 bg-linear-to-br from-white to-purple-50/30 rounded-xl hover:shadow-lg transition-all border border-gray-100 ${featuresAnimation.isVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
              <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                Create and send beautiful invitations in minutes, not hours or days.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className={`group p-8 bg-linear-to-br from-white to-pink-50/30 rounded-xl hover:shadow-lg transition-all border border-gray-100 ${featuresAnimation.isVisible ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'}`}>
              <div className="w-14 h-14 bg-linear-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Free Forever</h3>
              <p className="text-gray-600 leading-relaxed">
                No subscriptions, no hidden fees. Create unlimited invitations completely free.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className={`group p-8 bg-linear-to-br from-white to-indigo-50/30 rounded-xl hover:shadow-lg transition-all border border-gray-100 ${featuresAnimation.isVisible ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'}`}>
              <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Language</h3>
              <p className="text-gray-600 leading-relaxed">
                Support for Khmer, English, and other languages to reach all your guests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Modern Gradient */}
      <section 
        ref={statsAnimation.ref}
        className={`py-20 bg-linear-to-r from-teal-600 via-cyan-600 to-purple-600 ${statsAnimation.isVisible ? 'animate-fade-in' : 'opacity-0'}`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-white">1000+</div>
              <p className="text-teal-100 text-sm">Templates</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-white">5000+</div>
              <p className="text-cyan-100 text-sm">Happy Users</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-white">100%</div>
              <p className="text-cyan-100 text-sm">Paperless</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-white">Free</div>
              <p className="text-purple-100 text-sm">Forever</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Tree Image */}
      <div className="w-full md:hidden">
        <img src={Tree.src} alt="forest" className="w-full h-64 object-cover" />
      </div>

      {/* Motivation Section */}
      <div id="about">
        <Motivation
          isReadMoreVisible={isReadMoreVisible}
          toggleReadMoreVisibity={handleToggleReadMoreVisibility}
        />
      </div>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <TelegramNewsletterSimple />
        </div>
      </section>

      {/* Footer */}
      <div id="contact">
        <Footer />
      </div>
    </div>
  );
}