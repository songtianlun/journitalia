<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getToday } from '$lib/utils/date';

	onMount(() => {
		// Redirect to today's diary (using local timezone)
		goto(`/diary/${getToday()}`);
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	<p class="text-muted-foreground">Loading...</p>
</div>
