import { ReactNode } from "react";
import { Navbar } from "@/components/ui/navbar";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-20 pb-8">
        {children}
      </main>
    </div>
  );
}