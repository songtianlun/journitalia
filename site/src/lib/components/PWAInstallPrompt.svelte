<script lang="ts">
	import { canInstall, installPWA } from '$lib/utils/pwa';
	import { onMount } from 'svelte';

	let showPrompt = false;
	let installing = false;

	onMount(() => {
		const unsubscribe = canInstall.subscribe((value) => {
			showPrompt = value;
		});

		return unsubscribe;
	});

	async function handleInstall() {
		installing = true;
		try {
			await installPWA();
		} finally {
			installing = false;
		}
	}

	function dismiss() {
		showPrompt = false;
	}
</script>

{#if showPrompt}
	<div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<svg
						class="w-8 h-8 text-blue-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Install Diarum</h3>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Install the app on your home screen for faster access and offline use
					</p>
					<div class="mt-3 flex gap-2">
						<button
							type="button"
							on:click={handleInstall}
							disabled={installing}
							class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{installing ? 'Installing...' : 'Install'}
						</button>
						<button
							type="button"
							on:click={dismiss}
							class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
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
	@keyframes slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
