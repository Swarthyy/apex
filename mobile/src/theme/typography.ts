// APEX — Typography
// Syne for headings, DM Mono for body/data
export const Fonts = {
  heading: 'Syne',
  mono: 'DMMono',
} as const;

export const FontSizes = {
  xs: 9,
  sm: 11,
  base: 13,
  md: 15,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '800' as const,
};
