/**
 * Consent State Composable
 *
 * Manages consent categories, step navigation, and settings restoration
 * for GDPR-compliant consent flows.
 */
import type { ConsentCategories, ConsentStep, ConsentSubmission, RestorableSettings } from './types.js';
export declare function useConsentState(): {
    categories: ConsentCategories;
    preciseLocation: boolean;
    ageVerified: boolean;
    optionalHandle: string | null;
    preferences: {
        theme: string;
        darkMode: "light" | "dark" | "system";
        a11y: {
            reducedMotion: boolean;
            highContrast: boolean;
            fontSize: "normal" | "large" | "x-large";
        };
    };
    contentPageSettings: {
        forceTheme: string | null;
        forceDarkMode: "light" | "dark" | null;
        forceA11y: boolean;
    };
    currentStep: ConsentStep;
    readonly canSubmit: boolean;
    readonly hasPreferenceConsent: boolean;
    readonly isReturningVisitor: boolean;
    readonly completedSteps: ConsentStep[];
    readonly canGoBack: boolean;
    readonly canProceed: boolean;
    restoreFromTempo: (settings: RestorableSettings) => void;
    resetToDefaults: () => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: ConsentStep) => void;
    buildSubmission: () => ConsentSubmission;
};
//# sourceMappingURL=useConsentState.svelte.d.ts.map