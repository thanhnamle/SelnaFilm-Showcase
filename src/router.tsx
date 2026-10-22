import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import ErrorPage from './pages/ErrorPage';
import { DEFAULT_LOCALE } from './i18n';

// Each page is its own chunk; only the route being opened is downloaded.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={`/${DEFAULT_LOCALE}`} replace /> },
  {
    path: '/:locale',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    // Shown for the split second while the first page chunk downloads.
    hydrateFallbackElement: <div className="min-h-dvh bg-canvas" />,
    children: [
      { index: true, lazy: page(() => import('./pages/Home')) },
      { path: 'movies', lazy: page(() => import('./pages/BrowseMovies')) },
      { path: 'tv', lazy: page(() => import('./pages/BrowseTV')) },
      { path: 'new', lazy: page(() => import('./pages/NewAndHot')) },
      { path: 'my-list', lazy: page(() => import('./pages/MyList')) },
      { path: 'search', lazy: page(() => import('./pages/Search')) },
      { path: 'movie/:id', lazy: page(() => import('./pages/MovieDetail')) },
      { path: 'tv/:id', lazy: page(() => import('./pages/TVDetail')) },
      { path: 'person/:id', lazy: page(() => import('./pages/Person')) },
      { path: 'watch/:type/:id', lazy: page(() => import('./pages/Watch')) },
      { path: '*', lazy: page(() => import('./pages/NotFound')) },
    ],
  },
]);
