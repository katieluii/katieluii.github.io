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
import AtlasDrugDevAnalyst from './pages/AtlasDrugDevAnalyst';
import ConferenceCatalyst from './pages/ConferenceCatalyst';
import AtlasReader from './pages/AtlasReader';
import AtlasReaderETLM from './pages/AtlasReaderETLM';
import AtlasReaderETLMReport from './pages/AtlasReaderETLMReport';
import AtlasReaderTPP from './pages/AtlasReaderTPP';
import AtlasReaderTPPReport from './pages/AtlasReaderTPPReport';
import AtlasReaderTheme from './pages/AtlasReaderTheme';
import AtlasReaderThemeReport from './pages/AtlasReaderThemeReport';
import AtlasReaderEcosystem from './pages/AtlasReaderEcosystem';
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

        {/* Atlas — Drug Development Analyst Agent (WS9/10a/10b/12/13 umbrella) */}
        <Route path="/atlas-drug-dev-analyst" element={<AtlasDrugDevAnalyst />} />
        <Route path="/projects/atlas-drug-dev-analyst" element={<AtlasDrugDevAnalyst />} />

        {/* WS8: Biotech Conference Catalyst Monitor */}
        <Route path="/conference-catalyst" element={<ConferenceCatalyst />} />
        <Route path="/projects/conference-catalyst-monitor" element={<ConferenceCatalyst />} />

        {/* Atlas Reader — rendered deliverables preview */}
        <Route path="/atlas-reader" element={<AtlasReader />} />
        <Route path="/projects/atlas-reader" element={<AtlasReader />} />
        <Route path="/atlas-reader/etlm/:indication" element={<AtlasReaderETLM />} />
        <Route path="/atlas-reader/etlm/:indication/report" element={<AtlasReaderETLMReport />} />
        <Route path="/atlas-reader/tpp/:slug" element={<AtlasReaderTPP />} />
        <Route path="/atlas-reader/tpp/:slug/report" element={<AtlasReaderTPPReport />} />
        <Route path="/atlas-reader/theme/:slug" element={<AtlasReaderTheme />} />
        <Route path="/atlas-reader/theme/:slug/report" element={<AtlasReaderThemeReport />} />
        <Route path="/atlas-reader/ecosystem" element={<AtlasReaderEcosystem />} />

        <Route path="/projects/:slug" element={<StandardProjectPage />} />
      </Routes>
    </Router>
  );
}

export default App;