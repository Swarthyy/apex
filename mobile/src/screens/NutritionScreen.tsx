// ═══════════════════════════════════════════════════════════════════════════
// APEX — Nutrition Intelligence Screen
// Feed timeline · Log Wizard · Animated progress · Clipboard export
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore, type MealEntry, type MealType } from '../stores/useApexStore';

const CALORIE_GOAL = 2800;
const PROTEIN_GOAL = 200;

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Food Intelligence ────────────────────────────────────────────────────────

interface FoodEstimate {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  suggestedType: MealType;
  detectedIngredients: string[];
}

// Per-100g reference values for common ancestral foods
const FOOD_DB: Array<{ keys: string[]; per100: { cal: number; p: number; f: number; c: number }; type: MealType; ingredients: string[] }> = [
  { keys: ['beef liver', 'liver'], per100: { cal: 175, p: 27, f: 5, c: 4 }, type: 'lunch', ingredients: ['liver'] },
  { keys: ['oysters', 'oyster'], per100: { cal: 68, p: 8, f: 2, c: 4 }, type: 'snack', ingredients: ['oysters'] },
  { keys: ['raw milk', 'raw whole milk'], per100: { cal: 64, p: 3, f: 4, c: 5 }, type: 'snack', ingredients: ['raw milk'] },
  { keys: ['grass-fed beef', 'ribeye', 'steak', 'beef'], per100: { cal: 250, p: 26, f: 17, c: 0 }, type: 'dinner', ingredients: ['beef'] },
  { keys: ['ground beef', 'mince'], per100: { cal: 215, p: 22, f: 14, c: 0 }, type: 'lunch', ingredients: ['beef'] },
  { keys: ['egg', 'eggs', 'scrambled eggs', 'fried eggs'], per100: { cal: 147, p: 10, f: 11, c: 1 }, type: 'breakfast', ingredients: ['eggs'] },
  { keys: ['salmon', 'atlantic salmon'], per100: { cal: 208, p: 20, f: 13, c: 0 }, type: 'dinner', ingredients: ['salmon'] },
  { keys: ['chicken', 'chicken breast', 'chicken thigh'], per100: { cal: 165, p: 31, f: 4, c: 0 }, type: 'lunch', ingredients: ['chicken'] },
  { keys: ['bone broth', 'beef broth'], per100: { cal: 31, p: 6, f: 1, c: 0 }, type: 'snack', ingredients: ['bone broth'] },
  { keys: ['butter', 'grass-fed butter'], per100: { cal: 717, p: 1, f: 81, c: 0 }, type: 'breakfast', ingredients: ['butter'] },
  { keys: ['whey protein', 'protein shake', 'protein'], per100: { cal: 120, p: 25, f: 2, c: 3 }, type: 'supplement', ingredients: [] },
  { keys: ['creatine'], per100: { cal: 0, p: 0, f: 0, c: 0 }, type: 'supplement', ingredients: [] },
  { keys: ['sweet potato', 'potato'], per100: { cal: 86, p: 2, f: 0, c: 20 }, type: 'lunch', ingredients: [] },
  { keys: ['rice', 'white rice'], per100: { cal: 130, p: 3, f: 0, c: 28 }, type: 'lunch', ingredients: [] },
];

function estimateMacros(name: string, grams = 200): FoodEstimate {
  const n = name.toLowerCase();
  for (const entry of FOOD_DB) {
    if (entry.keys.some(k => n.includes(k))) {
      const scale = grams / 100;
      return {
        calories: Math.round(entry.per100.cal * scale),
        protein: Math.round(entry.per100.p * scale),
        fat: Math.round(entry.per100.f * scale),
        carbs: Math.round(entry.per100.c * scale),
        suggestedType: entry.type,
        detectedIngredients: entry.ingredients,
      };
    }
  }
  // Generic fallback — 200g balanced meal
  return { calories: 420, protein: 32, fat: 18, carbs: 28, suggestedType: 'lunch', detectedIngredients: [] };
}

interface BonusChip {
  label: string;
  color: string;
}

