// APEX — Sector Carousel
// Horizontal FlatList with snap-to-interval iOS paging
import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import SectorCard, { CARD_WIDTH } from './SectorCard';
import { Colors, Fonts, FontSizes, Spacing } from '../theme';

interface SectorData {
  id: string;
  label: string;
  value: string;
  sub: string;
  color: string;
}

const SECTORS: SectorData[] = [
  { id: 'sleep', label: 'SLEEP', value: '7.5h', sub: 'On target', color: Colors.blue },
  { id: 'energy', label: 'ENERGY', value: '7', sub: '/10 score', color: Colors.gold },
  { id: 'weight', label: 'WEIGHT', value: '82.5', sub: '12% BF', color: Colors.purple },
  { id: 'mood', label: 'MOOD', value: '8', sub: '/10 score', color: Colors.amber },
  { id: 'libido', label: 'LIBIDO', value: '7', sub: '/10 score', color: Colors.pink },
  { id: 'nutrition', label: 'NUTRITION', value: '2,100', sub: 'kcal today', color: Colors.teal },
];

const SNAP_INTERVAL = CARD_WIDTH + Spacing.md; // card width + gap

export default function SectorCarousel() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>SECTORS</Text>
      <FlatList
        data={SECTORS}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SectorCard
            label={item.label}
            value={item.value}
            sub={item.sub}
            color={item.color}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: FontSizes.xs,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  list: {
    paddingHorizontal: Spacing.xl,
  },
});
