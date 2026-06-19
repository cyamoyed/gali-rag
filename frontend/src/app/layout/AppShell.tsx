import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Spinner, ToastContainer } from '../../shared/components/ui';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-canvas-soft p-4 lg:p-8">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><Spinner /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
