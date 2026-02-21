import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
    blue: {
        label: 'Blue',
        primary: '217 91% 60%', // #3b82f6
        color: '#3b82f6'
    },
    orange: {
        label: 'Orange',
        primary: '24.6 95% 53.1%', // #f97316
        color: '#f97316'
    },
    green: {
        label: 'Green',
        primary: '142.1 76.2% 36.3%', // #16a34a
        color: '#16a34a'
    },
    violet: {
        label: 'Violet',
        primary: '262.1 83.3% 57.8%', // #8b5cf6
        color: '#8b5cf6'
    },
    rose: {
        label: 'Rose',
        primary: '346.8 77.2% 49.8%', // #e11d48
        color: '#e11d48'
    },
    amber: {
        label: 'Amber',
        primary: '45 93% 47%', // #f59e0b
        color: '#f59e0b'
    },
    teal: {
        label: 'Teal',
        primary: '173 80% 40%', // #0d9488
        color: '#0d9488'
    },
    cyan: {
        label: 'Cyan',
        primary: '189 94% 43%', // #06b6d4
        color: '#06b6d4'
    },
    indigo: {
        label: 'Indigo',
        primary: '243 75% 59%', // #6366f1
        color: '#6366f1'
    },
    fuchsia: {
        label: 'Fuchsia',
        primary: '300 76% 72%', // #d946ef
        color: '#d946ef'
    },
    slate: {
        label: 'Slate',
        primary: '215 16% 47%', // #64748b
        color: '#64748b'
    }
};

export const ThemeProvider = ({ children }) => {
    const [accent, setAccent] = useState(() => {
        return localStorage.getItem('app_accent') || 'blue';
    });

    useEffect(() => {
        const theme = THEMES[accent] || THEMES.blue;
        const root = document.documentElement;

        // Update Tailwind CSS variable
        root.style.setProperty('--primary', theme.primary);

        // Update Legacy CSS variables to match
        // We use the HSL value inside hsl() for the color itself
        root.style.setProperty('--accent-primary', `hsl(${theme.primary})`);

        // Save to storage
        localStorage.setItem('app_accent', accent);
    }, [accent]);

    return (
        <ThemeContext.Provider value={{ accent, setAccent, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
