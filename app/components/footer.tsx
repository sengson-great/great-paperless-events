/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import Logo from "@/public/logo.png";
import Link from "next/link";
import { Facebook, Youtube, Instagram } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Footer() {
    const footerAnimation = useScrollAnimation({ threshold: 0.1 });

    return (
        <footer className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900">
            <div 
                ref={footerAnimation.ref}
                className={`max-w-7xl mx-auto px-6 md:px-12 py-16 ${footerAnimation.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Logo & About */}
                    <div className="lg:col-span-1 space-y-6">
                        <img src={Logo.src} alt="Logo" className="h-12 w-auto" />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Beautiful digital invitations for every Khmer event. Paperless, eco-friendly, and free forever.
                        </p>
                    </div>
                    
                    {/* Service */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Service</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <Link href="/template" className="hover:text-teal-400 transition-colors">
                                    Templates
                                </Link>
                            </li>
                            <li>
                                <Link href="/templateSelector" className="hover:text-teal-400 transition-colors">
                                    Create Invitation
                                </Link>
                            </li>
                            <li>
                                <Link href="/my-events" className="hover:text-teal-400 transition-colors">
                                    My Events
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Learn */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Learn</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <Link href="/faq" className="hover:text-teal-400 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/read-more" className="hover:text-teal-400 transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Social */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Follow Us</h3>
                        <div className="flex gap-4">
                            <a 
                                href="https://facebook.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-teal-600 hover:to-cyan-600 transition-all hover:scale-110"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a 
                                href="https://youtube.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-teal-600 hover:to-cyan-600 transition-all hover:scale-110"
                            >
                                <Youtube className="w-5 h-5" />
                            </a>
                            <a 
                                href="https://instagram.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-teal-600 hover:to-cyan-600 transition-all hover:scale-110"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Copyright */}
            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
                <p>© {new Date().getFullYear()} Great Paperless Events. All rights reserved.</p>
            </div>
        </footer>
    )
}