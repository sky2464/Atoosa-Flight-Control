import React, { useState } from 'react';
import type { PreFlightInterview, PreFlightRecommendation, ProjectRecord } from '../../shared/types.ts';
import { api } from '../lib/api.ts';
import { PageHeader } from './ui/PageHeader.tsx';
import { StepMission } from './wizard/StepMission.tsx';
import { StepArchitecture } from './wizard/StepArchitecture.tsx';
import { StepReview } from './wizard/StepReview.tsx';
import { StepLaunchpad } from './wizard/StepLaunchpad.tsx';

interface PreFlightWizardProps {
  onFlightLaunched: (project: ProjectRecord) => void;
  onCancel: () => void;
}

export const PreFlightWizard: React.FC<PreFlightWizardProps> = ({ onFlightLaunched, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [projectMission, setProjectMission] = useState('');
  const [targetAudience, setTargetAudience] = useState('Engineering Team');
  const [scaleAndTraffic, setScaleAndTraffic] = useState<PreFlightInterview['scaleAndTraffic']>('production-standard');
  const [containerPreference, setContainerPreference] = useState<PreFlightInterview['containerPreference']>('undecided');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['TypeScript']);
  const [securityTier, setSecurityTier] = useState<PreFlightInterview['securityTier']>('strict');
  const [testingStrategy, setTestingStrategy] = useState<PreFlightInterview['testingStrategy']>('tdd-strict');
  const [maxLinesPerFile, setMaxLinesPerFile] = useState(500);

  // Target folder for Step 4
  const [targetFolder, setTargetFolder] = useState('');

  // AI & Recommendation State
  const [recommendation, setRecommendation] = useState<PreFlightRecommendation | null>(null);
  const [aiStreamText, setAiStreamText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldSuccess, setScaffoldSuccess] = useState<string[] | null>(null);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAiStreamText('');

    const interview: PreFlightInterview = {
      projectName: projectName.trim() || 'New Flight Project',
      targetFolder: targetFolder.trim(),
      projectMission: projectMission.trim(),
      targetAudience,
      scaleAndTraffic,
      containerPreference,
      preferredLanguages: selectedLanguages,
      securityTier,
      testingStrategy,
      maxLinesPerFile,
    };

    try {
      const rec = await api.analyzePreFlight(interview);
      setRecommendation(rec);

      await api.streamPromptImprovement(
        projectMission,
        {
          domain: targetAudience,
          scale: scaleAndTraffic,
          container: containerPreference,
        },
        (chunk) => setAiStreamText((prev) => prev + chunk),
        () => setIsAnalyzing(false),
        () => setIsAnalyzing(false)
      );
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  const handleEmitAndRegister = async () => {
    if (!targetFolder.trim()) {
      alert('Please specify the absolute local target directory path.');
      return;
    }
    if (!recommendation) return;

    setIsScaffolding(true);
    try {
      const emitRes = await api.emitGovernance(targetFolder.trim(), [
        { filename: 'AGENT.md', content: recommendation.generatedFiles.agentMd },
        { filename: 'ARCHITECTURE.md', content: recommendation.generatedFiles.architectureMd },
        { filename: 'FLIGHT_RULES.md', content: recommendation.generatedFiles.flightRulesMd },
      ]);

      setScaffoldSuccess(emitRes.writtenFiles || []);
      const telemetry = await api.scanProject(targetFolder.trim());

      const created = await api.createProject({
        name: projectName.trim() || 'Project',
        path: targetFolder.trim(),
        status: 'cleared-for-takeoff',
        interview: {
          projectName,
          targetFolder,
          projectMission,
          targetAudience,
          scaleAndTraffic,
          containerPreference,
          preferredLanguages: selectedLanguages,
          securityTier,
          testingStrategy,
          maxLinesPerFile,
        },
        recommendation,
        telemetry,
      });

      setTimeout(() => {
        onFlightLaunched(created);
      }, 700);
    } catch (err: any) {
      alert(`Scaffolding failed: ${err.message}`);
    } finally {
      setIsScaffolding(false);
    }
  };

  const steps = ['Mission', 'Architecture', 'Review', 'Launch'];

  return (
    <div className="page max-w-3xl">
      <PageHeader title="New flight" subtitle={`Step ${step} of 4 · ${steps[step - 1]}`} />

      {/* Stepper: four quiet segments */}
      <ol className="grid grid-cols-4 gap-3 -mt-4" aria-label="Progress">
        {steps.map((title, i) => {
          const num = i + 1;
          return (
            <li key={title} className="space-y-2">
              <div className={`h-0.5 rounded-full ${num <= step ? 'bg-sky-400' : 'bg-slate-800'}`} />
              <span className={`text-xs ${num === step ? 'text-slate-200' : 'text-slate-400'}`}>{title}</span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <StepMission
          projectName={projectName}
          setProjectName={setProjectName}
          projectMission={projectMission}
          setProjectMission={setProjectMission}
          targetAudience={targetAudience}
          setTargetAudience={setTargetAudience}
          scaleAndTraffic={scaleAndTraffic}
          setScaleAndTraffic={setScaleAndTraffic}
          onNext={() => setStep(2)}
          onCancel={onCancel}
        />
      )}

      {step === 2 && (
        <StepArchitecture
          containerPreference={containerPreference}
          setContainerPreference={setContainerPreference}
          selectedLanguages={selectedLanguages}
          toggleLanguage={toggleLanguage}
          maxLinesPerFile={maxLinesPerFile}
          setMaxLinesPerFile={setMaxLinesPerFile}
          testingStrategy={testingStrategy}
          setTestingStrategy={setTestingStrategy}
          securityTier={securityTier}
          setSecurityTier={setSecurityTier}
          onBack={() => setStep(1)}
          onNext={() => {
            setStep(3);
            handleRunAnalysis();
          }}
        />
      )}

      {step === 3 && (
        <StepReview
          recommendation={recommendation}
          aiStreamText={aiStreamText}
          isAnalyzing={isAnalyzing}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <StepLaunchpad
          targetFolder={targetFolder}
          setTargetFolder={setTargetFolder}
          isScaffolding={isScaffolding}
          scaffoldSuccess={scaffoldSuccess}
          onBack={() => setStep(3)}
          onScaffold={handleEmitAndRegister}
        />
      )}
    </div>
  );
};
