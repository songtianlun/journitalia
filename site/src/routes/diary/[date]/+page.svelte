<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import MarkdownEditor from '$lib/components/editor/MarkdownEditor.svelte';
	import { getDiaryByDate } from '$lib/api/diaries';
	import { isAuthenticated } from '$lib/api/client';
	import {
		formatDisplayDate,
		getDayOfWeek,
		getPreviousDay,
		getNextDay,
		getToday,
		isToday
	} from '$lib/utils/date';
	import {
		diaryCache,
		syncState,
		updateLocalCache,
		updateFromServer,
		getCachedContent,
		forceSyncNow,
		hasDirtyCache
	} from '$lib/stores/diaryCache';

	let content = '';
	let loading = true;

	// Use reactive statement to always get current date from URL
	$: date = $page.params.date;
	$: canGoNext = !isToday(date);

	// Reactive sync status for current date
	$: currentDateIsDirty = date ? $diaryCache[date]?.isDirty || false : false;
	$: isSyncingCurrentDate = $syncState.isSyncing && $syncState.currentDate === date;

	// Navigation - use current page params directly
	function goToPreviousDay() {
		const prevDate = getPreviousDay($page.params.date);
		goto(`/diary/${prevDate}`);
	}

	function goToNextDay() {
		const currentDate = $page.params.date;
		if (isToday(currentDate)) return;
		const nextDate = getNextDay(currentDate);
		goto(`/diary/${nextDate}`);
	}

	function goToToday() {
		if (isToday($page.params.date)) return;
		goto(`/diary/${getToday()}`);
	}

	function goToCalendar() {
		goto('/diary');
	}

	// Load diary content
	async function loadDiary(targetDate: string) {
		// Immediately show cached content if available
		const cached = getCachedContent(targetDate);
		if (cached) {
			content = cached.content;
			// If dirty, don't fetch from server
			if (cached.isDirty) {
				loading = false;
				return;
			}
		} else {
			content = '';
		}

		loading = true;

		// Fetch from server
		const diary = await getDiaryByDate(targetDate);

		// Check if date changed during fetch
		if (targetDate !== date) {
			return;
		}

		// Update cache from server
		updateFromServer(targetDate, diary);

		// Get content from cache
		const updatedCache = getCachedContent(targetDate);
		content = updatedCache?.content || '';
		loading = false;
	}

	// Auto-save with debounce - update local cache
	function handleContentChange(newContent: string) {
		content = newContent;
		updateLocalCache(date, newContent);
	}

	// Manual save
	async function handleManualSave() {
		await forceSyncNow();
	}

	// Keyboard shortcuts
	function handleKeyboard(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			handleManualSave();
		}
	}

	onMount(() => {
		// Check authentication
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}

		window.addEventListener('keydown', handleKeyboard);

		return () => {
			window.removeEventListener('keydown', handleKeyboard);
		};
	});

	// Reload when date changes
	let previousDate = '';
	$: if (date && date !== previousDate) {
		previousDate = date;
		loadDiary(date);
	}
</script>

<svelte:head>
	<title>{formatDisplayDate(date)} - Diaria</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-4xl mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<!-- Navigation -->
				<div class="flex items-center gap-2">
					<button
						on:click={goToPreviousDay}
						disabled={loading}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						title="Previous day"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>

					<button
						on:click={goToNextDay}
						disabled={loading || !canGoNext}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						title={canGoNext ? "Next day" : "Cannot go beyond today"}
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</button>

					<button
						on:click={goToCalendar}
						disabled={loading}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						title="Calendar"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</button>
				</div>

				<!-- Date Display -->
				<div class="flex-1 text-center">
					<h1 class="text-xl font-semibold text-gray-900">
						{formatDisplayDate(date)}
					</h1>
					<p class="text-sm text-gray-500">
						{getDayOfWeek(date)}
						{#if isToday(date)}
							<span class="text-blue-600 font-medium">• Today</span>
						{/if}
					</p>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-3">
					<!-- Sync Status Icon -->
					<div class="flex items-center" title={isSyncingCurrentDate ? 'Syncing...' : currentDateIsDirty ? 'Unsaved changes' : 'Synced'}>
						{#if isSyncingCurrentDate}
							<!-- Syncing: spinning ring -->
							<svg class="w-5 h-5 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="40 20" stroke-linecap="round"></circle>
							</svg>
						{:else if currentDateIsDirty}
							<!-- Dirty: pencil edit icon -->
							<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
							</svg>
						{:else}
							<!-- Synced: cloud check -->
							<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
							</svg>
						{/if}
					</div>

					{#if !isToday(date)}
						<button
							on:click={goToToday}
							class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							Today
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- Editor -->
	<main class="max-w-4xl mx-auto px-4 py-8">
		{#if loading}
			<div class="flex flex-col items-center justify-center py-20 gap-3">
				<svg class="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<div class="text-gray-500">Loading diary...</div>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<MarkdownEditor
					{content}
					onChange={handleContentChange}
					placeholder="What's on your mind today?"
				/>
			</div>
		{/if}
	</main>

	<!-- Footer hint -->
	<footer class="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
		Press <kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl+S</kbd> or
		<kbd class="px-2 py-1 bg-gray-100 rounded">⌘S</kbd> to save manually
	</footer>
</div>

<style>
	kbd {
		font-family: monospace;
		font-size: 0.875em;
	}
</style>
