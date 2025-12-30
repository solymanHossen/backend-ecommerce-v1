import mongoose, { Document, Schema } from 'mongoose';

export interface ITheme extends Document {
    name: string;
    label: string;
    colors: {
        light: {
            background: string;
            foreground: string;
            primary: string;
            'primary-foreground': string;
            secondary: string;
            'secondary-foreground': string;
            accent: string;
            'accent-foreground': string;
            muted: string;
            'muted-foreground': string;
            card: string;
            'card-foreground': string;
            border: string;
            input: string;
            ring: string;
        };
        dark: {
            background: string;
            foreground: string;
            primary: string;
            'primary-foreground': string;
            secondary: string;
            'secondary-foreground': string;
            accent: string;
            'accent-foreground': string;
            muted: string;
            'muted-foreground': string;
            card: string;
            'card-foreground': string;
            border: string;
            input: string;
            ring: string;
        };
    };
}

const themeSchema = new Schema<ITheme>({
    name: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    colors: {
        light: {
            background: { type: String, required: true },
            foreground: { type: String, required: true },
            primary: { type: String, required: true },
            'primary-foreground': { type: String, required: true },
            secondary: { type: String, required: true },
            'secondary-foreground': { type: String, required: true },
            accent: { type: String, required: true },
            'accent-foreground': { type: String, required: true },
            muted: { type: String, required: true },
            'muted-foreground': { type: String, required: true },
            card: { type: String, required: true },
            'card-foreground': { type: String, required: true },
            border: { type: String, required: true },
            input: { type: String, required: true },
            ring: { type: String, required: true },
        },
        dark: {
            background: { type: String, required: true },
            foreground: { type: String, required: true },
            primary: { type: String, required: true },
            'primary-foreground': { type: String, required: true },
            secondary: { type: String, required: true },
            'secondary-foreground': { type: String, required: true },
            accent: { type: String, required: true },
            'accent-foreground': { type: String, required: true },
            muted: { type: String, required: true },
            'muted-foreground': { type: String, required: true },
            card: { type: String, required: true },
            'card-foreground': { type: String, required: true },
            border: { type: String, required: true },
            input: { type: String, required: true },
            ring: { type: String, required: true },
        },
    },
}, { timestamps: true });

export const Theme = mongoose.model<ITheme>('Theme', themeSchema);
