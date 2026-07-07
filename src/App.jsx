import { useEffect, useMemo, useState } from 'react';
import InputsPanel from './components/InputsPanel';
import MetricsPanel from './components/MetricsPanel';
import PortfolioChart from './components/PortfolioChart';
import IncomeChart from './components/IncomeChart';
import EventTimeline from './components/EventTimeline';
import EmergencyFundChart from './components/EmergencyFundChart';
import { DEFAULT_INPUTS, getCurrentAge, runSimulation } from './lib/simulate';
import { decodeStateFromUrl, encodeStateToUrl } from './lib/urlState';

function App() {
  const [inputs, setInputs] = useState(() => ({ ...DEFAULT_INPUTS, ...decodeStateFromUrl() }));

  const setField = (key, value) => setInputs((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    encodeStateToUrl(inputs);
  }, [inputs]);

  const result = useMemo(() => runSimulation(inputs), [inputs]);
  const currentAge = useMemo(() => getCurrentAge(inputs.dob), [inputs.dob]);

  const handleReset = () => setInputs(DEFAULT_INPUTS);
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard access can be denied by the browser; the URL is already in the address bar
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Retirement &amp; Wealth Outlook</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            All figures are in today&rsquo;s euros (real terms) and returns are shown net of inflation. Working →
            semi-retirement → full retirement → pension.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="order-2 lg:order-1">
          <InputsPanel
            inputs={inputs}
            setField={setField}
            currentAge={currentAge}
            onReset={handleReset}
            onShare={handleShare}
          />
        </div>

        <div className="order-1 lg:order-2">
          <MetricsPanel result={result} inputs={inputs} />

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 mb-6">
            <EmergencyFundChart result={result} events={inputs.lifeEvents} />
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
            <EventTimeline
              events={inputs.lifeEvents}
              setEvents={(events) => setField('lifeEvents', events)}
              currentAge={currentAge}
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 mb-6">
            <PortfolioChart result={result} inputs={inputs} />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5">
            <IncomeChart result={result} inputs={inputs} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