function buildBonusChips(
  ingredients: string[],
  isRawMilk: boolean,
  isGrassFed: boolean,
  protein: number,
): BonusChip[] {
  const chips: BonusChip[] = [];
  const has = (k: string) => ingredients.includes(k);

  if (has('liver')) {
    chips.push({ label: '+B12', color: Colors.accent });
    chips.push({ label: '+Vitamin A', color: Colors.gold });
    chips.push({ label: '+Iron', color: Colors.orange });
    chips.push({ label: '+Choline', color: Colors.teal });
  }
  if (has('oysters')) {
    chips.push({ label: '+Zinc', color: Colors.teal });
    chips.push({ label: '+Omega-3', color: Colors.blue });
  }
  if (has('raw milk') && isRawMilk) {
    chips.push({ label: '+Raw Enzymes', color: Colors.accent });
    chips.push({ label: '+CLA', color: Colors.gold });
  } else if (has('raw milk') && !isRawMilk) {
    chips.push({ label: '+CLA', color: Colors.muted });
  }
  if (has('beef') && isGrassFed) {
    chips.push({ label: '+CLA', color: Colors.gold });
    chips.push({ label: '+Sat Fat', color: Colors.muted });
  }
  if (has('eggs')) {
    chips.push({ label: '+Choline', color: Colors.teal });
    chips.push({ label: '+Fat-sol. Vitamins', color: Colors.gold });
  }
  if (has('salmon')) {
    chips.push({ label: '+Omega-3', color: Colors.blue });
    chips.push({ label: '+Vitamin D', color: Colors.gold });
  }
  if (has('bone broth')) {
    chips.push({ label: '+Collagen', color: Colors.orange });
    chips.push({ label: '+Glycine', color: Colors.teal });
  }
  if (protein >= 30) {
    chips.push({ label: '+High Protein', color: Colors.accent });
  }

  return chips;
}

// Clarification questions
interface ClarifyQuestion {
  id: string;
  text: string;
  options: Array<{ label: string; value: boolean }>;
}

function buildClarifyQuestions(ingredients: string[], protein: number): ClarifyQuestion[] {
  const questions: ClarifyQuestion[] = [];
  if (ingredients.includes('raw milk')) {
    questions.push({
      id: 'rawMilk',
      text: 'Is this milk raw or pasteurized?',
      options: [{ label: 'Raw', value: true }, { label: 'Pasteurized', value: false }],
    });
  }
  if (ingredients.includes('beef')) {
    questions.push({
      id: 'grassFed',
      text: 'Is the beef grass-fed?',
      options: [{ label: 'Grass-fed', value: true }, { label: 'Grain-fed', value: false }],
    });
  }
  if (protein >= 25) {
    questions.push({
      id: 'highProtein',
      text: 'Confirm: high-protein meal detected.',
      options: [{ label: 'Confirmed', value: true }, { label: 'Adjust', value: false }],
    });
  }
  return questions;
}

// ─── Clipboard Export ─────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildClipboardExport(
  meals: MealEntry[],
  dateKey: string,
  profile: { srDay: number; vitalityScore: number },
  checkin: { energy: number; mood: number; libido: number } | null,
): string {
  const totalCals = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
  const calPct = Math.round(totalCals / CALORIE_GOAL * 100);
  const proPct = Math.round(totalProtein / PROTEIN_GOAL * 100);

  const date = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const mealLines = meals.length
    ? meals.map(m =>
        `  ${formatTime(m.timestamp)} [${MEAL_LABELS[m.mealType].toUpperCase()}] ${m.name} — ${m.calories}kcal, ${m.protein}g P, ${m.fat}g F, ${m.carbs}g C`
      ).join('\n')
    : '  — None logged';

  const allChips = [...new Set(meals.flatMap(m => (m.bonusChips ?? []).map(c => c.replace('+', ''))))];
  const ancestralHits = allChips.length
    ? allChips.map(c => `  ✓ ${c}`).join('\n')
    : '  — No ancestral hits logged today';

  return [
    `APEX NUTRITION EXPORT — ${date}`,
    '━'.repeat(48),
    'DAILY TOTALS',
    `  Calories : ${totalCals} / ${CALORIE_GOAL} kcal (${calPct}%)`,
    `  Protein  : ${totalProtein}g / ${PROTEIN_GOAL}g (${proPct}%)`,
    `  Fat      : ${totalFat}g`,
    `  Carbs    : ${totalCarbs}g`,
    '',
    `MEALS LOGGED (${meals.length})`,
    mealLines,
    '',
    'NUTRIENT HITS',
    ancestralHits,
    '',
    'VITALITY CORRELATION',
    `  SR Day   : ${profile.srDay}`,
    `  Vitality : ${profile.vitalityScore}/100`,
    checkin
      ? `  Energy   : ${checkin.energy}/10\n  Mood     : ${checkin.mood}/10\n  Libido   : ${checkin.libido}/10`
      : '  — No check-in logged today',
    '',
    `Generated by APEX · ${new Date().toISOString()}`,
  ].join('\n');
}

