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
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 375 });
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      
      setContainerHeight(availableHeight);
      
      // For very small screens
      const isExtraSmall = containerWidth < 320;
      const isSmall = containerWidth < 480;
      const isMedium = containerWidth < 768;
      
      // Define target canvas sizes with proper aspect ratio (4:5)
      let targetWidth, targetHeight;
      
      if (isExtraSmall) {
        targetWidth = Math.min(containerWidth * 0.9, 260); // 90% of container or 260px max
        targetHeight = targetWidth * 1.25; // 4:5 ratio (800:1000 = 1:1.25)
      } else if (isSmall) {
        targetWidth = Math.min(containerWidth * 0.95, 350);
        targetHeight = targetWidth * 1.25;
      } else if (isMedium) {
        targetWidth = Math.min(containerWidth * 0.9, 500);
        targetHeight = targetWidth * 1.25;
      } else {
        targetWidth = Math.min(containerWidth * 0.85, 600);
        targetHeight = targetWidth * 1.25;
      }
      
      // Ensure canvas doesn't exceed available height (with some margin)
      const maxHeight = availableHeight * 0.9; // 90% of available height
      if (targetHeight > maxHeight) {
        targetHeight = maxHeight;
        targetWidth = targetHeight * 0.8; // Reverse calculation (5:4)
      }
      
      // Set minimum sizes
      const minWidth = isExtraSmall ? 200 : 250;
      const minHeight = minWidth * 1.25;
      
      targetWidth = Math.max(minWidth, targetWidth);
      targetHeight = Math.max(minHeight, targetHeight);
      
      // Ensure we stay within container bounds
      targetWidth = Math.min(targetWidth, containerWidth);
      targetHeight = Math.min(targetHeight, availableHeight);
      
      // Update state
      setCanvasSize({ width: targetWidth, height: targetHeight });
      
      // Calculate scale relative to original 800x1000
      const scaleFactor = targetWidth / 800;
      setScale(scaleFactor);
    };

    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-50"
      style={{ 
        minHeight: '250px',
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        className="relative bg-white shadow-lg"
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          // Center the canvas with proper margins
          margin: 'auto',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxSizing: 'border-box',
        }}
      >
        {/* Render all elements */}
        {elements.map((el) => (
          <div
            key={el.id}
            className="absolute"
            style={{
              left: `${el.x * scale}px`,
              top: `${el.y * scale}px`,
              width: `${el.width * scale}px`,
              height: `${el.height * scale}px`,
              boxSizing: 'border-box',
            }}
          >
{el.type === 'text' && (
  <div
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
    }}
  >
    <div
      style={{
        fontSize: `${el.fontSize || 16}px`,
        color: el.color,
        backgroundColor: el.bgColor || 'transparent',
        // width: '100%',
        // height: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        // Scale the entire element
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        // Adjust for scaling
        width: `${100 / scale}%`,
        height: `${100 / scale}%`,
      }}
    >
      {el.content || ''}
    </div>
  </div>
)}
            {el.type === 'rectangle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.bgColor,
                  border: `${Math.max(1, 2 * scale)}px solid ${el.color}`,
                }}
              />
            )}
            {el.type === 'circle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.bgColor,
                  border: `${Math.max(1, 2 * scale)}px solid ${el.color}`,
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
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '100%',
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