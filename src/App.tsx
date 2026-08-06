import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuroraBackground } from './components/AuroraBackground';
import { SiteHeader } from './components/SiteHeader';
import { ProgressProvider } from './hooks/useProgress';
import { BankIndexRedirect, BankPage } from './pages/BankPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

const SolutionPage = lazy(() =>
  import('./pages/SolutionPage').then((m) => ({ default: m.SolutionPage })),
);

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-dracula-orange">页面出错：{this.state.error.message}</p>
          <a href="/" className="mt-4 inline-block text-dracula-cyan">
            返回首页
          </a>
        </main>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  return (
    <>
      <AuroraBackground />
      <SiteHeader />
      <AppErrorBoundary>
        <Suspense
          fallback={
            <main className="px-4 py-16 text-center text-dracula-comment">加载中…</main>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bank/:bankId" element={<BankIndexRedirect />} />
            <Route path="/bank/:bankId/solution/:slug" element={<SolutionPage />} />
            <Route path="/bank/:bankId/:categoryId" element={<BankPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <AppShell />
      </ProgressProvider>
    </BrowserRouter>
  );
}