function copyText(text: string): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  // Native clipboard via expo-clipboard wired in Phase 2
}

// ─── Log Wizard ───────────────────────────────────────────────────────────────

type WizardStep = 'name' | 'scanning' | 'analysing' | 'clarify' | 'confirm';

interface WizardState {
  name: string;
  mealType: MealType;
  estimate: FoodEstimate | null;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  clarifyAnswers: Record<string, boolean>;
  chips: BonusChip[];
}

const DEFAULT_WIZARD: WizardState = {
  name: '',
  mealType: 'lunch',
  estimate: null,
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
  clarifyAnswers: {},
  chips: [],
};

interface WizardProps {
  visible: boolean;
  dateKey: string;
  onClose: () => void;
  onCommit: () => void;
}

function LogWizard({ visible, dateKey, onClose, onCommit }: WizardProps) {
  const addMeal = useApexStore(s => s.addMeal);
  const refreshSplit = useApexStore(s => s.refreshSplit);

  const [step, setStep] = useState<WizardStep>('name');
  const [w, setW] = useState<WizardState>(DEFAULT_WIZARD);
  const [analyseDots, setAnalyseDots] = useState(0);

  // Scanning pulse animation
  const scanPulse = useRef(new Animated.Value(1)).current;
  // Chip stagger animations
  const chipAnims = useRef<Animated.Value[]>([]).current;

  const reset = () => {
    setStep('name');
    setW(DEFAULT_WIZARD);
    chipAnims.length = 0;
  };

  // Scanning pulse loop
  useEffect(() => {
    if (step !== 'scanning') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 1.15, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanPulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [step]);

  // Analyse dot counter
  useEffect(() => {
    if (step !== 'analysing') return;
    const iv = setInterval(() => setAnalyseDots(d => (d + 1) % 4), 400);
    const timer = setTimeout(() => {
      clearInterval(iv);
      const estimate = estimateMacros(w.name);
      const questions = buildClarifyQuestions(estimate.detectedIngredients, estimate.protein);
      const newW: WizardState = {
        ...w,
        estimate,
        mealType: estimate.suggestedType,
        calories: String(estimate.calories),
        protein: String(estimate.protein),
        fat: String(estimate.fat),
        carbs: String(estimate.carbs),
      };
      setW(newW);
      if (questions.length > 0) setStep('clarify');
      else goToConfirm(newW, {});
    }, 2000);
    return () => { clearInterval(iv); clearTimeout(timer); };
  }, [step]);

  const goToConfirm = (state: WizardState, answers: Record<string, boolean>) => {
    const estimate = state.estimate ?? estimateMacros(state.name);
    const isRawMilk = answers['rawMilk'] ?? false;
    const isGrassFed = answers['grassFed'] ?? true;
    const p = parseInt(state.protein) || estimate.protein;
    const chips = buildBonusChips(estimate.detectedIngredients, isRawMilk, isGrassFed, p);
    const withChips = { ...state, clarifyAnswers: answers, chips };
    setW(withChips);
    // Prep chip animations
    chips.forEach((_, i) => { chipAnims[i] = new Animated.Value(0); });
    setStep('confirm');
    // Stagger chip reveal
    chips.forEach((_, i) => {
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(chipAnims[i], { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
      }, 150 + i * 120);
    });
  };

  const handleNameNext = () => {
    if (!w.name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('analysing');
  };

  const handleScan = () => {
    if (!w.name.trim()) {
      setW(prev => ({ ...prev, name: 'Meal' }));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('scanning');
  };

  const handleCapture = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('analysing');
  };

  const handleClarifyAnswer = (id: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const answers = { ...w.clarifyAnswers, [id]: value };
    const questions = buildClarifyQuestions(w.estimate?.detectedIngredients ?? [], w.estimate?.protein ?? 0);
    const unanswered = questions.filter(q => !(q.id in answers));
    if (unanswered.length === 0) {
      goToConfirm(w, answers);
    } else {
      setW(prev => ({ ...prev, clarifyAnswers: answers }));
    }
  };

  const handleCommit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMeal(dateKey, {
      mealType: w.mealType,
      name: w.name.trim() || 'Meal',
      calories: parseInt(w.calories) || 0,
      protein: parseInt(w.protein) || 0,
      fat: parseInt(w.fat) || 0,
      carbs: parseInt(w.carbs) || 0,
      timestamp: new Date().toISOString(),
      bonusChips: w.chips.map(c => c.label),
    });
    refreshSplit();
    reset();
    onCommit();
    onClose();
  };

  const questions = w.estimate ? buildClarifyQuestions(w.estimate.detectedIngredients, w.estimate.protein) : [];
  const unansweredQuestion = questions.find(q => !(q.id in w.clarifyAnswers));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { reset(); onClose(); }}>
      <SafeAreaView style={wiz.container} edges={['top', 'bottom']}>

        {/* ── Step: name input ─────────────────────────────────── */}
        {step === 'name' && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={wiz.header}>
              <View>
                <Text style={wiz.title}>Upload Fuel Data</Text>
                <Text style={wiz.subtitle}>What did you eat?</Text>
              </View>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={wiz.closeBtn}>
                <Text style={wiz.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={wiz.content} keyboardShouldPersistTaps="handled">
              {/* Meal type */}
              <Text style={wiz.label}>MEAL TYPE</Text>
              <View style={wiz.typeRow}>
                {MEAL_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[wiz.typeBtn, w.mealType === t && { backgroundColor: MEAL_COLORS[t] + '30', borderColor: MEAL_COLORS[t] }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setW(prev => ({ ...prev, mealType: t })); }}
                  >
                    <Text style={[wiz.typeBtnText, w.mealType === t && { color: MEAL_COLORS[t] }]}>
                      {MEAL_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Food name */}
              <Text style={wiz.label}>FOOD NAME</Text>
              <TextInput
                style={wiz.input}
                value={w.name}
                onChangeText={v => setW(prev => ({ ...prev, name: v }))}
                placeholder="e.g. Grass-fed beef liver 150g"
                placeholderTextColor={Colors.muted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNameNext}
              />

              <Text style={wiz.hintText}>
                APEX recognises liver, oysters, raw milk, steak, eggs, salmon, bone broth and more.
              </Text>

              {/* Actions */}
              <View style={wiz.actionRow}>
                <TouchableOpacity style={wiz.cameraBtn} onPress={handleScan} activeOpacity={0.8}>
                  <Text style={wiz.cameraBtnIcon}>⬡</Text>
                  <Text style={wiz.cameraBtnText}>SCAN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[wiz.analyseBtn, !w.name.trim() && { opacity: 0.4 }]}
                  onPress={handleNameNext}
                  disabled={!w.name.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={wiz.analyseBtnText}>ANALYSE →</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── Step: camera simulation ──────────────────────────── */}
        {step === 'scanning' && (
          <View style={wiz.scanContainer}>
            {/* Camera grid overlay */}
            <View style={wiz.scanGrid}>
              {Array(9).fill(null).map((_, i) => (
                <View key={i} style={wiz.scanCell} />
              ))}
            </View>

            {/* Corner brackets */}
            {[wiz.cornerTL, wiz.cornerTR, wiz.cornerBL, wiz.cornerBR].map((s, i) => (
              <View key={i} style={s} />
            ))}

            {/* Centre pulse */}
            <Animated.View style={[wiz.scanPulse, { transform: [{ scale: scanPulse }] }]}>
              <Text style={wiz.scanIcon}>◆</Text>
            </Animated.View>

            <Text style={wiz.scanLabel}>APEX VISION ACTIVE</Text>
            <Text style={wiz.scanSub}>Frame your meal · tap capture</Text>

            {/* Capture button */}
            <TouchableOpacity style={wiz.captureBtn} onPress={handleCapture} activeOpacity={0.85}>
              <View style={wiz.captureInner} />
            </TouchableOpacity>

            <TouchableOpacity style={wiz.scanCancel} onPress={() => setStep('name')}>
              <Text style={wiz.scanCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: analysing ──────────────────────────────────── */}
        {step === 'analysing' && (
          <View style={wiz.analysingContainer}>
            <Text style={wiz.analysingIcon}>◆</Text>
            <Text style={wiz.analysingTitle}>
              Analysing{'.'.repeat(analyseDots)}
            </Text>
            <Text style={wiz.analysingFood}>{w.name || 'your meal'}</Text>
            <Text style={wiz.analysingHint}>Estimating macros · detecting nutrients</Text>
          </View>
        )}

        {/* ── Step: clarification ──────────────────────────────── */}
        {step === 'clarify' && unansweredQuestion && (
          <View style={wiz.clarifyContainer}>
            <Text style={wiz.clarifyProgress}>
              {questions.filter(q => q.id in w.clarifyAnswers).length + 1} of {questions.length}
            </Text>
            <Text style={wiz.clarifyTitle}>{unansweredQuestion.text}</Text>
            <Text style={wiz.clarifyHint}>Apex-level accuracy requires this.</Text>
            <View style={wiz.clarifyOptions}>
              {unansweredQuestion.options.map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={wiz.clarifyOption}
                  onPress={() => handleClarifyAnswer(unansweredQuestion.id, opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={wiz.clarifyOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step: confirm ────────────────────────────────────── */}
        {step === 'confirm' && (
          <View style={{ flex: 1 }}>
            <View style={wiz.header}>
              <View>
                <Text style={wiz.title}>Fuel Verified</Text>
                <Text style={wiz.subtitle}>Review before uploading</Text>
              </View>
              <TouchableOpacity onPress={() => setStep('name')} style={wiz.closeBtn}>
                <Text style={[wiz.closeText, { color: Colors.muted }]}>← EDIT</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={wiz.content}>
              {/* Meal preview card */}
              <View style={[wiz.previewCard, { borderTopColor: MEAL_COLORS[w.mealType] }]}>
                <View style={wiz.previewHeader}>
                  <View style={[wiz.mealTag, { backgroundColor: MEAL_COLORS[w.mealType] + '30', borderColor: MEAL_COLORS[w.mealType] + '60' }]}>
                    <Text style={[wiz.mealTagText, { color: MEAL_COLORS[w.mealType] }]}>{MEAL_LABELS[w.mealType]}</Text>
                  </View>
                  <Text style={wiz.previewCalories}>{w.calories} kcal</Text>
                </View>
                <Text style={wiz.previewName}>{w.name}</Text>

                {/* Macro grid */}
                <View style={wiz.macroGrid}>
                  {[
                    { label: 'PROTEIN', value: w.protein, unit: 'g', color: Colors.teal },
                    { label: 'FAT',     value: w.fat,     unit: 'g', color: Colors.gold },
                    { label: 'CARBS',   value: w.carbs,   unit: 'g', color: Colors.orange },
                  ].map(m => (
                    <View key={m.label} style={[wiz.macroTile, { borderTopColor: m.color }]}>
                      <Text style={[wiz.macroLabel, { color: m.color }]}>{m.label}</Text>
                      <Text style={wiz.macroValue}>{m.value}<Text style={wiz.macroUnit}>{m.unit}</Text></Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Bonus chips */}
              {w.chips.length > 0 && (
                <View style={wiz.chipsSection}>
                  <Text style={wiz.label}>NUTRIENT INTELLIGENCE</Text>
                  <View style={wiz.chips}>
                    {w.chips.map((chip, i) => (
                      <Animated.View
                        key={chip.label}
                        style={[
                          wiz.chip,
                          { borderColor: chip.color + '60', backgroundColor: chip.color + '20' },
                          {
                            opacity: chipAnims[i] ?? new Animated.Value(1),
                            transform: [{ scale: chipAnims[i] ?? new Animated.Value(1) }],
                          },
                        ]}
                      >
                        <Text style={[wiz.chipText, { color: chip.color }]}>{chip.label}</Text>
                      </Animated.View>
                    ))}
                  </View>
                </View>
              )}

              {/* Editable macros override */}
              <Text style={[wiz.label, { marginTop: Spacing.lg }]}>ADJUST MACROS</Text>
              <View style={wiz.editGrid}>
                {[
                  { label: 'Calories', value: w.calories, key: 'calories' as const, color: Colors.accent },
                  { label: 'Protein (g)', value: w.protein, key: 'protein' as const, color: Colors.teal },
                  { label: 'Fat (g)', value: w.fat, key: 'fat' as const, color: Colors.gold },
                  { label: 'Carbs (g)', value: w.carbs, key: 'carbs' as const, color: Colors.orange },
                ].map(f => (
                  <View key={f.key} style={wiz.editField}>
                    <Text style={[wiz.editLabel, { color: f.color }]}>{f.label}</Text>
                    <TextInput
                      style={wiz.editInput}
                      value={f.value}
                      onChangeText={v => setW(prev => ({ ...prev, [f.key]: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                ))}
              </View>

              {/* Commit */}
              <TouchableOpacity style={wiz.commitBtn} onPress={handleCommit} activeOpacity={0.85}>
                <Text style={wiz.commitText}>UPLOAD TO APEX</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

      </SafeAreaView>
    </Modal>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────

function AnimatedCalorieBar({ value, goal }: { value: number; goal: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(value / goal, 1);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 1200,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const color = pct >= 1 ? Colors.accent : pct >= 0.7 ? Colors.teal : Colors.muted2;

  return (
    <View style={prog.track}>
      <Animated.View
        style={[
          prog.fill,
          {
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const prog = StyleSheet.create({
  track: { height: 4, backgroundColor: Colors.surface2, overflow: 'hidden' },
  fill: { height: '100%' },
});

// ─── Animated Macro Pill ──────────────────────────────────────────────────────

function MacroPill({ label, value, goal, color, prevValue }: {
  label: string; value: number; goal: number | null; color: string; prevValue: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value === prevValue) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
  }, [value]);

  return (
    <Animated.View style={[pillS.pill, { transform: [{ scale }] }]}>
      <Text style={[pillS.label, { color }]}>{label}</Text>
      <Text style={pillS.value}>{value}</Text>
      {goal ? <Text style={pillS.goal}>/ {goal}</Text> : null}
    </Animated.View>
  );
}

const pillS = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
    alignItems: 'center',
  },
  label: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1, marginBottom: 1 },
  value: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.sm, color: Colors.text },
  goal: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted },
});

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({ meal, onDelete }: { meal: MealEntry; onDelete: () => void }) {
  const color = MEAL_COLORS[meal.mealType];

  return (
    <View style={card.wrap}>
      <View style={card.timelineCol}>
        <View style={[card.dot, { backgroundColor: color }]} />
        <View style={card.line} />
      </View>
      <View style={card.body}>
        <View style={card.header}>
          <View style={[card.tag, { backgroundColor: color + '30', borderColor: color + '60' }]}>
            <Text style={[card.tagText, { color }]}>{MEAL_LABELS[meal.mealType]}</Text>
          </View>
          <Text style={card.time}>{formatTime(meal.timestamp)}</Text>
        </View>

        <View style={card.nameRow}>
          <Text style={card.name} numberOfLines={1}>{meal.name}</Text>
          <Text style={card.calories}>{meal.calories} kcal</Text>
        </View>

        {/* Macro bars */}
        {[
          { label: 'P', value: meal.protein, max: PROTEIN_GOAL, color: Colors.teal },
          { label: 'F', value: meal.fat,     max: 100,          color: Colors.gold },
          { label: 'C', value: meal.carbs,   max: 200,          color: Colors.orange },
        ].map(m => (
          <View key={m.label} style={card.macroRow}>
            <Text style={[card.macroLabel, { color: m.color }]}>{m.label}</Text>
            <View style={card.macroTrack}>
              <View style={[card.macroFill, { width: `${Math.min(m.value / m.max, 1) * 100}%`, backgroundColor: m.color }]} />
            </View>
            <Text style={card.macroValue}>{m.value}g</Text>
          </View>
        ))}

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

        <TouchableOpacity onPress={onDelete} style={card.removeBtn}>
          <Text style={card.removeText}>REMOVE</Text>
        </TouchableOpacity>
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
  tag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  tagText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs },
  time: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.sm },
  name: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.base, color: Colors.text, flex: 1, marginRight: Spacing.sm },
  calories: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.md, color: Colors.accent },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 3 },
  macroLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, width: 12 },
  macroTrack: { flex: 1, height: 4, backgroundColor: Colors.surface2, borderRadius: 2, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 2, minWidth: 2 },
  macroValue: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, width: 36, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs, marginBottom: Spacing.xs },
  chip: {
    backgroundColor: Colors.accent + '20',
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.accent },
  removeBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.xs, marginTop: Spacing.xs },
  removeText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.red + '80', letterSpacing: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const getMeals   = useApexStore(s => s.getMeals);
  const deleteMeal = useApexStore(s => s.deleteMeal);
  const profile    = useApexStore(s => s.profile);
  const getTodayCheckin = useApexStore(s => s.getTodayCheckin);

  const [dayOffset, setDayOffset] = useState(0);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Track previous macro values for pill bounce animation
  const prevTotals = useRef({ cals: 0, protein: 0, fat: 0, carbs: 0 });

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const dateKey = formatDateKey(targetDate);

  const dayLabel = dayOffset === 0 ? 'Today'
    : dayOffset === -1 ? 'Yesterday'
    : `${Math.abs(dayOffset)} days ago`;

  const meals = getMeals(dateKey);
  const totalCals    = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalFat     = meals.reduce((s, m) => s + m.fat, 0);
  const totalCarbs   = meals.reduce((s, m) => s + m.carbs, 0);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const mealsBeforeNow = dayOffset === 0
    ? meals.filter(m => { const t = new Date(m.timestamp); return t.getHours() * 60 + t.getMinutes() <= nowMinutes; })
    : meals;
  const mealsAfterNow = dayOffset === 0
    ? meals.filter(m => { const t = new Date(m.timestamp); return t.getHours() * 60 + t.getMinutes() > nowMinutes; })
    : [];

  const handleCommit = useCallback(() => {
    prevTotals.current = { cals: totalCals, protein: totalProtein, fat: totalFat, carbs: totalCarbs };
  }, [totalCals, totalProtein, totalFat, totalCarbs]);

  const handleExport = () => {
    const text = buildClipboardExport(meals, dateKey, profile, getTodayCheckin());
    copyText(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
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

        <View style={styles.headerRight}>
          {/* Clipboard export */}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Text style={[styles.exportText, copied && { color: Colors.accent }]}>
              {copied ? '✓ COPIED' : '⎘ EXPORT'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { if (dayOffset < 0) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDayOffset(d => d + 1); } }}
            style={[styles.navBtn, dayOffset >= 0 && { opacity: 0.25 }]}
            disabled={dayOffset >= 0}
          >
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated calorie bar */}
      <AnimatedCalorieBar value={totalCals} goal={CALORIE_GOAL} />

      {/* Macro pills */}
      <View style={styles.macroPills}>
        <MacroPill label="KCAL"  value={totalCals}    goal={CALORIE_GOAL} color={Colors.accent} prevValue={prevTotals.current.cals} />
        <MacroPill label="PRO"   value={totalProtein} goal={PROTEIN_GOAL} color={Colors.teal}   prevValue={prevTotals.current.protein} />
        <MacroPill label="FAT"   value={totalFat}     goal={null}         color={Colors.gold}   prevValue={prevTotals.current.fat} />
        <MacroPill label="CHO"   value={totalCarbs}   goal={null}         color={Colors.orange} prevValue={prevTotals.current.carbs} />
      </View>

      {/* Feed */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No fuel logged {dayLabel.toLowerCase()}</Text>
            <Text style={styles.emptySub}>Tap the camera button to upload your first meal.</Text>
          </View>
        ) : (
          <>
            {mealsBeforeNow.map(meal => (
              <MealCard key={meal.id} meal={meal} onDelete={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deleteMeal(dateKey, meal.id); }} />
            ))}

            {dayOffset === 0 && (
              <View style={styles.nowMarker}>
                <View style={styles.nowDot} />
                <Text style={styles.nowText}>NOW</Text>
                <View style={styles.nowLine} />
              </View>
            )}

            {mealsAfterNow.map(meal => (
              <MealCard key={meal.id} meal={meal} onDelete={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deleteMeal(dateKey, meal.id); }} />
            ))}
          </>
        )}

        {/* Remaining */}
        {totalCals > 0 && totalCals < CALORIE_GOAL && (
          <View style={styles.remainCard}>
            <Text style={styles.remainText}>{CALORIE_GOAL - totalCals} kcal remaining · {PROTEIN_GOAL - totalProtein > 0 ? `${PROTEIN_GOAL - totalProtein}g protein to go` : 'protein goal hit ✓'}</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB row — camera primary + text secondary */}
      {dayOffset === 0 && (
        <View style={styles.fabRow}>
          <TouchableOpacity
            style={styles.fabText}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWizardVisible(true); }}
            activeOpacity={0.85}
          >
            <Text style={styles.fabTextLabel}>+ TEXT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fabCamera}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setWizardVisible(true); }}
            activeOpacity={0.85}
          >
            <Text style={styles.fabCameraIcon}>⬡</Text>
            <Text style={styles.fabCameraLabel}>LOG FUEL</Text>
          </TouchableOpacity>
        </View>
      )}

      <LogWizard
        visible={wizardVisible}
        dateKey={dateKey}
        onClose={() => setWizardVisible(false)}
        onCommit={handleCommit}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontFamily: Fonts.heading, fontSize: FontSizes.xl, color: Colors.text },
  headerCenter: { alignItems: 'center' },
  dayLabel: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.md, color: Colors.text },
  dateStr: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  exportBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, marginRight: 2 },
  exportText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  macroPills: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  scroll: { flex: 1 },
  feedContent: { padding: Spacing.lg, paddingBottom: 110 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyTitle: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  emptySub: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.muted, textAlign: 'center' },
  nowMarker: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm, gap: Spacing.sm },
  nowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.red },
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
  remainText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, textAlign: 'center' },
  fabRow: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fabText: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabTextLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, letterSpacing: 1 },
  fabCamera: {
    flex: 1,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  fabCameraIcon: { fontSize: 18, color: Colors.bg },
  fabCameraLabel: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.base, color: Colors.bg, letterSpacing: 1 },
});

