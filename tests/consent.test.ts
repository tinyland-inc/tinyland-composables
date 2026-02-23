






import { describe, it, expect } from 'vitest';
import type {
	ConsentCategories,
	ConsentStep,
	ConsentSubmission,
	RestorableSettings
} from '../src/types.js';

describe('Consent State - categories', () => {
	it('should have essential always true in default state', () => {
		const defaults: ConsentCategories = {
			essential: true,
			preferences: false,
			functional: false,
			tracking: false,
			performance: false
		};

		expect(defaults.essential).toBe(true);
		expect(defaults.preferences).toBe(false);
		expect(defaults.functional).toBe(false);
		expect(defaults.tracking).toBe(false);
		expect(defaults.performance).toBe(false);
	});

	it('should allow toggling individual categories', () => {
		const categories: ConsentCategories = {
			essential: true,
			preferences: false,
			functional: false,
			tracking: false,
			performance: false
		};

		categories.tracking = true;

		expect(categories.tracking).toBe(true);
		expect(categories.preferences).toBe(false);
	});
});

describe('Consent State - step navigation', () => {
	const STEP_ORDER: ConsentStep[] = ['welcome', 'privacy', 'preferences'];

	it('should define correct step order', () => {
		expect(STEP_ORDER).toEqual(['welcome', 'privacy', 'preferences']);
		expect(STEP_ORDER.length).toBe(3);
	});

	it('should calculate completed steps correctly', () => {
		function getCompletedSteps(currentStep: ConsentStep): ConsentStep[] {
			const currentIndex = STEP_ORDER.indexOf(currentStep);
			if (currentIndex === -1) return [];
			return STEP_ORDER.slice(0, currentIndex);
		}

		expect(getCompletedSteps('welcome')).toEqual([]);
		expect(getCompletedSteps('privacy')).toEqual(['welcome']);
		expect(getCompletedSteps('preferences')).toEqual(['welcome', 'privacy']);
	});

	it('should determine canGoBack correctly', () => {
		function canGoBack(step: ConsentStep): boolean {
			return step === 'privacy' || step === 'preferences';
		}

		expect(canGoBack('welcome')).toBe(false);
		expect(canGoBack('privacy')).toBe(true);
		expect(canGoBack('preferences')).toBe(true);
	});

	it('should determine canProceed based on step', () => {
		function canProceed(step: ConsentStep, ageVerified: boolean): boolean {
			switch (step) {
				case 'welcome':
					return true;
				case 'privacy':
					return ageVerified;
				case 'preferences':
					return false;
				default:
					return false;
			}
		}

		expect(canProceed('welcome', false)).toBe(true);
		expect(canProceed('privacy', false)).toBe(false);
		expect(canProceed('privacy', true)).toBe(true);
		expect(canProceed('preferences', true)).toBe(false);
	});

	it('should navigate forward only when allowed', () => {
		let currentStep: ConsentStep = 'welcome';

		function nextStep(ageVerified: boolean) {
			const currentIndex = STEP_ORDER.indexOf(currentStep);
			if (currentIndex === -1 || currentIndex === STEP_ORDER.length - 1) return;

			
			if (currentStep === 'privacy' && !ageVerified) return;

			currentStep = STEP_ORDER[currentIndex + 1];
		}

		nextStep(false); 
		expect(currentStep).toBe('privacy');

		nextStep(false); 
		expect(currentStep).toBe('privacy');

		nextStep(true); 
		expect(currentStep).toBe('preferences');

		nextStep(true); 
		expect(currentStep).toBe('preferences');
	});

	it('should navigate backward freely', () => {
		let currentStep: ConsentStep = 'preferences';

		function prevStep() {
			const currentIndex = STEP_ORDER.indexOf(currentStep);
			if (currentIndex <= 0) return;
			currentStep = STEP_ORDER[currentIndex - 1];
		}

		prevStep();
		expect(currentStep).toBe('privacy');

		prevStep();
		expect(currentStep).toBe('welcome');

		prevStep();
		expect(currentStep).toBe('welcome'); 
	});
});

describe('Consent State - submission building', () => {
	it('should build correct submission payload', () => {
		const categories: ConsentCategories = {
			essential: true,
			preferences: false,
			functional: false,
			tracking: true,
			performance: false
		};

		const submission: ConsentSubmission = {
			categories: {
				essential: true,
				preferences: false,
				functional: false,
				tracking: categories.tracking,
				performance: false
			},
			preciseLocation: false,
			ageVerified: true,
			optionalHandle: 'jessie',
			preferences: {
				theme: 'trans',
				darkMode: 'dark'
			},
			resetToDefaults: false
		};

		expect(submission.categories.essential).toBe(true);
		expect(submission.categories.tracking).toBe(true);
		expect(submission.categories.preferences).toBe(false);
		expect(submission.ageVerified).toBe(true);
		expect(submission.optionalHandle).toBe('jessie');
		expect(submission.preferences.theme).toBe('trans');
	});
});

describe('Consent State - restore from Tempo', () => {
	it('should restore consent categories from settings', () => {
		const settings: RestorableSettings = {
			lastKnownLocation: {
				city: 'Ithaca',
				country: 'United States',
				latitude: 42.44,
				longitude: -76.50
			},
			deviceContext: {
				deviceType: 'desktop',
				browserName: 'Firefox',
				browserVersion: '130.0',
				os: 'Linux'
			},
			lastVisit: {
				pathname: '/',
				timestamp: '2026-01-15T10:00:00Z',
				referrerHostname: null
			},
			userContext: {
				handle: 'jessie',
				role: 'admin'
			},
			a11yPreferences: {
				reducedMotion: false,
				highContrast: false,
				screenReaderDetected: false
			},
			preferences: {
				theme: 'pride',
				darkMode: 'dark',
				a11y: {
					reducedMotion: true,
					highContrast: false,
					fontSize: 'large'
				}
			},
			consentCategories: {
				essential: true,
				preferences: true,
				functional: false,
				tracking: true,
				performance: false
			}
		};

		
		let categories: ConsentCategories = {
			essential: true,
			preferences: false,
			functional: false,
			tracking: false,
			performance: false
		};

		if (settings.consentCategories) {
			categories = { ...settings.consentCategories };
		}

		expect(categories.preferences).toBe(true);
		expect(categories.tracking).toBe(true);
		expect(categories.functional).toBe(false);
	});

	it('should restore theme preferences', () => {
		const settings: RestorableSettings = {
			lastKnownLocation: { city: null, country: 'US', latitude: null, longitude: null },
			deviceContext: { deviceType: 'mobile', browserName: 'Chrome', browserVersion: '120', os: 'Android' },
			lastVisit: { pathname: '/', timestamp: '', referrerHostname: null },
			userContext: { handle: null, role: null },
			a11yPreferences: { reducedMotion: false, highContrast: false, screenReaderDetected: false },
			preferences: {
				theme: 'catppuccin',
				darkMode: 'system'
			}
		};

		let theme = 'trans';
		let darkMode: 'light' | 'dark' | 'system' = 'system';

		if (settings.preferences?.theme) {
			theme = settings.preferences.theme;
		}
		if (settings.preferences?.darkMode) {
			darkMode = settings.preferences.darkMode;
		}

		expect(theme).toBe('catppuccin');
		expect(darkMode).toBe('system');
	});
});
