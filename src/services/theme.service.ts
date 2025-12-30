import { Theme, ITheme } from '../models/theme.model';
import { Setting, ISetting } from '../models/setting.model';

const defaultThemes = [
  {
    name: "default",
    label: "Default",
    colors: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.145 0 0)",
        primary: "oklch(0.205 0 0)",
        "primary-foreground": "oklch(0.985 0 0)",
        secondary: "oklch(0.97 0 0)",
        "secondary-foreground": "oklch(0.205 0 0)",
        accent: "oklch(0.97 0 0)",
        "accent-foreground": "oklch(0.205 0 0)",
        muted: "oklch(0.97 0 0)",
        "muted-foreground": "oklch(0.556 0 0)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.145 0 0)",
        border: "oklch(0.922 0 0)",
        input: "oklch(0.922 0 0)",
        ring: "oklch(0.708 0 0)",
      },
      dark: {
        background: "oklch(0.145 0 0)",
        foreground: "oklch(0.985 0 0)",
        primary: "oklch(0.985 0 0)",
        "primary-foreground": "oklch(0.205 0 0)",
        secondary: "oklch(0.269 0 0)",
        "secondary-foreground": "oklch(0.985 0 0)",
        accent: "oklch(0.269 0 0)",
        "accent-foreground": "oklch(0.985 0 0)",
        muted: "oklch(0.269 0 0)",
        "muted-foreground": "oklch(0.708 0 0)",
        card: "oklch(0.145 0 0)",
        "card-foreground": "oklch(0.985 0 0)",
        border: "oklch(0.269 0 0)",
        input: "oklch(0.269 0 0)",
        ring: "oklch(0.439 0 0)",
      },
    },
  },
  {
    name: "ocean",
    label: "Ocean Blue",
    colors: {
      light: {
        background: "oklch(0.98 0.01 220)",
        foreground: "oklch(0.15 0.05 220)",
        primary: "oklch(0.55 0.25 220)",
        "primary-foreground": "oklch(0.98 0.01 220)",
        secondary: "oklch(0.94 0.03 220)",
        "secondary-foreground": "oklch(0.15 0.05 220)",
        accent: "oklch(0.88 0.08 200)",
        "accent-foreground": "oklch(0.15 0.05 220)",
        muted: "oklch(0.94 0.03 220)",
        "muted-foreground": "oklch(0.45 0.08 220)",
        card: "oklch(0.99 0.005 220)",
        "card-foreground": "oklch(0.15 0.05 220)",
        border: "oklch(0.88 0.05 220)",
        input: "oklch(0.88 0.05 220)",
        ring: "oklch(0.55 0.25 220)",
      },
      dark: {
        background: "oklch(0.08 0.03 220)",
        foreground: "oklch(0.95 0.02 220)",
        primary: "oklch(0.65 0.25 220)",
        "primary-foreground": "oklch(0.08 0.03 220)",
        secondary: "oklch(0.15 0.05 220)",
        "secondary-foreground": "oklch(0.95 0.02 220)",
        accent: "oklch(0.25 0.08 200)",
        "accent-foreground": "oklch(0.95 0.02 220)",
        muted: "oklch(0.15 0.05 220)",
        "muted-foreground": "oklch(0.65 0.08 220)",
        card: "oklch(0.12 0.04 220)",
        "card-foreground": "oklch(0.95 0.02 220)",
        border: "oklch(0.25 0.08 220)",
        input: "oklch(0.25 0.08 220)",
        ring: "oklch(0.65 0.25 220)",
      },
    },
  },
];

export class ThemeService {
  static async initializeDatabase(): Promise<void> {
    try {
      // Check if themes already exist
      const existingThemes = await Theme.countDocuments();
      
      if (existingThemes === 0) {
        // Insert default themes
        await Theme.insertMany(defaultThemes);
        console.log('Default themes inserted successfully');
      }
      
      // Set default active theme if none exists
      const activeTheme = await Setting.findOne({ type: 'activeTheme' });
      
      if (!activeTheme) {
        await Setting.create({
          type: 'activeTheme',
          theme: 'default',
          isDark: false
        });
        console.log('Default active theme set successfully');
      }
    } catch (error) {
      console.error('Error initializing theme database:', error);
      throw error;
    }
  }

  static async getAllThemes(): Promise<ITheme[]> {
    try {
      const themes = await Theme.find({}).sort({ name: 1 });
      return themes;
    } catch (error) {
      console.error('Error fetching themes:', error);
      throw new Error('Failed to fetch themes');
    }
  }

  static async getThemeByName(name: string): Promise<ITheme | null> {
    try {
      const theme = await Theme.findOne({ name });
      return theme;
    } catch (error) {
      console.error('Error fetching theme by name:', error);
      throw new Error('Failed to fetch theme');
    }
  }

  static async createTheme(themeData: Partial<ITheme>): Promise<ITheme> {
    try {
      // Check if theme already exists
      const existingTheme = await Theme.findOne({ name: themeData.name });
      if (existingTheme) {
        throw new Error('Theme with this name already exists');
      }

      const theme = new Theme(themeData);
      await theme.save();
      return theme;
    } catch (error) {
      console.error('Error creating theme:', error);
      throw error;
    }
  }

  static async updateTheme(name: string, themeData: Partial<ITheme>): Promise<ITheme | null> {
    try {
      const theme = await Theme.findOneAndUpdate(
        { name },
        { ...themeData, updatedAt: new Date() },
        { new: true }
      );
      return theme;
    } catch (error) {
      console.error('Error updating theme:', error);
      throw new Error('Failed to update theme');
    }
  }

  static async deleteTheme(name: string): Promise<void> {
    try {
      // Prevent deletion of default theme
      if (name === 'default') {
        throw new Error('Cannot delete the default theme');
      }

      // Check if this theme is currently active
      const activeSetting = await Setting.findOne({ type: 'activeTheme' });
      if (activeSetting && activeSetting.theme === name) {
        // Reset to default theme
        await Setting.findOneAndUpdate(
          { type: 'activeTheme' },
          { theme: 'default', isDark: false }
        );
      }

      await Theme.findOneAndDelete({ name });
    } catch (error) {
      console.error('Error deleting theme:', error);
      throw error;
    }
  }

  static async getActiveTheme(): Promise<{ theme: string; isDark: boolean }> {
    try {
      const activeTheme = await Setting.findOne({ type: 'activeTheme' });
      
      return {
        theme: activeTheme?.theme || 'default',
        isDark: activeTheme?.isDark || false
      };
    } catch (error) {
      console.error('Error fetching active theme:', error);
      throw new Error('Failed to fetch active theme');
    }
  }

  static async setActiveTheme(theme: string, isDark: boolean = false): Promise<ISetting> {
    try {
      // Verify that the theme exists
      const themeExists = await Theme.findOne({ name: theme });
      if (!themeExists) {
        throw new Error('Theme not found');
      }

      const setting = await Setting.findOneAndUpdate(
        { type: 'activeTheme' },
        { 
          theme, 
          isDark,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      return setting;
    } catch (error) {
      console.error('Error setting active theme:', error);
      throw error;
    }
  }
}
