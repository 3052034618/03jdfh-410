import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from '@/components';
import GeneratorPage from '@/pages/GeneratorPage';
import CluesPage from '@/pages/CluesPage';
import PreviewPage from '@/pages/PreviewPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-horror-black text-gray-100">
        <Navigation />
        <Routes>
          <Route path="/" element={<GeneratorPage />} />
          <Route path="/clues" element={<CluesPage />} />
          <Route path="/preview" element={<PreviewPage />} />
        </Routes>
      </div>
    </Router>
  );
}
