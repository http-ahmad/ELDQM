
import React from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Info, AlertTriangle, Shield } from "lucide-react";

const MobileNavigationMenu = () => {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="flex flex-col space-y-4 py-4">
            <Link 
              to="/" 
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
            <Link 
              to="/emergency-model" 
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency Model
            </Link>
            <Link 
              to="/safety-protocols" 
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Shield className="mr-2 h-4 w-4" />
              Safety Protocols
            </Link>
            <Link 
              to="/about" 
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Info className="mr-2 h-4 w-4" />
              About & Credits
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigationMenu;
