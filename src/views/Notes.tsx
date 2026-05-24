import React, { useState, useEffect } from 'react';
import { Menu, Plus, Trash2, Search, StickyNote, X, Pin, PinOff, Edit2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { NotificationCenter } from '../components/NotificationCenter';
import { isWithin90Days } from '../utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NoteColorPicker } from '../components/NoteColorPicker';

type NoteColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'violet' | 'slate';

interface Note {
  id: string;
  title: string;
  body: string;
  color: string; // NoteColor name OR hex string (#rrggbb)
  pinned: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'simcard_notes_v1';

const SAMPLE_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Supplier contacts',
    body: 'Hot Wholesale — Rashid bhai, 011-2345-6789\nDiGi distributor — Faruk, 017-8765-4321\nuMobile rep — Karim, 019-1122-3344\n\nAlways call before 5pm for same-day delivery.',
    color: 'emerald',
    pinned: true,
    updatedAt: '2026-05-14T10:30:00Z',
  },
  {
    id: 'n2',
    title: 'May targets',
    body: 'Sales: RM 25,000\nQty: 1,500 units\nNew customers: 12\n\nFocus on Hot Unlimited + DiGi 30GB — highest margin SKUs this month.',
    color: 'blue',
    pinned: true,
    updatedAt: '2026-05-13T08:15:00Z',
  },
  {
    id: 'n3',
    title: 'Customer notes — MF Hossen',
    body: 'Prefers monthly bulk orders.\nUsually pays within 7 days.\nDiscount: 2% on orders > 500 units.\nDelivery address changed last month — new shop in Jalan Pasar.',
    color: 'amber',
    pinned: false,
    updatedAt: '2026-05-11T14:00:00Z',
  },
  {
    id: 'n4',
    title: 'Pricing reminders',
    body: 'Hot30GB cost went up RM 0.50 last week — adjust retail to RM 22.\nDiGi 6GB still RM 12 wholesale.\nCheck Celcom 35 — promotion ends 20 May.',
    color: 'rose',
    pinned: false,
    updatedAt: '2026-05-10T09:45:00Z',
  },
  {
    id: 'n5',
    title: 'Ideas',
    body: 'Loyalty card for top 20 customers?\nWhatsApp broadcast for new stock arrivals.\nCombo deals: SIM + topup credit.',
    color: 'violet',
    pinned: false,
    updatedAt: '2026-05-08T16:20:00Z',
  },
];

const colorStyles: Record<NoteColor, { bg: string; bgDark: string; border: string; borderDark: string; accent: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-50',  bgDark: 'dark:bg-emerald-500/10',  border: 'border-emerald-200',  borderDark: 'dark:border-emerald-500/30',  accent: 'text-emerald-600 dark:text-emerald-400',  ring: 'ring-emerald-500' },
  blue:    { bg: 'bg-blue-50',     bgDark: 'dark:bg-blue-500/10',     border: 'border-blue-200',     borderDark: 'dark:border-blue-500/30',     accent: 'text-blue-600 dark:text-blue-400',     ring: 'ring-blue-500' },
  amber:   { bg: 'bg-amber-50',    bgDark: 'dark:bg-amber-500/10',    border: 'border-amber-200',    borderDark: 'dark:border-amber-500/30',    accent: 'text-amber-600 dark:text-amber-400',   ring: 'ring-amber-500' },
  rose:    { bg: 'bg-rose-50',     bgDark: 'dark:bg-rose-500/10',     border: 'border-rose-200',     borderDark: 'dark:border-rose-500/30',     accent: 'text-rose-600 dark:text-rose-400',     ring: 'ring-rose-500' },
  violet:  { bg: 'bg-violet-50',   bgDark: 'dark:bg-violet-500/10',   border: 'border-violet-200',   borderDark: 'dark:border-violet-500/30',   accent: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500' },
  slate:   { bg: 'bg-slate-50',    bgDark: 'dark:bg-slate-800/50',    border: 'border-slate-200',    borderDark: 'dark:border-slate-700',       accent: 'text-slate-600 dark:text-slate-400',   ring: 'ring-slate-500' },
};

function getCardStyles(color: string): {
  cs: typeof colorStyles[NoteColor];
  cardStyle?: React.CSSProperties;
  accentStyle?: React.CSSProperties;
  isCustom: boolean;
} {
  if (!color.startsWith('#')) {
    return { cs: colorStyles[color as NoteColor] ?? colorStyles.slate, isCustom: false };
  }
  return {
    cs: colorStyles.slate,
    cardStyle: { backgroundColor: color + '18', borderColor: color + '55' },
    accentStyle: { color },
    isCustom: true,
  };
}

const formatUpdated = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

// Map Supabase row (snake_case) → Note (camelCase)
function rowToNote(row: any): Note {
  return {
    id: String(row.id),
    title: row.title,
    body: row.body,
    color: row.color as NoteColor,
    pinned: row.pinned,
    updatedAt: row.updated_at,
  };
}

// Map Note → Supabase row
function noteToRow(n: Note) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    color: n.color,
    pinned: n.pinned,
    updated_at: n.updatedAt,
  };
}

