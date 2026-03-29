// ═══════════════════════════════════════════════════════════════════════════
// APEX — Ask Screen
// Keyword-match chat interface (MVP canned responses)
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../theme';
import { useApexStore } from '../stores/useApexStore';

interface Message {
  id: string;
  role: 'user' | 'apex';
  text: string;
  timestamp: string;
}

function getResponse(
  query: string,
  srDay: number,
  energy: number,
  mood: number,
  libido: number,
  totalDays: number,
  totalCals: number,
): string {
  const q = query.toLowerCase();

  // SR / Retention
  if (q.includes('streak') || q.includes('retention') || q.includes(' sr ') || q.startsWith('sr ') || q.includes('day ')) {
    if (srDay === 0) return "You don't have an active streak logged. Set your SR day in the morning check-in.";
    if (srDay < 7) return `You're on Day ${srDay}. The first 7 days are the foundation — dopamine receptors are beginning to recalibrate. Stay consistent.`;
    if (srDay < 14) return `Day ${srDay} — you're entering the energy surge window. Most people notice elevated drive and focus between days 7-14. Keep it going.`;
    if (srDay < 21) return `Day ${srDay} is strong. You should be feeling elevated libido, sharper focus, and better gym output. This is the peak correlation zone.`;
    return `Day ${srDay} — exceptional. You're well into peak territory. The data consistently shows highest energy, mood, and gym performance at this stage.`;
  }

  // Energy
  if (q.includes('energy') || q.includes('tired') || q.includes('fatigue')) {
    if (energy === 0) return "No energy score logged today. Complete your morning check-in and I can give you more specific analysis.";
    if (energy <= 3) return `Energy is at ${energy}/10 — that's low. Key culprits: poor sleep, insufficient calories, or high training load. Check when you last had liver and what your sleep was like last night.`;
    if (energy <= 6) return `Energy is at ${energy}/10 — moderate. You're functional but not optimal. Prioritise protein and fat intake today, and make sure you're hydrated.`;
    return `Energy is at ${energy}/10 — solid. You're in a good zone. If you have a hard session planned, now is the time.`;
  }

  // Sleep
  if (q.includes('sleep') || q.includes('rest') || q.includes('recovery')) {
    return "Sleep data will be auto-imported from Apple Health in Phase 2. For now, rate your sleep quality in tomorrow's morning check-in using the energy score as a proxy — low morning energy usually correlates with poor sleep.";
  }

  // Mood
  if (q.includes('mood') || q.includes('feel') || q.includes('mental')) {
    if (mood === 0) return "No mood score logged today. Complete your morning check-in to track this.";
    if (mood <= 4) return `Mood at ${mood}/10. The strongest correlates in the data are: sunlight exposure within 1 hour of waking, animal liver 3x/week, and social interaction. Check which of those is missing.`;
    if (mood <= 7) return `Mood at ${mood}/10. Decent but room to improve. SR streak, consistent nutrition, and good sleep quality are the main levers.`;
    return `Mood at ${mood}/10 — you're in a great state. Conditions are aligned.`;
  }

  // Libido
  if (q.includes('libido') || q.includes('drive') || q.includes('testosterone')) {
    if (libido === 0) return "No libido score logged today. Complete your morning check-in.";
    if (libido <= 4) return `Libido at ${libido}/10 is low. This typically correlates with: low SR streak, zinc deficiency (no oysters/liver), or high stress. Review your nutrition and streak length.`;
    if (srDay >= 10 && libido >= 7) return `Libido at ${libido}/10 combined with Day ${srDay} of SR — you're in optimal territory. High correlation with peak gym performance.`;
    return `Libido at ${libido}/10. Zinc-rich foods (oysters, liver) and maintaining your SR streak are the primary drivers here.`;
  }

  // Nutrition
  if (q.includes('nutrition') || q.includes('eat') || q.includes('food') || q.includes('meal') || q.includes('calorie')) {
    if (totalCals === 0) return "No meals logged today. Head to the Nutrition tab to start logging. The key foods to prioritise: liver (B12, Vitamin A, Iron), oysters (Zinc), grass-fed beef (protein, fat), raw milk (enzymes, CLA).";
    if (totalCals < 1200) return `Only ${totalCals} kcal logged today — likely underfuelled. Your goal is 2,800 kcal. Low calories will tank energy and gym performance.`;
    return `${totalCals} kcal logged today. Keep tracking to see nutrient bonuses and gaps. The most correlated foods with high vitality scores are liver, oysters, and grass-fed beef.`;
  }

  // Gym / workout
  if (q.includes('gym') || q.includes('workout') || q.includes('train') || q.includes('lift') || q.includes('session')) {
    return "Gym data will be auto-synced from Hevy in Phase 2. Your current split is Push/Pull/Legs/Rest. Check the Home tab for your next scheduled session and the Gym sector for volume history.";
  }

  // Weight / body
  if (q.includes('weight') || q.includes('body') || q.includes('fat') || q.includes('recomp')) {
    return "Body composition data (weight and body fat %) will be imported from Withings in Phase 2. For now, track your check-in energy and gym volume — sustained high energy + increasing gym volume is a strong recomp signal even without scale data.";
  }

  // Best week / best day
  if (q.includes('best') || q.includes('peak') || q.includes('optimal')) {
    if (totalDays < 7) return `You've logged ${totalDays} days so far. Log for at least 7 days and I'll be able to identify patterns in what makes your best days.`;
    return `Based on your logged data (${totalDays} days), your highest vitality scores correlate with: SR day 10+, energy ≥7, and consistent meal logging. The History tab shows your full calendar.`;
  }

  // Vitality
  if (q.includes('vitality') || q.includes('score') || q.includes('dashboard')) {
    return "Your Vitality Score (0-100) is calculated from: Energy (25%), Mood (20%), Libido (20%), SR streak modifier (15%), with Sleep (20%) arriving in Phase 2. Log your morning check-in daily to keep it accurate.";
  }

  // How / why questions
  if (q.startsWith('why') || q.startsWith('how')) {
    if (q.includes('low') || q.includes('bad') || q.includes('down')) {
      if (energy <= 4 || mood <= 4) return "Low scores typically trace back to 3 culprits: sleep quality, nutrition gaps (especially B12 and zinc from liver/oysters), or a dropped SR streak. Check which changed when the scores dropped.";
      return "To diagnose a dip, look at the History tab and find the last high-scoring day. Compare what was different — usually sleep, nutrition density, or SR streak length.";
    }
    if (q.includes('improve') || q.includes('better') || q.includes('higher')) {
      return "The fastest levers to improve your Vitality Score: (1) maintain your SR streak, (2) log liver 3x/week, (3) hit 2,800 kcal with 200g+ protein, (4) protect 8h sleep. These four alone drive 80% of the variance.";
    }
  }

  // Correlations
  if (q.includes('correlat') || q.includes('pattern') || q.includes('relationship')) {
    return `The strongest correlations in the APEX data model: SR streak × energy (r≈0.7), liver frequency × libido (r≈0.6), sleep duration × mood (r≈0.65). With ${totalDays} days logged, I'll surface personalised correlations once you hit 30 days.`;
  }

  // Liver
  if (q.includes('liver')) {
    return "Liver is the most correlated single food with high vitality scores. It's the densest source of B12, Vitamin A, Iron, and Choline. 100-150g of beef liver 3x/week is the minimum effective dose. Log it in the Nutrition tab and watch the B12/Vitamin A bonus chips appear.";
  }

  // Oysters
  if (q.includes('oyster') || q.includes('zinc')) {
    return "Oysters are the top zinc source in the data — strongly correlated with libido scores. 6 oysters provides ~50mg zinc. Most people are deficient. Log them and the +Zinc chip will appear with the correlation data attached.";
  }

  // Fallback
  return totalDays < 3
    ? "Not enough data to analyse yet. Complete your morning check-in for a few days and I'll be able to answer with your actual numbers. Ask me about sleep, energy, SR streak, nutrition, or what makes your best days."
    : `I don't have a specific answer for that yet. Try asking about: sleep, energy, mood, libido, SR streak, nutrition, gym, vitality score, or patterns in your data. As you log more (currently ${totalDays} days), my answers will get more specific.`;
}

