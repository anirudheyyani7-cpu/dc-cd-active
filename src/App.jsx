import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import GlobalDashboard from './pages/GlobalDashboard';
import Stage01 from './pages/Stage01_StrategyAssessment';
import Stage02 from './pages/Stage02_SupplyChainSourcing';
import Stage03 from './pages/Stage03_DesignBuild';
import Stage04 from './pages/Stage04_Compliance';
import Stage05 from './pages/Stage05_Operations';
import Stage06 from './pages/Stage06_Monetization';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><GlobalDashboard /></PageTransition>} />
          <Route path="/stage/01" element={<PageTransition><Stage01 /></PageTransition>} />
          <Route path="/stage/02" element={<PageTransition><Stage02 /></PageTransition>} />
          <Route path="/stage/03" element={<PageTransition><Stage03 /></PageTransition>} />
          <Route path="/stage/04" element={<PageTransition><Stage04 /></PageTransition>} />
          <Route path="/stage/05" element={<PageTransition><Stage05 /></PageTransition>} />
          <Route path="/stage/06" element={<PageTransition><Stage06 /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
