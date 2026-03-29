// ═══════════════════════════════════════════════════════════════════════════
// APEX — Sector Detail Screen
// Per-sector focus view: stat tiles + trend bars + history log
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore } from '../stores/useApexStore';
import type { SectorsStackParamList } from '../navigation/types';

type Route = RouteProp<SectorsStackParamList, 'SectorDetail'>;

interface StatTile {
  label: string;
  value: string;
  sub?: string;
}

interface TrendBar {
  label: string;
  value: number; // 0-100 percent fill
  color: string;
  displayValue: string;
}

interface SectorConfig {
  label: string;
  color: string;
  icon: string;
  dataSource: string;
  tiles: StatTile[];
  trends: TrendBar[];
  notes?: string;
}

function buildConfig(
  sectorId: string,
  profile: { srDay: number; vitalityScore: number },
  checkin: { energy: number; mood: number; libido: number } | null,
  checkins: Record<string, { energy: number; mood: number; libido: number; srDay: number }>,
  totalCals: number,
  totalProtein: number,
): SectorConfig {
  const dates = Object.keys(checkins).sort().slice(-14);
  const recent = dates.map(d => checkins[d]);

  switch (sectorId) {
    case 'sr': {
      const avgEnergy = recent.length
        ? Math.round(recent.reduce((s, c) => s + c.energy, 0) / recent.length * 10) / 10
        : 0;
      return {
        label: 'SR / Retention',
        color: Colors.accent,
        icon: '⬡',
        dataSource: 'Manual — daily check-in',
        tiles: [
          { label: 'Current Streak', value: `Day ${profile.srDay}` },
          { label: 'Avg Energy on SR', value: avgEnergy > 0 ? `${avgEnergy}/10` : '—' },
          { label: 'Peak Zone', value: profile.srDay >= 7 ? 'Active' : 'Building', sub: 'Days 7-21' },
          { label: 'Vitality Impact', value: '+15%', sub: 'of score weighting' },
        ],
        trends: dates.map(d => ({
          label: d.slice(5),
          value: Math.min(checkins[d].srDay / 30, 1) * 100,
          color: Colors.accent,
          displayValue: `Day ${checkins[d].srDay}`,
        })),
        notes: profile.srDay >= 14
          ? 'You are in peak territory. Libido, gym output, and energy should be elevated.'
          : profile.srDay >= 7
          ? 'Approaching peak window. Watch for energy surge between days 7-14.'
          : 'Build the streak. First 7 days are the foundation.',
      };
    }

    case 'energy': {
      const avgE = recent.length
        ? Math.round(recent.reduce((s, c) => s + c.energy, 0) / recent.length * 10) / 10
        : 0;
      const maxE = recent.length ? Math.max(...recent.map(c => c.energy)) : 0;
      return {
        label: 'Energy',
        color: Colors.gold,
        icon: '◈',
        dataSource: 'Daily morning check-in',
        tiles: [
          { label: 'Today', value: checkin ? `${checkin.energy}/10` : '—' },
          { label: '14-Day Avg', value: avgE > 0 ? `${avgE}/10` : '—' },
          { label: '14-Day Peak', value: maxE > 0 ? `${maxE}/10` : '—' },
          { label: 'Score Weight', value: '25%', sub: 'of Vitality' },
        ],
        trends: dates.map(d => ({
          label: d.slice(5),
          value: checkins[d].energy * 10,
          color: Colors.gold,
          displayValue: `${checkins[d].energy}`,
        })),
      };
    }

    case 'mood': {
      const avgM = recent.length
        ? Math.round(recent.reduce((s, c) => s + c.mood, 0) / recent.length * 10) / 10
        : 0;
      return {
        label: 'Mood',
        color: Colors.amber,
        icon: '◯',
        dataSource: 'Daily morning check-in',
        tiles: [
          { label: 'Today', value: checkin ? `${checkin.mood}/10` : '—' },
          { label: '14-Day Avg', value: avgM > 0 ? `${avgM}/10` : '—' },
          { label: 'Best This Week', value: recent.slice(-7).length ? `${Math.max(...recent.slice(-7).map(c => c.mood))}/10` : '—' },
          { label: 'Score Weight', value: '20%', sub: 'of Vitality' },
        ],
        trends: dates.map(d => ({
          label: d.slice(5),
          value: checkins[d].mood * 10,
          color: Colors.amber,
          displayValue: `${checkins[d].mood}`,
        })),
        notes: 'Mood correlates strongly with sunlight exposure, liver intake, and social contact.',
      };
    }

    case 'libido': {
      const avgL = recent.length
        ? Math.round(recent.reduce((s, c) => s + c.libido, 0) / recent.length * 10) / 10
        : 0;
      return {
        label: 'Libido',
        color: Colors.pink,
        icon: '◇',
        dataSource: 'Daily morning check-in',
        tiles: [
          { label: 'Today', value: checkin ? `${checkin.libido}/10` : '—' },
          { label: '14-Day Avg', value: avgL > 0 ? `${avgL}/10` : '—' },
          { label: 'SR Correlation', value: profile.srDay >= 7 ? 'Elevated' : 'Building' },
          { label: 'Score Weight', value: '20%', sub: 'of Vitality' },
        ],
        trends: dates.map(d => ({
          label: d.slice(5),
          value: checkins[d].libido * 10,
          color: Colors.pink,
          displayValue: `${checkins[d].libido}`,
        })),
        notes: 'Libido tracks closely with SR streak day. Oysters and zinc are the top nutritional correlates.',
      };
    }

    case 'nutrition': {
      return {
        label: 'Nutrition',
        color: Colors.teal,
        icon: '◎',
        dataSource: 'Manual meal logging',
        tiles: [
          { label: 'Calories Today', value: totalCals > 0 ? `${totalCals} kcal` : '—' },
          { label: 'Protein', value: totalProtein > 0 ? `${totalProtein}g` : '—' },
          { label: 'Calorie Goal', value: '2,800 kcal', sub: 'default' },
          { label: 'Score Weight', value: 'Coming', sub: 'Phase 2' },
        ],
        trends: [],
        notes: 'Log meals in the Nutrition tab to build your feed and unlock nutrient insights.',
      };
    }

    case 'gym': {
      return {
        label: 'Gym',
        color: Colors.orange,
        icon: '◉',
        dataSource: 'Hevy API (Phase 2)',
        tiles: [
          { label: 'Sessions', value: '—', sub: 'connect Hevy' },
          { label: 'Volume Trend', value: '—' },
          { label: 'Last Session', value: '—' },
          { label: 'Current Split', value: 'PPL' },
        ],
        trends: [],
        notes: 'Connect Hevy in Phase 2 to automatically import workouts, volume trends, and PR history.',
      };
    }

    case 'sleep': {
      return {
        label: 'Sleep',
        color: Colors.blue,
        icon: '◑',
        dataSource: 'Apple Health (Phase 2)',
        tiles: [
          { label: 'Last Night', value: '—', sub: 'connect Apple Health' },
          { label: '7-Day Avg', value: '—' },
          { label: 'Sleep Debt', value: '—' },
          { label: 'Score Weight', value: '20%', sub: 'of Vitality' },
        ],
        trends: [],
        notes: 'Connect Apple Health in Phase 2 to import sleep duration, HRV, and sleep debt tracking.',
      };
    }

    case 'body': {
      return {
        label: 'Body Comp',
        color: Colors.purple,
        icon: '◐',
        dataSource: 'Withings (Phase 2)',
        tiles: [
          { label: 'Weight', value: '—', sub: 'connect Withings' },
          { label: 'Body Fat %', value: '—' },
          { label: '14-Day Delta', value: '—' },
          { label: 'Recomp Flag', value: '—' },
        ],
        trends: [],
        notes: 'Connect Withings in Phase 2 to track weight, body fat %, and detect recomp patterns.',
      };
    }

    case 'finances': {
      return {
        label: 'Finances',
        color: '#00d4aa',
        icon: '◻',
        dataSource: 'Manual — weekly review',
        tiles: [
          { label: 'Net Cash Flow', value: '—', sub: 'log manually' },
          { label: 'Savings Rate', value: '—' },
          { label: 'Expenses', value: '—' },
          { label: 'Income', value: '—' },
        ],
        trends: [],
        notes: 'Log your monthly finances manually to track net cash flow and savings rate over time.',
      };
    }

    case 'business': {
      return {
        label: 'Business',
        color: Colors.blue,
        icon: '◼',
        dataSource: 'Manual + Calendar',
        tiles: [
          { label: 'Focus Score', value: '—', sub: 'log daily' },
          { label: 'Active Projects', value: '—' },
          { label: 'Momentum', value: '—' },
          { label: 'Next Event', value: '—', sub: 'Google Cal Phase 2' },
        ],
        trends: [],
        notes: 'Log focus scores daily to track momentum. Google Calendar sync arrives in Phase 2.',
      };
    }

    default:
      return {
        label: sectorId,
        color: Colors.muted,
        icon: '●',
        dataSource: '—',
        tiles: [],
        trends: [],
      };
  }
}

