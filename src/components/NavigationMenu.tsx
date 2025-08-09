
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger, 
  navigationMenuTriggerStyle 
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Home, Info, AlertTriangle, Shield } from "lucide-react";

const MainNavigationMenu = () => {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <Link to="/emergency-model">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency Model
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <Link to="/safety-protocols">
              <Shield className="mr-2 h-4 w-4" />
              Safety Protocols
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <Link to="/about">
              <Info className="mr-2 h-4 w-4" />
              About & Credits
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainNavigationMenu;
