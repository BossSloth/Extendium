import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function extractExtensionId(link: string): string | null {
	const match = link.match(/\/detail\/[^/]+\/([a-z]+)/);
	return match?.[1] ?? null;
}

function parseCSV(csvPath: string): Map<string, string> {
	const content = readFileSync(csvPath, 'utf-8');
	const lines = content.split('\n').slice(1);

	const compatibilityMap = new Map<string, string>();


	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine) continue;

		const columns = trimmedLine.split(',');

		const name = columns[0]?.trim() ?? '';
		const link = columns[1]?.trim() ?? '';
		const compatibility = columns[2]?.trim() ?? '';

		if (!name || !link || !compatibility) continue;

		const extensionId = extractExtensionId(link);
		if (extensionId) {
			compatibilityMap.set(extensionId, compatibility);
		}
	}

	return compatibilityMap;
}

function generateTypeScriptFile(compatibilityMap: Map<string, string>, outputPath: string): void {
	const entries = Array.from(compatibilityMap.entries())
		.map(([id, compat]) => `  ${id}: '${compat}'`)
		.join(',\n') + ",";

	const content = `// Auto-generated file - Do not edit manually
// Generated from compatibility CSV

export type CompatibilityStatus = 'Perfect' | 'Great' | 'Okay' | 'Broken';

export const extensionCompatibility: Record<string, CompatibilityStatus> = {
${entries}
} as const;

export function getExtensionCompatibility(extensionId: string): CompatibilityStatus | undefined {
  return extensionCompatibility[extensionId];
}
`;

	writeFileSync(outputPath, content, 'utf-8');
}

function main() {
	const csvPath = process.argv[2];

	if (!csvPath) {
		console.error('Usage: bun run helpers/generate-compatibility-map.ts <path-to-csv>');
		process.exit(1);
	}

	const compatibilityMap = parseCSV(csvPath);
	const outputPath = join(process.cwd(), 'frontend', 'extensionCompatibility.ts');

	generateTypeScriptFile(compatibilityMap, outputPath);

	console.log(`✓ Generated compatibility map with ${compatibilityMap.size} extensions`);
	console.log(`✓ Output: ${outputPath}`);
}

main();
