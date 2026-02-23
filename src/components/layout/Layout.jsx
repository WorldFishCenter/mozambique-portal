import React from 'react';
import { Sidebar, MobileNav } from './Sidebar';

const Layout = ({
  children,
  theme,
  toggleTheme,
  selectedLandingSite,
  setSelectedLandingSite,
  currency,
  setCurrency,
}) => {
  const sidebarProps = {
    theme,
    toggleTheme,
    selectedLandingSite,
    setSelectedLandingSite,
    currency,
    setCurrency,
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex">
      <Sidebar {...sidebarProps} />

      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background/95 px-6 h-14 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <MobileNav {...sidebarProps} />
          <div className="font-semibold text-lg">PESKAS</div>
        </header>

        <main className="flex-1 p-6 md:p-8 pt-6">
          <div className="container max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
