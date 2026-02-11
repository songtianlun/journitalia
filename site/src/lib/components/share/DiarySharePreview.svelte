<script lang="ts">
	import { themes, type ShareOptions } from '$lib/utils/imageExport';
	import { formatDisplayDate, getDayOfWeek } from '$lib/utils/date';
	import { marked } from 'marked';

	export let date: string;
	export let content: string;
	export let options: ShareOptions;
	export let mood: string = '';
	export let weather: string = '';
	export let tags: string[] = [];

	$: theme = themes[options.theme];
	$: htmlContent = parseContent(content);

	function parseContent(rawContent: string): string {
		if (!rawContent) return '';

		// Convert TipTap JSON to HTML if needed, or use marked for markdown
		try {
			const parsed = JSON.parse(rawContent);
			if (parsed.type === 'doc') {
				return convertTiptapToHtml(parsed);
			}
		} catch {
			// Not JSON, treat as markdown
			return marked.parse(rawContent) as string;
		}
		return rawContent;
	}

	function convertTiptapToHtml(doc: any): string {
		if (!doc.content) return '';
		return doc.content.map((node: any) => nodeToHtml(node)).join('');
	}

	function nodeToHtml(node: any): string {
		switch (node.type) {
			case 'paragraph':
				const pContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<p>${pContent}</p>`;
			case 'heading':
				const level = node.attrs?.level || 1;
				const hContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<h${level}>${hContent}</h${level}>`;
			case 'text':
				let text = node.text || '';
				if (node.marks) {
					for (const mark of node.marks) {
						switch (mark.type) {
							case 'bold':
								text = `<strong>${text}</strong>`;
								break;
							case 'italic':
								text = `<em>${text}</em>`;
								break;
							case 'underline':
								text = `<u>${text}</u>`;
								break;
							case 'strike':
								text = `<s>${text}</s>`;
								break;
							case 'code':
								text = `<code>${text}</code>`;
								break;
							case 'link':
								text = `<a href="${mark.attrs?.href || '#'}">${text}</a>`;
								break;
							case 'highlight':
								text = `<mark>${text}</mark>`;
								break;
						}
					}
				}
				return text;
			case 'bulletList':
				const ulContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<ul>${ulContent}</ul>`;
			case 'orderedList':
				const olContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<ol>${olContent}</ol>`;
			case 'listItem':
				const liContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<li>${liContent}</li>`;
			case 'blockquote':
				const bqContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<blockquote>${bqContent}</blockquote>`;
			case 'codeBlock':
				const codeContent = node.content ? node.content.map((n: any) => n.text || '').join('') : '';
				return `<pre><code>${codeContent}</code></pre>`;
			case 'horizontalRule':
				return '<hr />';
			case 'image':
				if (!options.showImages) return '';
				const src = node.attrs?.src || '';
				const alt = node.attrs?.alt || '';
				return `<img src="${src}" alt="${alt}" />`;
			case 'taskList':
				const tlContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<ul class="task-list">${tlContent}</ul>`;
			case 'taskItem':
				const checked = node.attrs?.checked ? 'checked' : '';
				const tiContent = node.content ? node.content.map((n: any) => nodeToHtml(n)).join('') : '';
				return `<li class="task-item"><input type="checkbox" ${checked} disabled />${tiContent}</li>`;
			case 'hardBreak':
				return '<br />';
			default:
				if (node.content) {
					return node.content.map((n: any) => nodeToHtml(n)).join('');
				}
				return '';
		}
	}
</script>

<div
	class="share-preview"
	style="
		width: {options.width}px;
		background-color: {theme.background};
		color: {theme.foreground};
		font-family: {theme.fontFamily};
		padding: 32px;
		box-sizing: border-box;
	"
>
	<!-- Branding -->
	{#if options.showBranding}
		<div
			class="branding"
			style="
				display: flex;
				align-items: center;
				gap: 8px;
				padding-bottom: 16px;
				margin-bottom: 16px;
				border-bottom: 1px solid {theme.border};
			"
		>
			<img src="/logo.png" alt="Diarum" style="width: 24px; height: 24px;" />
			<span style="font-size: 18px; font-weight: 600;">Diarum</span>
		</div>
	{/if}

	<!-- Date -->
	{#if options.showDate}
		<div
			class="date-section"
			style="margin-bottom: 16px;"
		>
			<div style="font-size: 20px; font-weight: 600;">
				{formatDisplayDate(date)}
			</div>
			<div style="font-size: 14px; color: {theme.mutedForeground};">
				{getDayOfWeek(date)}
			</div>
		</div>
	{/if}

	<!-- Mood & Weather -->
	{#if (options.showMood && mood) || (options.showWeather && weather)}
		<div
			class="meta-section"
			style="
				display: flex;
				gap: 16px;
				margin-bottom: 16px;
				font-size: 14px;
				color: {theme.mutedForeground};
			"
		>
			{#if options.showWeather && weather}
				<span>{weather}</span>
			{/if}
			{#if options.showMood && mood}
				<span>{mood}</span>
			{/if}
		</div>
	{/if}

	<!-- Content -->
	<div
		class="content-section"
		style="
			line-height: 1.8;
			font-size: 16px;
		"
	>
		{@html htmlContent}
	</div>

	<!-- Tags -->
	{#if options.showTags && tags.length > 0}
		<div
			class="tags-section"
			style="
				margin-top: 24px;
				padding-top: 16px;
				border-top: 1px solid {theme.border};
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
			"
		>
			{#each tags as tag}
				<span
					style="
						font-size: 12px;
						padding: 4px 12px;
						background-color: {theme.accent}20;
						color: {theme.accent};
						border-radius: 16px;
					"
				>
					#{tag}
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.share-preview :global(p) {
		margin-bottom: 1em;
	}

	.share-preview :global(h1) {
		font-size: 1.75em;
		font-weight: 700;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}

	.share-preview :global(h2) {
		font-size: 1.5em;
		font-weight: 600;
		margin-top: 1.25em;
		margin-bottom: 0.5em;
	}

	.share-preview :global(h3) {
		font-size: 1.25em;
		font-weight: 600;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}

	.share-preview :global(ul),
	.share-preview :global(ol) {
		margin-left: 1.5em;
		margin-bottom: 1em;
	}

	.share-preview :global(ul) {
		list-style-type: disc;
	}

	.share-preview :global(ol) {
		list-style-type: decimal;
	}

	.share-preview :global(li) {
		margin-bottom: 0.35em;
	}

	.share-preview :global(blockquote) {
		border-left: 3px solid currentColor;
		padding-left: 1em;
		margin: 1em 0;
		opacity: 0.8;
		font-style: italic;
	}

	.share-preview :global(code) {
		background-color: rgba(0, 0, 0, 0.05);
		padding: 0.2em 0.4em;
		border-radius: 4px;
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
	}

	.share-preview :global(pre) {
		background-color: rgba(0, 0, 0, 0.05);
		padding: 1em;
		border-radius: 8px;
		overflow-x: auto;
		margin: 1em 0;
	}

	.share-preview :global(pre code) {
		background-color: transparent;
		padding: 0;
	}

	.share-preview :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 1em 0;
	}

	.share-preview :global(hr) {
		border: none;
		border-top: 1px solid currentColor;
		opacity: 0.2;
		margin: 1.5em 0;
	}

	.share-preview :global(mark) {
		background-color: rgba(255, 235, 59, 0.4);
		padding: 0.1em 0.2em;
		border-radius: 2px;
	}

	.share-preview :global(a) {
		color: inherit;
		text-decoration: underline;
	}

	.share-preview :global(.task-list) {
		list-style: none;
		margin-left: 0;
		padding-left: 0;
	}

	.share-preview :global(.task-item) {
		display: flex;
		align-items: flex-start;
		gap: 0.5em;
	}

	.share-preview :global(.task-item input) {
		margin-top: 0.3em;
	}
</style>
