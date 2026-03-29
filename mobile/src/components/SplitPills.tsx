// APEX — Split Progress Pills
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { SplitSlot } from '../utils/splitEngine';

interface SplitPillsProps {
  rotation: SplitSlot[];
  currentIndex: number;
}

export default function SplitPills({ rotation, currentIndex }: SplitPillsProps) {
  if (!rotation || rotation.length === 0) return null;

  return (
    <View style={styles.row}>
      {rotation.map((slot, i) => {
        const isCurrent = i === currentIndex;
        const isDone = i < currentIndex;

        return (
          <View
            key={slot.id}
            style={[
              styles.pill,
              isCurrent && styles.pillCurrent,
              isDone && styles.pillDone,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                isCurrent && styles.pillTextCurrent,
                isDone && styles.pillTextDone,
              ]}
            >
              {slot.label}
              {isDone ? ' ✓' : isCurrent ? ' →' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillCurrent: {
    borderColor: Colors.orange,
    backgroundColor: 'rgba(255, 122, 47, 0.15)',
  },
  pillDone: {
    borderColor: Colors.muted2,
    opacity: 0.6,
  },
  pillText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
  },
  pillTextCurrent: {
    color: Colors.orange,
    fontWeight: '700',
  },
  pillTextDone: {
    color: Colors.muted,
  },
});
