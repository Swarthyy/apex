// APEX — Hero Card
// SR Streak + Vitality Score display
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';

interface HeroCardProps {
  srDay: number;
  vitalityScore: number;
}

export default function HeroCard({ srDay, vitalityScore }: HeroCardProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.card}>
      {/* Date */}
      <Text style={styles.date}>{dateStr}</Text>

      {/* Main row */}
      <View style={styles.row}>
        {/* SR Streak */}
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>SR STREAK</Text>
          <Text style={[styles.statValue, { color: Colors.accent }]}>
            Day {srDay}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Vitality */}
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>VITALITY</Text>
          <Text style={[styles.statValue, { color: Colors.gold }]}>
            {vitalityScore}
          </Text>
          <Text style={styles.statSub}>/100</Text>
        </View>
      </View>

      {/* Accent bar */}
      <View style={[styles.accentBar, { width: `${Math.min(srDay / 30 * 100, 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  date: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
  },
  statLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.xxl,
  },
  statSub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.muted,
    marginTop: -4,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  accentBar: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginTop: Spacing.lg,
  },
});
