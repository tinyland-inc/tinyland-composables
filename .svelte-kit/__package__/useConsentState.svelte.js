/**
 * Consent State Composable
 *
 * Manages consent categories, step navigation, and settings restoration
 * for GDPR-compliant consent flows.
 */
export function useConsentState() {
    // Reactive state using Svelte 5 runes
    let categories = $state({
        essential: true,
        preferences: false,
        functional: false,
        tracking: false,
        performance: false
    });
    let preciseLocation = $state(false);
    let ageVerified = $state(false);
    let optionalHandle = $state(null);
    let preferences = $state({
        theme: 'trans',
        darkMode: 'system',
        a11y: {
            reducedMotion: false,
            highContrast: false,
            fontSize: 'normal'
        }
    });
    let contentPageSettings = $state({
        forceTheme: null,
        forceDarkMode: null,
        forceA11y: false
    });
    let currentStep = $state('welcome');
    let restoredFromTempo = $state(false);
    // Step order for navigation
    const STEP_ORDER = ['welcome', 'privacy', 'preferences'];
    // Derived state
    const canSubmit = $derived(ageVerified && categories.essential);
    const hasPreferenceConsent = $derived(categories.preferences || categories.functional);
    const isReturningVisitor = $derived(restoredFromTempo);
    const completedSteps = $derived.by(() => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex === -1)
            return [];
        return STEP_ORDER.slice(0, currentIndex);
    });
    const canGoBack = $derived(currentStep === 'privacy' || currentStep === 'preferences');
    const canProceed = $derived.by(() => {
        switch (currentStep) {
            case 'welcome':
                return true;
            case 'privacy':
                return ageVerified;
            case 'preferences':
                return false;
            default:
                return false;
        }
    });
    // Actions
    function restoreFromTempo(settings) {
        if (settings.consentCategories) {
            categories = { ...settings.consentCategories };
        }
        if (settings.preferences) {
            if (settings.preferences.theme) {
                preferences.theme = settings.preferences.theme;
            }
            if (settings.preferences.darkMode) {
                preferences.darkMode = settings.preferences.darkMode;
            }
            if (settings.preferences.a11y) {
                if (settings.preferences.a11y.reducedMotion !== undefined) {
                    preferences.a11y.reducedMotion = settings.preferences.a11y.reducedMotion;
                }
                if (settings.preferences.a11y.highContrast !== undefined) {
                    preferences.a11y.highContrast = settings.preferences.a11y.highContrast;
                }
                if (settings.preferences.a11y.fontSize) {
                    preferences.a11y.fontSize = settings.preferences.a11y.fontSize;
                }
            }
        }
        if (settings.userContext?.handle) {
            optionalHandle = settings.userContext.handle;
        }
        restoredFromTempo = true;
    }
    function resetToDefaults() {
        categories = {
            essential: true,
            preferences: false,
            functional: false,
            tracking: false,
            performance: false
        };
        preciseLocation = false;
        ageVerified = false;
        optionalHandle = null;
        preferences = {
            theme: 'trans',
            darkMode: 'system',
            a11y: {
                reducedMotion: false,
                highContrast: false,
                fontSize: 'normal'
            }
        };
        contentPageSettings = {
            forceTheme: null,
            forceDarkMode: null,
            forceA11y: false
        };
        currentStep = 'welcome';
        restoredFromTempo = false;
    }
    function nextStep() {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex === -1 || currentIndex === STEP_ORDER.length - 1) {
            return;
        }
        if (!canProceed) {
            return;
        }
        currentStep = STEP_ORDER[currentIndex + 1];
    }
    function prevStep() {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex === -1 || currentIndex === 0) {
            return;
        }
        currentStep = STEP_ORDER[currentIndex - 1];
    }
    function goToStep(step) {
        const targetIndex = STEP_ORDER.indexOf(step);
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (targetIndex === -1) {
            return;
        }
        if (targetIndex < currentIndex) {
            currentStep = step;
            return;
        }
        if (targetIndex === currentIndex + 1 && canProceed) {
            currentStep = step;
            return;
        }
    }
    function buildSubmission() {
        return {
            categories: {
                essential: true,
                preferences: false,
                functional: false,
                tracking: categories.tracking,
                performance: false
            },
            preciseLocation,
            ageVerified,
            optionalHandle,
            preferences: {
                theme: preferences.theme,
                darkMode: preferences.darkMode
            },
            resetToDefaults: false
        };
    }
    return {
        // State
        get categories() {
            return categories;
        },
        set categories(v) {
            categories = v;
        },
        get preciseLocation() {
            return preciseLocation;
        },
        set preciseLocation(v) {
            preciseLocation = v;
        },
        get ageVerified() {
            return ageVerified;
        },
        set ageVerified(v) {
            ageVerified = v;
        },
        get optionalHandle() {
            return optionalHandle;
        },
        set optionalHandle(v) {
            optionalHandle = v;
        },
        get preferences() {
            return preferences;
        },
        set preferences(v) {
            preferences = v;
        },
        get contentPageSettings() {
            return contentPageSettings;
        },
        set contentPageSettings(v) {
            contentPageSettings = v;
        },
        get currentStep() {
            return currentStep;
        },
        set currentStep(v) {
            currentStep = v;
        },
        // Derived
        get canSubmit() {
            return canSubmit;
        },
        get hasPreferenceConsent() {
            return hasPreferenceConsent;
        },
        get isReturningVisitor() {
            return isReturningVisitor;
        },
        get completedSteps() {
            return completedSteps;
        },
        get canGoBack() {
            return canGoBack;
        },
        get canProceed() {
            return canProceed;
        },
        // Actions
        restoreFromTempo,
        resetToDefaults,
        nextStep,
        prevStep,
        goToStep,
        buildSubmission
    };
}
