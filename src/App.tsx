
import { useState, useEffect, lazy, Suspense } from 'react';
import MainLayout from './components/layout/MainLayout';
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import Problem from './components/sections/Problem';
import OperationsExplainer from './components/sections/OperationsExplainer';
import Signs from './components/sections/Signs';
import WhatWeDo from './components/sections/WhatWeDo';
import WhoWeHelp from './components/sections/WhoWeHelp';
import PortfolioProof from './components/sections/PortfolioProof';
import Method from './components/sections/Method';
import Authority from './components/sections/Authority';
import PrivacyTrust from './components/sections/PrivacyTrust';
import Contact from './components/sections/Contact';
import PersonaDrawer from './components/layout/PersonaDrawer';
import { portfolioProjects } from './data/portfolioData';
import { getPersonaBySlug } from './data/personaData';

// ── Lazy-loaded routes ──
// Admin, portals, and heavy pages are code-split to reduce the public bundle.
// Only the homepage sections are eagerly loaded (critical rendering path).
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const ClientPortal = lazy(() => import('./components/portal/ClientPortal'));
const ReferralPortal = lazy(() => import('./components/portal/ReferralPortal'));
const AnimationShowcase = lazy(() => import('./components/sections/AnimationShowcase'));
const JobsPage = lazy(() => import('./components/sections/JobsPage'));
const Portfolio = lazy(() => import('./components/sections/Portfolio'));
const ProjectDetail = lazy(() => import('./components/sections/ProjectDetail'));
const DemosPage = lazy(() => import('./components/sections/DemosPage'));
const DemoDetailPage = lazy(() => import('./components/sections/DemoDetailPage'));
const PersonaPage = lazy(() => import('./components/sections/PersonaPage'));
const WhoWeHelpPage = lazy(() => import('./components/sections/WhoWeHelpPage'));

const personaSlugs = ['founders', 'operations', 'product-systems', 'creative-ops', 'ai-adoption', 'remote-owner', 'financial-ops'];

/** Minimal loading fallback for lazy-loaded routes */
const LazyFallback = () => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin w-8 h-8 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
      <span className="text-xs text-neutral-600 font-medium tracking-wider uppercase">Loading</span>
    </div>
  </div>
);

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [personaDrawerOpen, setPersonaDrawerOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ── Lazy-loaded routes (wrapped in Suspense) ──

  if (currentHash === '#_ops' || currentHash.startsWith('#_ops/')) {
    return <Suspense fallback={<LazyFallback />}><AdminPanel /></Suspense>;
  }

  if (currentHash === '#referral') {
    return <Suspense fallback={<LazyFallback />}><ReferralPortal /></Suspense>;
  }

  if (currentHash === '#showcase') {
    return <Suspense fallback={<LazyFallback />}><AnimationShowcase /></Suspense>;
  }

  if (currentHash === '#demos') {
    return (
      <Suspense fallback={<LazyFallback />}>
        <Navbar />
        <DemosPage />
      </Suspense>
    );
  }

  if (currentHash.startsWith('#demo/')) {
    const demoId = currentHash.replace('#demo/', '');
    return (
      <Suspense fallback={<LazyFallback />}>
        <Navbar />
        <DemoDetailPage demoId={demoId} />
      </Suspense>
    );
  }

  if (currentHash === '#jobs' || currentHash.startsWith('#job/') || currentHash.startsWith('#apply/')) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <Navbar />
        <JobsPage />
      </Suspense>
    );
  }

  if (currentHash === '#contact') {
    return (
      <>
        <Navbar />
        <div className="pt-16">
          <Contact />
        </div>
      </>
    );
  }

  if (currentHash === '#portal') {
    return (
      <Suspense fallback={<LazyFallback />}>
        <Navbar />
        <ClientPortal />
      </Suspense>
    );
  }

  if (currentHash === '#portfolio' || currentHash.startsWith('#portfolio?')) {
    return <Suspense fallback={<LazyFallback />}><Portfolio /></Suspense>;
  }

  if (currentHash.startsWith('#project/')) {
    const projectId = currentHash.replace('#project/', '');
    const project = portfolioProjects.find(p => p.id === projectId);
    if (project) {
      return <Suspense fallback={<LazyFallback />}><ProjectDetail project={project} /></Suspense>;
    }
    return <Suspense fallback={<LazyFallback />}><Portfolio /></Suspense>;
  }

  // Persona pages
  const cleanHash = currentHash.replace('#', '');

  if (cleanHash === 'who-we-help') {
    return <Suspense fallback={<LazyFallback />}><WhoWeHelpPage /></Suspense>;
  }

  if (personaSlugs.includes(cleanHash)) {
    const persona = getPersonaBySlug(cleanHash);
    if (persona) {
      return <Suspense fallback={<LazyFallback />}><PersonaPage persona={persona} /></Suspense>;
    }
  }

  // ── Homepage (eagerly loaded — critical path) ──
  return (
    <MainLayout>
      <Hero />
      <Problem />
      <OperationsExplainer />
      <Signs />
      <WhatWeDo />
      <WhoWeHelp />
      <PortfolioProof />
      <Method />
      <Authority />
      <PrivacyTrust />

      {/* Floating 'Who We Help' trigger */}
      <button
        onClick={() => setPersonaDrawerOpen(true)}
        className="fixed right-0 top-1/2 translate-y-[4px] z-40 bg-neutral-900/90 backdrop-blur-md hover:bg-neutral-800/90 border border-neutral-800 border-r-0 rounded-l-lg px-2 py-3 sm:px-3 sm:py-4 text-neutral-400 hover:text-white transition-all shadow-lg group cursor-pointer"
        aria-label="Open Who We Help drawer"
      >
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">Who We Help</span>
      </button>

      <PersonaDrawer isOpen={personaDrawerOpen} onClose={() => setPersonaDrawerOpen(false)} />
    </MainLayout>
  );
}

export default App;
