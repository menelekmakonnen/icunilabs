
import { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import Hero from './components/sections/Hero';
import Problem from './components/sections/Problem';
import WhatWeDo from './components/sections/WhatWeDo';
import Method from './components/sections/Method';
import Offers from './components/sections/Offers';
import Authority from './components/sections/Authority';
import LabDemos from './components/sections/LabDemos';
import Contact from './components/sections/Contact';
import ClientPortal from './components/portal/ClientPortal';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentHash === '#portal') {
    return <ClientPortal />;
  }

  return (
    <MainLayout>
      <Hero />
      <Problem />
      <WhatWeDo />
      <Method />
      <LabDemos />
      <Offers />
      <Authority />
      <Contact />
    </MainLayout>
  );
}

export default App;
