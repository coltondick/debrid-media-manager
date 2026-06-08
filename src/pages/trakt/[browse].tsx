import Poster from '@/components/poster';
import { useCachedList } from '@/hooks/useCachedList';
import { TraktMediaItem } from '@/services/trakt';
import { withAuth } from '@/utils/withAuth';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FunctionComponent, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';

type Category = {
	name: string;
	results: Record<string, TraktMediaItem[]>;
};

type TraktBrowseProps = {
	mediaType: string;
	categories: Category[];
};

type RankedItem = {
	imdbid: string;
	title: string;
	year: number;
	appearances: number;
};

function rankItems(categories: Category[]): RankedItem[] {
	const map = new Map<string, RankedItem>();

	for (const category of categories) {
		for (const items of Object.values(category.results)) {
			for (const item of items) {
				const imdbid =
					item.movie?.ids?.imdb || item.show?.ids?.imdb || (item as any).ids?.imdb;
				if (!imdbid) continue;

				const existing = map.get(imdbid);
				if (existing) {
					existing.appearances++;
				} else {
					map.set(imdbid, {
						imdbid,
						title:
							item.movie?.title ||
							item.show?.title ||
							(item as any).title ||
							'Unknown',
						year: item.movie?.year || item.show?.year || (item as any).year || 0,
						appearances: 1,
					});
				}
			}
		}
	}

	return Array.from(map.values()).sort(
		(a, b) => b.appearances - a.appearances || b.year - a.year
	);
}

export const TraktBrowse: FunctionComponent = () => {
	const router = useRouter();
	const { browse } = router.query;
	const browseKey = typeof browse === 'string' ? browse : '';

	const { data, loading, error } = useCachedList<TraktBrowseProps>(
		browseKey ? `trakt:${browseKey}` : null,
		async () => {
			const response = await fetch(`/api/info/trakt?browse=${browseKey}`);
			if (!response.ok) {
				throw new Error('Failed to fetch data');
			}
			return response.json();
		}
	);

	const ranked = useMemo(() => (data ? rankItems(data.categories) : []), [data]);

	if (!browseKey || (loading && !data)) {
		return <div className="mx-2 my-1 min-h-screen bg-gray-900 text-white">Loading...</div>;
	}

	if (error) {
		return (
			<div className="mx-2 my-1 min-h-screen bg-gray-900 text-white">
				Error: Failed to load data
			</div>
		);
	}

	if (!data) {
		return (
			<div className="mx-2 my-1 min-h-screen bg-gray-900 text-white">No data available</div>
		);
	}

	const title = data.mediaType === 'movie' ? 'Movies' : 'Shows';

	return (
		<div className="mx-2 my-1 min-h-screen bg-gray-900">
			<Head>
				<title>Debrid Media Manager - Trakt - {title}</title>
			</Head>
			<Toaster position="bottom-right" />

			<div className="mb-2 flex items-center justify-between">
				<h1 className="text-xl font-bold text-white">Trakt - {title}</h1>
				<Link
					href="/"
					className="rounded border-2 border-cyan-500 bg-cyan-900/30 px-2 py-1 text-sm text-cyan-100 transition-colors hover:bg-cyan-800/50"
				>
					Go Home
				</Link>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
				{ranked.map((item) => (
					<Link key={item.imdbid} href={`/${data.mediaType}/${item.imdbid}`}>
						<Poster imdbId={item.imdbid} title={item.title} />
					</Link>
				))}
			</div>
		</div>
	);
};

export default withAuth(TraktBrowse);
