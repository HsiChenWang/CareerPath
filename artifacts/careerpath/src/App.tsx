import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AppNav, Footer, Guard } from '@/components/shell';
import { CoachProvider } from '@/components/coach';
import Landing from '@/pages/landing';
import { Login, Register } from '@/pages/auth';
import CareerStart from '@/pages/career-start';
import Explore from '@/pages/explore';
import PathFinder from '@/pages/path-finder';
import MyGap from '@/pages/my-gap';
import Connect from '@/pages/connect';
import PersonPage from '@/pages/person';
import Messages from '@/pages/messages';
import MyNetwork from '@/pages/my-network';
import { Requests, UpcomingChats } from '@/pages/chats';
import Profile from '@/pages/profile';
import { useMe } from '@/lib/cp';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 30_000 } },
});

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/career-workflow">{() => <Guard role="student"><CareerStart /></Guard>}</Route>
        <Route path="/explore">{() => <Guard role="student"><Explore /></Guard>}</Route>
        <Route path="/path-finder">{() => <Guard role="student"><PathFinder /></Guard>}</Route>
        <Route path="/my-gap">{() => <Guard role="student"><MyGap /></Guard>}</Route>
        <Route path="/connect">{() => <Guard role="student"><Connect /></Guard>}</Route>
        <Route path="/my-network">{() => <Guard role="student"><MyNetwork /></Guard>}</Route>
        <Route path="/people/:id">{() => <Guard><PersonPage /></Guard>}</Route>
        <Route path="/messages">{() => <Guard><Messages /></Guard>}</Route>
        <Route path="/upcoming-chats">{() => <Guard><UpcomingChats /></Guard>}</Route>
        <Route path="/requests">{() => <Guard role="alumni"><Requests /></Guard>}</Route>
        <Route path="/profile">{() => <Guard><Profile /></Guard>}</Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Shell() {
  const [location] = useLocation();
  const { user } = useMe();
  const bare = location === '/' || location === '/login' || location === '/register';
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Find your path', '/login': 'Log in', '/register': 'Join the Trojan community',
      '/career-workflow': 'Choose your starting point',
      '/explore': 'Explore careers', '/path-finder': 'Path Finder', '/my-gap': 'My Gap',
      '/connect': 'Connect with Trojans', '/messages': 'Messages', '/my-network': 'My Network',
      '/requests': 'Coffee chat requests', '/upcoming-chats': 'Your coffee chats', '/profile': 'Your profile',
    };
    const page = titles[location] || (location.startsWith('/people/') ? 'Trojan profile' : 'Page not found');
    const title = `${page} · NextStepSC`;
    const description = `${page} with NextStepSC, the AI career companion for USC students and alumni. Explore sample Trojan journeys and build meaningful connections.`;
    document.title = title;
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute('content', description);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute('content', title);
    window.scrollTo(0, 0);
  }, [location]);
  return (
    <CoachProvider key={user?.id || 'anonymous'}>
      <div className="flex min-h-[100dvh] flex-col">
        {!bare && <AppNav />}
        <div className="flex flex-1 flex-col"><Router /></div>
        <Footer />
      </div>
    </CoachProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Shell />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
