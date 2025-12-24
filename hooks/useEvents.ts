// hooks/useEvents.ts
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Event {
  id: string;
  name: string;
  organizer: {
    name: string;
    avatar: string;
  };
  category: string;
  createdDate: string;
  createdDateObj: Date;
  updatedAt?: Date;
}

// Add this type for creating new events
export interface CreateEventData {
  name: string;
  organizer: {
    name: string;
    avatar: string;
  };
  category: string;
}

export const useEvents = (filters: {
  searchTerm: string;
  category: string;
  sortBy: string;
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Firebase is initialized
    if (!db) {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    try {
      
      const q = query(collection(db, 'events'), orderBy('createdDateObj', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const eventsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdDateObj: data.createdDateObj?.toDate ? data.createdDateObj.toDate() : new Date(data.createdDate)
            } as Event;
          });
          
          // Apply client-side filtering
          let filtered = eventsData.filter(event => {
            const matchesSearch =
              event.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
              event.organizer.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
  
            const matchesCategory =
              filters.category === 'All' || event.category === filters.category;
  
            return matchesSearch && matchesCategory;
          });

          // Apply sorting
          if (filters.sortBy === 'date-desc') {
            filtered.sort((a, b) => b.createdDateObj.getTime() - a.createdDateObj.getTime());
          } else if (filters.sortBy === 'date-asc') {
            filtered.sort((a, b) => a.createdDateObj.getTime() - b.createdDateObj.getTime());
          } else if (filters.sortBy === 'name-asc') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
          } else if (filters.sortBy === 'name-desc') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
          }

          setEvents(filtered);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Firestore error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [filters.searchTerm, filters.category, filters.sortBy]);

  const addEvent = async (eventData: CreateEventData): Promise<Event | null> => {
    try {
      const today = new Date();
      const createdDate = today.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }).replace(' ', '-, ');
      
      const newEventData = {
        ...eventData,
        createdDate: createdDate,
        createdDateObj: today,
        updatedAt: today
      };

      const docRef = await addDoc(collection(db, 'events'), newEventData);
      const addedEvent = { 
        id: docRef.id, 
        ...newEventData, 
        createdDateObj: today 
      };
      return addedEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to add event');
      return null;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>): Promise<boolean> => {
    try {
      const updateData: any = { ...eventData, updatedAt: new Date() };
      
      if (updateData.createdDateObj) {
        updateData.createdDate = updateData.createdDateObj.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }).replace(' ', '-, ');
        delete updateData.createdDateObj;
      }

      await updateDoc(doc(db, 'events', id), updateData);
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event');
      return false;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'events', id));
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
      return false;
    }
  };

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent
  };
};