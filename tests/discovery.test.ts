import { describe, it, expect } from 'bun:test';
import { analyzePreFlight } from '../src/server/modules/discovery/discoveryService.ts';
import type { PreFlightInterview } from '../src/shared/types.ts';

describe('Discovery Service & Architecture Advisor', () => {
  it('should synthesize a comprehensive recommendation with clean governance files', () => {
    const interview: PreFlightInterview = {
      projectName: 'TestFlight',
      targetFolder: '/tmp/testflight',
      projectMission: 'Build a high-throughput crypto trading engine',
      targetAudience: 'Institutional Traders',
      scaleAndTraffic: 'high-throughput-enterprise',
      containerPreference: 'docker-compose',
      preferredLanguages: ['TypeScript'],
      securityTier: 'regulated',
      testingStrategy: 'tdd-strict',
      maxLinesPerFile: 500,
    };

    const rec = analyzePreFlight(interview);

    expect(rec).toBeDefined();
    expect(rec.recommendedStack.frontend).toContain('React');
    expect(rec.dockerEvaluation.recommendation).toBe('recommended');
    expect(rec.securityControls.length).toBeGreaterThan(3);
    expect(rec.generatedFiles.agentMd).toContain('500 lines of code');
    expect(rec.generatedFiles.agentMd).toContain('TDD');
    expect(rec.generatedFiles.architectureMd).toContain('TestFlight Blueprint');
    expect(rec.generatedFiles.flightRulesMd).toContain('Pre-Flight Checklist');
  });

  it('should adjust recommendations for fast prototype scale', () => {
    const interview: PreFlightInterview = {
      projectName: 'QuickMVP',
      targetFolder: '/tmp/quickmvp',
      projectMission: 'Simple hobby project',
      targetAudience: 'Friends',
      scaleAndTraffic: 'prototype',
      containerPreference: 'undecided',
      preferredLanguages: ['Python'],
      securityTier: 'standard',
      testingStrategy: 'fast-prototype',
      maxLinesPerFile: 400,
    };

    const rec = analyzePreFlight(interview);

    expect(rec.recommendedStack.backend).toContain('FastAPI');
    expect(rec.dockerEvaluation.recommendation).toBe('avoid-for-mvp');
    expect(rec.generatedFiles.agentMd).toContain('400 lines of code');
  });
});
