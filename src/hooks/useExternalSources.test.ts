import { describe, expect, it } from 'vitest';
import { buildCometConfig, parseSizeToMb } from './useExternalSources';

describe('parseSizeToMb', () => {
	it('parses the decimal units addons commonly emit', () => {
		expect(parseSizeToMb('👤 162 💾 83.07 GB ⚙️ ThePirateBay')).toBeCloseTo(83.07 * 1024);
		expect(parseSizeToMb('💾 700 MB')).toBe(700);
		expect(parseSizeToMb('💾 1.5 TB')).toBeCloseTo(1.5 * 1024 * 1024);
	});

	it('parses binary units', () => {
		expect(parseSizeToMb('💾 4.5 GiB')).toBeCloseTo(4.5 * 1024);
		expect(parseSizeToMb('💾 700 MiB')).toBe(700);
	});

	it('handles a comma decimal separator', () => {
		expect(parseSizeToMb('💾 4,5 GB')).toBeCloseTo(4.5 * 1024);
	});

	it('handles commas used as thousand separators', () => {
		expect(parseSizeToMb('💾 1,024.5 MB')).toBeCloseTo(1024.5);
	});

	it('tolerates missing whitespace', () => {
		expect(parseSizeToMb('💾9.94GB')).toBeCloseTo(9.94 * 1024);
	});

	it('returns 0 when no size is present', () => {
		// Peerflix omits the 💾 field entirely on non-cached results
		expect(parseSizeToMb('Michael.2026.2160p.UHD.BluRay.mkv\n  👤 59 🌐 Peerflix')).toBe(0);
		expect(parseSizeToMb('')).toBe(0);
		expect(parseSizeToMb(undefined)).toBe(0);
	});
});

describe('buildCometConfig', () => {
	const decode = (b64: string) => JSON.parse(atob(b64));

	it('produces base64 JSON carrying the RD key', () => {
		const config = decode(buildCometConfig('MY-RD-KEY'));
		expect(config.debridServices).toEqual([{ service: 'realdebrid', apiKey: 'MY-RD-KEY' }]);
	});

	it('never asks Comet to enumerate the user library', () => {
		const config = decode(buildCometConfig('MY-RD-KEY'));
		expect(config.scrapeDebridAccountTorrents).toBe(false);
	});

	it('does not cap or pre-filter results, so DMM can do its own filtering', () => {
		const config = decode(buildCometConfig('MY-RD-KEY'));
		expect(config.maxResultsPerResolution).toBe(0);
		expect(config.maxSize).toBe(0);
		expect(config.cachedOnly).toBe(false);
		expect(config.removeTrash).toBe(false);
	});
});
