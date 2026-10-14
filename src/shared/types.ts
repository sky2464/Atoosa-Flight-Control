export type FlightStatus = 'pre-flight' | 'cleared-for-takeoff' | 'in-flight' | 'grounded';

export interface FileMetric {
  path: string;
  relativePath: string;
  lineCount: number;
  byteSize: number;
  extension: string;
  warningLevel: 'ok' | 'caution' | 'critical'; // > 500 lines is caution/critical
}

export interface TelemetrySummary {
  scannedAt: string;
  targetPath: string;
  totalFiles: number;
  totalLines: number;
  filesOver500Lines: FileMetric[];
  languageBreakdown: Record<string, { files: number; lines: number; percentage: number }>;
  detectedFrameworks: string[];
  hasGit: boolean;
  gitBranch?: string;
  gitClean?: boolean;
  testSetup: {
    detected: boolean;
    framework?: string;
    testFilesCount: number;
    testPattern?: string;
  };
  dockerSetup: {
    detected: boolean;
    hasDockerfile: boolean;
    hasCompose: boolean;
  };
  governanceFiles: {
    hasAgentMd: boolean;
    hasClaudeMd: boolean;
    hasCursorRules: boolean;
    hasArchitectureMd: boolean;
    hasFlightRules: boolean;
  };
  flightScore: number; // 0 - 100
  flightHealthStatus: 'optimal' | 'moderate' | 'hazard';
  warnings: string[];
  recommendations: string[];
}

export interface PreFlightInterview {
  projectName: string;
  targetFolder: string;
  projectMission: string;
  targetAudience: string;
  scaleAndTraffic: 'prototype' | 'internal-tool' | 'production-standard' | 'high-throughput-enterprise';
  containerPreference: 'docker' | 'docker-compose' | 'bare-metal' | 'serverless' | 'undecided';
  preferredLanguages: string[];
  securityTier: 'standard' | 'strict' | 'regulated';
  testingStrategy: 'tdd-strict' | 'balanced' | 'fast-prototype';
  maxLinesPerFile: number; // Defaults to 500
}

export interface PreFlightRecommendation {
  summary: string;
  architecturePattern: string;
  recommendedStack: {
    frontend: string;
    backend: string;
    database: string;
    runtime: string;
    containerization: string;
  };
  dockerEvaluation: {
    recommendation: 'recommended' | 'optional' | 'avoid-for-mvp';
    reasoning: string;
    pros: string[];
    cons: string[];
  };
  securityControls: string[];
  governanceRules: string[];
  generatedFiles: {
    agentMd: string;
    architectureMd: string;
    flightRulesMd: string;
  };
}

export interface ProjectRecord {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  lastScannedAt?: string;
  status: FlightStatus;
  interview?: PreFlightInterview;
  recommendation?: PreFlightRecommendation;
  telemetry?: TelemetrySummary;
}

export interface AISettings {
  activeProvider: 'claude-cli' | 'ollama' | 'gemini' | 'openai' | 'anthropic' | 'system';
  ollamaEndpoint: string;
  ollamaModel: string;
  claudeCliPath: string;
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
}

export interface ModuleDescriptor {
  id: string;
  name: string;
  category: 'core' | 'scanner' | 'discovery' | 'governance' | 'project-management' | 'security' | 'logic-engine';
  version: string;
  status: 'active' | 'beta' | 'planned';
  description: string;
  author: string;
}
