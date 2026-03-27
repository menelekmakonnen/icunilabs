
import { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import Hero from './components/sections/Hero';
import Problem from './components/sections/Problem';
import OperationsExplainer from './components/sections/OperationsExplainer';
import Signs from './components/sections/Signs';
import WhatWeDo from './components/sections/WhatWeDo';
import WhoWeHelp from './components/sections/WhoWeHelp';
import PortfolioProof from './components/sections/PortfolioProof';
import Method from './components/sections/Method';
import Authority from './components/sections/Authority';
import Contact from './components/sections/Contact';
import ClientPortal from './components/portal/ClientPortal';
import Portfolio from './components/sections/Portfolio';
import ProjectDetail from './components/sections/ProjectDetail';
import PersonaPage from './components/sections/PersonaPage';
import WhoWeHelpPage from './components/sections/WhoWeHelpPage';
import PersonaDrawer from './components/layout/PersonaDrawer';
import { portfolioProjects } from './data/portfolioData';
import { getPersonaBySlug } from './data/personaData';

const personaSlugs = ['founders', 'operations', 'product-systems', 'creative-ops', 'ai-adoption'];

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

  if (currentHash === '#portal') {
    return <ClientPortal />;
  }

  if (currentHash === '#portfolio' || currentHash.startsWith('#portfolio?')) {
    return <Portfolio />;
  }

  if (currentHash.startsWith('#project/')) {
    const projectId = currentHash.replace('#project/', '');
    const project = portfolioProjects.find(p => p.id === projectId);
    if (project) {
      return <ProjectDetail project={project} />;
    }
    return <Portfolio />;
  }

  // Persona pages
  const cleanHash = currentHash.replace('#', '');

  if (cleanHash === 'who-we-help') {
    return <WhoWeHelpPage />;
  }

  if (personaSlugs.includes(cleanHash)) {
    const persona = getPersonaBySlug(cleanHash);
    if (persona) {
      return <PersonaPage persona={persona} />;
    }
  }

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
      <Contact />

      {/* Floating 'Who We Help' trigger */}
      <button
        onClick={() => setPersonaDrawerOpen(true)}
        className="fixed right-0 top-1/2 translate-y-[4px] z-50 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 border-r-0 rounded-l-xl px-3 py-6 text-neutral-400 hover:text-white transition-all shadow-xl group cursor-pointer"
        aria-label="Open Who We Help drawer"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <span className="text-xs font-bold tracking-widest uppercase">Who We Help</span>
      </button>

      <PersonaDrawer isOpen={personaDrawerOpen} onClose={() => setPersonaDrawerOpen(false)} />
    </MainLayout>
  );
}

export default App;
