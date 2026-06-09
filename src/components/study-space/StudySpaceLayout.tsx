import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import { PlanWorkspace } from '@/components/chat/PlanWorkspace';
import { useChatStore, useSpaceStore } from '@/store';
import { usePlanHydration } from '@/hooks';
import { SpaceNavSidebar } from './SpaceNavSidebar';
import { getHasGeneratedPlan, isPlanGenerationState } from './spacePlanStatus';
import './StudySpaceLayout.css';

export const StudySpaceLayout: React.FC = () => {
  const { spaceId } = useParams();
  const location = useLocation();
  const spaces = useSpaceStore(state => state.spaces);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const workspaceState = useChatStore(state => state.workspaceState);
  const currentChatSpaceId = useChatStore(state => state.currentSpaceId);
  const switchToSpaceSession = useChatStore(state => state.switchToSpaceSession);

  // 🆕 从 planStore 获取持久化 blocks（订阅式）
  const { uiBlocks: effectiveUiBlocks, hasPlan: persistedHasPlan } = usePlanHydration(spaceId);

  const currentSpace = spaceId
    ? spaces.find(space => space.id === spaceId && !space.isDeleted) || null
    : null;
  const resolvedSpaceId = currentSpace?.id;
  const effectiveWorkspaceState = currentChatSpaceId === spaceId ? workspaceState : 'empty';
  const hasPlan = persistedHasPlan || getHasGeneratedPlan(currentSpace, effectiveUiBlocks);
  const isChatRoute = location.pathname.endsWith('/chat');
  const shouldShowPlanDock = isChatRoute && (
    effectiveUiBlocks.length > 0 ||
    isPlanGenerationState(effectiveWorkspaceState) ||
    effectiveWorkspaceState === 'finalized'
  );

  useEffect(() => {
    if (spaceId && resolvedSpaceId) {
      switchSpace(spaceId);
      if (currentChatSpaceId !== spaceId) {
        switchToSpaceSession(spaceId);
      }
    }
  }, [spaceId, resolvedSpaceId, currentChatSpaceId, switchSpace, switchToSpaceSession]);

  if (!spaceId) {
    return <Navigate to="/workSpace" replace />;
  }

  if (!currentSpace) {
    return (
      <div className="study-space-not-found">
        <h1>未找到学习空间</h1>
        <p>该学习空间不存在，或已经被删除。</p>
        <Navigate to="/workSpace" replace />
      </div>
    );
  }

  return (
    <div className="study-space-layout">
      <SpaceNavSidebar
        space={currentSpace}
        hasPlan={hasPlan}
        workspaceState={effectiveWorkspaceState}
      />
      <main className="study-space-main">
        <Outlet />
      </main>
      {shouldShowPlanDock && (
        <PlanWorkspace
          workspaceState={effectiveWorkspaceState}
          uiBlocks={effectiveUiBlocks}
        />
      )}
    </div>
  );
};
