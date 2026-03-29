// ═══════════════════════════════════════════════════════════════════════════
// APEX — Nutrition Screen
// Feed timeline + calorie progress + log meal modal
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore, type MealEntry, type MealType } from '../stores/useApexStore';

const CALORIE_GOAL = 2800;
const PROTEIN_GOAL = 200;

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: Colors.gold,
  lunch: Colors.teal,
  dinner: Colors.purple,
  snack: Colors.orange,
  supplement: Colors.blue,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  supplement: 'Supplement',
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'supplement'];

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function detectBonusChips(name: string): string[] {
  const n = name.toLowerCase();
  const chips: string[] = [];
  if (n.includes('liver')) { chips.push('+B12'); chips.push('+Vitamin A'); chips.push('+Iron'); }
  if (n.includes('oyster')) { chips.push('+Zinc'); chips.push('+Omega-3'); }
  if (n.includes('beef') || n.includes('steak')) { chips.push('+High Protein'); chips.push('+Sat Fat'); }
  if (n.includes('egg')) { chips.push('+Choline'); chips.push('+Fat-sol. Vitamins'); }
  if (n.includes('raw milk') || n.includes('milk')) { chips.push('+CLA'); chips.push('+Raw Enzymes'); }
  if (n.includes('salmon') || n.includes('fish')) { chips.push('+Omega-3'); }
  return chips;
}

// ─── Log Meal Modal ──────────────────────────────────────────────────────────

interface LogModalProps {
  visible: boolean;
  dateKey: string;
  onClose: () => void;
}

