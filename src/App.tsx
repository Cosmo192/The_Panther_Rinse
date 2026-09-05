import { HomePage } from './pages/HomePage';
import { lazy, Suspense } from 'react';
import { Spinner } from './components/Feedback';
const ScanPage = lazy(() => import('./pages/ScanPage').then(module => ({ default: module.ScanPage })));

export function App() {
  return <Suspense fallback={<div className="page-shell text-center"><Spinner /></div>}>
    {window.location.pathname.replace(/\/$/, '') === '/scan' ? <ScanPage /> : <HomePage />}
  </Suspense>;
}
