import './App.css';
import router from './router';
import { RouterProvider } from 'react-router';
import { useEffect } from 'react';
import { bootstrapSpaceChatPersistence } from '@/services/persistenceBootstrap';
import { startPersistenceCoordinator } from '@/services/persistenceCoordinator';
import { PersistenceSyncStatus } from '@/components/persistence/PersistenceSyncStatus';
function App() {
  useEffect(() => {
    const stopCoordinator = startPersistenceCoordinator();
    void bootstrapSpaceChatPersistence().catch(() => {
      // Stores retain their local caches when the database is unavailable.
    });
    return stopCoordinator;
  }, []);

  return (
    <div className="app">
      <RouterProvider router={router}></RouterProvider>
      <PersistenceSyncStatus />
    </div>
  );
}

export default App;
