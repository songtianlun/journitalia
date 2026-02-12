// PWA utility functions
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store for installation prompt
export const deferredPrompt = writable<BeforeInstallPromptEvent | null>(null);
export const canInstall = writable(false);
export const isUpdateAvailable = writable(false);

// iOS detection and install guide
export const isIOS = writable(false);
export const isAndroid = writable(false);
export const showIOSInstallGuide = writable(false);

// Service Worker registration
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

// Detect platform
export function detectPlatform() {
	if (typeof window === 'undefined') return;

	const ua = window.navigator.userAgent;
	const isIOSDevice = /iPad|iPhone|iPod/.test(ua) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	const isAndroidDevice = /Android/.test(ua);

	isIOS.set(isIOSDevice);
	isAndroid.set(isAndroidDevice);

	return { isIOS: isIOSDevice, isAndroid: isAndroidDevice };
}

// Check if running as standalone PWA
export function isStandalone() {
	if (typeof window === 'undefined') return false;

	return window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as any).standalone === true;
}

// Register Service Worker
async function registerServiceWorker() {
	if (!browser) return;

	try {
		const { registerSW } = await import('virtual:pwa-register');
		updateSW = registerSW({
			immediate: true,
			onNeedRefresh() {
				isUpdateAvailable.set(true);
				console.log('PWA: New content available, refresh needed');
			},
			onOfflineReady() {
				console.log('PWA: App ready to work offline');
			},
			onRegistered(registration) {
				console.log('PWA: Service Worker registered', registration);
			},
			onRegisterError(error) {
				console.error('PWA: Service Worker registration failed', error);
			}
		});
	} catch (error) {
		console.error('PWA: Failed to register service worker', error);
	}
}

// Initialize PWA features
export function initPWA() {
	if (typeof window === 'undefined') return;

	const platform = detectPlatform();

	// Register Service Worker
	registerServiceWorker();

	// If already installed as standalone, don't show install prompts
	if (isStandalone()) {
		canInstall.set(false);
		return;
	}

	// Listen for beforeinstallprompt event (Chrome/Edge/Android)
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		deferredPrompt.set(e as BeforeInstallPromptEvent);
		canInstall.set(true);
	});

	// Listen for app installed event
	window.addEventListener('appinstalled', () => {
		deferredPrompt.set(null);
		canInstall.set(false);
		showIOSInstallGuide.set(false);
		console.log('PWA installed successfully');
	});

	// For iOS, show install guide after a delay (since beforeinstallprompt won't fire)
	if (platform?.isIOS) {
		// Check if user has dismissed the guide before
		const dismissed = localStorage.getItem('pwa-ios-guide-dismissed');
		if (!dismissed) {
			setTimeout(() => {
				if (!isStandalone()) {
					showIOSInstallGuide.set(true);
				}
			}, 3000);
		}
	}
}

// Dismiss iOS install guide
export function dismissIOSGuide(remember = false) {
	showIOSInstallGuide.set(false);
	if (remember) {
		localStorage.setItem('pwa-ios-guide-dismissed', 'true');
	}
}

// Trigger installation prompt
export async function installPWA() {
	const prompt = get(deferredPrompt);

	if (!prompt) {
		console.log('Installation prompt not available');
		return false;
	}

	await prompt.prompt();
	const { outcome } = await prompt.userChoice;

	if (outcome === 'accepted') {
		console.log('User accepted the install prompt');
		deferredPrompt.set(null);
		canInstall.set(false);
		return true;
	} else {
		console.log('User dismissed the install prompt');
		return false;
	}
}

// Check for service worker updates
export function checkForUpdates() {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

	navigator.serviceWorker.ready.then((registration) => {
		registration.update();
	});
}

// Listen for service worker updates
export function listenForUpdates() {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

	navigator.serviceWorker.addEventListener('controllerchange', () => {
		isUpdateAvailable.set(true);
	});

	// Check for updates every 60 minutes
	setInterval(() => {
		checkForUpdates();
	}, 60 * 60 * 1000);
}

// Reload to apply updates
export function applyUpdate() {
	window.location.reload();
}
