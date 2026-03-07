/**
 * Velocis — Tutorial / Onboarding Tour Context
 * Shows a guided step-by-step tour on first login.
 * Users can follow it (clicking "Next") or skip at any time.
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export const TUTORIAL_KEY          = 'velocis_tutorial_completed';
export const REPO_TUTORIAL_KEY     = 'velocis_tutorial_repo_completed';
export const WORKSPACE_TUTORIAL_KEY= 'velocis_tutorial_workspace_completed';
export const PIPELINE_TUTORIAL_KEY = 'velocis_tutorial_pipeline_completed';
export const INFRA_TUTORIAL_KEY    = 'velocis_tutorial_infra_completed';
export const CORTEX_TUTORIAL_KEY   = 'velocis_tutorial_cortex_completed';
export const AUTOMATION_TUTORIAL_KEY = 'velocis_tutorial_automation_completed';
export const SETTINGS_TUTORIAL_KEY = 'velocis_tutorial_settings_completed';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** ID of the DOM element to spotlight — omit for a centered modal step */
  targetId?: string;
  /** Which side of the target to place the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const DASHBOARD_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Velocis!',
    description:
      "Let's take a quick tour to show you around your dashboard. You can skip anytime by clicking the × button.",
  },
  {
    id: 'search',
    title: 'Search Repositories',
    description:
      'Use the search bar to instantly filter your repositories by name as you type.',
    targetId: 'tutorial-search',
    position: 'bottom',
  },
  {
    id: 'metrics',
    title: 'Health Overview',
    description:
      'At a glance: see how many repos are healthy, have warnings, are critical, or carry open risks.',
    targetId: 'tutorial-metrics',
    position: 'bottom',
  },
  {
    id: 'repos',
    title: 'Your Repositories',
    description:
      'Each card shows a connected repo with its health status and recent AI-agent activity. Click a card to explore agents, automation reports, and more.',
    targetId: 'tutorial-repos',
    position: 'top',
  },
  {
    id: 'activity',
    title: 'Live Activity Feed',
    description:
      'Real-time events from your AI agents — Sentinel, Fortress, and Cortex — as they analyse and automate your codebase.',
    targetId: 'tutorial-activity',
    position: 'left',
  },
  {
    id: 'system',
    title: 'System Health',
    description:
      'Monitor API latency, queue depth, agent uptime, and storage usage at a glance.',
    targetId: 'tutorial-system',
    position: 'left',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description:
      'Click your avatar to access account options or sign out.',
    targetId: 'tutorial-profile',
    position: 'bottom',
  },
  {
    id: 'done',
    title: "🚀 You're all set!",
    description:
      'That covers the key features. Install a repository from the Onboarding page to start using your AI agents.',
  },
];

export const REPO_STEPS: TutorialStep[] = [
  {
    id: 'repo-welcome',
    title: '📊 Repository Dashboard',
    description:
      'This is your repository hub. Get a full picture of your codebase health and access all AI-powered agents from here.',
  },
  {
    id: 'repo-kpi',
    title: 'Health Metrics',
    description:
      'These four indicators show your PR risk score, test stability, architecture drift, and the time since the last automated action.',
    targetId: 'repo-kpi-strip',
    position: 'bottom',
  },
  {
    id: 'repo-agents',
    title: 'Agent Command Center',
    description:
      'Four AI agents are at your disposal — Visual Cortex, AI Workspace, Fortress QA, and Infrastructure Predictor.',
    targetId: 'repo-agent-command-center',
    position: 'bottom',
  },
  {
    id: 'repo-cortex',
    title: 'Launch Visual Cortex',
    description:
      'Visual Cortex builds an interactive service dependency graph of your codebase, grouped into architecture layers.',
    targetId: 'repo-cortex-card',
    position: 'right',
  },
  {
    id: 'repo-workspace',
    title: 'AI Workspace',
    description:
      'Browse and edit your repository files with Sentinel AI assistance inline.',
    targetId: 'repo-workspace-card',
    position: 'right',
  },
  {
    id: 'repo-pipeline',
    title: 'Fortress QA Pipeline',
    description:
      'Generates BDD test plans and API documentation using DeepSeek V3 via Amazon Bedrock.',
    targetId: 'repo-pipeline-card',
    position: 'right',
  },
  {
    id: 'repo-infra',
    title: 'Infrastructure Predictor',
    description:
      'Analyses your code to generate Terraform IaC and predict your monthly AWS costs.',
    targetId: 'repo-infra-card',
    position: 'right',
  },
  {
    id: 'repo-sidebar',
    title: 'Activity & Reports',
    description:
      'Your commit history, recent agent events, and Automation Report are always visible here.',
    targetId: 'repo-activity-sidebar',
    position: 'left',
  },
  {
    id: 'repo-automation',
    title: 'Automation Report',
    description:
      'Click here to view the full AI pipeline report — Sentinel review, Fortress test plan, and infrastructure prediction — triggered by your last commit.',
    targetId: 'repo-automation-report',
    position: 'left',
  },
];

export const WORKSPACE_STEPS: TutorialStep[] = [
  {
    id: 'workspace-welcome',
    title: '💻 AI Workspace',
    description:
      'Browse and edit your repository files with Sentinel AI providing live code analysis and automated fixes.',
  },
  {
    id: 'workspace-file',
    title: 'File Selector',
    description:
      'Click here to search and open any file from your repository. The editor loads the file with syntax highlighting.',
    targetId: 'workspace-file-selector',
    position: 'bottom',
  },
  {
    id: 'workspace-branch',
    title: 'Branch Selector',
    description:
      'Choose which branch you are working on. Files are loaded from and pushed to the selected branch.',
    targetId: 'workspace-branch-selector',
    position: 'bottom',
  },
  {
    id: 'workspace-push',
    title: 'Push Changes',
    description:
      'Once you have made edits, push them back to GitHub. The badge shows how many files have unsaved changes.',
    targetId: 'workspace-push-btn',
    position: 'bottom',
  },
  {
    id: 'workspace-editor',
    title: 'Monaco Code Editor',
    description:
      'A full VS Code-style editor powered by Monaco. Changes are tracked and can be pushed directly to your repository.',
    targetId: 'workspace-editor-panel',
    position: 'right',
  },
  {
    id: 'workspace-ai',
    title: 'Sentinel AI Panel',
    description:
      'Your AI coding assistant. Ask questions, request refactors, or trigger a full repository review.',
    targetId: 'workspace-ai-panel',
    position: 'left',
  },
  {
    id: 'workspace-lang',
    title: 'Language Switcher',
    description:
      "Switch Sentinel's response language between English (EN), Hindi (HI), and Tamil (TA).",
    targetId: 'workspace-lang-switcher',
    position: 'bottom',
  },
  {
    id: 'workspace-review',
    title: 'Review Code',
    description:
      'Trigger a full Sentinel review of the current file — security issues, logic errors, and improvement opportunities.',
    targetId: 'workspace-review-btn',
    position: 'top',
  },
  {
    id: 'workspace-chat',
    title: 'Chat with Sentinel',
    description:
      'Type your question here and Sentinel will respond with analysis, suggestions, or code fixes.',
    targetId: 'workspace-chat-input',
    position: 'top',
  },
];

export const PIPELINE_STEPS: TutorialStep[] = [
  {
    id: 'pipeline-welcome',
    title: '🧪 Fortress Intelligence Suite',
    description:
      'Fortress generates BDD test plans and API documentation using DeepSeek V3 via Amazon Bedrock.',
  },
  {
    id: 'pipeline-subheader',
    title: 'Fortress Overview',
    description:
      'This bar shows the active repository and the AI model powering Fortress.',
    targetId: 'pipeline-sub-header',
    position: 'bottom',
  },
  {
    id: 'pipeline-qa',
    title: 'BDD Test Plan Generator',
    description:
      'Generates Given/When/Then test scenarios, edge cases, and security checks for your entire repository.',
    targetId: 'pipeline-qa-panel',
    position: 'right',
  },
  {
    id: 'pipeline-gen-qa',
    title: 'Generate Test Plan',
    description:
      'Click "Generate" to have Fortress analyse your code and produce a comprehensive BDD test strategy.',
    targetId: 'pipeline-gen-qa-btn',
    position: 'bottom',
  },
  {
    id: 'pipeline-docs',
    title: 'API Documenter',
    description:
      'Generates Markdown API documentation with Swagger/OpenAPI blocks from your endpoint definitions.',
    targetId: 'pipeline-docs-panel',
    position: 'left',
  },
  {
    id: 'pipeline-gen-docs',
    title: 'Generate API Docs',
    description:
      'Click "Generate" to produce complete API documentation for all your routes and endpoints.',
    targetId: 'pipeline-gen-docs-btn',
    position: 'bottom',
  },
];

export const INFRA_STEPS: TutorialStep[] = [
  {
    id: 'infra-welcome',
    title: '☁️ Infrastructure Predictor',
    description:
      'Velocis analyses your repository and generates Terraform IaC, predicts your AWS architecture, and estimates monthly costs.',
  },
  {
    id: 'infra-env',
    title: 'Environment Selector',
    description:
      'Choose whether to generate infrastructure for production, staging, or a preview environment.',
    targetId: 'infra-env-selector',
    position: 'bottom',
  },
  {
    id: 'infra-analyse',
    title: 'Analyse Infrastructure',
    description:
      'Click to have the IaC Predictor scan your code files and generate the Terraform configuration.',
    targetId: 'infra-analyse-btn',
    position: 'bottom',
  },
  {
    id: 'infra-code',
    title: 'Terraform Code Viewer',
    description:
      'The generated main.tf file with syntax highlighting and a diff view showing added, modified, and removed resources.',
    targetId: 'infra-code-panel',
    position: 'right',
  },
  {
    id: 'infra-cost',
    title: 'Cost & Analytics Panel',
    description:
      'See the projected monthly cost, a service breakdown, change impact summary, and AI-generated confidence checks.',
    targetId: 'infra-cost-panel',
    position: 'left',
  },
];

export const CORTEX_STEPS: TutorialStep[] = [
  {
    id: 'cortex-welcome',
    title: '🕸 Visual Cortex',
    description:
      'Visual Cortex maps your service architecture as an interactive graph, showing dependencies, health scores, and runtime behaviour.',
  },
  {
    id: 'cortex-view',
    title: 'View Modes',
    description:
      'Switch between Architecture (graph), Service Map (grid by layer), and Dependency Flow views.',
    targetId: 'cortex-view-switcher',
    position: 'bottom',
  },
  {
    id: 'cortex-rebuild',
    title: 'Build / Rebuild Graph',
    description:
      'Click "Build" to analyse your repository for the first time, or "Rebuild" to refresh with the latest changes.',
    targetId: 'cortex-rebuild-btn',
    position: 'right',
  },
  {
    id: 'cortex-layers',
    title: 'Layer Controls',
    description:
      'Toggle visibility for Edge/Gateway, Compute Services, and Data/Persistence layers to focus on specific parts of your system.',
    targetId: 'cortex-layer-controls',
    position: 'right',
  },
  {
    id: 'cortex-canvas',
    title: 'Architecture Canvas',
    description:
      'Click any service node to see detailed health metrics, or drill down into its files to explore the internal dependency graph.',
    targetId: 'cortex-canvas',
    position: 'bottom',
  },
];

export const AUTOMATION_STEPS: TutorialStep[] = [
  {
    id: 'automation-welcome',
    title: '🤖 Automation Report',
    description:
      'The consolidated output of your autonomous pipeline — Sentinel review, Fortress test plan, and Infrastructure prediction — triggered automatically on commit.',
  },
  {
    id: 'automation-restart',
    title: 'Restart Pipeline',
    description:
      'Manually re-trigger the full autonomous pipeline on the latest commit for a fresh analysis.',
    targetId: 'automation-restart-btn',
    position: 'bottom',
  },
  {
    id: 'automation-sentinel',
    title: 'Sentinel Deep Review',
    description:
      'AI security and code quality analysis — risk level, finding counts, executive summary, and expandable finding cards with fix suggestions.',
    targetId: 'automation-sentinel-card',
    position: 'right',
  },
  {
    id: 'automation-fortress',
    title: 'Fortress QA Test Plan',
    description:
      'The complete BDD test strategy generated by Fortress, ready to guide your QA team or seed your CI pipeline.',
    targetId: 'automation-fortress-card',
    position: 'right',
  },
  {
    id: 'automation-infra',
    title: 'Infrastructure Prediction',
    description:
      'AI-forecasted architecture changes and cost projections automatically generated from the code changes in the latest commit.',
    targetId: 'automation-infra-card',
    position: 'right',
  },
];

export const SETTINGS_STEPS: TutorialStep[] = [
  {
    id: 'settings-welcome',
    title: '⚙️ Repository Settings',
    description:
      'Configure the autonomous pipeline for this repository. Once enabled, Velocis runs Sentinel, Fortress, and Infrastructure agents on every commit.',
  },
  {
    id: 'settings-card',
    title: 'Autonomous Repository Engine',
    description:
      'A single toggle activates Cortex tracing, Sentinel code review, Fortress testing, and infrastructure prediction.',
    targetId: 'settings-automation-card',
    position: 'top',
  },
  {
    id: 'settings-enable',
    title: 'Enable Automation',
    description:
      'Click this button to enable the full autonomous pipeline. You\'ll be asked to type "confirm" as a safety gate before activation.',
    targetId: 'settings-enable-btn',
    position: 'bottom',
  },
  {
    id: 'settings-workflow',
    title: 'Automation Workflow',
    description:
      'The three-step pipeline that runs after each commit: Cortex traces dependencies, Sentinel reviews code, Fortress generates the test plan.',
    targetId: 'settings-workflow-steps',
    position: 'right',
  },
];

interface TutorialContextValue {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  next: () => void;
  skip: () => void;
  /** Pass the steps to show and the localStorage key that marks this tour as seen. */
  start: (steps?: TutorialStep[], storageKey?: string) => void;
}

const TutorialContext = createContext<TutorialContextValue>({
  isActive: false,
  currentStep: 0,
  steps: DASHBOARD_STEPS,
  next: () => {},
  skip: () => {},
  start: () => {},
});

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>(DASHBOARD_STEPS);
  // Tracks which localStorage key to write when this tour ends/is skipped
  const activeKeyRef = useRef<string | null>(null);

  const finish = useCallback(() => {
    setIsActive(false);
    if (activeKeyRef.current) {
      localStorage.setItem(activeKeyRef.current, 'true');
    }
  }, []);

  const start = useCallback((newSteps?: TutorialStep[], storageKey?: string) => {
    if (newSteps) setSteps(newSteps);
    activeKeyRef.current = storageKey ?? null;
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    setCurrentStep((s) => {
      if (s < steps.length - 1) return s + 1;
      finish();
      return s;
    });
  }, [steps.length, finish]);

  const skip = useCallback(() => finish(), [finish]);

  return (
    <TutorialContext.Provider value={{ isActive, currentStep, steps, next, skip, start }}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => useContext(TutorialContext);
