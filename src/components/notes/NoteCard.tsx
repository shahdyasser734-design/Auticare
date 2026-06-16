import { useState } from 'react';
import { Button } from '../common/Button';
import { notesService, type Note } from '../../services/api/notes';
import { Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface NoteCardProps {
  note: Note;
  childName?: string;
  onUpdate: (updatedNote: Note) => void;
  onDelete: (id: string) => void;
}

export const NoteCard = ({ note, childName, onUpdate, onDelete }: NoteCardProps) => {
  const { user } = useAuth();

  const canModify = (user?.role === 'doctor' || user?.role === 'therapist') && (user?.id === note.createdBy);
  const isSentByMe = String(user?.id) === String(note.createdBy);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      const updatedNote = await notesService.updateNote(note.id, { content: editContent });
      onUpdate(updatedNote);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setIsDeleting(true);
    try {
      await notesService.deleteNote(note.id);
      onDelete(note.id);
    } catch (err) {
      console.error('Failed to delete note:', err);
      setIsDeleting(false);
    }
  };

  const [now] = useState(() => Date.now());
  const relativeTime = (() => {
    const d = new Date(note.createdAt);
    const diff = now - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (days === 0) return `Today ${timeStr}`;
    if (days === 1) return `Yesterday ${timeStr}`;
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  const role = note.senderRole?.toLowerCase() || '';
  const roleBadgeClass = 
    role === 'doctor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
    role === 'therapist' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
    role === 'parent' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  if (isEditing) {
    return (
      <div className="p-4 standard-card border-2 border-primary-500 transition-all relative">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
          rows={4}
          disabled={isSaving}
        />
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
            <X size={16} className="mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !editContent.trim()}>
            {isSaving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Check size={16} className="mr-1" />}
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all relative group">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              {displayRole && (
                <span className={`w-fit px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${roleBadgeClass}`}>
                  {displayRole}
                </span>
              )}
              {note.senderName && (
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {note.senderName}
                </span>
              )}
            </div>
            
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              {isSentByMe ? (note.receiverId ? `Sent to ${note.receiverRole || 'User'}` : 'Shared note') : 'Received'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {[
              displayRole ? displayRole : null,
              childName ? `For ${childName}` : null,
              relativeTime,
              note.updatedAt && note.updatedAt !== note.createdAt ? '(Edited)' : null
            ].filter(Boolean).join(' • ')}
          </p>

          <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap italic mt-1 bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
            "{note.content}"
          </p>
        </div>
        
        {canModify && (
          <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              title="Edit Note"
              disabled={isDeleting}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Note"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