export default function SectorDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { sectorId } = route.params;

  const profile = useApexStore(s => s.profile);
  const getTodayCheckin = useApexStore(s => s.getTodayCheckin);
  const checkins = useApexStore(s => s.checkins);
  const getMeals = useApexStore(s => s.getMeals);

  const checkin = getTodayCheckin();
  const today = new Date().toISOString().split('T')[0];
  const meals = getMeals(today);
  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);

  const config = buildConfig(sectorId, profile, checkin, checkins, totalCals, totalProtein);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: config.color + '40' }]}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Sectors</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
          <View>
            <Text style={[styles.title, { color: config.color }]}>{config.label}</Text>
            <Text style={styles.source}>{config.dataSource}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat tiles */}
        <View style={styles.tilesGrid}>
          {config.tiles.map((tile, i) => (
            <View key={i} style={[styles.tile, { borderTopColor: config.color }]}>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={[styles.tileValue, { color: config.color }]}>{tile.value}</Text>
              {tile.sub ? <Text style={styles.tileSub}>{tile.sub}</Text> : null}
            </View>
          ))}
        </View>

        {/* Trend bars (14-day history) */}
        {config.trends.length > 0 && (
          <View style={styles.trendSection}>
            <Text style={styles.sectionLabel}>14-DAY HISTORY</Text>
            <View style={styles.trendChart}>
              {config.trends.map((bar, i) => (
                <View key={i} style={styles.trendBarWrap}>
                  <Text style={styles.trendValue}>{bar.displayValue}</Text>
                  <View style={styles.trendBarTrack}>
                    <View
                      style={[
                        styles.trendBarFill,
                        { height: `${Math.max(bar.value, 4)}%`, backgroundColor: bar.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendLabel}>{bar.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes / insight */}
        {config.notes ? (
          <View style={[styles.notesCard, { borderLeftColor: config.color }]}>
            <Text style={styles.notesLabel}>APEX ANALYSIS</Text>
            <Text style={styles.notesText}>{config.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backArrow: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.muted,
    lineHeight: 22,
  },
  backText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: { fontSize: 28 },
  title: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.lg,
  },
  source: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tile: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderTopWidth: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  tileLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  tileValue: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.md,
  },
  tileSub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  trendSection: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  trendChart: {
    flexDirection: 'row',
    height: 100,
    gap: 4,
    alignItems: 'flex-end',
  },
  trendBarWrap: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendValue: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    marginBottom: 2,
  },
  trendBarTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.surface2,
    borderRadius: 2,
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  trendLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    marginTop: 3,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  notesLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.text,
    lineHeight: 18,
  },
});
