import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { bookingService, type BookingRequest } from '../../services/api/bookings';
import { childrenService } from '../../services/api/childrenService';
import type { Child, Specialist } from '../../types';

interface BookingModalProps {
  open: boolean;
  specialist: Specialist;
  onClose: () => void;
  onBooked: () => void;
}

export const BookingModal = ({ open, specialist, onClose, onBooked }: BookingModalProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  // Pre-populate from localStorage immediately to avoid race condition
  const [childId, setChildId] = useState<string | undefined>(
    () => localStorage.getItem('latestChildId') || undefined
  );
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadChildren = async () => {
      setLoadingChildren(true);
      try {
        const fetched = await childrenService.getMyChildren();
        setChildren(fetched);
        // Auto-select: prefer localStorage, then first child
        const latest = localStorage.getItem('latestChildId');
        if (latest && fetched.some(c => c.id === latest)) {
          setChildId(latest);
        } else if (fetched.length > 0 && fetched[0].id) {
          setChildId(fetched[0].id);
        }
      } catch (err) {
        console.warn('Could not load child list for booking:', err);
        // Fallback to localStorage if API fails
        const fallbackId = localStorage.getItem('latestChildId');
        if (fallbackId) setChildId(fallbackId);
      } finally {
        setLoadingChildren(false);
      }
    };
    if (open) {
      void loadChildren();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!date || !time) {
      setError('Please select a date and time for the booking.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason for the appointment.');
      return;
    }
    if (!childId || childId === '0' || isNaN(Number(childId))) {
      setError('Please add or select a valid child profile before booking a session.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // Format the date to ensure it's in the correct ISO8601 format for C# DateTime (YYYY-MM-DDT00:00:00Z)
      const dateString = date.includes('T') ? date : `${date}T00:00:00Z`;
      const formattedDate = new Date(dateString).toISOString();
      
      // Format time to strictly "HH:mm:ss" for C# TimeSpan
      const formattedTime = time.length === 5 ? `${time}:00` : time;
      const specialistIdValue = Number(
        specialist.id ||
        (specialist as unknown as Record<string, unknown>).doctorId as string ||
        (specialist as unknown as Record<string, unknown>).therapistId as string
      );

      if (!specialistIdValue) {
        throw new Error('Specialist identifier could not be determined.');
      }

      if (!childId || childId === '0' || isNaN(Number(childId))) {
        setError('Please select a valid child profile for this booking.');
        setSubmitting(false);
        return;
      }

      const payload: BookingRequest = {
        specialistId: typeof specialistIdValue === 'number' ? specialistIdValue : Number(specialistIdValue),
        childId: childId ? Number(childId) : undefined,
        bookingDate: formattedDate,
        bookingTime: formattedTime,
        preferredDate: formattedDate,
        preferredTime: formattedTime,
        reason: reason.trim() || undefined,
      };
      console.log('BOOKING PAYLOAD', payload);
      await bookingService.createBooking(payload);
      onBooked();
    } catch (err) {
      console.error('Booking failed', err);
      const responseErrors = (err as Record<string, unknown> & { response?: { data?: { errors?: Record<string, unknown[]> } } })?.response?.data?.errors;
      const firstValidationError = responseErrors
        ? (Object.values(responseErrors).flat()[0] as string)
        : null;
      setError(firstValidationError || (err as Error)?.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Book a session with ${specialist.name}`}
      footer={(
        <div className="flex flex-col gap-3 sm:flex-row justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !date || !time || !reason.trim()}>
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Book a session, select the right child profile, and confirm your preferred date and time.
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Child</label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
            >
              <option value="">Select a child</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name || `Child ${child.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Child is due for a developmental consultation..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
            />
          </div>
        </div>

        {!loadingChildren && !childId && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            No child profile found. Please add a child before booking a session.
          </div>
        )}
        {loadingChildren && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-500 dark:border-slate-700 dark:bg-slate-800/40">
            Loading child profiles...
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