function LogMealModal({ visible, dateKey, onClose }: LogModalProps) {
  const addMeal = useApexStore(s => s.addMeal);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  const reset = () => {
    setName(''); setCalories(''); setProtein(''); setFat(''); setCarbs('');
    setMealType('lunch');
  };

  const handleSubmit = () => {
    if (!name.trim() || !calories) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMeal(dateKey, {
      mealType,
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      fat: parseInt(fat) || 0,
      carbs: parseInt(carbs) || 0,
      timestamp: new Date().toISOString(),
      bonusChips: detectBonusChips(name),
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modal.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={modal.header}>
            <Text style={modal.title}>Log Meal</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={modal.closeBtn}>
              <Text style={modal.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modal.content} keyboardShouldPersistTaps="handled">
            {/* Meal type selector */}
            <Text style={modal.label}>MEAL TYPE</Text>
            <View style={modal.typeRow}>
              {MEAL_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[modal.typeBtn, mealType === t && { backgroundColor: MEAL_COLORS[t] + '30', borderColor: MEAL_COLORS[t] }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMealType(t); }}
                >
                  <Text style={[modal.typeBtnText, mealType === t && { color: MEAL_COLORS[t] }]}>
                    {MEAL_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Food name */}
            <Text style={modal.label}>FOOD NAME</Text>
            <TextInput
              style={modal.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Grass-fed beef liver 150g"
              placeholderTextColor={Colors.muted}
            />

            {/* Macros grid */}
            <Text style={modal.label}>MACROS</Text>
            <View style={modal.macroGrid}>
              {[
                { label: 'Calories (kcal)', value: calories, set: setCalories, color: Colors.accent },
                { label: 'Protein (g)', value: protein, set: setProtein, color: Colors.teal },
                { label: 'Fat (g)', value: fat, set: setFat, color: Colors.gold },
                { label: 'Carbs (g)', value: carbs, set: setCarbs, color: Colors.orange },
              ].map(f => (
                <View key={f.label} style={modal.macroField}>
                  <Text style={[modal.macroLabel, { color: f.color }]}>{f.label}</Text>
                  <TextInput
                    style={modal.macroInput}
                    value={f.value}
                    onChangeText={f.set}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.muted}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[modal.submitBtn, !name.trim() && { opacity: 0.4 }]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={!name.trim()}
            >
              <Text style={modal.submitText}>ADD TO FEED</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.lg, color: Colors.text },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: Fonts.heading, fontSize: FontSizes.base, color: Colors.muted },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  label: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  typeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeBtnText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  macroField: { width: '48%' },
  macroLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 0.5, marginBottom: 4 },
  macroInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
  submitBtn: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  submitText: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.base, color: Colors.bg, letterSpacing: 2 },
});

// ─── Meal Card ───────────────────────────────────────────────────────────────

function MealCard({ meal, onDelete }: { meal: MealEntry; onDelete: () => void }) {
  const color = MEAL_COLORS[meal.mealType];
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={card.wrap}>
      {/* Timeline dot */}
      <View style={card.timelineCol}>
        <View style={[card.dot, { backgroundColor: color }]} />
        <View style={card.line} />
      </View>

      <View style={card.body}>
        {/* Header row */}
        <View style={card.header}>
          <View style={[card.tag, { backgroundColor: color + '30', borderColor: color + '60' }]}>
            <Text style={[card.tagText, { color }]}>{MEAL_LABELS[meal.mealType]}</Text>
          </View>
          <Text style={card.time}>{formatTime(meal.timestamp)}</Text>
        </View>

        {/* Meal name + calories */}
        <View style={card.nameRow}>
          <Text style={card.name}>{meal.name}</Text>
          <Text style={card.calories}>{meal.calories} kcal</Text>
        </View>

        {/* Macro bars */}
        <View style={card.macroRow}>
          {[
            { label: 'P', value: meal.protein, max: PROTEIN_GOAL, color: Colors.teal },
            { label: 'F', value: meal.fat, max: 100, color: Colors.gold },
            { label: 'C', value: meal.carbs, max: 200, color: Colors.orange },
          ].map(m => (
            <View key={m.label} style={card.macroPill}>
              <Text style={[card.macroLabel, { color: m.color }]}>{m.label}</Text>
              <View style={card.macroTrack}>
                <View style={[card.macroFill, { width: `${Math.min(m.value / m.max, 1) * 100}%`, backgroundColor: m.color }]} />
              </View>
              <Text style={card.macroValue}>{m.value}g</Text>
            </View>
          ))}
        </View>

        {/* Bonus chips */}
        {meal.bonusChips && meal.bonusChips.length > 0 && (
          <View style={card.chips}>
            {meal.bonusChips.map(chip => (
              <View key={chip} style={card.chip}>
                <Text style={card.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expand / delete */}
        <View style={card.actions}>
          <TouchableOpacity onPress={() => setExpanded(e => !e)} style={card.actionBtn}>
            <Text style={card.actionText}>{expanded ? 'LESS' : 'DETAILS'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={card.actionBtn}>
            <Text style={[card.actionText, { color: Colors.red + '80' }]}>REMOVE</Text>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View style={card.expanded}>
            <Text style={card.expandedText}>
              {meal.calories} kcal · {meal.protein}g protein · {meal.fat}g fat · {meal.carbs}g carbs
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: { flexDirection: 'row', marginBottom: Spacing.sm },
  timelineCol: { width: 24, alignItems: 'center', paddingTop: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  line: { flex: 1, width: 1, backgroundColor: Colors.border, marginTop: 2 },
  body: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginLeft: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs },
  time: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.sm },
  name: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.base, color: Colors.text, flex: 1 },
  calories: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.md, color: Colors.accent },
  macroRow: { gap: Spacing.xs, marginBottom: Spacing.sm },
  macroPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  macroLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, width: 12 },
  macroTrack: { flex: 1, height: 4, backgroundColor: Colors.surface2, borderRadius: 2, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 2, minWidth: 2 },
  macroValue: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, width: 36, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.xs },
  chip: {
    backgroundColor: Colors.accent + '20',
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.accent },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  actionBtn: { paddingVertical: Spacing.xs },
  actionText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, letterSpacing: 1 },
  expanded: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
  },
  expandedText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.text2 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const addMeal = useApexStore(s => s.addMeal);
  const getMeals = useApexStore(s => s.getMeals);
  const deleteMeal = useApexStore(s => s.deleteMeal);

  // avoid unused var warning
  void addMeal;

  const [dayOffset, setDayOffset] = useState(0);
  const [logModalVisible, setLogModalVisible] = useState(false);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const dateKey = formatDateKey(targetDate);

  const dayLabel = dayOffset === 0 ? 'Today'
    : dayOffset === -1 ? 'Yesterday'
    : `${Math.abs(dayOffset)} days ago`;

  const meals = getMeals(dateKey);
  const totalCals = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);

  const calPct = Math.min(totalCals / CALORIE_GOAL, 1);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const mealsBeforeNow = meals.filter(m => {
    const t = new Date(m.timestamp);
    return t.getHours() * 60 + t.getMinutes() <= nowMinutes;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with day nav */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDayOffset(d => d - 1); }}
          style={styles.navBtn}
        >
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <Text style={styles.dateStr}>
            {targetDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (dayOffset < 0) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDayOffset(d => d + 1);
            }
          }}
          style={[styles.navBtn, dayOffset >= 0 && styles.navBtnDisabled]}
        >
          <Text style={[styles.navArrow, dayOffset >= 0 && { color: Colors.muted }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Calorie progress bar */}
      <View style={styles.calorieBar}>
        <View style={[styles.calorieBarFill, { width: `${calPct * 100}%` }]} />
      </View>

      {/* Macro summary pills */}
      <View style={styles.macroPills}>
        {[
          { label: 'KCAL', value: `${totalCals}`, color: Colors.accent, goal: CALORIE_GOAL },
          { label: 'PRO', value: `${totalProtein}g`, color: Colors.teal, goal: PROTEIN_GOAL },
          { label: 'FAT', value: `${totalFat}g`, color: Colors.gold, goal: null },
          { label: 'CHO', value: `${totalCarbs}g`, color: Colors.orange, goal: null },
        ].map(p => (
          <View key={p.label} style={styles.pill}>
            <Text style={[styles.pillLabel, { color: p.color }]}>{p.label}</Text>
            <Text style={styles.pillValue}>{p.value}</Text>
            {p.goal ? <Text style={styles.pillGoal}>/ {p.goal}</Text> : null}
          </View>
        ))}
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽</Text>
            <Text style={styles.emptyTitle}>No meals logged {dayLabel.toLowerCase()}</Text>
            <Text style={styles.emptySub}>Tap + Log Meal to add your first entry.</Text>
          </View>
        ) : (
          <>
            {mealsBeforeNow.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                onDelete={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  deleteMeal(dateKey, meal.id);
                }}
              />
            ))}

            {/* NOW marker (only for today) */}
            {dayOffset === 0 && (
              <View style={styles.nowMarker}>
                <View style={styles.nowDot} />
                <Text style={styles.nowText}>NOW</Text>
                <View style={styles.nowLine} />
              </View>
            )}

            {/* Meals after NOW */}
            {dayOffset === 0 && meals.filter(m => {
              const t = new Date(m.timestamp);
              return t.getHours() * 60 + t.getMinutes() > nowMinutes;
            }).map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                onDelete={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  deleteMeal(dateKey, meal.id);
                }}
              />
            ))}
          </>
        )}

        {/* Remaining calories */}
        {totalCals < CALORIE_GOAL && (
          <View style={styles.remainCard}>
            <Text style={styles.remainText}>
              {CALORIE_GOAL - totalCals} kcal remaining to hit goal
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {dayOffset === 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLogModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+ Log Meal</Text>
        </TouchableOpacity>
      )}

      <LogMealModal
        visible={logModalVisible}
        dateKey={dateKey}
        onClose={() => setLogModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navArrow: { fontFamily: Fonts.heading, fontSize: FontSizes.xl, color: Colors.text },
  headerCenter: { alignItems: 'center' },
  dayLabel: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.md, color: Colors.text },
  dateStr: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, marginTop: 2 },
  calorieBar: {
    height: 3,
    backgroundColor: Colors.surface2,
    overflow: 'hidden',
  },
  calorieBarFill: {
    height: '100%',
    backgroundColor: Colors.teal,
  },
  macroPills: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  pill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
    alignItems: 'center',
  },
  pillLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1, marginBottom: 1 },
  pillValue: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.sm, color: Colors.text },
  pillGoal: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted },
  scroll: { flex: 1 },
  feedContent: { padding: Spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md, color: Colors.text, marginBottom: Spacing.sm },
  emptySub: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.muted },
  nowMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.red,
  },
  nowText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.red, letterSpacing: 1 },
  nowLine: { flex: 1, height: 1, backgroundColor: Colors.red + '40' },
  remainCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  remainText: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.muted },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  fabText: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.base, color: Colors.bg, letterSpacing: 1 },
});
