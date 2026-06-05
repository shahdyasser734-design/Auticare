import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { bookingService, type BookingRequest } from '../../services/api/bookings';
import { childrenService } from '../../services/childrenService';
import { mockState, createBookingNotification } from '../../services/api/mockState';
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
  const [childId, setChildId] = useState<string | undefined>(undefined);
  const [children, setChildren] = useState<Child[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const fetched = await childrenService.getChildren();
        setChildren(fetched);
        const latest = localStorage.getItem('latestChildId');
        if (latest) {
          setChildId(latest);
        } else if (fetched.length > 0) {
          setChildId(fetched[0].id);
        }
      } catch (err) {
        console.warn('Could not load child list for booking:', err);
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
    if (!childId) {
      setError('Please add a child before booking a session.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // Format the date to ensure it's in the correct format (YYYY-MM-DD)
      const formattedDate = date.includes('-') ? date : new Date(date).toISOString().split('T')[0];
      const formattedTime = time;
      const dateTimeIso = `${formattedDate}T${formattedTime}`;
      const specialistIdValue =
        specialist.id ||
        (specialist as any)._id ||
        (specialist as any).specialistId ||
        (specialist as any).doctorId ||
        (specialist as any).therapistId;

      if (!specialistIdValue) {
        throw new Error('Specialist identifier could not be determined.');
      }

      const payload: BookingRequest = {
        specialistId: specialistIdValue,
        childId,
        preferredDate: formattedDate,
        preferredTime: formattedTime,
        dateTime: dateTimeIso,
        reason: reason.trim(),
        request: reason.trim(),
        notes: reason.trim(),
        SpecialistId: specialistIdValue,
        ChildId: childId,
        PreferredDate: formattedDate,
        PreferredTime: formattedTime,
        DateTime: dateTimeIso,
        Reason: reason.trim(),
        Notes: reason.trim(),
        Request: reason.trim(),
      };
      const booking = await bookingService.createBooking(payload);
      const notification = createBookingNotification(booking);
      mockState.addNotification(notification);
      onBooked();
    } catch (err) {
      console.error('Booking failed', err);
      const responseErrors = (err as any)?.response?.data?.errors;
      const firstValidationError = responseErrors
        ? Object.values(responseErrors).flat()[0]
        : null;
      setError(firstValidationError || (err as any)?.message || 'Failed to create booking. Please try again.');
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

        {!childId && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            No child is selected. Please add a child before booking a session.
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
