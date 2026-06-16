import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { bookingService, type BookingRequest } from '../../services/api/bookings';
import type { Specialist } from '../../types';
import { useAuth } from '../../context/useAuth';
import { childrenService, dedupeChildren, type Child } from '../../services/api/children';
import { FileUpload } from '../common/FileUpload';
import { fileUploadService } from '../../services/api/fileUploadService';

interface BookingModalProps {
  open: boolean;
  specialist: Specialist;
  onClose: () => void;
  onBooked: () => void;
}

export const BookingModal = ({ open, specialist, onClose, onBooked }: BookingModalProps) => {
  const { parentChildren } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [childId, setChildId] = useState<string>(''); // Default to empty to force explicit selection
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [childrenList, setChildrenList] = useState<Child[]>(parentChildren);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChildId(''); // Reset selection on open
      setDate('');
      setTime('');
      setReason('');
      setError('');
      setSelectedFile(null);
      // Fetch the most up-to-date children list so newly added children are visible
      childrenService.getMyChildren()
        .then((kids) => {
          setChildrenList(kids);
        })
        .catch(console.error);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!childId || childId === '0' || isNaN(Number(childId))) {
      setError('Please select a valid child profile before booking a session.');
      return;
    }
    if (!date || !time) {
      setError('Please select a date and time for the booking.');
      return;
    }
    if (!reason.trim() && !selectedFile) {
      setError('Please enter a reason for the appointment or attach a file.');
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

      let attachedFileUrl = '';
      if (selectedFile) {
        try {
          const uploadRes = await fileUploadService.uploadFile(selectedFile, 'booking-document');
          attachedFileUrl = uploadRes.url;
        } catch (uploadErr) {
          setError('File upload failed. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      let finalReason = reason.trim();
      if (attachedFileUrl) {
        finalReason = finalReason ? `${finalReason}\n\nAttached File: ${attachedFileUrl}` : `Attached File: ${attachedFileUrl}`;
      }

      const payload: BookingRequest = {
        specialistId: typeof specialistIdValue === 'number' ? specialistIdValue : Number(specialistIdValue),
        childId: childId ? Number(childId) : undefined,
        bookingDate: formattedDate,
        bookingTime: formattedTime,
        preferredDate: formattedDate,
        preferredTime: formattedTime,
        reason: finalReason || undefined,
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
          <Button onClick={handleSubmit} disabled={submitting || !date || !time || (!reason.trim() && !selectedFile) || !childId}>
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Select Child
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
            value={childId || ''}
            onChange={(e) => setChildId(e.target.value)}
          >
            <option value="" disabled>Select a child</option>
            {dedupeChildren(childrenList).map((c: unknown) => (
              <option key={(c as { id: string }).id} value={(c as { id: string }).id}>
                {(c as { name: string }).name}
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

        {specialist.type === 'therapist' && (
          <div className="mt-4">
            <FileUpload
              label="Attach Document (Optional)"
              description="Upload relevant documents such as previous assessments or progress reports."
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              allowedFormats={['PDF', 'DOC', 'DOCX', 'JPG', 'JPEG', 'PNG']}
              maxSize={10}
              onFileSelect={setSelectedFile}
            />
          </div>
        )}

        {!parentChildren.length && !childId && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            No child profile found. Please add a child before booking a session.
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
