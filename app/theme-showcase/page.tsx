"use client";

import React from 'react';
import Link from 'next/link';

export default function ThemeShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="bg-white shadow-soft sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-serif gradient-text font-bold">Great Paperless Events</h1>
          <Link href="/" className="text-primary-600 hover:text-primary-700 transition-smooth">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-20 animate-fade-in">
          <h1 className="text-6xl font-serif font-bold gradient-text mb-6">
            Enhanced Theme Showcase
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the new premium design system with Khmer-inspired colors, 
            beautiful typography, and smooth animations.
          </p>
        </section>

        {/* Color Palette */}
        <section className="mb-20 animate-slide-up">
          <h2 className="text-4xl font-serif font-bold mb-8">Color Palette</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Primary Colors */}
            <div className="bg-white rounded-3xl shadow-medium p-6 hover-lift">
              <h3 className="text-xl font-semibold mb-4">Primary (Emerald-Gold)</h3>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
                  <div key={shade} className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-primary-${shade} shadow-soft`}></div>
                    <span className="text-sm">primary-{shade}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Colors */}
            <div className="bg-white rounded-3xl shadow-medium p-6 hover-lift">
              <h3 className="text-xl font-semibold mb-4">Secondary (Royal Purple)</h3>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
                  <div key={shade} className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-secondary-${shade} shadow-soft`}></div>
                    <span className="text-sm">secondary-{shade}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Colors */}
            <div className="bg-white rounded-3xl shadow-medium p-6 hover-lift">
              <h3 className="text-xl font-semibold mb-4">Accent (Warm Amber)</h3>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
                  <div key={shade} className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-accent-${shade} shadow-soft`}></div>
                    <span className="text-sm">accent-{shade}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Khmer Cultural Colors */}
          <div className="bg-white rounded-3xl shadow-medium p-8">
            <h3 className="text-2xl font-semibold mb-6">Khmer Cultural Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-temple-gold shadow-glow-gold mx-auto mb-3"></div>
                <p className="font-medium">Temple Gold</p>
                <p className="text-sm text-gray-500">#D4AF37</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-lotus-pink shadow-soft mx-auto mb-3"></div>
                <p className="font-medium">Lotus Pink</p>
                <p className="text-sm text-gray-500">#FFC0CB</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-silk-blue shadow-soft mx-auto mb-3"></div>
                <p className="font-medium">Silk Blue</p>
                <p className="text-sm text-gray-500">#4A90E2</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-forest-green shadow-soft mx-auto mb-3"></div>
                <p className="font-medium">Forest Green</p>
                <p className="text-sm text-gray-500">#2D5016</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-20">
          <h2 className="text-4xl font-serif font-bold mb-8">Typography</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl shadow-medium p-8">
              <h3 className="text-2xl font-semibold mb-6">Font Families</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sans (Inter)</p>
                  <p className="text-2xl font-sans">The quick brown fox jumps over the lazy dog</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Serif (Playfair Display)</p>
                  <p className="text-2xl font-serif">The quick brown fox jumps over the lazy dog</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Khmer (Noto Sans Khmer)</p>
                  <p className="text-2xl font-khmer">សូមស្វាគមន៍មកកាន់ព្រឹត្តិការណ៍របស់យើង</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-medium p-8">
              <h3 className="text-2xl font-semibold mb-6">Font Sizes</h3>
              <div className="space-y-2">
                <p className="text-xs">Extra Small (xs)</p>
                <p className="text-sm">Small (sm)</p>
                <p className="text-base">Base</p>
                <p className="text-lg">Large (lg)</p>
                <p className="text-xl">Extra Large (xl)</p>
                <p className="text-2xl">2XL</p>
                <p className="text-3xl">3XL</p>
                <p className="text-4xl">4XL</p>
              </div>
            </div>
          </div>
        </section>

        {/* Shadows & Effects */}
        <section className="mb-20">
          <h2 className="text-4xl font-serif font-bold mb-8">Shadows & Effects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white rounded-3xl shadow-soft p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Soft Shadow</h3>
              <p className="text-sm text-gray-500">shadow-soft</p>
            </div>
            <div className="bg-white rounded-3xl shadow-medium p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Medium Shadow</h3>
              <p className="text-sm text-gray-500">shadow-medium</p>
            </div>
            <div className="bg-white rounded-3xl shadow-strong p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Strong Shadow</h3>
              <p className="text-sm text-gray-500">shadow-strong</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-primary-500 text-white rounded-3xl shadow-glow p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Glow Effect</h3>
              <p className="text-sm">shadow-glow</p>
            </div>
            <div className="bg-temple-gold text-white rounded-3xl shadow-glow-gold p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Gold Glow</h3>
              <p className="text-sm">shadow-glow-gold</p>
            </div>
            <div className="glass rounded-3xl p-8 text-center backdrop-blur-xl bg-white/30">
              <h3 className="text-xl font-semibold mb-2">Glassmorphism</h3>
              <p className="text-sm text-gray-700">glass</p>
            </div>
          </div>
        </section>

        {/* Gradients */}
        <section className="mb-20">
          <h2 className="text-4xl font-serif font-bold mb-8">Gradients</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-primary rounded-3xl p-12 text-white text-center shadow-strong">
              <h3 className="text-2xl font-semibold mb-2">Primary Gradient</h3>
              <p className="text-sm opacity-90">Emerald to Gold</p>
            </div>
            <div className="bg-gradient-secondary rounded-3xl p-12 text-white text-center shadow-strong">
              <h3 className="text-2xl font-semibold mb-2">Secondary Gradient</h3>
              <p className="text-sm opacity-90">Purple to Pink</p>
            </div>
            <div className="bg-gradient-accent rounded-3xl p-12 text-white text-center shadow-strong">
              <h3 className="text-2xl font-semibold mb-2">Accent Gradient</h3>
              <p className="text-sm opacity-90">Amber Warmth</p>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-3xl shadow-medium p-8 text-center">
            <h3 className="text-6xl font-serif font-bold gradient-text mb-4">
              Gradient Text Effect
            </h3>
            <p className="text-gray-600">Using the .gradient-text utility class</p>
          </div>
        </section>

        {/* Animations */}
        <section className="mb-20">
          <h2 className="text-4xl font-serif font-bold mb-8">Animations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl shadow-medium p-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-primary-500 rounded-2xl mx-auto mb-4"></div>
              <h3 className="font-semibold">Fade In</h3>
              <p className="text-sm text-gray-500">animate-fade-in</p>
            </div>
            <div className="bg-white rounded-3xl shadow-medium p-8 text-center animate-slide-up">
              <div className="w-16 h-16 bg-secondary-500 rounded-2xl mx-auto mb-4"></div>
              <h3 className="font-semibold">Slide Up</h3>
              <p className="text-sm text-gray-500">animate-slide-up</p>
            </div>
            <div className="bg-white rounded-3xl shadow-medium p-8 text-center animate-scale-in">
              <div className="w-16 h-16 bg-accent-500 rounded-2xl mx-auto mb-4"></div>
              <h3 className="font-semibold">Scale In</h3>
              <p className="text-sm text-gray-500">animate-scale-in</p>
            </div>
            <div className="bg-white rounded-3xl shadow-medium p-8 text-center hover-lift">
              <div className="w-16 h-16 bg-temple-gold rounded-2xl mx-auto mb-4"></div>
              <h3 className="font-semibold">Hover Lift</h3>
              <p className="text-sm text-gray-500">hover-lift</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-20">
          <h2 className="text-4xl font-serif font-bold mb-8">Button Styles</h2>
          
          <div className="bg-white rounded-3xl shadow-medium p-8">
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-smooth shadow-soft hover:shadow-medium">
                Primary Button
              </button>
              <button className="px-6 py-3 bg-secondary-600 text-white rounded-xl hover:bg-secondary-700 transition-smooth shadow-soft hover:shadow-medium">
                Secondary Button
              </button>
              <button className="px-6 py-3 bg-accent-600 text-white rounded-xl hover:bg-accent-700 transition-smooth shadow-soft hover:shadow-medium">
                Accent Button
              </button>
              <button className="px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow transition-smooth shadow-soft">
                Gradient Button
              </button>
              <button className="px-6 py-3 bg-temple-gold text-white rounded-xl hover:shadow-glow-gold transition-smooth shadow-soft">
                Temple Gold
              </button>
              <button className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 transition-smooth">
                Outline Button
              </button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-20">
          <h2 className="text-4xl font-serif font-bold mb-8">Card Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl shadow-medium p-6 hover-lift">
              <div className="w-full h-48 bg-gradient-primary rounded-2xl mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Event Card</h3>
              <p className="text-gray-600 mb-4">Beautiful card with hover lift effect</p>
              <button className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth">
                View Details
              </button>
            </div>

            <div className="glass rounded-3xl p-6 backdrop-blur-xl bg-white/40 hover-lift">
              <div className="w-full h-48 bg-gradient-secondary rounded-2xl mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Glass Card</h3>
              <p className="text-gray-700 mb-4">Glassmorphism design effect</p>
              <button className="w-full py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-smooth">
                Learn More
              </button>
            </div>

            <div className="bg-gradient-accent rounded-3xl p-6 text-white shadow-strong hover-lift">
              <div className="w-full h-48 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm"></div>
              <h3 className="text-xl font-semibold mb-2">Gradient Card</h3>
              <p className="opacity-90 mb-4">Full gradient background card</p>
              <button className="w-full py-2 bg-white text-accent-700 rounded-lg hover:bg-gray-100 transition-smooth font-semibold">
                Get Started
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-serif gradient-text mb-4">Great Paperless Events</h3>
          <p className="text-gray-400">Enhanced Theme System • 2025</p>
        </div>
      </footer>
    </div>
  );
}
