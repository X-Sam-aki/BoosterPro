import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Home, ShoppingCart, Package, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { signOut } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <Home className="h-4 w-4 mr-2" /> },
    { label: "Marketplace", path: "/marketplace", icon: <ShoppingCart className="h-4 w-4 mr-2" /> },
    { label: "My Orders", path: "/order", icon: <Package className="h-4 w-4 mr-2" /> },
    { label: "Profile", path: "/profile", icon: <User className="h-4 w-4 mr-2" /> },
  ];

  return (
    <nav className="bg-background border-b border-border py-3 px-4 md:px-6 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/dashboard">
          <div className="flex items-center cursor-pointer">
            <span className="text-xl font-bold text-primary">SocialBoost</span>
          </div>
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="p-1">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? "default" : "ghost"}
                className="flex items-center"
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          ))}
          <Button variant="ghost" className="flex items-center" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg">
          <div className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}