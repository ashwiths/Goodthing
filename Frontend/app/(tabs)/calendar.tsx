/**
 * app/(tabs)/calendar.tsx  ·  To|Do — Premium Calendar + Pinned Notes
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Modal, StatusBar, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CinematicBackground } from '../../components/CinematicBackground';

import { useAppTheme } from '../../hooks/useAppTheme';
import { fireHaptic } from '../../utils/haptics';

const { width: W } = Dimensions.get('window');
const MAX_W = 600;
const ACTUAL_W = Math.min(W, MAX_W);

// ─── Types ───────────────────────────────────────────────────────────────────
interface PinnedNote {
  id: string;
  title: string;
  body: string;
  color: string;
  date: string;
  createdAt: Date;
  pinned: boolean;
}

interface TaskDot {
  date: string; // 'YYYY-MM-DD'
  color: string;
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function pad2(n: number) { return String(n).padStart(2, '0'); }
function toKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

// ─── Seed Data ─────────────────────────────────────────────────────────────
const today = new Date();
const SEED_DOTS: TaskDot[] = [
  { date: toKey(today.getFullYear(), today.getMonth(), today.getDate()), color: '#4FA5FF', count: 3 },
  { date: toKey(today.getFullYear(), today.getMonth(), today.getDate() + 1), color: '#F7DC6F', count: 1 },
];

const SEED_NOTES: PinnedNote[] = [
  { id: '1', title: 'Project Goals', body: 'Complete Tasks UI and backend integration by end of week.', color: '#4FA5FF', date: toKey(today.getFullYear(), today.getMonth(), today.getDate()), createdAt: new Date(), pinned: true },
];

// ─── Note Card Component ──────────────────────────────────────────────────────
function NoteCard({ note, onPress, onDelete }: { note: PinnedNote; onPress: () => void; onDelete: () => void }) {
  const { P, getBlurIntensity } = useAppTheme();
  
  return (
    <Pressable onPress={() => { fireHaptic('light'); onPress(); }} style={[nc.card, { borderColor: note.color + '40', backgroundColor: 'rgba(10,18,34,0.55)' }]}>
      <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[nc.colorBar, { backgroundColor: note.color }]} />
      <View style={nc.body}>
        <View style={nc.row}>
          <Text style={[nc.title, { color: P.white }]} numberOfLines={1}>{note.title}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {note.pinned && <Ionicons name="bookmark" size={14} color={note.color} />}
            <Pressable onPress={() => { fireHaptic('medium'); onDelete(); }} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.25)" />
            </Pressable>
          </View>
        </View>
        <Text style={[nc.body_txt, { color: P.dim }]} numberOfLines={2}>{note.body}</Text>
      </View>
    </Pressable>
  );
}

const nc = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 18, overflow: 'hidden', borderWidth: 1, marginBottom: 12 },
  colorBar: { width: 3, borderRadius: 2, margin: 14, marginRight: 0 },
  body: { flex: 1, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  body_txt: { fontSize: 13, lineHeight: 18 },
});

// ─── Main Calendar Screen ─────────────────────────────────────────────────────
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity, minimalMode } = useAppTheme();

  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected]   = useState(toKey(today.getFullYear(), today.getMonth(), today.getDate()));

  const [notes, setNotes] = useState<PinnedNote[]>(SEED_NOTES);
  const [showModal, setShowModal]       = useState(false);
  const [editNote, setEditNote]         = useState<PinnedNote | null>(null);
  const [noteTitle, setNoteTitle]       = useState('');
  const [noteBody, setNoteBody]         = useState('');
  const [noteColor, setNoteColor]       = useState(P.blue);
  const [notePinned, setNotePinned]     = useState(true);

  // Dynamic PIN COLORS based on theme
  const PIN_COLORS = [P.blue, P.purple, P.high, P.medium, P.low];

  // Calendar helpers
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay  = firstDayOfMonth(viewYear, viewMonth);

  const dotMap: Record<string, string> = {};
  SEED_DOTS.forEach(d => { dotMap[d.date] = d.color; });

  const handlePrevMonth = () => {
    fireHaptic('light');
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    fireHaptic('light');
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayPress = (day: number) => {
    fireHaptic('light');
    setSelected(toKey(viewYear, viewMonth, day));
  };

  const openNoteModal = (note?: PinnedNote) => {
    fireHaptic('medium');
    if (note) {
      setEditNote(note);
      setNoteTitle(note.title);
      setNoteBody(note.body);
      setNoteColor(note.color);
      setNotePinned(note.pinned);
    } else {
      setEditNote(null);
      setNoteTitle('');
      setNoteBody('');
      setNoteColor(PIN_COLORS[0]);
      setNotePinned(true);
    }
    setShowModal(true);
  };

  const saveNote = () => {
    fireHaptic('medium');
    if (!noteTitle.trim()) { setShowModal(false); return; }
    if (editNote) {
      setNotes(notes.map(n => n.id === editNote.id ? { ...n, title: noteTitle, body: noteBody, color: noteColor, pinned: notePinned } : n));
    } else {
      setNotes([{ id: Date.now().toString(), title: noteTitle, body: noteBody, color: noteColor, pinned: notePinned, date: selected, createdAt: new Date() }, ...notes]);
    }
    setShowModal(false);
  };

  const deleteNote = (id: string) => {
    fireHaptic('heavy');
    setNotes(notes.filter(n => n.id !== id));
  };

  // Filter notes by selected date
  const selectedNotes = notes.filter(n => n.date === selected);

  // Render grid
  const renderGrid = () => {
    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push(<View key={`empty-${i}`} style={s.dayCell} />);
    }
    for (let d = 1; d <= totalDays; d++) {
      const keyStr = toKey(viewYear, viewMonth, d);
      const isSelected = selected === keyStr;
      const isToday = keyStr === toKey(today.getFullYear(), today.getMonth(), today.getDate());
      const dotColor = dotMap[keyStr];

      cells.push(
        <Pressable key={d} style={s.dayCell} onPress={() => handleDayPress(d)}>
          <View style={[s.dayCircle, isSelected && { backgroundColor: P.blue, shadowColor: P.blue }, isToday && !isSelected && { borderWidth: 1, borderColor: P.border }]}>
            <Text style={[s.dayTxt, { color: P.white }, isSelected && s.dayTxtSel, isToday && !isSelected && { color: P.blue }]}>{d}</Text>
          </View>
          {dotColor && <View style={[s.dot, { backgroundColor: dotColor }]} />}
        </Pressable>
      );
    }
    return cells;
  };

  const s = React.useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: P.bg },
    scroll: { paddingHorizontal: 22 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
    pageTitle: { fontSize: 32, fontWeight: '800', color: P.white, letterSpacing: -0.5 },
    pageSub: { fontSize: 14, color: P.dimmer, fontWeight: '500', marginTop: 4 },
  
    // Cal Card
    calCard: { borderRadius: 24, padding: 18, marginBottom: 32, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)', overflow: 'hidden' },
    calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    monthTxt: { fontSize: 18, fontWeight: '700', color: P.white },
    navBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  
    // Grid
    daysRow: { flexDirection: 'row', marginBottom: 12 },
    dayLblCell: { flex: 1, alignItems: 'center' },
    dayLbl: { fontSize: 12, fontWeight: '600', color: P.dimmer },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'flex-start' },
    dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
    dayTxt: { fontSize: 14, fontWeight: '600' },
    dayTxtSel: { color: P.bg, fontWeight: '800' },
    dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  
    // Notes Sec
    notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    notesTitle: { fontSize: 18, fontWeight: '700', color: P.white },
    addNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: P.blue + '20', borderWidth: 1, borderColor: P.border },
    addNoteTxt: { fontSize: 13, fontWeight: '700', color: P.blue },
    emptyNotes: { padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: P.borderSub, borderRadius: 20, borderStyle: 'dashed' },
    emptyTxt: { fontSize: 14, color: P.dimmer, marginTop: 8 },
  
    // Modal
    modalWrap: { flex: 1, justifyContent: 'flex-end' },
    modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: P.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: P.borderSub },
    modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: P.white },
    input: { color: P.white, fontSize: 16, marginBottom: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: P.borderSub },
    bodyInput: { minHeight: 100, textAlignVertical: 'top' },
    colorRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
    rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 16 },
    saveBtn: { backgroundColor: P.blue, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: P.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
    saveTxt: { color: P.bg, fontSize: 16, fontWeight: '700' },
  }), [P]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <CinematicBackground particleCount={20} showScanLine={false} />

      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: 100, maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]} showsVerticalScrollIndicator={false}>
        
        <View style={s.header}>
          <View>
            <Text style={s.pageTitle}>Calendar</Text>
            <Text style={s.pageSub}>Schedule and reflect.</Text>
          </View>
        </View>

        <View style={s.calCard}>
          <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={s.calHeader}>
            <Pressable style={s.navBtn} onPress={handlePrevMonth}><Ionicons name="chevron-back" size={20} color={P.white} /></Pressable>
            <Text style={s.monthTxt}>{MONTHS[viewMonth]} {viewYear}</Text>
            <Pressable style={s.navBtn} onPress={handleNextMonth}><Ionicons name="chevron-forward" size={20} color={P.white} /></Pressable>
          </View>

          <View style={s.daysRow}>
            {DAYS.map(day => <View key={day} style={s.dayLblCell}><Text style={s.dayLbl}>{day}</Text></View>)}
          </View>

          <View style={s.grid}>{renderGrid()}</View>
        </View>

        <View style={s.notesHeader}>
          <Text style={s.notesTitle}>Notes for {selected.slice(-2)} {MONTHS[viewMonth].slice(0,3)}</Text>
          <Pressable style={s.addNoteBtn} onPress={() => openNoteModal()}>
            <Ionicons name="add" size={16} color={P.blue} />
            <Text style={s.addNoteTxt}>Add</Text>
          </Pressable>
        </View>

        {selectedNotes.length === 0 ? (
          <View style={s.emptyNotes}>
            <Ionicons name="document-text-outline" size={32} color={P.dimmer} />
            <Text style={s.emptyTxt}>No notes for this date.</Text>
          </View>
        ) : (
          selectedNotes.map(n => <NoteCard key={n.id} note={n} onPress={() => openNoteModal(n)} onDelete={() => deleteNote(n.id)} />)
        )}
      </ScrollView>

      {/* ── Add Note Modal ── */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalWrap}>
          <Pressable style={s.modalBg} onPress={() => setShowModal(false)}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          
          <View style={s.modalContent}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{editNote ? 'Edit Note' : 'New Note'}</Text>
              <Pressable onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={P.white} /></Pressable>
            </View>

            <TextInput style={s.input} placeholder="Note title" placeholderTextColor={P.dimmer} value={noteTitle} onChangeText={setNoteTitle} />
            <TextInput style={[s.input, s.bodyInput]} placeholder="Write something..." placeholderTextColor={P.dimmer} value={noteBody} onChangeText={setNoteBody} multiline />

            <View style={s.colorRow}>
              {PIN_COLORS.map(c => (
                <Pressable key={c} onPress={() => setNoteColor(c)} style={[s.colorDot, { backgroundColor: c }, noteColor === c && { borderColor: P.white }]} />
              ))}
            </View>

            <View style={s.rowCenter}>
              <Text style={{ fontSize: 16, color: P.white, fontWeight: '500' }}>Pin to top</Text>
              <Pressable onPress={() => setNotePinned(!notePinned)}>
                <Ionicons name={notePinned ? "toggle" : "toggle-outline"} size={32} color={notePinned ? P.blue : P.dim} />
              </Pressable>
            </View>

            <Pressable style={s.saveBtn} onPress={saveNote}>
              <Text style={s.saveTxt}>Save Note</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
