// ═══════════════════════════════════════════════════════════════════════════
// APEX — History Screen
// Month calendar view coloured by Vitality Score + day detail panel
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore, vitalityColor, type DailyCheckin } from '../stores/useApexStore';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const startPad = (firstDay + 6) % 7; // shift so Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function calcVitalityFromCheckin(c: DailyCheckin): number {
  const srMod = Math.min(c.srDay / 30, 1) * 10;
  const weighted = c.energy * 0.25 + c.mood * 0.20 + c.libido * 0.20 + srMod * 0.15;
  return Math.max(0, Math.min(100, Math.round((weighted / 0.80) * 10)));
}

interface DayDetailProps {
  dateKey: string;
  checkin: DailyCheckin | null;
  onClose: () => void;
}

function DayDetail({ dateKey, checkin, onClose }: DayDetailProps) {
  const d = new Date(dateKey + 'T00:00:00');
  const label = d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const vitality = checkin ? calcVitalityFromCheckin(checkin) : 0;
  const color = vitalityColor(vitality);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={detail.container} edges={['top', 'bottom']}>
        <View style={detail.header}>
          <View>
            <Text style={detail.dateLabel}>{label}</Text>
            {checkin ? (
              <Text style={[detail.vitality, { color }]}>Vitality {vitality}</Text>
            ) : (
              <Text style={detail.noData}>No check-in recorded</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={detail.closeBtn}>
            <Text style={detail.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {checkin ? (
          <ScrollView contentContainerStyle={detail.content}>
            <Text style={detail.sectionLabel}>METRICS</Text>
            {[
              { label: 'Energy', value: `${checkin.energy}/10`, color: Colors.gold },
              { label: 'Mood', value: `${checkin.mood}/10`, color: Colors.amber },
              { label: 'Libido', value: `${checkin.libido}/10`, color: Colors.pink },
              { label: 'SR Day', value: `Day ${checkin.srDay}`, color: Colors.accent },
            ].map((row) => (
              <View key={row.label} style={detail.metricRow}>
                <Text style={detail.metricLabel}>{row.label}</Text>
                <Text style={[detail.metricValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}

            {checkin.notes ? (
              <>
                <Text style={[detail.sectionLabel, { marginTop: Spacing.xl }]}>NOTES</Text>
                <View style={detail.notesCard}>
                  <Text style={detail.notesText}>{checkin.notes}</Text>
                </View>
              </>
            ) : null}

            <Text style={[detail.sectionLabel, { marginTop: Spacing.xl }]}>APEX ANALYSIS</Text>
            <View style={[detail.analysisCard, { borderLeftColor: color }]}>
              <Text style={detail.analysisText}>
                {vitality >= 80
                  ? `Excellent day — vitality at ${vitality}/100. All sectors performing above baseline.`
                  : vitality >= 60
                  ? `Good day at ${vitality}/100. Solid across tracked sectors.`
                  : vitality >= 40
                  ? `Average day — ${vitality}/100. Some sectors below baseline.`
                  : `Below average at ${vitality}/100. Review energy, mood, and SR streak.`}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <View style={detail.emptyState}>
            <Text style={detail.emptyIcon}>◷</Text>
            <Text style={detail.emptyTitle}>No data for this day</Text>
            <Text style={detail.emptySub}>Complete your morning check-in each day to build your history.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const detail = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateLabel: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.base, color: Colors.text },
  vitality: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.xl, marginTop: Spacing.xs },
  noData: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.muted, marginTop: Spacing.xs },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: Fonts.heading, fontSize: FontSizes.base, color: Colors.muted },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.text2 },
  metricValue: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.base },
  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  notesText: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.text, lineHeight: 18 },
  analysisCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    padding: Spacing.md,
  },
  analysisText: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.text, lineHeight: 18 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  emptyIcon: { fontSize: 48, color: Colors.muted, marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md, color: Colors.text, marginBottom: Spacing.sm },
  emptySub: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
});

export default function HistoryScreen() {
  const checkins = useApexStore(s => s.checkins);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const cells = getMonthCells(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const monthCheckins = Object.entries(checkins)
    .filter(([k]) => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .map(([, v]) => v);

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;

  const avgEnergy = avg(monthCheckins.map(c => c.energy));
  const avgMood = avg(monthCheckins.map(c => c.mood));
  const avgLibido = avg(monthCheckins.map(c => c.libido));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.sub}>{monthCheckins.length} days logged</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map((d, i) => (
            <Text key={i} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`e${i}`} style={styles.cellEmpty} />;
            const key = formatDateKey(year, month, day);
            const checkin = checkins[key] ?? null;
            const vitality = checkin ? calcVitalityFromCheckin(checkin) : 0;
            const bgColor = checkin ? vitalityColor(vitality) + '99' : Colors.surface;
            const isToday = key === todayKey;

            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, { backgroundColor: bgColor }, isToday && styles.cellToday]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDay(key);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.cellDay, isToday && styles.cellDayToday]}>{day}</Text>
                {checkin ? <Text style={styles.cellScore}>{vitality}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vitality legend */}
        <View style={styles.legend}>
          {[
            { label: '1-20', color: '#500808' },
            { label: '21-40', color: '#c03020' },
            { label: '41-60', color: '#e09020' },
            { label: '61-80', color: '#52b030' },
            { label: '81+', color: '#c8f135' },
          ].map(item => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Monthly averages */}
        {monthCheckins.length > 0 ? (
          <View style={styles.avgSection}>
            <Text style={styles.sectionLabel}>MONTH AVERAGES</Text>
            {[
              { label: 'Energy', value: avgEnergy, color: Colors.gold },
              { label: 'Mood', value: avgMood, color: Colors.amber },
              { label: 'Libido', value: avgLibido, color: Colors.pink },
            ].map(row => (
              <View key={row.label} style={styles.avgRow}>
                <Text style={styles.avgLabel}>{row.label}</Text>
                <View style={styles.avgBarTrack}>
                  <View style={[styles.avgBarFill, { width: `${row.value * 10}%`, backgroundColor: row.color }]} />
                </View>
                <Text style={[styles.avgValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No check-ins recorded this month. Complete your morning check-in daily to build your history.
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedDay && (
        <DayDetail
          dateKey={selectedDay}
          checkin={checkins[selectedDay] ?? null}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </SafeAreaView>
  );
}

const CELL_SIZE = 46;

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
  title: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.lg, color: Colors.text },
  sub: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontFamily: Fonts.heading, fontSize: FontSizes.xl, color: Colors.text },
  monthLabel: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md, color: Colors.text },
  dayHeaders: { flexDirection: 'row', marginBottom: Spacing.xs },
  dayHeader: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginHorizontal: 1,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.lg },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cellEmpty: { width: CELL_SIZE, height: CELL_SIZE, margin: 1 },
  cellToday: { borderWidth: 2, borderColor: Colors.text },
  cellDay: { fontFamily: Fonts.heading, fontWeight: '600', fontSize: FontSizes.xs, color: Colors.text, lineHeight: 14 },
  cellDayToday: { color: Colors.accent },
  cellScore: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.text, lineHeight: 10 },
  legend: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  avgSection: { marginTop: Spacing.sm },
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avgLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, width: 48 },
  avgBarTrack: { flex: 1, height: 6, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' },
  avgBarFill: { height: '100%', borderRadius: 3 },
  avgValue: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.xs, width: 28, textAlign: 'right' },
  emptyState: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
});
