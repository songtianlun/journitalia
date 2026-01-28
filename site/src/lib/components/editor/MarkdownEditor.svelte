<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
	import { commonmark } from '@milkdown/preset-commonmark';
	import { nord } from '@milkdown/theme-nord';
	import { listener, listenerCtx } from '@milkdown/plugin-listener';

	export let content = '';
	export let onChange: (value: string) => void = () => {};
	export let placeholder = 'Start writing...';

	let editorContainer: HTMLDivElement;
	let editor: Editor | null = null;

	onMount(async () => {
		try {
			editor = await Editor.make()
				.config((ctx) => {
					ctx.set(rootCtx, editorContainer);
					ctx.set(defaultValueCtx, content);
					ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
						onChange(markdown);
					});
				})
				.use(nord)
				.use(commonmark)
				.use(listener)
				.create();
		} catch (error) {
			console.error('Failed to initialize editor:', error);
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	// Update editor content when prop changes
	$: if (editor && content !== undefined) {
		try {
			editor.action((ctx) => {
				const view = ctx.get(rootCtx);
				if (view) {
					const currentContent = editor?.action((ctx) => {
						return ctx.get(defaultValueCtx);
					});
					if (currentContent !== content) {
						// Only update if content is different to avoid cursor issues
						ctx.set(defaultValueCtx, content);
					}
				}
			});
		} catch (error) {
			console.error('Failed to update editor:', error);
		}
	}
</script>

<div class="markdown-editor">
	<div bind:this={editorContainer} class="editor-container" />
	{#if !content}
		<div class="editor-placeholder">
			{placeholder}
		</div>
	{/if}
</div>

<style>
	.markdown-editor {
		position: relative;
		width: 100%;
		min-height: 500px;
	}

	.editor-container {
		position: relative;
		width: 100%;
		min-height: 500px;
		font-size: 16px;
		line-height: 1.75;
	}

	.editor-placeholder {
		position: absolute;
		top: 16px;
		left: 16px;
		color: #94a3b8;
		pointer-events: none;
		font-size: 16px;
	}

	:global(.milkdown) {
		padding: 1rem;
		outline: none;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	:global(.milkdown .editor) {
		outline: none;
	}

	:global(.milkdown p) {
		margin-bottom: 1em;
	}

	:global(.milkdown h1) {
		font-size: 2em;
		font-weight: bold;
		margin-bottom: 0.5em;
		margin-top: 1em;
	}

	:global(.milkdown h2) {
		font-size: 1.5em;
		font-weight: bold;
		margin-bottom: 0.5em;
		margin-top: 0.75em;
	}

	:global(.milkdown h3) {
		font-size: 1.25em;
		font-weight: bold;
		margin-bottom: 0.5em;
		margin-top: 0.5em;
	}

	:global(.milkdown ul),
	:global(.milkdown ol) {
		margin-left: 1.5em;
		margin-bottom: 1em;
	}

	:global(.milkdown li) {
		margin-bottom: 0.25em;
	}

	:global(.milkdown code) {
		background-color: #f1f5f9;
		padding: 0.2em 0.4em;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
	}

	:global(.milkdown pre) {
		background-color: #1e293b;
		color: #e2e8f0;
		padding: 1em;
		border-radius: 6px;
		overflow-x: auto;
		margin-bottom: 1em;
	}

	:global(.milkdown pre code) {
		background-color: transparent;
		padding: 0;
		color: inherit;
	}

	:global(.milkdown blockquote) {
		border-left: 4px solid #cbd5e1;
		padding-left: 1em;
		margin-left: 0;
		margin-bottom: 1em;
		color: #64748b;
	}
</style>
