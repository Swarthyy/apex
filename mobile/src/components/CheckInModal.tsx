// ═══════════════════════════════════════════════════════════════════════════
// APEX — Morning Check-In Modal
// Energy / Mood / Libido sliders (1-10 button rows) + SR day
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore } from '../stores/useApexStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface ScoreRowProps {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}

function ScoreRow({ label, color, value, onChange }: ScoreRowProps) {
  return (
    <View style={scoreStyles.wrap}>
      <View style={scoreStyles.header}>
        <Text style={scoreStyles.label}>{label}</Text>
        <Text style={[scoreStyles.value, { color }]}>{value}</Text>
      </View>
      <View style={scoreStyles.row}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const active = n <= value;
          return (
            <TouchableOpacity
              key={n}
              style={[
                scoreStyles.btn,
                active && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(n);
              }}
              activeOpacity={0.7}
            >
              <Text style={[scoreStyles.btnText, active && { color: Colors.bg }]}>
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    color: Colors.muted,
  },
  value: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.lg,
  },
  row: { flexDirection: 'row', gap: Spacing.xs },
  btn: {
    flex: 1,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
  },
});

export default function CheckInModal({ visible, onClose }: Props) {
  const profile = useApexStore(s => s.profile);
  const submitCheckin = useApexStore(s => s.submitCheckin);

  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState(7);
  const [libido, setLibido] = useState(7);
  const [srDay, setSrDay] = useState(profile.srDay + 1);
  const [notes, setNotes] = useState('');

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    submitCheckin({ energy, mood, libido, srDay, notes: notes || undefined });
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Morning Check-In</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* SR Day */}
            <View style={styles.srCard}>
              <View style={styles.srRow}>
                <View>
                  <Text style={styles.srLabel}>SR STREAK</Text>
                  <Text style={styles.srValue}>Day {srDay}</Text>
                </View>
                <View style={styles.srButtons}>
                  <TouchableOpacity
                    style={styles.srResetBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSrDay(0);
                    }}
                  >
                    <Text style={styles.srResetText}>RESET</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.srIncrBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSrDay(d => d + 1);
                    }}
                  >
                    <Text style={styles.srIncrText}>+1</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.srBar, { width: `${Math.min(srDay / 30 * 100, 100)}%` }]} />
            </View>

            {/* Score Rows */}
            <ScoreRow label="ENERGY" color={Colors.gold} value={energy} onChange={setEnergy} />
            <ScoreRow label="MOOD" color={Colors.amber} value={mood} onChange={setMood} />
            <ScoreRow label="LIBIDO" color={Colors.pink} value={libido} onChange={setLibido} />

            {/* Notes */}
            <View style={styles.notesWrap}>
              <Text style={styles.notesLabel}>NOTES (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="How are you feeling today?"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.submitText}>LOG CHECK-IN</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  date: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.muted,
  },
  scroll: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  srCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  srRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  srLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    color: Colors.muted,
    marginBottom: 2,
  },
  srValue: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.xl,
    color: Colors.accent,
  },
  srButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  srResetBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.red + '60',
    borderRadius: Radius.full,
  },
  srResetText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.red,
    letterSpacing: 1,
  },
  srIncrBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.accent + '20',
    borderWidth: 1,
    borderColor: Colors.accent + '60',
    borderRadius: Radius.full,
  },
  srIncrText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.accent,
    letterSpacing: 1,
  },
  srBar: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  notesWrap: {
    marginBottom: Spacing.xl,
  },
  notesLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitText: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.base,
    color: Colors.bg,
    letterSpacing: 2,
  },
});
