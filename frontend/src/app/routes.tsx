/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layout';

const Dashboard = lazy(() => import('../features/dashboard'));
const KBList = lazy(() => import('../features/knowledge-base/KBList'));
const KBDetail = lazy(() => import('../features/knowledge-base/KBDetail'));
const AgentList = lazy(() => import('../features/agents/AgentList'));
const AgentDetail = lazy(() => import('../features/agents/AgentDetail'));
const ModelPage = lazy(() => import('../features/models'));
const ChatPage = lazy(() => import('../features/chat'));
const PromptPage = lazy(() => import('../features/prompts'));
const SettingsPage = lazy(() => import('../features/settings'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'knowledge-bases', element: <KBList /> },
      { path: 'knowledge-bases/:id', element: <KBDetail /> },
      { path: 'agents', element: <AgentList /> },
      { path: 'agents/:id', element: <AgentDetail /> },
      { path: 'models', element: <ModelPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'prompts', element: <PromptPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
