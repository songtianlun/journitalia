<script lang="ts">
	import type { ShareOptions, ThemeId } from '$lib/utils/imageExport';
	import ThemeSelector from './ThemeSelector.svelte';

	export let options: ShareOptions;
	export let onChange: (options: ShareOptions) => void = () => {};

	function updateOption<K extends keyof ShareOptions>(key: K, value: ShareOptions[K]) {
		options = { ...options, [key]: value };
		onChange(options);
	}

	function handleThemeSelect(theme: ThemeId) {
		updateOption('theme', theme);
	}

	const widthOptions = [
		{ value: 600, label: '600px' },
		{ value: 800, label: '800px' },
		{ value: 1000, label: '1000px' },
		{ value: 1200, label: '1200px' }
	];

	const scaleOptions = [
		{ value: 1, label: '1x' },
		{ value: 2, label: '2x (Recommended)' },
		{ value: 3, label: '3x' }
	];
</script>

<div class="space-y-4">
	<!-- Theme Selection -->
	<div>
		<h4 class="text-sm font-medium text-foreground mb-2">Theme</h4>
		<ThemeSelector selected={options.theme} onSelect={handleThemeSelect} />
	</div>

	<!-- Display Options -->
	<div>
		<h4 class="text-sm font-medium text-foreground mb-2">Display</h4>
		<div class="space-y-2">
			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={options.showDate}
					on:change={(e) => updateOption('showDate', e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border text-primary focus:ring-primary"
				/>
				<span class="text-sm text-foreground">Show date</span>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={options.showImages}
					on:change={(e) => updateOption('showImages', e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border text-primary focus:ring-primary"
				/>
				<span class="text-sm text-foreground">Show images</span>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={options.showBranding}
					on:change={(e) => updateOption('showBranding', e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border text-primary focus:ring-primary"
				/>
				<span class="text-sm text-foreground">Show Diarum branding</span>
			</label>
		</div>
	</div>

	<!-- Size Options -->
	<div class="grid grid-cols-2 gap-4">
		<div>
			<h4 class="text-sm font-medium text-foreground mb-2">Width</h4>
			<select
				value={options.width}
				on:change={(e) => updateOption('width', parseInt(e.currentTarget.value))}
				class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
			>
				{#each widthOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
		<div>
			<h4 class="text-sm font-medium text-foreground mb-2">Quality</h4>
			<select
				value={options.scale}
				on:change={(e) => updateOption('scale', parseInt(e.currentTarget.value))}
				class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
			>
				{#each scaleOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
	</div>
</div>
