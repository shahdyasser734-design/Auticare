// UI-only modal; relies on the project's JSX runtime (no React symbol needed)

export const BookingModalUI = ({
  open,
  specialistName,
  date,
  time,
  reason,
  setDate,
  setTime,
  setReason,
  onClose,
  onConfirm,
  submitting = false,
}: {
  open: boolean;
  specialistName?: string;
  date: string;
  time: string;
  reason: string;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setReason: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="standard-card w-full max-w-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Book Session</h3>
            <p className="text-sm text-slate-500">{specialistName ?? 'Specialist'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-slate-600">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm text-slate-600">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm text-slate-600">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1 w-full p-2 border rounded-md" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-100 text-slate-700">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!date || !time || submitting}
            className="px-4 py-2 rounded bg-sky-600 text-white disabled:opacity-60 inline-flex items-center gap-2"
          >
            {submitting ? (
              <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="80" strokeDashoffset="60" fill="none" />
              </svg>
            ) : null}
            <span>{submitting ? 'Booking...' : 'Confirm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModalUI;
