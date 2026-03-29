// APEX — Sector Card (reusable tile for the carousel)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';

interface SectorCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  onPress?: () => void;
}

export default function SectorCard({ label, value, sub, color, onPress }: SectorCardProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Glow dot */}
      <View style={[styles.glowDot, { backgroundColor: color }]} />

      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.sub}>{sub}</Text>

      {/* Accent bar */}
      <View style={[styles.bar, { backgroundColor: color }]} />
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 150;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  glowDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.2,
  },
  label: {
    fontFamily: Fonts.heading,
    fontWeight: '600',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  value: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.lg,
    marginBottom: 2,
  },
  sub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.text2,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
});

export { CARD_WIDTH };
