// APEX — Next Up Gym Card
// Consumes getNextSession() from splitEngine
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius, MIN_TAP_SIZE } from '../theme';
import { NextSession } from '../utils/splitEngine';
import SplitPills from './SplitPills';
import { useApexStore } from '../stores/useApexStore';

export default function NextUpGymCard() {
  const nextSession = useApexStore(s => s.nextSession);
  const splitProgress = useApexStore(s => s.splitProgress);

  if (nextSession.empty) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>NEXT UP • GYM</Text>
        <Text style={styles.emptyText}>No split configured yet</Text>
      </View>
    );
  }

  if (nextSession.isRest) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>NEXT UP • GYM</Text>
        <Text style={styles.restBadge}>REST DAY</Text>
        {nextSession.nextAfterRest && (
          <Text style={styles.thenText}>
            Then: {nextSession.nextAfterRest.label}
          </Text>
        )}
        <View style={styles.pillsWrap}>
          <SplitPills rotation={splitProgress.rotation} currentIndex={splitProgress.currentIndex} />
        </View>
      </View>
    );
  }

  const partnerText = nextSession.partner?.name
    ? `with ${nextSession.partner.name}`
    : 'Solo session';

  const handleOpenHevy = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://hevy.com');
  };

  // Days since last session of this type
  let daysSinceText = '';
  if (nextSession.lastSession && nextSession.lastSession.length > 0) {
    const last = nextSession.lastSession[0];
    const daysAgo = Math.round((Date.now() - last.date.getTime()) / 86400000);
    daysSinceText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>NEXT UP • GYM</Text>

      {/* Session Name */}
      <Text style={styles.sessionName}>{nextSession.label}</Text>

      {/* Partner */}
      <Text style={styles.partner}>{partnerText}</Text>

      {/* Muscle tags */}
      {nextSession.muscles && (
        <View style={styles.muscleRow}>
          {nextSession.muscles.map(m => (
            <View key={m} style={styles.muscleTag}>
              <Text style={styles.muscleText}>{m}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Focus suggestion */}
      {nextSession.focus && (
        <View style={styles.focusWrap}>
          <Text style={styles.focusText}>→ {nextSession.focus.text}</Text>
        </View>
      )}

      {/* Last session */}
      {daysSinceText ? (
        <Text style={styles.lastSession}>Last {nextSession.label}: {daysSinceText}</Text>
      ) : null}

      {/* Split pills */}
      <View style={styles.pillsWrap}>
        <SplitPills rotation={splitProgress.rotation} currentIndex={splitProgress.currentIndex} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleOpenHevy}
          activeOpacity={0.8}
        >
          <Text style={styles.btnPrimaryText}>Open in Hevy →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.orange,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  sessionName: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.xl,
    color: Colors.orange,
    marginBottom: Spacing.xs,
  },
  partner: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.text2,
    marginBottom: Spacing.md,
  },
  muscleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  muscleTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 122, 47, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 47, 0.3)',
    borderRadius: Radius.sm,
  },
  muscleText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.orange,
    fontWeight: '600',
  },
  focusWrap: {
    backgroundColor: 'rgba(200, 241, 53, 0.08)',
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  focusText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '600',
  },
  lastSession: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  pillsWrap: {
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: Colors.orange,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    minHeight: MIN_TAP_SIZE,
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.sm,
    color: Colors.bg,
  },
  restBadge: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.lg,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  thenText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },
});
