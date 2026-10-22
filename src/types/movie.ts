export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  popularity: number;
  video: boolean;
  media_type?: string;
  original_language?: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface MovieDetails extends Movie {
  budget: number;
  genres: Genre[];
  homepage: string | null;
  imdb_id: string | null;
  production_companies: ProductionCompany[];
  revenue: number;
  runtime: number | null;
  status: string;
  tagline: string | null;
}

export interface CastMember {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  character: string;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  department: string;
  job: string;
}

export interface MovieCredits {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Video {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface MovieVideos {
  id: number;
  results: Video[];
}

// --- TV Shows ---

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  media_type?: string;
  original_language?: string;
}

export interface TVSeason {
  id: number;
  air_date: string | null;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface TVEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  crew: CrewMember[];
  guest_stars: CastMember[];
}

export interface TVSeasonDetails {
  id: number;
  air_date: string | null;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
  episodes: TVEpisode[];
}

export interface TVShowDetails extends TVShow {
  genres: Genre[];
  homepage: string | null;
  status: string;
  tagline: string | null;
  adult?: boolean;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TVSeason[];
  episode_run_time: number[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  last_air_date: string | null;
  in_production: boolean;
  type: string;
}

export interface HeroMovieData extends MovieDetails {
  videos?: MovieVideos;
  images?: {
    logos: { file_path: string }[];
  };
}

export interface HeroTVData extends TVShowDetails {
  videos?: MovieVideos;
  images?: {
    logos: { file_path: string }[];
  };
}

export type HeroMediaData = HeroMovieData | HeroTVData;

// --- People ---

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  media_type?: string;
  known_for?: (Movie | TVShow)[];
}

export interface PersonDetails extends Person {
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  gender: number;
  imdb_id: string | null;
  homepage: string | null;
  also_known_as: string[];
}

export interface PersonCastCredit {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  character: string;
  media_type: 'movie' | 'tv';
  popularity: number;
  genre_ids: number[];
}

export interface PersonCrewCredit {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  department: string;
  job: string;
  media_type: 'movie' | 'tv';
  popularity: number;
  genre_ids: number[];
}

export interface PersonCombinedCredits {
  id: number;
  cast: PersonCastCredit[];
  crew: PersonCrewCredit[];
}

// --- Multi Search ---

export type MultiSearchResult = (Movie & { media_type: 'movie' }) 
  | (TVShow & { media_type: 'tv' }) 
  | (Person & { media_type: 'person' });

// --- Watch Providers ---

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProvidersData {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
}

export interface WatchProvidersResponse {
  id: number;
  results: Record<string, WatchProvidersData>;
}


