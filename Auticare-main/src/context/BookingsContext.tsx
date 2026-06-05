import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { bookingService, type Booking } from '../services/api/bookings';

type BookingsContextValue = {
  myBookings: Booking[];
  upcomingBookings: Booking[];
  currentChildId?: string;
  loading: boolean;
  refreshBookings: () => Promise<void>;
  addBooking: (b: Booking) => void;
  setCurrentChildId: (id?: string) => void;
};

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [currentChildId, setCurrentChildId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refreshBookings = async () => {
    setLoading(true);
    try {
      const [mine, upcoming] = await Promise.all([
        bookingService.getMyBookings().catch(() => []),
        bookingService.getUpcomingBookings().catch(() => []),
      ]);
      setMyBookings(mine || []);
      setUpcomingBookings(upcoming || []);
    } catch (err) {
      console.error('Failed to refresh bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const childId = localStorage.getItem('latestChildId') || undefined;
    setCurrentChildId(childId);
    void refreshBookings();
  }, []);

  const addBooking = (b: Booking) => {
    setMyBookings((prev) => [b, ...prev]);
    if (b.status === 'scheduled' || b.status === 'confirmed' || b.status === 'pending') {
      setUpcomingBookings((prev) => [b, ...prev]);
    }
  };

  return (
    <BookingsContext.Provider value={{ myBookings, upcomingBookings, currentChildId, loading, refreshBookings, addBooking, setCurrentChildId }}>
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
};

export default BookingsContext;
