import React from 'react';

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
  imageUrl?: string;
  locked?: boolean;
}

interface EventData {
  [key: string]: any;
}

interface EventTemplateViewerProps {
  elements: Element[];
  eventData?: EventData;
}

const EventTemplateViewer: React.FC<EventTemplateViewerProps> = ({
  elements = [],
  eventData = {}
}) => {
  const replacePlaceholders = (text: string = ''): string => {
    let result = text;
    Object.keys(eventData).forEach(key => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), eventData[key] || '');
    });
    return result;
  };

  // Show a message if no elements
  if (!elements || elements.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-gray-600 text-lg">No invitation elements to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 p-8">
      <div 
        className="relative bg-white shadow-lg"
        style={{
          width: '800px',
          height: '1000px',
        }}
      >
        {elements.map((el) => (
          <div
            key={el.id}
            className="absolute"
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`,
            }}
          >
            {el.type === 'text' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  color: el.color || '#000000',
                  fontSize: `${el.fontSize || 16}px`,
                  backgroundColor: el.bgColor || 'transparent',
                  padding: '8px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {replacePlaceholders(el.content)}
              </div>
            )}

            {el.type === 'rectangle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.bgColor || '#e5e7eb',
                  border: `2px solid ${el.color || '#000000'}`,
                  boxSizing: 'border-box',
                }}
              />
            )}

            {el.type === 'circle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.bgColor || '#e5e7eb',
                  border: `2px solid ${el.color || '#000000'}`,
                  borderRadius: '50%',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {el.type === 'image' && el.imageUrl && (
              <img
                src={el.imageUrl}
                alt="Invitation element"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
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