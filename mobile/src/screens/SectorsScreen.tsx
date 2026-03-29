// ═══════════════════════════════════════════════════════════════════════════
// APEX — Sectors Screen
// Scrollable list of all 10 sectors, tap to drill into detail
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore } from '../stores/useApexStore';
import type { SectorsStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<SectorsStackParamList, 'SectorsList'>;

interface SectorDef {
  id: string;
  label: string;
  color: string;
  icon: string;
  description: string;
  inputType: 'passive' | 'active';
}

const SECTOR_DEFS: SectorDef[] = [
  { id: 'sr',        label: 'SR / Retention', color: '#c8f135', icon: '⬡', description: 'Semen retention streak tracker', inputType: 'active' },
  { id: 'sleep',     label: 'Sleep',          color: Colors.blue,   icon: '◑', description: 'Duration, quality, debt tracking', inputType: 'passive' },
  { id: 'energy',    label: 'Energy',         color: Colors.gold,   icon: '◈', description: 'Morning energy score (1-10)', inputType: 'active' },
  { id: 'gym',       label: 'Gym',            color: Colors.orange, icon: '◉', description: 'Volume, sessions, PRs via Hevy', inputType: 'passive' },
  { id: 'libido',    label: 'Libido',         color: Colors.pink,   icon: '◇', description: 'Daily libido score (1-10)', inputType: 'active' },
  { id: 'nutrition', label: 'Nutrition',      color: Colors.teal,   icon: '◎', description: 'Calories, macros, nutrient log', inputType: 'active' },
  { id: 'body',      label: 'Body Comp',      color: Colors.purple, icon: '◐', description: 'Weight, body fat % via Withings', inputType: 'passive' },
  { id: 'mood',      label: 'Mood',           color: Colors.amber,  icon: '◯', description: 'Daily mood score (1-10)', inputType: 'active' },
  { id: 'finances',  label: 'Finances',       color: '#00d4aa',     icon: '◻', description: 'Net cash flow, expenses, savings rate', inputType: 'active' },
  { id: 'business',  label: 'Business',       color: Colors.blue,   icon: '◼', description: 'Focus score, projects, calendar', inputType: 'active' },
];

function SectorRow({ def, value, sub }: { def: SectorDef; value: string; sub: string }) {
  const navigation = useNavigation<Nav>();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('SectorDetail', { sectorId: def.id });
      }}
      activeOpacity={0.7}
    >
      {/* Color bar */}
      <View style={[styles.colorBar, { backgroundColor: def.color }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { borderColor: def.color + '40' }]}>
        <Text style={[styles.icon, { color: def.color }]}>{def.icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{def.label}</Text>
        <Text style={styles.rowDesc}>{def.description}</Text>
      </View>

      {/* Value */}
      <View style={styles.rowValue}>
        <Text style={[styles.valueText, { color: def.color }]}>{value}</Text>
        <Text style={styles.valueSub}>{sub}</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function SectorsScreen() {
  const profile = useApexStore(s => s.profile);
  const getTodayCheckin = useApexStore(s => s.getTodayCheckin);
  const getMeals = useApexStore(s => s.getMeals);

  const checkin = getTodayCheckin();
  const today = new Date().toISOString().split('T')[0];
  const meals = getMeals(today);
  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0);

  function getSectorValue(id: string): { value: string; sub: string } {
    switch (id) {
      case 'sr':
        return { value: `Day ${profile.srDay}`, sub: 'streak' };
      case 'energy':
        return checkin ? { value: `${checkin.energy}`, sub: '/10' } : { value: '—', sub: 'log check-in' };
      case 'mood':
        return checkin ? { value: `${checkin.mood}`, sub: '/10' } : { value: '—', sub: 'log check-in' };
      case 'libido':
        return checkin ? { value: `${checkin.libido}`, sub: '/10' } : { value: '—', sub: 'log check-in' };
      case 'nutrition':
        return totalCals > 0 ? { value: `${totalCals}`, sub: 'kcal today' } : { value: '—', sub: 'log meals' };
      case 'sleep':
        return { value: '—', sub: 'connect Apple Health' };
      case 'gym':
        return { value: '—', sub: 'connect Hevy' };
      case 'body':
        return { value: '—', sub: 'connect Withings' };
      case 'finances':
        return { value: '—', sub: 'log manually' };
      case 'business':
        return { value: '—', sub: 'log manually' };
      default:
        return { value: '—', sub: '' };
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sectors</Text>
        <Text style={styles.sub}>
          Vitality{' '}
          <Text style={styles.vitalityNum}>{profile.vitalityScore}</Text>
          <Text style={styles.sub}>/100</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SECTOR_DEFS.map(def => {
          const { value, sub } = getSectorValue(def.id);
          return <SectorRow key={def.id} def={def} value={value} sub={sub} />;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  sub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },
  vitalityNum: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.base,
    color: Colors.accent,
  },
  scroll: { flex: 1 },
  content: { paddingVertical: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  icon: {
    fontSize: 18,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  rowDesc: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  rowValue: { alignItems: 'flex-end' },
  valueText: {
    fontFamily: Fonts.heading,
    fontWeight: '800',
    fontSize: FontSizes.md,
  },
  valueSub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: 1,
  },
  arrow: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.muted,
  },
});