// Wizard styles
const wiz = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.lg, color: Colors.text },
  subtitle: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, marginTop: 2 },
  closeBtn: { height: 44, justifyContent: 'center', paddingLeft: Spacing.sm },
  closeText: { fontFamily: Fonts.heading, fontSize: FontSizes.base, color: Colors.muted },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  label: {
    fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.xs,
    color: Colors.muted, letterSpacing: 2, marginBottom: Spacing.sm, marginTop: Spacing.md,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  typeBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  typeBtnText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.text,
    fontFamily: Fonts.mono, fontSize: FontSizes.base, marginBottom: Spacing.sm,
    minHeight: 52,
  },
  hintText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, lineHeight: 16, marginBottom: Spacing.xl },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  cameraBtnIcon: { fontSize: 18, color: Colors.teal },
  cameraBtnText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, letterSpacing: 1 },
  analyseBtn: {
    flex: 1, backgroundColor: Colors.teal, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', minHeight: 52,
  },
  analyseBtnText: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.base, color: Colors.bg, letterSpacing: 2 },

  // Scan
  scanContainer: { flex: 1, backgroundColor: '#020208', alignItems: 'center', justifyContent: 'center' },
  scanGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.08 },
  scanCell: { width: '33.33%', height: '33.33%', borderWidth: 0.5, borderColor: Colors.accent },
  cornerTL: { position: 'absolute', top: 80, left: 32, width: 40, height: 40, borderTopWidth: 2, borderLeftWidth: 2, borderColor: Colors.accent },
  cornerTR: { position: 'absolute', top: 80, right: 32, width: 40, height: 40, borderTopWidth: 2, borderRightWidth: 2, borderColor: Colors.accent },
  cornerBL: { position: 'absolute', bottom: 160, left: 32, width: 40, height: 40, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: Colors.accent },
  cornerBR: { position: 'absolute', bottom: 160, right: 32, width: 40, height: 40, borderBottomWidth: 2, borderRightWidth: 2, borderColor: Colors.accent },
  scanPulse: { marginBottom: Spacing.xl },
  scanIcon: { fontSize: 48, color: Colors.accent },
  scanLabel: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.base, color: Colors.accent, letterSpacing: 3, marginBottom: Spacing.xs },
  scanSub: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, marginBottom: 60 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent },
  scanCancel: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  scanCancelText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, letterSpacing: 2 },

  // Analysing
  analysingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  analysingIcon: { fontSize: 48, color: Colors.teal, marginBottom: Spacing.xl },
  analysingTitle: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.lg, color: Colors.text, marginBottom: Spacing.sm, width: 160, textAlign: 'center' },
  analysingFood: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md, color: Colors.teal, marginBottom: Spacing.md },
  analysingHint: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, textAlign: 'center' },

  // Clarify
  clarifyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  clarifyProgress: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, letterSpacing: 2, marginBottom: Spacing.xl },
  clarifyTitle: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.lg, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  clarifyHint: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted, marginBottom: Spacing.xxxl, textAlign: 'center' },
  clarifyOptions: { width: '100%', gap: Spacing.sm },
  clarifyOption: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, paddingVertical: Spacing.lg, alignItems: 'center', minHeight: 56,
  },
  clarifyOptionText: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md, color: Colors.text },

  // Confirm
  previewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, borderTopWidth: 3,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  mealTag: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  mealTagText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs },
  previewCalories: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.xl, color: Colors.accent },
  previewName: { fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md, color: Colors.text, marginBottom: Spacing.lg },
  macroGrid: { flexDirection: 'row', gap: Spacing.sm },
  macroTile: {
    flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.md,
    borderTopWidth: 2, padding: Spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  macroLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1, marginBottom: Spacing.xs },
  macroValue: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.lg, color: Colors.text },
  macroUnit: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  chipsSection: { marginBottom: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, minHeight: 28, justifyContent: 'center',
  },
  chipText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 0.5 },
  editGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  editField: { width: '48%' },
  editLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 0.5, marginBottom: 4 },
  editInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.sm, color: Colors.text,
    fontFamily: Fonts.heading, fontWeight: '700', fontSize: FontSizes.md,
  },
  commitBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center', minHeight: 56,
  },
  commitText: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.base, color: Colors.bg, letterSpacing: 2 },
});
