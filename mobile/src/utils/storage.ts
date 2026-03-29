// APEX — AsyncStorage Wrapper
// Drop-in replacement for localStorage used in the web app
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem<T = string>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] setItem failed:', key, e);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('[Storage] removeItem failed:', key, e);
  }
}
