import { useState } from 'react';
import { Button } from '../common/Button';
import { notesService, type Note } from '../../services/api/notes';
import { Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface NoteCardProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
  onDelete: (id: string) => void;
}

export const NoteCard = ({ note, onUpdate, onDelete }: NoteCardProps) => {
  const { user } = useAuth();

  // For real implementation:
  const canModify = (user?.role === 'doctor' || user?.role === 'therapist') && (user?.id === note.createdBy);

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
      setIsDeleting(false); // Only reset if failed. If success, it unmounts.
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-primary-500 shadow-sm transition-all relative">
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
        <div className="flex-1">
          <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{note.content}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            {new Date(note.createdAt).toLocaleString()}
            {note.updatedAt && note.updatedAt !== note.createdAt && ' (Edited)'}
          </p>
        </div>
        
        {canModify && (
          <div className="flex flex-col sm:flex-row gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              title="Edit Note"
              disabled={isDeleting}
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Note"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
