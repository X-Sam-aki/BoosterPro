import { useState, useEffect } from "react";
import { BarChart, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("/dashboard");

  useEffect(() => {
    // Update active tab based on current path
    if (location === "/") {
      setActiveTab("/dashboard");
    } else if (location.startsWith("/marketplace")) {
      setActiveTab("/marketplace");
    } else if (location.startsWith("/order") || location.startsWith("/orders")) {
      setActiveTab("/orders");
    } else if (location.startsWith("/profile")) {
      setActiveTab("/profile");
    } else {
      setActiveTab(location);
    }
  }, [location]);

  const navItems: NavItem[] = [
    {
      icon: <BarChart className="text-lg h-5 w-5" />,
      label: "Dashboard",
      path: "/dashboard"
    },
    {
      icon: <ShoppingCart className="text-lg h-5 w-5" />,
      label: "Services",
      path: "/marketplace"
    },
    {
      icon: <ClipboardList className="text-lg h-5 w-5" />,
      label: "Orders",
      path: "/orders"
    },
    {
      icon: <User className="text-lg h-5 w-5" />,
      label: "Profile",
      path: "/profile"
    }
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleTabClick(item.path)}
            className={cn(
              "flex flex-col items-center justify-center py-3 w-full",
              activeTab === item.path
                ? "text-primary"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
