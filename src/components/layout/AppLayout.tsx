import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        {/* Add top padding on mobile to account for menu button */}
        <div className="content-container animate-fade-in pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}