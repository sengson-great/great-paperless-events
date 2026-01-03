"use client";

import Tree from "@/public/tree.jpeg";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Motivation({isReadMoreVisible, toggleReadMoreVisibity}: {isReadMoreVisible?: boolean, toggleReadMoreVisibity?: ()=>void}) {
    const contentAnimation = useScrollAnimation({ threshold: 0.2 });
    const imageAnimation = useScrollAnimation({ threshold: 0.2 });
    
    return (
      <section className="py-32 px-6 md:px-12 lg:px-20 bg-white hidden md:block">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div 
              ref={contentAnimation.ref}
              className={`space-y-8 ${contentAnimation.isVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
            >
              {/* Heading */}
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                Protecting Our Environment
              </h2>
              
              {/* Body Text */}
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  We&rsquo;re inspired by a simple but powerful vision: to create a convenient, 
                  paperless solution that helps people save time, reduce costs, and enjoy 
                  a smoother event-planning experience.
                </p>
                <p>
                  Our commitment goes beyond technology—we aim to <span className="font-semibold text-green-600">protect the environment</span> by 
                  minimizing paper waste and reducing harm to our forests.
                </p>
              </div>
              
              {/* Read More Link */}
              {isReadMoreVisible && (
                <Link 
                  href="/read-more" 
                  onClick={toggleReadMoreVisibity} 
                  className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-green-600 transition-smooth group"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            
            {/* Right Image with Parallax Effect */}
            <div 
              ref={imageAnimation.ref}
              className={`relative ${imageAnimation.isVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl group">
                <img 
                  src={Tree.src} 
                  alt="forest" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
            </div>
          </div>
        </div>
      </section>
    )
}