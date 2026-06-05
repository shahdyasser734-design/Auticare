import { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useBookings } from '../../context/BookingsContext';
import { bookingService } from '../../services/api/bookings';
import type { BookingRequest } from '../../services/api/bookings';
import type { Specialist } from '../../services/api/specialists';

export const BookingModal = ({
  open,
  specialist,
  onClose,
  onBooked,
}: {
  open: boolean;
  specialist: Specialist;
  onClose: () => void;
  onBooked: (b: any) => void;
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { currentChildId } = useBookings();
  const childId = currentChildId;

  if (!open) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: BookingRequest = {
        specialistId: specialist.id,
        childId,
        dateTime: date && time ? new Date(`${date}T${time}`).toISOString() : undefined,
        request: reason,
        reason,
      };
      const created = await bookingService.createBooking(payload as any);
      onBooked(created);
    } catch (err) {
      console.error('Booking failed', err);
      alert('Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-w-2xl w-full p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold">Book Session with {specialist.name}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm text-slate-600">Select Date</label>
            <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full mt-1 p-2 border rounded" />
          </div>

          <div>
            <label className="text-sm text-slate-600">Select Time</label>
            <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="w-full mt-1 p-2 border rounded" />
          </div>

          <div>
            <label className="text-sm text-slate-600">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mt-1 p-2 border rounded" rows={3} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !date || !time}>
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
