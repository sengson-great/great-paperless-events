/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import Logo from "@/public/logo.png";
import Link from "next/link";
import { Facebook, Youtube, Instagram, Twitter, Mail, Phone, MapPin, Heart, Shield, Users, Globe } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Footer() {
    const footerAnimation = useScrollAnimation({ threshold: 0.1 });

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-linear-to-r from-slate-900 via-gray-900 to-slate-900">
            <div 
                ref={footerAnimation.ref}
                className={`max-w-7xl mx-auto px-6 md:px-12 py-52 ${footerAnimation.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            >
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Logo & About - Expanded */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <img src={Logo.src} alt="Logo" className="h-12 w-auto" />
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-teal-400 to-cyan-400">
                                Great Paperless
                            </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">
                            Beautiful digital invitations for every Khmer event. We are committed to preserving 
                            Cambodian traditions while embracing modern technology. Paperless, eco-friendly, 
                            and free forever for our community.
                        </p>
                        
                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-900/30 rounded-lg flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-teal-400" />
                                </div>
                                <span className="text-sm text-gray-300">100% Free</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-900/30 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-teal-400" />
                                </div>
                                <span className="text-sm text-gray-300">Privacy First</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-900/30 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-teal-400" />
                                </div>
                                <span className="text-sm text-gray-300">Community</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-900/30 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-teal-400" />
                                </div>
                                <span className="text-sm text-gray-300">Eco-Friendly</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-800">Quick Links</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <Link href="/" className="hover:text-teal-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/template" className="hover:text-teal-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                                    Browse Templates
                                </Link>
                            </li>
                            <li>
                                <Link href="/templateSelector" className="hover:text-teal-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                                    Create Invitation
                                </Link>
                            </li>
                            <li>
                                <Link href="/my-events" className="hover:text-teal-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                                    My Events
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-it-works" className="hover:text-teal-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                                    How It Works
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Event Categories */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-800">Event Types</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <Link href="/category/wedding" className="hover:text-teal-400 transition-colors">
                                    Wedding & Engagement
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/birthday" className="hover:text-teal-400 transition-colors">
                                    Birthday Celebrations
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/religious" className="hover:text-teal-400 transition-colors">
                                    Religious Ceremonies
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/business" className="hover:text-teal-400 transition-colors">
                                    Business Events
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/family" className="hover:text-teal-400 transition-colors">
                                    Family Gatherings
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/all" className="hover:text-teal-400 transition-colors text-sm text-teal-300">
                                    View All Categories →
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Contact & Social */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-800">Contact Us</h3>
                        
                        {/* Contact Info */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-3 text-gray-300">
                                <Mail className="w-4 h-4 mt-1 text-teal-400" />
                                <span className="text-sm">support@paperlessevents.kh</span>
                            </div>
                            <div className="flex items-start gap-3 text-gray-300">
                                <Phone className="w-4 h-4 mt-1 text-teal-400" />
                                <span className="text-sm">+855 12 345 678</span>
                            </div>
                            <div className="flex items-start gap-3 text-gray-300">
                                <MapPin className="w-4 h-4 mt-1 text-teal-400" />
                                <span className="text-sm">Phnom Penh, Cambodia</span>
                            </div>
                        </div>
                        
                        {/* Newsletter */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-200">Stay Updated</h4>
                            <div className="flex">
                                <input 
                                    type="email" 
                                    placeholder="Your email" 
                                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-teal-500"
                                />
                                <button className="px-4 py-2 bg-linear-to-r from-teal-600 to-cyan-600 text-white text-sm font-medium rounded-r-lg hover:opacity-90 transition-opacity">
                                    Subscribe
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">No spam, only updates on new features</p>
                        </div>
                        
                        {/* Social Media */}
                        <div className="space-y-3 mt-8">
                            <h4 className="text-sm font-semibold text-gray-200">Follow Us</h4>
                            <div className="flex gap-3">
                                {[
                                    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                                    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
                                    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                                    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                                ].map((social) => (
                                    <a 
                                        key={social.label}
                                        href={social.href} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-linear-to-r hover:from-teal-600 hover:to-cyan-600 transition-all hover:scale-110 group"
                                        aria-label={social.label}
                                    >
                                        <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-800 mb-8">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-teal-400 mb-2">10,000+</div>
                        <div className="text-sm text-gray-400">Events Created</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400 mb-2">500+</div>
                        <div className="text-sm text-gray-400">Templates</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-teal-400 mb-2">50,000+</div>
                        <div className="text-sm text-gray-400">Happy Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400 mb-2">∞</div>
                        <div className="text-sm text-gray-400">Free Forever</div>
                    </div>
                </div>
                
                {/* Bottom Links */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-6 border-t border-gray-800">
                    <div className="text-gray-400 text-sm">
                        <p>© {currentYear} Great Paperless Events. Preserving Khmer traditions through technology.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                        <Link href="/privacy" className="hover:text-teal-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-teal-400 transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/cookies" className="hover:text-teal-400 transition-colors">
                            Cookie Policy
                        </Link>
                        <Link href="/sitemap" className="hover:text-teal-400 transition-colors">
                            Sitemap
                        </Link>
                    </div>
                </div>
                
                {/* Partnership Badge */}
                <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                    <div className="inline-flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full">
                        <span className="text-xs text-gray-400">Proudly serving the Cambodian community since 2022</span>
                        <span className="text-teal-400">🇰🇭</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}