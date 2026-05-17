import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { NeonInput } from '../ui/NeonInput';
import { NeonButton } from '../ui/NeonButton';
import { useTheme } from '../../hooks/useTheme';
import { TEXT, NEON } from '../../constants/colors';
import { Habit, HabitCategory } from '../../types/habit.types';
import { uid } from '../../utils/formatters';

const ICONS   = ['⚡','💪','🧘','📚','🏃','🥗','💧','🎯','🎨','🎵','🛌','🧠'];
const COLORS  = Object.values(NEON);
const CATS: { key: HabitCategory; label: string }[] = [
  { key: 'health',  label: '❤️ Health'   },
  { key: 'mind',    label: '🧠 Mind'     },
  { key: 'fitness', label: '💪 Fitness'  },
  { key: 'learn',   label: '📚 Learn'    },
  { key: 'social',  label: '🤝 Social'   },
  { key: 'custom',  label: '✨ Custom'   },
];

interface HabitFormProps {
  initial?:  Partial<Habit>;
  onSave:    (data: Omit<Habit, 'id' | 'createdAt'>) => void;
  onCancel:  () => void;
}

export function HabitForm({ initial, onSave, onCancel }: HabitFormProps) {
  const { primary } = useTheme();
  const [title,    setTitle]    = useState(initial?.title    ?? '');
  const [desc,     setDesc]     = useState(initial?.description ?? '');
  const [icon,     setIcon]     = useState(initial?.icon     ?? '⚡');
  const [color,    setColor]    = useState(initial?.color    ?? NEON.cyan);
  const [category, setCategory] = useState<HabitCategory>(initial?.category ?? 'health');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(), description: desc.trim(),
      icon, color, category,
      frequency: 'daily', targetDays: [],
      xpReward: 10,
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      <NeonInput
        label="Habit Name"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Morning Meditation"
        containerStyle={styles.field}
      />
      <NeonInput
        label="Description (optional)"
        value={desc}
        onChangeText={setDesc}
        placeholder="What does this habit mean to you?"
        containerStyle={styles.field}
        multiline
      />

      <Text style={styles.label}>Choose Icon</Text>
      <View style={styles.row}>
        {ICONS.map((ic) => (
          <Pressable
            key={ic}
            onPress={() => setIcon(ic)}
            style={[styles.iconPill, icon === ic && { borderColor: primary, backgroundColor: primary + '22' }]}
          >
            <Text style={styles.iconText}>{ic}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Neon Color</Text>
      <View style={styles.row}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              color === c && styles.colorSelected,
            ]}
          />
        ))}
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {CATS.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => setCategory(cat.key)}
            style={[styles.catPill, category === cat.key && { borderColor: primary, backgroundColor: primary + '22' }]}
          >
            <Text style={styles.catText}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <NeonButton label="Cancel" onPress={onCancel} variant="ghost" style={{ flex: 1 }} />
        <NeonButton label="Save Habit" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:       { maxHeight: 500 },
  field:        { marginBottom: 16 },
  label:        { color: TEXT.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  row:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  iconPill:     { padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  iconText:     { fontSize: 20 },
  colorDot:     { width: 28, height: 28, borderRadius: 14 },
  colorSelected:{ transform: [{ scale: 1.3 }], borderWidth: 2, borderColor: '#fff' },
  catPill:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  catText:      { color: TEXT.secondary, fontSize: 12, fontWeight: '600' },
  actions:      { flexDirection: 'row', gap: 10, marginTop: 16 },
});
