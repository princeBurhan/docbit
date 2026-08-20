import React from 'react';
import { useRouter } from './router/router';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';

export default function App() {
  const { path } = useRouter();

  if (path === '/workspace') return <WorkspacePage />;
  return <HomePage />;
}
