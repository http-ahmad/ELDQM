
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

interface SlidingTabNavigationProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  fullWidth?: boolean;
  includeAboutTab?: boolean;
}

export const SlidingTabNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  fullWidth = false,
  includeAboutTab = false
}: SlidingTabNavigationProps) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  
  // Check if scrolling is needed
  const checkScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    }
  };
  
  // Scroll to active tab
  const scrollToActiveTab = () => {
    if (tabsContainerRef.current) {
      const activeTabElement = tabsContainerRef.current.querySelector(`[data-state="active"]`);
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement as HTMLElement;
        const { scrollLeft, clientWidth } = tabsContainerRef.current;
        
        // Calculate center position
        const targetScrollLeft = offsetLeft - (clientWidth / 2) + (offsetWidth / 2);
        
        // Smooth scroll to the active tab
        tabsContainerRef.current.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };
  
  // Scroll left
  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      const { clientWidth } = tabsContainerRef.current;
      tabsContainerRef.current.scrollBy({
        left: -clientWidth / 2,
        behavior: 'smooth'
      });
    }
  };
  
  // Scroll right
  const scrollRight = () => {
    if (tabsContainerRef.current) {
      const { clientWidth } = tabsContainerRef.current;
      tabsContainerRef.current.scrollBy({
        left: clientWidth / 2,
        behavior: 'smooth'
      });
    }
  };
  
  // Initialize and update scroll indicators
  useEffect(() => {
    checkScroll();
    scrollToActiveTab();
    
    // Add resize and scroll event listeners
    window.addEventListener('resize', checkScroll);
    if (tabsContainerRef.current) {
      tabsContainerRef.current.addEventListener('scroll', checkScroll);
    }
    
    return () => {
      window.removeEventListener('resize', checkScroll);
      if (tabsContainerRef.current) {
        tabsContainerRef.current.removeEventListener('scroll', checkScroll);
      }
    };
  }, [activeTab, tabs]);
  
  return (
    <div className="relative flex items-center w-full">
      {showLeftArrow && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0 z-10 bg-background/80 backdrop-blur-sm" 
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      <div 
        ref={tabsContainerRef} 
        className="flex-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className={`${fullWidth ? 'w-full grid' : ''} h-auto p-1`} style={fullWidth ? { gridTemplateColumns: `repeat(${includeAboutTab ? tabs.length + 1 : tabs.length}, 1fr)` } : {}}>
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                className="px-4 py-2 whitespace-nowrap text-sm"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
            {includeAboutTab && (
              <TabsTrigger 
                key="about-tab"
                value="about"
                asChild
                className="px-4 py-2 whitespace-nowrap text-sm"
              >
                <Link to="/about">About</Link>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>
      
      {showRightArrow && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 z-10 bg-background/80 backdrop-blur-sm" 
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Add custom styles to hide scrollbar
const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(style);
