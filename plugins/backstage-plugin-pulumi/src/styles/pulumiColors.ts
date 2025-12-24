/**
 * Pulumi Brand Colors
 * Source: https://www.pulumi.com/brand/
 *
 * These are the official Pulumi brand colors as defined in the brand guidelines.
 * This file is used within the plugin for consistent styling.
 */

export const pulumiColors = {
  // Primary Brand Colors
  yellow: '#f7bf2a',
  salmon: '#f26e7e',
  fuchsia: '#bd4c85',
  purple: '#8a3391',
  violet: '#805ac3',
  blue: '#4d5bd9',
} as const;

// Status colors for resource changes
export const statusColors = {
  create: '#437e37', // Green for create
  update: pulumiColors.yellow, // Brand yellow for update
  same: '#b0b0b0', // Gray for same
  delete: '#9e2626', // Red for delete
  success: '#437e37',
  error: '#9e2626',
  running: pulumiColors.blue,
} as const;

// Text colors for status buttons
export const statusTextColors = {
  create: '#ffffff',
  update: '#313131', // Dark text on yellow for contrast
  same: '#313131', // Dark text on gray for contrast
  delete: '#ffffff',
} as const;

// Table row alternating background
export const tableRowAlternate = `rgba(138, 51, 145, 0.03)`; // Subtle purple tint

export type PulumiColor = keyof typeof pulumiColors;
export type StatusColor = keyof typeof statusColors;