export function Notes() {
  const { setIsMenuOpen } = useApp();

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Note[] = JSON.parse(raw);
        return parsed.filter(n => isWithin90Days(n.updatedAt));
      }
    } catch {}
    return SAMPLE_NOTES.filter(n => isWithin90Days(n.updatedAt));
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'alpha'>('updated');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        const fetched = (data as any[]).map(rowToNote).filter(n => isWithin90Days(n.updatedAt));
        setNotes(fetched);
      });
  }, []);

  // Persist to localStorage (fallback)
  useEffect(() => {
    if (isSupabaseConfigured) return;
    const fresh = notes.filter(n => isWithin90Days(n.updatedAt));
    if (fresh.length !== notes.length) {
      setNotes(fresh);
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
  }, [notes]);

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated = { ...note, pinned: !note.pinned, updatedAt: new Date().toISOString() };
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
    if (isSupabaseConfigured) {
      await supabase.from('notes').update({ pinned: updated.pinned, updated_at: updated.updatedAt }).eq('id', id);
    }
  };

  const remove = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (isSupabaseConfigured) {
      await supabase.from('notes').delete().eq('id', id);
    }
  };

  const openEditor = (note?: Note) => {
    if (note) setEditingNote(note);
    else setEditingNote({ id: `n${Date.now()}`, title: '', body: '', color: 'emerald', pinned: false, updatedAt: new Date().toISOString() });
    setIsAddOpen(true);
  };

  const save = async () => {
    if (!editingNote) return;
    const title = editingNote.title.trim();
    const body = editingNote.body.trim();
    if (!title && !body) { setIsAddOpen(false); setEditingNote(null); return; }
    const updated = { ...editingNote, title: title || 'Untitled', body, updatedAt: new Date().toISOString() };
    setNotes(prev => {
      const exists = prev.find(n => n.id === updated.id);
      if (exists) return prev.map(n => n.id === updated.id ? updated : n);
      return [updated, ...prev];
    });
    if (isSupabaseConfigured) {
      const isExisting = notes.find(n => n.id === editingNote!.id);
      if (isExisting) {
        await supabase.from('notes').update({
          title: updated.title,
          body: updated.body,
          color: updated.color,
          pinned: updated.pinned,
          updated_at: updated.updatedAt,
        }).eq('id', updated.id);
      } else {
        const { data } = await supabase.from('notes').insert({
          title: updated.title,
          body: updated.body,
          color: updated.color,
          pinned: updated.pinned,
          updated_at: updated.updatedAt,
        }).select('id').single();
        if (data) {
          const realId = String(data.id);
          setNotes(prev => prev.map(n => n.id === updated.id ? { ...n, id: realId } : n));
        }
      }
    }
    setIsAddOpen(false);
    setEditingNote(null);
  };

  const sortFn = (a: Note, b: Note): number => {
    switch (sortBy) {
      case 'alpha':   return a.title.localeCompare(b.title);
      case 'updated':
      default:        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  };

  const filtered = notes.filter(n => {
    if (!search) return true;
    const s = search.toLowerCase();
    return n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s);
  });

  const pinned = filtered.filter(n => n.pinned).sort(sortFn);
  const others = filtered.filter(n => !n.pinned).sort(sortFn);

  const renderCard = (n: Note) => {
    const { cs, cardStyle, accentStyle, isCustom } = getCardStyles(n.color);
    return (
      <div
        key={n.id}
        onClick={() => openEditor(n)}
        className={`group relative p-4 ${!isCustom ? `${cs.bg} ${cs.bgDark}` : ''} rounded-2xl border ${!isCustom ? `${cs.border} ${cs.borderDark}` : ''} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer break-inside-avoid mb-3`}
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className={`text-sm font-bold tracking-tight ${!isCustom ? cs.accent : ''} line-clamp-2 flex-1`}
            style={isCustom ? accentStyle : undefined}
          >{n.title}</h3>
          <button
            onClick={e => { e.stopPropagation(); togglePin(n.id); }}
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/60 dark:hover:bg-slate-900/40 ${n.pinned ? (!isCustom ? cs.accent : '') : 'text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100'}`}
            style={n.pinned && isCustom ? accentStyle : undefined}
            title={n.pinned ? 'Unpin' : 'Pin'}
          >
            {n.pinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6 leading-relaxed">{n.body}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
          <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{formatUpdated(n.updatedAt)}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); openEditor(n); }}
              className="w-6 h-6 rounded-md hover:bg-white/60 dark:hover:bg-slate-900/40 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600"
              title="Edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); remove(n.id); }}
              className="w-6 h-6 rounded-md hover:bg-white/60 dark:hover:bg-slate-900/40 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 sm:px-6 pb-2 pt-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-200 tracking-tight">Notes</h1>
          <NotificationCenter />
        </div>

        {/* Stats banner */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/15 dark:to-blue-500/15 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-md shrink-0">
            <StickyNote className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{notes.length} notes</p>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
              {notes.filter(n => n.pinned).length} pinned · Tap a card to edit
            </p>
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-semibold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="shrink-0 px-3 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-sm"
            title="Sort"
          >
            <option value="updated">Recent</option>
            <option value="alpha">A-Z</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-40 mt-3 sm:mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 flex items-center justify-center mb-4">
              <StickyNote className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-300">No notes yet</p>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">Tap + to create your first note</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Pin className="w-3 h-3 fill-current" /> Pinned
                </p>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
                  {pinned.map(renderCard)}
                </div>
              </>
            )}
            {others.length > 0 && (
              <>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 mt-2">
                  {pinned.length > 0 ? 'Others' : 'All Notes'}
                </p>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
                  {others.map(renderCard)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => openEditor()}
        className="fixed bottom-24 lg:bottom-8 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-30"
        title="New note"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Editor Modal */}
      {isAddOpen && editingNote && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] animate-in fade-in duration-200" onClick={() => { setIsAddOpen(false); setEditingNote(null); }} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[92%] max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-200 tracking-tight">
                {notes.find(n => n.id === editingNote.id) ? 'Edit Note' : 'New Note'}
              </h3>
              <button onClick={() => { setIsAddOpen(false); setEditingNote(null); }} className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                autoFocus
                type="text"
                value={editingNote.title}
                onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                placeholder="Title"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-base font-bold text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest -mt-2 ml-1">
              {notes.find(n => n.id === editingNote.id) ? 'Updated' : 'Created'}: {new Date(editingNote.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
              <textarea
                value={editingNote.body}
                onChange={e => setEditingNote({ ...editingNote, body: e.target.value })}
                placeholder="Write your note..."
                rows={8}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              />
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Color</label>
                <div className="flex gap-2 mt-1.5">
                  {(Object.keys(colorStyles) as NoteColor[]).map(c => {
                    const cs = colorStyles[c];
                    const active = editingNote.color === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setEditingNote({ ...editingNote, color: c as string })}
                        className={`w-8 h-8 rounded-xl ${cs.bg} ${cs.bgDark} border ${cs.border} ${cs.borderDark} transition-all active:scale-90 ${active ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${cs.ring}` : ''}`}
                        title={c}
                      />
                    );
                  })}
                  <NoteColorPicker
                    value={editingNote.color.startsWith('#') ? editingNote.color : '#10b981'}
                    onChange={hex => setEditingNote({ ...editingNote, color: hex })}
                  >
                    <div
                      className="w-8 h-8 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors"
                      style={editingNote.color.startsWith('#') ? { backgroundColor: editingNote.color + '30', borderColor: editingNote.color } : undefined}
                      title="Custom color"
                    >
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 select-none">+</span>
                    </div>
                  </NoteColorPicker>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  onClick={() => setEditingNote({ ...editingNote, pinned: !editingNote.pinned })}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${editingNote.pinned ? 'bg-gradient-to-br from-emerald-500 to-blue-500 border-transparent' : 'border-gray-300 dark:border-slate-600'}`}
                >
                  {editingNote.pinned && <Pin className="w-2.5 h-2.5 text-white fill-current" />}
                </button>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Pin to top</span>
              </label>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex gap-2">
              <button onClick={() => { setIsAddOpen(false); setEditingNote(null); }} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                Cancel
              </button>
              <button
                onClick={save}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
