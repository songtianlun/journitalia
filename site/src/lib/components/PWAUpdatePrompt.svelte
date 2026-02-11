<script lang="ts">
	import { isUpdateAvailable, applyUpdate } from '$lib/utils/pwa';
	import { onMount } from 'svelte';

	let showUpdate = false;

	onMount(() => {
		const unsubscribe = isUpdateAvailable.subscribe((value) => {
			showUpdate = value;
		});

		return unsubscribe;
	});

	function handleUpdate() {
		applyUpdate();
	}

	function dismiss() {
		showUpdate = false;
		isUpdateAvailable.set(false);
	}
</script>

{#if showUpdate}
	<div class="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-down">
		<div class="bg-blue-50 dark:bg-blue-900 rounded-lg shadow-lg p-4 border border-blue-200 dark:border-blue-700">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<svg
						class="w-6 h-6 text-blue-500 dark:text-blue-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-blue-900 dark:text-blue-100">Update Available</h3>
					<p class="mt-1 text-sm text-blue-700 dark:text-blue-200">
						Click update to get the latest features and improvements
					</p>
					<div class="mt-3 flex gap-2">
						<button
							type="button"
							on:click={handleUpdate}
							class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
						>
							Update Now
						</button>
						<button
							type="button"
							on:click={dismiss}
							class="px-4 py-2 bg-white dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm font-medium rounded-md hover:bg-blue-50 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
						>
							Later
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-down {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-down {
		animation: slide-down 0.3s ease-out;
	}
</style>
