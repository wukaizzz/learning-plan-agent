import { createBrowserRouter, Navigate } from 'react-router';
import React from 'react';
import { ChatPanel } from '../components/chat/ChatPanel';
import { WorkSpacePanel } from '../components/workspace/WorkSpacePanel';

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
    Component: ChatPanel,
  },

]);

export default router;