import { pb } from './client';

export interface ExportStats {
	diaries: number;
	media: number;
	media_failed: number;
	conversations: number;
	messages: number;
}

export interface ImportCounters {
	total: number;
	imported: number;
	skipped: number;
	failed: number;
}

export interface ImportStats {
	diaries: ImportCounters;
	media: ImportCounters;
	conversations: ImportCounters;
}

/**
 * Export all diary data as a ZIP file.
 * Triggers a browser download and returns export stats from the response header.
 */
export async function exportDiaries(): Promise<ExportStats> {
	const response = await fetch('/api/export', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${pb.authStore.token}`
		}
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || 'Export failed');
	}

	// 解析 stats header
	const statsRaw = response.headers.get('X-Export-Stats');
	const stats: ExportStats = statsRaw
		? JSON.parse(statsRaw)
		: { diaries: 0, media: 0, media_failed: 0, conversations: 0, messages: 0 };

	// Trigger browser download
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;

	// Generate filename with timestamp suffix
	const now = new Date();
	const timestamp = now.getFullYear().toString() +
		(now.getMonth() + 1).toString().padStart(2, '0') +
		now.getDate().toString().padStart(2, '0') +
		now.getHours().toString().padStart(2, '0') +
		now.getMinutes().toString().padStart(2, '0') +
		now.getSeconds().toString().padStart(2, '0');
	a.download = `diarum_export_${timestamp}.zip`;

	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	return stats;
}

/**
 * Import diary data from a previously exported ZIP file.
 */
export async function importDiaries(file: File): Promise<ImportStats> {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch('/api/import', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${pb.authStore.token}`
		},
		body: formData
	});

	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error((data as any).message || 'Import failed');
	}

	return await response.json();
}
