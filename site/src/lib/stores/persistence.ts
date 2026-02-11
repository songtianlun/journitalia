import { browser } from '$app/environment';

const STORAGE_KEY = 'diarum_diary_cache';

export interface PersistedEntry {
	date: string;
	content: string;
	localUpdatedAt: number;
	serverUpdatedAt: string | null;
	isDirty: boolean;
}

export interface PersistedData {
	entries: { [date: string]: PersistedEntry };
	version: number;
}

const CURRENT_VERSION = 1;

/**
 * Load persisted data from localStorage
 */
export function loadPersistedData(): PersistedData {
	if (!browser) {
		return { entries: {}, version: CURRENT_VERSION };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { entries: {}, version: CURRENT_VERSION };
		}

		const data = JSON.parse(stored) as PersistedData;

		// Handle version migrations if needed
		if (!data.version || data.version < CURRENT_VERSION) {
			return migrateData(data);
		}

		return data;
	} catch (e) {
		console.error('Failed to load persisted diary data:', e);
		return { entries: {}, version: CURRENT_VERSION };
	}
}

/**
 * Save data to localStorage
 */
export function savePersistedData(data: PersistedData): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.error('Failed to persist diary data:', e);
	}
}

/**
 * Save a single entry to persistence
 */
export function persistEntry(entry: PersistedEntry): void {
	const data = loadPersistedData();
	data.entries[entry.date] = entry;
	savePersistedData(data);
}

/**
 * Save multiple entries to persistence (batch operation)
 */
export function persistEntries(entries: PersistedEntry[]): void {
	if (entries.length === 0) return;
	const data = loadPersistedData();
	for (const entry of entries) {
		data.entries[entry.date] = entry;
	}
	savePersistedData(data);
}

/**
 * Remove an entry from persistence
 */
export function removePersistedEntry(date: string): void {
	const data = loadPersistedData();
	delete data.entries[date];
	savePersistedData(data);
}

/**
 * Remove multiple entries from persistence (batch operation)
 */
export function removePersistedEntries(dates: string[]): void {
	if (dates.length === 0) return;
	const data = loadPersistedData();
	for (const date of dates) {
		delete data.entries[date];
	}
	savePersistedData(data);
}

/**
 * Get all persisted entries
 */
export function getAllPersistedEntries(): { [date: string]: PersistedEntry } {
	return loadPersistedData().entries;
}

/**
 * Get a single persisted entry
 */
export function getPersistedEntry(date: string): PersistedEntry | null {
	const data = loadPersistedData();
	return data.entries[date] || null;
}

/**
 * Clear all persisted data
 */
export function clearAllPersistedData(): void {
	if (!browser) return;
	localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get count of dirty (unsynced) entries
 */
export function getDirtyEntryCount(): number {
	const data = loadPersistedData();
	return Object.values(data.entries).filter(e => e.isDirty).length;
}

/**
 * Get all dirty entries
 */
export function getDirtyPersistedEntries(): PersistedEntry[] {
	const data = loadPersistedData();
	return Object.values(data.entries).filter(e => e.isDirty);
}

/**
 * Migrate data from older versions
 */
function migrateData(data: PersistedData): PersistedData {
	// For now, just update version
	return {
		...data,
		version: CURRENT_VERSION
	};
}

/**
 * Check if date is within cache range
 */
export function isInCacheRange(date: string, cacheDays: number): boolean {
	const entryDate = new Date(date);
	const now = new Date();
	const diffTime = now.getTime() - entryDate.getTime();
	const diffDays = diffTime / (1000 * 60 * 60 * 24);
	return diffDays <= cacheDays;
}

/**
 * Clean up entries outside cache range that are already synced
 */
export function cleanupOldEntries(cacheDays: number): number {
	const data = loadPersistedData();
	let removedCount = 0;

	for (const [date, entry] of Object.entries(data.entries)) {
		// Only remove synced entries outside cache range
		if (!entry.isDirty && !isInCacheRange(date, cacheDays)) {
			delete data.entries[date];
			removedCount++;
		}
	}

	if (removedCount > 0) {
		savePersistedData(data);
	}

	return removedCount;
}
