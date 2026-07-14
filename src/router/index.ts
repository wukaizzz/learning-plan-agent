import { createBrowserRouter, Navigate } from 'react-router';
import React from 'react';
import { WorkSpacePanel } from '../components/workspace/WorkSpacePanel';
import {
  SpaceAgentChatPage,
  SpaceOverviewPage,
  SpacePlanPage,
  SpaceSettingsPage,
  SpaceTasksPage,
  SpaceTimelinePage,
  StudySpaceLayout
} from '../components/study-space';

const router = createBrowserRouter([
  {
    path: '/',
    element: React.createElement(Navigate, { to: '/workSpace', replace: true }),
  },
  {
    path: '/workSpace',
    Component: WorkSpacePanel,
  },
  {
    path: '/workSpace/:spaceId',
    Component: StudySpaceLayout,
    children: [
      {
        index: true,
        element: React.createElement(Navigate, { to: 'overview', replace: true }),
      },
      {
        path: 'overview',
        Component: SpaceOverviewPage,
      },
      {
        path: 'chat',
        Component: SpaceAgentChatPage,
      },
      {
        path: 'tasks',
        Component: SpaceTasksPage,
      },
      {
        path: 'plan',
        Component: SpacePlanPage,
      },
      {
        path: 'timeline',
        Component: SpaceTimelinePage,
      },
      {
        path: 'settings',
        Component: SpaceSettingsPage,
      },
      {
        path: '*',
        element: React.createElement(Navigate, { to: '../overview', replace: true }),
      },
    ],
  },

]);

export default router;
