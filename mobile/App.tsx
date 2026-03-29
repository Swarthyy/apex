// ═══════════════════════════════════════════════════════════════════════════
// APEX — App Entry Point
// ═══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import RootNavigator from './src/navigation/RootNavigator';
import { useApexStore } from './src/stores/useApexStore';
import { Colors } from './src/theme';

const DARK_THEME = {
  dark: true,
  colors: {
    primary: Colors.accent,
    background: Colors.bg,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.orange,
  },
  fonts: {
    regular: { fontFamily: 'DMMono', fontWeight: '400' as const },
    medium: { fontFamily: 'DMMono', fontWeight: '500' as const },
    bold: { fontFamily: 'Syne', fontWeight: '700' as const },
    heavy: { fontFamily: 'Syne', fontWeight: '800' as const },
  },
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const hydrate = useApexStore(s => s.hydrate);
  const isHydrated = useApexStore(s => s.isHydrated);

  useEffect(() => {
    async function boot() {
      // Load fonts
      await Font.loadAsync({
        'Syne': require('./assets/fonts/Syne-Variable.ttf'),
        'DMMono': require('./assets/fonts/DMMono-Regular.ttf'),
      });
      setFontsLoaded(true);

      // Hydrate Zustand from AsyncStorage
      await hydrate();
    }
    boot();
  }, []);

  if (!fontsLoaded || !isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer theme={DARK_THEME}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
