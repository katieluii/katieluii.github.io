// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { Home } from './pages/Home';
// import { Sec13f } from './pages/Sec13f';
// import { TrialRecruitment } from './pages/TrialRecruitment';
// import { StandardProjectPage } from './pages/StandardProjectPage';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/sec-13f" element={<Sec13f />} />

//         {/* Canonical */}
//         <Route path="/trial-recruitment" element={<TrialRecruitment />} />

//         {/* Alias: prevents /projects/trial-recruitment being treated as a slug */}
//         <Route
//           path="/projects/trial-recruitment"
//           element={<Navigate to="/trial-recruitment" replace />}
//         />

//         <Route path="/projects/:slug" element={<StandardProjectPage />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;



import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Sec13f } from './pages/Sec13f';
import TrialRecruitment from './pages/TrialRecruitment';
import ClinicalNewsMon from './pages/ClinicalNewsMon';
import InvestmentMemo from './pages/InvestmentMemo';
import ObesityStockAnalysis from './pages/ObesityStockAnalysis';
import BiopharmaAIFeed from './pages/BiopharmaAIFeed';
import BiotechFundraising from './pages/BiotechFundraising';
import StandardProjectPage from './pages/StandardProjectPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sec-13f" element={<Sec13f />} />

        {/* Trial recruitment */}
        <Route path="/trial-recruitment" element={<TrialRecruitment />} />
        <Route path="/projects/trial-recruitment" element={<TrialRecruitment />} />

        {/* WS3: Clinical news monitor */}
        <Route path="/clinical-news" element={<ClinicalNewsMon />} />
        <Route path="/projects/clinical-news-monitor" element={<ClinicalNewsMon />} />


        {/* WS4: Investment memo agent */}
        <Route path="/investment-memo" element={<InvestmentMemo />} />
        <Route path="/projects/investment-memo-agent" element={<InvestmentMemo />} />

        {/* WS1: Obesity stock analysis */}
        <Route path="/obesity-stocks" element={<ObesityStockAnalysis />} />
        <Route path="/projects/obesity-stock-analysis" element={<ObesityStockAnalysis />} />

        {/* WS2: AI biopharma intelligence feed */}
        <Route path="/ai-biopharma-feed" element={<BiopharmaAIFeed />} />

        {/* Biotech Fundraising Tracker (v2) */}
        <Route path="/biotech-fundraising" element={<BiotechFundraising />} />
        <Route path="/projects/biotech-fundraising-tracker" element={<BiotechFundraising />} />

        <Route path="/projects/:slug" element={<StandardProjectPage />} />
      </Routes>
    </Router>
  );
}

export default App;