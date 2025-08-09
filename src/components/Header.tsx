
import React from 'react';
import { Link } from 'react-router-dom';
import MainNavigationMenu from './NavigationMenu';
import MobileNavigationMenu from './MobileNavigationMenu';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl text-primary">HazardCloud</span>
        </Link>
        <div className="flex flex-1 items-center justify-between">
          <MainNavigationMenu />
          <MobileNavigationMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
