<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		cacheStats,
		syncState,
		forceSyncNow,
		clearSyncedCache,
		initDiaryCache,
		runCacheCleanup,
		preCacheDiaries,
		preCacheState
	} from '$lib/stores/diaryCache';
	import { onlineState, checkOnlineStatus } from '$lib/stores/onlineStatus';
	import { syncConfig, setAutoSaveInterval, setCacheDays } from '$lib/stores/syncConfig';
	import { getSyncSettings, saveSyncSettings } from '$lib/api/settings';

	let syncing = false;
	let clearing = false;
	let saving = false;
	let autoSaveSeconds = 3;
	let cacheDaysValue = 30;
	let hasChanges = false;
	let refreshInterval: ReturnType<typeof setInterval> | null = null;
	let tick = 0; // Used to force re-render for relative time updates

	// Track original values to detect changes
	let originalAutoSaveSeconds = 3;
	let originalCacheDaysValue = 30;

	// Format relative time
	function formatRelativeTime(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes} min ago`;
		if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		return `${days} day${days > 1 ? 's' : ''} ago`;
	}

	// Format date for display
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (dateStr === today.toISOString().split('T')[0]) {
			return 'Today';
		}
		if (dateStr === yesterday.toISOString().split('T')[0]) {
			return 'Yesterday';
		}
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	async function handleSyncNow() {
		syncing = true;
		await forceSyncNow();
		syncing = false;
	}

	function handleClearCache() {
		if (!confirm('Clear all synced entries from cache? Unsynced entries will be preserved.')) {
			return;
		}
		clearing = true;
		clearSyncedCache();
		clearing = false;
	}

	async function handlePreCache() {
		await preCacheDiaries();
	}

	function handleAutoSaveChange() {
		setAutoSaveInterval(autoSaveSeconds * 1000);
		hasChanges = autoSaveSeconds !== originalAutoSaveSeconds || cacheDaysValue !== originalCacheDaysValue;
	}

	function handleCacheDaysChange() {
		setCacheDays(cacheDaysValue);
		runCacheCleanup();
		hasChanges = autoSaveSeconds !== originalAutoSaveSeconds || cacheDaysValue !== originalCacheDaysValue;
	}

	async function handleSaveSettings() {
		saving = true;
		const success = await saveSyncSettings({
			autoSaveInterval: autoSaveSeconds * 1000,
			cacheDays: cacheDaysValue
		});
		if (success) {
			originalAutoSaveSeconds = autoSaveSeconds;
			originalCacheDaysValue = cacheDaysValue;
			hasChanges = false;
		}
		saving = false;
	}

	// Refresh config from store and update tick for relative time
	function refreshConfig() {
		tick++; // Force re-render to update relative times
	}

	async function loadSettingsFromBackend() {
		const settings = await getSyncSettings();
		autoSaveSeconds = settings.autoSaveInterval / 1000;
		cacheDaysValue = settings.cacheDays;
		originalAutoSaveSeconds = autoSaveSeconds;
		originalCacheDaysValue = cacheDaysValue;
		// Also update local store
		setAutoSaveInterval(settings.autoSaveInterval);
		setCacheDays(settings.cacheDays);
	}

	onMount(async () => {
		// initDiaryCache is idempotent, safe to call multiple times
		initDiaryCache();

		// Load settings from backend
		await loadSettingsFromBackend();

		// Periodically refresh relative times (every 1 second for smoother updates)
		refreshInterval = setInterval(refreshConfig, 1000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	});

	$: pendingEntries = $cacheStats.entries.filter(e => e.isDirty);
</script>

<div class="space-y-4">
	<!-- Online Status -->
	<div class="flex items-center justify-between py-3 border-b border-border/50">
		<div>
			<div class="font-medium text-foreground">Online Status</div>
			<div class="text-sm text-muted-foreground">Connection to server</div>
		</div>
		<div class="flex items-center gap-2">
			{#if $onlineState.checking}
				<svg class="w-4 h-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{:else if $onlineState.isOnline}
				<span class="flex items-center gap-1.5 text-green-600">
					<span class="w-2 h-2 rounded-full bg-green-500"></span>
					Online
				</span>
			{:else}
				<span class="flex items-center gap-1.5 text-amber-600">
					<span class="w-2 h-2 rounded-full bg-amber-500"></span>
					Offline
				</span>
			{/if}
			<button
				on:click={() => checkOnlineStatus()}
				class="p-1 hover:bg-muted/50 rounded transition-colors"
				title="Check connection"
			>
				<svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Auto-save Interval -->
	<div class="py-3 border-b border-border/50">
		<div class="flex items-center justify-between mb-2">
			<div>
				<div class="font-medium text-foreground">Auto-save Interval</div>
				<div class="text-sm text-muted-foreground">How often to sync changes</div>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="number"
					bind:value={autoSaveSeconds}
					on:change={handleAutoSaveChange}
					min="1"
					max="60"
					class="w-16 px-2 py-1 text-sm bg-muted rounded-lg text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
				/>
				<span class="text-sm text-muted-foreground">seconds</span>
			</div>
		</div>
	</div>

	<!-- Cache Days -->
	<div class="py-3 border-b border-border/50">
		<div class="flex items-center justify-between mb-2">
			<div>
				<div class="font-medium text-foreground">Cache Duration</div>
				<div class="text-sm text-muted-foreground">Keep recent entries locally</div>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="number"
					bind:value={cacheDaysValue}
					on:change={handleCacheDaysChange}
					min="1"
					max="30"
					class="w-16 px-2 py-1 text-sm bg-muted rounded-lg text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
				/>
				<span class="text-sm text-muted-foreground">days</span>
			</div>
		</div>
	</div>

	<!-- Cache Statistics -->
	<div class="py-3 border-b border-border/50">
		<div class="font-medium text-foreground mb-2">Cache Statistics</div>
		<div class="flex gap-6 text-sm">
			<div>
				<span class="text-muted-foreground">Total cached:</span>
				<span class="font-medium text-foreground ml-1">{$cacheStats.totalCached}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Pending sync:</span>
				<span class="font-medium {$cacheStats.pendingSync > 0 ? 'text-amber-600' : 'text-foreground'} ml-1">
					{$cacheStats.pendingSync}
				</span>
			</div>
		</div>
	</div>

	<!-- Pending Items -->
	{#if pendingEntries.length > 0}
		<div class="py-3 border-b border-border/50">
			<div class="font-medium text-foreground mb-2">Pending Items</div>
			<div class="space-y-2 max-h-40 overflow-y-auto">
				{#each pendingEntries as entry}
					<div class="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
						<div class="flex items-center gap-2">
							<span class="w-2 h-2 rounded-full bg-amber-500"></span>
							<span class="font-medium text-foreground">{entry.date}</span>
							<span class="text-muted-foreground">({formatDate(entry.date)})</span>
						</div>
						<span class="text-xs text-muted-foreground">
							{formatRelativeTime(entry.localUpdatedAt)}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Sync Status -->
	{#if $syncState.status !== 'idle'}
		<div class="py-3 border-b border-border/50">
			<div class="flex items-center gap-2 text-sm">
				{#if $syncState.status === 'saving'}
					<svg class="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span class="text-muted-foreground">{$syncState.message}</span>
				{:else if $syncState.status === 'saved'}
					<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
					<span class="text-green-600">{$syncState.message}</span>
				{:else if $syncState.status === 'error'}
					<svg class="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span class="text-destructive">{$syncState.message}</span>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Actions -->
	<div class="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-3 pt-2">
		<button
			on:click={handleSaveSettings}
			disabled={saving || !hasChanges}
			class="px-3 sm:px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
		>
			{#if saving}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			{/if}
			Save
		</button>
		<button
			on:click={handleSyncNow}
			disabled={syncing || $cacheStats.pendingSync === 0}
			class="px-3 sm:px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
		>
			{#if syncing}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			{/if}
			Sync
		</button>
		<button
			on:click={handlePreCache}
			disabled={$preCacheState.isRunning}
			class="px-3 sm:px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
			title="Pre-cache diaries for the configured duration"
		>
			{#if $preCacheState.isRunning}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
			{/if}
			Pre-cache
		</button>
		<button
			on:click={handleClearCache}
			disabled={clearing || $cacheStats.totalCached === 0}
			class="px-3 sm:px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
			</svg>
			Clear
		</button>
	</div>

	{#if $preCacheState.message}
		<div class="text-sm text-muted-foreground mt-2">
			{$preCacheState.message}
		</div>
	{/if}
</div>
