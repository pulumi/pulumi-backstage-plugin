import {
  createBaseThemeOptions,
  createUnifiedTheme,
  palettes,
  genPageTheme,
  shapes,
} from '@backstage/theme';
import { pulumiColors, pulumiSemanticColors } from './pulumiColors';

/**
 * Pulumi Light Theme
 *
 * A custom Backstage theme using Pulumi's official brand colors.
 */
export const pulumiLightTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.light,
      primary: {
        main: pulumiSemanticColors.primary,
        light: pulumiSemanticColors.primaryLight,
        dark: pulumiSemanticColors.primaryDark,
      },
      secondary: {
        main: pulumiSemanticColors.secondary,
        light: pulumiSemanticColors.secondaryLight,
        dark: pulumiSemanticColors.secondaryDark,
      },
      warning: {
        main: pulumiSemanticColors.warning,
        light: pulumiSemanticColors.warningLight,
        dark: pulumiSemanticColors.warningDark,
      },
      error: {
        main: pulumiSemanticColors.status.error,
      },
      success: {
        main: pulumiSemanticColors.status.success,
      },
      info: {
        main: pulumiColors.blue.main,
      },
      background: {
        paper: pulumiSemanticColors.background.paper,
        default: pulumiSemanticColors.background.default,
      },
      navigation: {
        background: pulumiSemanticColors.navigation.background,
        indicator: pulumiSemanticColors.navigation.indicator,
        color: pulumiSemanticColors.navigation.color,
        selectedColor: pulumiSemanticColors.navigation.selectedColor,
        navItem: {
          hoverBackground: pulumiSemanticColors.navigation.selectedBackground,
        },
      },
    },
  }),
  fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({
      colors: [pulumiColors.purple.main, pulumiColors.blue.main],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [pulumiColors.blue.main, pulumiColors.violet.main],
      shape: shapes.wave2,
    }),
    tool: genPageTheme({
      colors: [pulumiColors.fuchsia.main, pulumiColors.purple.main],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: [pulumiColors.salmon.main, pulumiColors.fuchsia.main],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: [pulumiColors.violet.main, pulumiColors.blue.main],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: [pulumiColors.yellow.main, pulumiColors.salmon.main],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: [pulumiColors.purple.main, pulumiColors.fuchsia.main],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [pulumiColors.blue.main, pulumiColors.purple.main],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [pulumiColors.violet.main, pulumiColors.fuchsia.main],
      shape: shapes.wave2,
    }),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: pulumiSemanticColors.primary,
          '&:hover': {
            backgroundColor: pulumiSemanticColors.primaryDark,
          },
        },
        containedSecondary: {
          backgroundColor: pulumiSemanticColors.secondary,
          '&:hover': {
            backgroundColor: pulumiSemanticColors.secondaryDark,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: pulumiSemanticColors.primary,
        },
        colorSecondary: {
          backgroundColor: pulumiSemanticColors.secondary,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: pulumiSemanticColors.primary,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: pulumiSemanticColors.primary,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: pulumiSemanticColors.primary,
          '&:hover': {
            color: pulumiSemanticColors.primaryDark,
          },
        },
      },
    },
    BackstageSidebar: {
      styleOverrides: {
        drawer: {
          background: pulumiSemanticColors.navigation.background,
        },
      },
    },
    BackstageSidebarItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: pulumiSemanticColors.navigation.selectedBackground,
          },
        },
      },
    },
  },
});

/**
 * Pulumi Dark Theme
 *
 * A dark variant of the Pulumi theme using the same brand colors.
 */
export const pulumiDarkTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.dark,
      primary: {
        main: pulumiSemanticColors.primaryLight, // Use lighter purple for better contrast
        light: pulumiColors.violet.main,
        dark: pulumiSemanticColors.primary,
      },
      secondary: {
        main: pulumiSemanticColors.secondaryLight,
        light: '#8b9ae6',
        dark: pulumiSemanticColors.secondary,
      },
      warning: {
        main: pulumiSemanticColors.warning,
        light: pulumiSemanticColors.warningLight,
        dark: pulumiSemanticColors.warningDark,
      },
      error: {
        main: '#ef5350', // Brighter red for dark theme
      },
      success: {
        main: '#66bb6a', // Brighter green for dark theme
      },
      info: {
        main: pulumiColors.blue.main,
      },
      background: {
        paper: pulumiSemanticColors.background.darkPaper,
        default: pulumiSemanticColors.background.dark,
      },
      navigation: {
        background: '#252541', // Same as darkPaper/cards
        indicator: pulumiColors.salmon.main,
        color: pulumiSemanticColors.navigation.color,
        selectedColor: pulumiSemanticColors.navigation.selectedColor,
        navItem: {
          hoverBackground: '#33325a',
        },
      },
    },
  }),
  fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({
      colors: [pulumiColors.purple.main, pulumiColors.blue.main],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [pulumiColors.blue.main, pulumiColors.violet.main],
      shape: shapes.wave2,
    }),
    tool: genPageTheme({
      colors: [pulumiColors.fuchsia.main, pulumiColors.purple.main],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: [pulumiColors.salmon.main, pulumiColors.fuchsia.main],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: [pulumiColors.violet.main, pulumiColors.blue.main],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: [pulumiColors.yellow.main, pulumiColors.salmon.main],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: [pulumiColors.purple.main, pulumiColors.fuchsia.main],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [pulumiColors.blue.main, pulumiColors.purple.main],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [pulumiColors.violet.main, pulumiColors.fuchsia.main],
      shape: shapes.wave2,
    }),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: pulumiSemanticColors.primaryLight,
          '&:hover': {
            backgroundColor: pulumiSemanticColors.primary,
          },
        },
        containedSecondary: {
          backgroundColor: pulumiSemanticColors.secondaryLight,
          '&:hover': {
            backgroundColor: pulumiSemanticColors.secondary,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: pulumiSemanticColors.primaryLight,
        },
        colorSecondary: {
          backgroundColor: pulumiSemanticColors.secondaryLight,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: pulumiSemanticColors.primaryLight,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: pulumiSemanticColors.primaryLight,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: pulumiSemanticColors.primaryLight,
          '&:hover': {
            color: pulumiColors.violet.main,
          },
        },
      },
    },
    BackstageSidebar: {
      styleOverrides: {
        drawer: {
          background: '#252541', // Same as darkPaper/cards
        },
      },
    },
    BackstageSidebarItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#33325a',
          },
        },
      },
    },
  },
});
