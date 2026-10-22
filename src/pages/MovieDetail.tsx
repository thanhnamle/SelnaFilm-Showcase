import { useParams } from 'react-router';
import DetailPage from './DetailPage';

export default function MovieDetail() {
  // Keyed by id so per-title state (season picker, trailer) resets between titles.
  return <DetailPage key={useParams().id} type="movie" />;
}
