<script lang="ts">
	export let title: string;
	export let backHref: string = '/diary';
	export let showBack: boolean = true;
	export let sticky: boolean = true;
	export let subtitle: string = '';
</script>

<header class="glass border-b border-border/50 flex-shrink-0 z-20 {sticky ? 'sticky top-0' : ''}">
	<div class="max-w-4xl mx-auto px-4 h-11">
		<div class="flex items-center justify-between h-full">
			<div class="flex items-center gap-2">
				<a href="/" class="text-lg font-semibold text-foreground hover:text-primary transition-colors">
					Journitalia
				</a>
				{#if showBack}
					<span class="text-muted-foreground/50">/</span>
					<a
						href={backHref}
						class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Diary
					</a>
				{/if}
				<span class="text-muted-foreground/50">/</span>
				<span class="text-sm font-medium text-muted-foreground">{title}</span>
				{#if subtitle}
					<span class="text-sm text-muted-foreground">{subtitle}</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<slot name="actions" />
			</div>
		</div>
	</div>
</header>
