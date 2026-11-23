import { ErrorBoundary } from './lib/monitoring';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { SessionProvider } from './lib/session';
import { App } from './App';
import './style.css';
const root = document.getElementById('root');
if (!root) throw new Error('Application root missing');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <ErrorBoundary
            fallback={
              <main className="access-state">
                <h1>Your workspace hit a snag.</h1>
                <p>Please reload to try again.</p>
                <button className="button primary" onClick={() => window.location.reload()}>
                  Reload workspace
                </button>
              </main>
            }
          >
            <App />
          </ErrorBoundary>
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
