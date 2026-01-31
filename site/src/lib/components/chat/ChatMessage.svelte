<script lang="ts">
	import type { Message } from '$lib/api/chat';
	import type { Diary } from '$lib/api/client';
	import { getDiariesByIds } from '$lib/api/diaries';
	import { goto } from '$app/navigation';
	import { marked } from 'marked';

	export let message: Message;
	export let isStreaming = false;

	let expanded = false;

	// Configure marked for safe rendering
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	function renderMarkdown(content: string): string {
		if (!content) return '';
		return marked.parse(content) as string;
	}
	let diaries: Diary[] = [];
	let loading = false;
	let loaded = false;

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatDiaryDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
	}

	function truncateContent(content: string, maxLength: number = 80): string {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}

	async function toggleExpanded() {
		expanded = !expanded;
		if (expanded && !loaded && message.referenced_diaries) {
			loading = true;
			try {
				diaries = await getDiariesByIds(message.referenced_diaries);
				loaded = true;
			} catch (error) {
				console.error('Failed to load diaries:', error);
			} finally {
				loading = false;
			}
		}
	}

	function navigateToDiary(date: string) {
		goto(`/diary/${date}`);
	}
</script>

<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4">
	<div class="max-w-[80%] {message.role === 'user' ? 'order-2' : 'order-1'}">
		<div
			class="rounded-2xl px-4 py-3 {message.role === 'user'
				? 'bg-primary text-primary-foreground rounded-br-md'
				: 'bg-muted text-foreground rounded-bl-md'}"
		>
			{#if message.role === 'user'}
				<div class="whitespace-pre-wrap break-words text-sm">
					{message.content}
				</div>
			{:else}
				<div class="prose prose-sm dark:prose-invert max-w-none break-words markdown-content">
					{@html renderMarkdown(message.content)}
				</div>
				{#if isStreaming}
					<div class="flex justify-center mt-3 pt-2 border-t border-border/30">
						<div class="flex items-center gap-2 text-xs text-muted-foreground">
							<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Thinking...</span>
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<div class="flex items-center gap-2 mt-1 px-1 {message.role === 'user' ? 'justify-end' : 'justify-start'}">
			{#if message.created}
				<span class="text-xs text-muted-foreground">{formatDate(message.created)}</span>
			{/if}

			{#if message.referenced_diaries && message.referenced_diaries.length > 0}
				<button
					type="button"
					class="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
					on:click={toggleExpanded}
				>
					<svg
						class="w-3 h-3 transition-transform {expanded ? 'rotate-90' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
					Referenced {message.referenced_diaries.length} {message.referenced_diaries.length === 1 ? 'diary' : 'diaries'}
				</button>
			{/if}
		</div>

		{#if expanded && message.referenced_diaries && message.referenced_diaries.length > 0}
			<div class="mt-2 px-1 space-y-2">
				{#if loading}
					<div class="text-xs text-muted-foreground">Loading...</div>
				{:else}
					{#each diaries as diary}
						<button
							type="button"
							class="w-full text-left p-2 rounded-lg bg-background/50 border border-border/50 hover:border-border hover:bg-background transition-colors"
							on:click={() => navigateToDiary(diary.date)}
						>
							<div class="text-xs font-medium text-foreground">{formatDiaryDate(diary.date)}</div>
							<div class="text-xs text-muted-foreground mt-1 line-clamp-2">
								{truncateContent(diary.content)}
							</div>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.markdown-content :global(h1) {
		font-size: 1.25rem;
		font-weight: 700;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	.markdown-content :global(h2) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 0.875rem;
		margin-bottom: 0.375rem;
	}

	.markdown-content :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin-top: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.markdown-content :global(p) {
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}

	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin-left: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.markdown-content :global(ul) {
		list-style-type: disc;
	}

	.markdown-content :global(ol) {
		list-style-type: decimal;
	}

	.markdown-content :global(li) {
		margin-bottom: 0.25rem;
		line-height: 1.5;
	}

	.markdown-content :global(strong) {
		font-weight: 600;
	}

	.markdown-content :global(em) {
		font-style: italic;
	}

	.markdown-content :global(code) {
		background-color: hsl(var(--background) / 0.5);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
		font-family: ui-monospace, monospace;
	}

	.markdown-content :global(pre) {
		background-color: hsl(var(--background) / 0.5);
		padding: 0.75rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 0.5rem;
	}

	.markdown-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.markdown-content :global(blockquote) {
		border-left: 3px solid hsl(var(--border));
		padding-left: 0.75rem;
		margin-left: 0;
		margin-bottom: 0.5rem;
		opacity: 0.9;
	}

	.markdown-content :global(a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}

	.markdown-content :global(hr) {
		border: none;
		border-top: 1px solid hsl(var(--border));
		margin: 0.75rem 0;
	}
</style>
