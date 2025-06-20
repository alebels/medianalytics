//mypreset.ts
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';

const primeTheme = definePreset(Aura, {
    semantic: {
        colorScheme: {
            light: {
                primary: {
                    color: "var(--color-accent)",
                    inverseColor: "var(--color-accent)",
                    hoverColor: "var(--color-accent)",
                    activeColor: "var(--color-accent)"
                },
                highlight: {
                    background: "var(--color-accent-background)",
                    // focusBackground: "var(--color-accent)",
                    color: "var(--color-text)",
                    focusColor: "var(--color-accent)"
                }
            },
            dark: {
                primary: {
                    color: "var(--color-accent)",
                    inverseColor: "var(--color-accent)",
                    hoverColor: "var(--color-accent)",
                    activeColor: "var(--color-accent)"
                },
                highlight: {
                    background: "var(--color-accent-background)",
                    // focusBackground: "var(--color-accent)",
                    color: "var(--color-text)",
                    focusColor: "var(--color-accent)"
                }
            }
        }
    }
});

export default primeTheme;