const SUGGESTIONS = [
  'How is my energy today?',
  'What do my best days look like?',
  'Why might my mood be low?',
  'How do I improve my vitality score?',
  'What should I eat today?',
  'How does my SR streak affect my data?',
];

export default function AskScreen() {
  const profile = useApexStore(s => s.profile);
  const getTodayCheckin = useApexStore(s => s.getTodayCheckin);
  const checkins = useApexStore(s => s.checkins);
  const getMeals = useApexStore(s => s.getMeals);

  const today = new Date().toISOString().split('T')[0];
  const checkin = getTodayCheckin();
  const meals = getMeals(today);
  const totalCals = meals.reduce((s, m) => s + m.calories, 0);
  const totalDays = Object.keys(checkins).length;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'apex',
      text: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${profile.name}. I'm APEX. Ask me anything about your data — sleep, energy, SR streak, nutrition, or patterns across sectors.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = (text: string) => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const response = getResponse(
      text,
      profile.srDay,
      checkin?.energy ?? 0,
      checkin?.mood ?? 0,
      checkin?.libido ?? 0,
      totalDays,
      totalCals,
    );

    const apexMsg: Message = {
      id: `a_${Date.now()}`,
      role: 'apex',
      text: response,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, apexMsg]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ask APEX</Text>
        <Text style={styles.sub}>
          {totalDays === 0 ? 'Start logging to unlock insights' : `${totalDays} days of data`}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            messages.length === 1 ? (
              <View style={styles.suggestions}>
                <Text style={styles.suggestLabel}>SUGGESTED</Text>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionBtn}
                    onPress={() => send(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                    <Text style={styles.suggestionArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.apexBubble]}>
              {item.role === 'apex' && (
                <Text style={styles.bubbleSender}>APEX</Text>
              )}
              <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, item.role === 'user' && styles.userTime]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          )}
        />

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your data..."
            placeholderTextColor={Colors.muted}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim()}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  title: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.lg, color: Colors.text },
  sub: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.muted },
  messageList: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  bubble: {
    maxWidth: '85%',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  apexBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent + '40',
    borderBottomRightRadius: Radius.sm,
  },
  bubbleSender: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.accent,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  bubbleText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.text,
    lineHeight: 19,
  },
  userText: { color: Colors.text },
  bubbleTime: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  userTime: { textAlign: 'right' },
  suggestions: { marginTop: Spacing.lg },
  suggestLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  suggestionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  suggestionText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: Colors.text2,
    flex: 1,
  },
  suggestionArrow: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.muted,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
  sendBtnText: { fontFamily: Fonts.heading, fontWeight: '800', fontSize: FontSizes.md, color: Colors.bg },
});
