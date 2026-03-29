// ═══════════════════════════════════════════════════════════════════════════
// APEX — Root Navigator
// Bottom tabs with nested stack for Sectors (list → detail)
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, TAB_BAR_HEIGHT, MIN_TAP_SIZE } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import SectorsScreen from '../screens/SectorsScreen';
import SectorDetailScreen from '../screens/SectorDetailScreen';
import HistoryScreen from '../screens/HistoryScreen';
import NutritionScreen from '../screens/NutritionScreen';
import AskScreen from '../screens/AskScreen';

import type { SectorsStackParamList } from './types';

// ── Sectors stack (list → detail) ─────────────────────────────────────────

const SectorsStack = createNativeStackNavigator<SectorsStackParamList>();

function SectorsNavigator() {
  return (
    <SectorsStack.Navigator screenOptions={{ headerShown: false }}>
      <SectorsStack.Screen name="SectorsList" component={SectorsScreen} />
      <SectorsStack.Screen name="SectorDetail" component={SectorDetailScreen} />
    </SectorsStack.Navigator>
  );
}

// ── Tab navigator ──────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '◆',
  Sectors: '◎',
  History: '◷',
  Nutrition: '🍽',
  Ask: '💬',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {TAB_ICONS[name] || '●'}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {name}
      </Text>
    </View>
  );
}

export default function RootNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          minHeight: MIN_TAP_SIZE,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sectors" component={SectorsNavigator} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Ask" component={AskScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 18,
    color: Colors.muted,
  },
  tabIconActive: {
    color: Colors.accent,
  },
  tabLabel: {
    fontFamily: Fonts.heading,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Colors.muted,
  },
  tabLabelActive: {
    color: Colors.accent,
  },
});
