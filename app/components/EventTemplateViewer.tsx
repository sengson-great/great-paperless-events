// app/components/EventTemplateViewer.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';

export interface Element {
  id: number;
  type: 'text' | 'image' | 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  locked: boolean;
  imageUrl?: string | null;
}

interface EventData {
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
}

interface EventTemplateViewerProps {
  elements: Element[];
  eventData: EventData;
}

const EventTemplateViewer: React.FC<EventTemplateViewerProps> = ({ elements, eventData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 1000 });
  const [scale, setScale] = useState(1);

  // Calculate responsive canvas dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate scale to fit container while maintaining aspect ratio
      const widthScale = containerWidth / 800;
      const heightScale = containerHeight / 1000;
      const newScale = Math.min(widthScale, heightScale, 1); // Don't scale up beyond 1
      
      setScale(newScale);
      
      // Set actual dimensions for the canvas
      const width = 800 * newScale;
      const height = 1000 * newScale;
      setCanvasDimensions({ width, height });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ minHeight: '400px' }}
    >
      <div
        className="relative bg-white shadow-xl"
        style={{
          width: `${canvasDimensions.width}px`,
          height: `${canvasDimensions.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {/* Render all elements */}
        {elements.map((el) => (
          <div
            key={el.id}
            className="absolute"
            style={{
              left: `${(el.x / 800) * 100}%`,
              top: `${(el.y / 1000) * 100}%`,
              width: `${(el.width / 800) * 100}%`,
              height: `${(el.height / 1000) * 100}%`,
            }}
          >
            {el.type === 'text' && (
              <div
                style={{
                  fontSize: `${(el.fontSize || 16) * scale}px`,
                  color: el.color,
                  backgroundColor: el.bgColor,
                  width: '100%',
                  height: '100%',
                  padding: `${8 * scale}px`,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {el.content}
              </div>
            )}
            {el.type === 'rectangle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.bgColor,
                  border: `${2 * scale}px solid ${el.color}`,
                }}
              />
            )}
            {el.type === 'circle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.bgColor,
                  border: `${2 * scale}px solid ${el.color}`,
                  borderRadius: '50%',
                }}
              />
            )}
            {el.type === 'image' && el.imageUrl && (
              <img
                src={el.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/150x150?text=Image+Error';
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTemplateViewer;