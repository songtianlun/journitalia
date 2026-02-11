<script lang="ts">
	import '../app.css';
	import { onMount, type Snippet } from 'svelte';
	import { initTheme } from '$lib/stores/theme';
	import { initPWA, listenForUpdates } from '$lib/utils/pwa';
	import PWAInstallPrompt from '$lib/components/PWAInstallPrompt.svelte';
	import PWAUpdatePrompt from '$lib/components/PWAUpdatePrompt.svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		initTheme();
		initPWA();
		listenForUpdates();
	});
</script>

<PWAInstallPrompt />
<PWAUpdatePrompt />

{@render children()}
