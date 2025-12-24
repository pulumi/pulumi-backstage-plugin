/**
 * Pulumi Brand Colors
 * Source: https://www.pulumi.com/brand/
 *
 * These are the official Pulumi brand colors as defined in the brand guidelines.
 */

export const pulumiColors = {
  // Primary Brand Colors
  yellow: {
    main: '#f7bf2a',
    rgb: '247, 191, 42',
    cmyk: '0, 22, 80, 3',
    pantone: '123 C',
  },
  salmon: {
    main: '#f26e7e',
    rgb: '242, 110, 126',
    cmyk: '0, 52, 45, 5',
    pantone: '1777 C',
  },
  fuchsia: {
    main: '#bd4c85',
    rgb: '189, 76, 133',
    cmyk: '0, 44, 22, 26',
    pantone: '2062 C',
  },
  purple: {
    main: '#8a3391',
    rgb: '138, 51, 145',
    cmyk: '3, 37, 0, 43',
    pantone: '513 C',
  },
  violet: {
    main: '#805ac3',
    rgb: '128, 90, 195',
    cmyk: '26, 41, 0, 24',
    pantone: '2088 C',
  },
  blue: {
    main: '#4d5bd9',
    rgb: '77, 91, 217',
    cmyk: '55, 4, 0, 15',
    pantone: '2726 C',
  },
} as const;

// Semantic color mappings for UI components
export const pulumiSemanticColors = {
  // Primary action color - using purple as the main brand color
  primary: pulumiColors.purple.main,
  primaryLight: pulumiColors.violet.main,
  primaryDark: '#6b2a78',

  // Secondary color - using blue
  secondary: pulumiColors.blue.main,
  secondaryLight: '#6b7ae0',
  secondaryDark: '#3a47b3',

  // Accent colors for highlights
  accent: pulumiColors.salmon.main,
  accentLight: '#f58f9c',
  accentDark: '#e04d5f',

  // Warning/attention - using yellow
  warning: pulumiColors.yellow.main,
  warningLight: '#f9cf5a',
  warningDark: '#d9a520',

  // Status colors for resource changes (keeping semantic meaning)
  status: {
    create: '#437e37', // Green for create
    update: pulumiColors.yellow.main, // Brand yellow for update
    same: '#b0b0b0', // Gray for same
    delete: '#9e2626', // Red for delete
    success: '#437e37',
    error: '#9e2626',
    running: pulumiColors.blue.main,
  },

  // Background colors
  background: {
    paper: '#ffffff',
    default: '#f8f9fa',
    dark: '#1a1a2e',
    darkPaper: '#252541',
  },

  // Text colors
  text: {
    primary: '#1e1e1e',
    secondary: '#5c5c5c',
    disabled: '#9e9e9e',
    dark: '#ffffff',
    darkSecondary: '#b3b3b3',
  },

  // Navigation/sidebar colors - matching the card/tile background
  navigation: {
    background: '#252541', // Same as darkPaper/cards
    selectedBackground: '#33325a', // Slightly lighter for selection
    indicator: pulumiColors.salmon.main,
    color: '#b5b5b5',
    selectedColor: '#ffffff',
  },

  // Table row alternating background
  tableRowAlternate: 'rgba(138, 51, 145, 0.03)', // Subtle purple tint
} as const;

// Gradient definitions matching Pulumi brand
export const pulumiGradients = {
  // Main brand gradient (used in logos and headers)
  primary: `linear-gradient(135deg, ${pulumiColors.salmon.main} 0%, ${pulumiColors.purple.main} 50%, ${pulumiColors.blue.main} 100%)`,
  // Reverse gradient
  primaryReverse: `linear-gradient(135deg, ${pulumiColors.blue.main} 0%, ${pulumiColors.purple.main} 50%, ${pulumiColors.salmon.main} 100%)`,
  // Header/page gradient
  header: `linear-gradient(90deg, ${pulumiColors.fuchsia.main} 0%, ${pulumiColors.violet.main} 100%)`,
  // Subtle gradient for cards
  card: `linear-gradient(180deg, rgba(138, 51, 145, 0.02) 0%, rgba(77, 91, 217, 0.02) 100%)`,
} as const;

export type PulumiColor = keyof typeof pulumiColors;
export type PulumiSemanticColor = keyof typeof pulumiSemanticColors;
