// ═══════════════════════════════════════════════════════════════════════════
// APEX — Home Screen
// Hero card + Morning Check-in CTA + Next Up Gym + Sector Carousel + Insights
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore, type ApexState } from '../stores/useApexStore';

import HeroCard from '../components/HeroCard';
import NextUpGymCard from '../components/NextUpGymCard';
import SectorCarousel from '../components/SectorCarousel';
import CheckInModal from '../components/CheckInModal';

interface InsightCardProps {
  type: 'positive' | 'warning' | 'info' | 'alert';
  text: string;
  sectors: string;
}

const INSIGHT_COLORS = {
  positive: Colors.accent,
  warning: Colors.orange,
  info: Colors.blue,
  alert: Colors.pink,
};

function InsightCard({ type, text, sectors }: InsightCardProps) {
  const color = INSIGHT_COLORS[type];
  return (
    <View style={[insightStyles.card, { borderLeftColor: color }]}>
      <Text style={insightStyles.text}>{text}</Text>
      <Text style={insightStyles.sectors}>{sectors}</Text>
    </View>
  );
}

const insightStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  text: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  sectors: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
});

function buildInsights(srDay: number, energy: number, mood: number, libido: number) {
  const insights: InsightCardProps[] = [];

  if (srDay === 0) {
    insights.push({
      type: 'info',
      text: 'Complete your morning check-in to start tracking your Vitality Score.',
      sectors: 'SR · Energy · Mood · Libido',
    });
    return insights;
  }

  if (srDay >= 7 && srDay < 14) {
    insights.push({
      type: 'positive',
      text: `Day ${srDay} of retention. Energy typically peaks between days 7-14. Watch for the surge.`,
      sectors: 'SR · Energy',
    });
  } else if (srDay >= 14) {
    insights.push({
      type: 'positive',
      text: `Day ${srDay} streak — you are in peak territory. Libido and gym output should be elevated.`,
      sectors: 'SR · Libido · Gym',
    });
  }

  if (energy <= 4) {
    insights.push({
      type: 'warning',
      text: 'Energy is low today. Consider sleep quality, meal timing, and training load.',
      sectors: 'Energy · Sleep · Gym',
    });
  }

  if (mood <= 4) {
    insights.push({
      type: 'warning',
      text: 'Mood is below baseline. Social contact, sunlight, and liver intake are correlated with recovery.',
      sectors: 'Mood · Nutrition',
    });
  }

  if (libido >= 8 && srDay >= 10) {
    insights.push({
      type: 'positive',
      text: `High libido + day ${srDay} streak — prime condition for intense training. Push volume today.`,
      sectors: 'Libido · SR · Gym',
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      text: 'Data looks stable. Keep logging daily to detect patterns across sectors.',
      sectors: 'All Sectors',
    });
  }

  return insights.slice(0, 3);
}

export default function HomeScreen() {
  const profile = useApexStore(s => s.profile);
  const getTodayCheckin = useApexStore(s => s.getTodayCheckin);
  const [modalVisible, setModalVisible] = useState(false);

  const todayCheckin = getTodayCheckin();
  const hasCheckedIn = todayCheckin !== null;

  const insights = buildInsights(
    profile.srDay,
    todayCheckin?.energy ?? 0,
    todayCheckin?.mood ?? 0,
    todayCheckin?.libido ?? 0,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoIcon}>◆</Text>
          <Text style={styles.logo}>APEX</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.section}>
          <HeroCard srDay={profile.srDay} vitalityScore={profile.vitalityScore} />
        </View>

        {/* Morning Check-In CTA */}
        <View style={styles.section}>
          {hasCheckedIn ? (
            <View style={styles.checkedInBadge}>
              <Text style={styles.checkedInIcon}>✓</Text>
              <View>
                <Text style={styles.checkedInTitle}>Check-in complete</Text>
                <Text style={styles.checkedInSub}>
                  Energy {todayCheckin!.energy} · Mood {todayCheckin!.mood} · Libido {todayCheckin!.libido}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setModalVisible(true);
                }}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>EDIT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.checkinCTA}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaIcon}>◆</Text>
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>Morning Check-In</Text>
                <Text style={styles.ctaSub}>Log energy · mood · libido · SR day</Text>
              </View>
              <Text style={styles.ctaArrow}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Next Up Gym */}
        <View style={styles.section}>
          <NextUpGymCard />
        </View>

        {/* Sector Carousel */}
        <SectorCarousel />

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INSIGHTS</Text>
          {insights.map((insight, i) => (
            <InsightCard key={i} {...insight} />
          ))}
        </View>
      </ScrollView>

      <CheckInModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logoIcon: {
    fontSize: 14,
    color: Colors.accent,
  },
  logo: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 2,
    color: Colors.accent,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xxxl },
  section: { paddingHorizontal: Spacing.xl },
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  checkinCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  ctaIcon: {
    fontSize: 20,
    color: Colors.accent,
  },
  ctaText: { flex: 1 },
  ctaTitle: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  ctaSub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  ctaArrow: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.accent,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  checkedInIcon: {
    fontSize: 18,
    color: Colors.accent,
    width: 24,
    textAlign: 'center',
  },
  checkedInTitle: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.sm,
    color: Colors.accent,
  },
  checkedInSub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: 1,
  },
  editBtn: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
  },
  editBtnText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 1,
  },
});
