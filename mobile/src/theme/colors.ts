// APEX — Color Tokens
export const Colors = {
  accent: '#c8f135',
  blue: '#3574f1',
  gold: '#ffcc00',
  purple: '#9b5de5',
  orange: '#ff7a2f',
  pink: '#ff3580',
  teal: '#00d4aa',
  amber: '#ff9f1c',
  red: '#ff3535',

  bg: '#080810',
  surface: '#0e0e1a',
  surface2: '#141428',
  border: '#1e1e35',
  muted: '#5a5a7a',
  muted2: '#2a2a45',
  text: '#e0e0f0',
  text2: '#a0a0c0',
} as const;

export type ColorKey = keyof typeof Colors;
