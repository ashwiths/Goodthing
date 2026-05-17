import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJournalStore } from '../../src/stores/journalStore';
import { useUserStore } from '../../src/stores/userStore';
import { useTheme } from '../../src/hooks/useTheme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { NeonInput } from '../../src/components/ui/NeonInput';
import { Modal } from '../../src/components/ui/Modal';
import { GradientHeader } from '../../src/components/ui/GradientHeader';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { DARK, TEXT } from '../../src/constants/colors';
import { JournalEntry } from '../../src/types/journal.types';
import { formatDisplayDate, TODAY } from '../../src/utils/dateUtils';
import { truncate } from '../../src/utils/formatters';
import { XP_REWARDS } from '../../src/utils/xpUtils';

export default function JournalScreen() {
  const { primary } = useTheme();
  const store = useJournalStore();
  const { addXP, updateStats } = useUserStore();
  const [showEditor, setShowEditor] = useState(false);
  const [editEntry, setEditEntry]   = useState<JournalEntry | null>(null);
  const [title, setTitle]   = useState('');
  const [content, setContent] = useState('');

  const stats   = store.getStats();
  const entries = store.entries;

  const openNew = () => {
    setEditEntry(null);
    setTitle('');
    setContent('');
    setShowEditor(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!content.trim()) return;
    if (editEntry) {
      store.updateEntry(editEntry.id, { title, content });
    } else {
      store.addEntry(title, content);
      addXP(XP_REWARDS.journalEntry);
      updateStats({ journalEntries: 1 });
    }
    setShowEditor(false);
  };

  const handleLongPress = (entry: JournalEntry) => {
    Alert.alert(entry.title, '', [
      { text: 'Edit',   onPress: () => openEdit(entry) },
      { text: entry.isPinned ? 'Unpin' : 'Pin', onPress: () => store.togglePin(entry.id) },
      { text: 'Delete', style: 'destructive', onPress: () => store.deleteEntry(entry.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pinned  = entries.filter((e) => e.isPinned);
  const regular = entries.filter((e) => !e.isPinned);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface, DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <GradientHeader
          title="Journal"
          subtitle={`${stats.totalEntries} entries`}
          right={
            <Pressable onPress={openNew} style={styles.addBtn} accessibilityLabel="New journal entry">
              <LinearGradient colors={[primary, primary + '88']} style={styles.addBtnGrad}>
                <Text style={styles.addBtnText}>+</Text>
              </LinearGradient>
            </Pressable>
          }
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats bar */}
          {stats.totalEntries > 0 && (
            <Animated.View entering={FadeInDown.delay(0)}>
              <GlassCard gradient glowColor={primary} padding={16}>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: primary }]}>{stats.totalEntries}</Text>
                    <Text style={styles.statLabel}>Entries</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: primary }]}>{stats.totalWords}</Text>
                    <Text style={styles.statLabel}>Words</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: primary }]}>{stats.avgWordsPerEntry}</Text>
                    <Text style={styles.statLabel}>Avg/Entry</Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Empty state */}
          {entries.length === 0 && (
            <Animated.View entering={FadeInDown.delay(60)}>
              <GlassCard padding={24}>
                <Text style={styles.emptyTitle}>📝 Start Your Journal</Text>
                <Text style={styles.emptyText}>Write your thoughts, reflections, and wins. Every entry earns XP!</Text>
                <View style={{ height: 12 }} />
                <NeonButton label={`New Entry  +${XP_REWARDS.journalEntry}XP`} onPress={openNew} />
              </GlassCard>
            </Animated.View>
          )}

          {/* Pinned entries */}
          {pinned.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>📌 PINNED</Text>
              {pinned.map((e, i) => (
                <JournalCard key={e.id} entry={e} index={i} onPress={openEdit} onLongPress={handleLongPress} color={primary} />
              ))}
            </>
          )}

          {/* All entries */}
          {regular.length > 0 && (
            <>
              {pinned.length > 0 && <Text style={styles.sectionLabel}>ALL ENTRIES</Text>}
              {regular.map((e, i) => (
                <JournalCard key={e.id} entry={e} index={i} onPress={openEdit} onLongPress={handleLongPress} color={primary} />
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Editor Modal */}
      <Modal visible={showEditor} onClose={() => setShowEditor(false)} title={editEntry ? 'Edit Entry' : 'New Entry'} height={580}>
        <View style={styles.editor}>
          <NeonInput
            value={title}
            onChangeText={setTitle}
            placeholder="Entry title..."
            containerStyle={{ marginBottom: 12 }}
          />
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write your thoughts..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={[styles.contentInput, { borderColor: primary + '44' }]}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          <NeonButton label="Save Entry" onPress={handleSave} fullWidth />
        </View>
      </Modal>
    </View>
  );
}

function JournalCard({ entry, index, onPress, onLongPress, color }: {
  entry: JournalEntry; index: number;
  onPress: (e: JournalEntry) => void;
  onLongPress: (e: JournalEntry) => void;
  color: string;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <Pressable
        onPress={() => onPress(entry)}
        onLongPress={() => onLongPress(entry)}
        accessibilityLabel={entry.title}
      >
        <GlassCard gradient style={styles.entryCard} padding={14}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
            <Text style={styles.entryDate}>{formatDisplayDate(entry.createdAt.split('T')[0])}</Text>
          </View>
          <Text style={styles.entryPreview} numberOfLines={2}>{truncate(entry.content, 100)}</Text>
          <View style={styles.entryFooter}>
            <Text style={[styles.wordCount, { color }]}>{entry.wordCount} words</Text>
            {entry.isPinned && <Text style={styles.pinIcon}>📌</Text>}
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: DARK.bg },
  safe:         { flex: 1 },
  content:      { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  addBtn:       {},
  addBtnGrad:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  addBtnText:   { color: '#000', fontSize: 22, fontWeight: '900', marginTop: -2 },
  statsRow:     { flexDirection: 'row', justifyContent: 'space-around' },
  stat:         { alignItems: 'center', gap: 4 },
  statVal:      { fontSize: 22, fontWeight: '800' },
  statLabel:    { color: TEXT.muted, fontSize: 11, fontWeight: '600' },
  sectionLabel: { color: TEXT.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase' },
  emptyTitle:   { color: TEXT.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText:    { color: TEXT.muted, fontSize: 14, lineHeight: 20 },
  entryCard:    { marginBottom: 2 },
  entryHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  entryTitle:   { color: TEXT.primary, fontSize: 15, fontWeight: '700', flex: 1 },
  entryDate:    { color: TEXT.muted, fontSize: 11 },
  entryPreview: { color: TEXT.secondary, fontSize: 13, lineHeight: 18 },
  entryFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  wordCount:    { fontSize: 11, fontWeight: '600' },
  pinIcon:      { fontSize: 12 },
  editor:       { gap: 14, flex: 1 },
  contentInput: {
    color: TEXT.primary, fontSize: 15, lineHeight: 24,
    borderWidth: 1.5, borderRadius: 14, padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 200, flex: 1,
  },
});
