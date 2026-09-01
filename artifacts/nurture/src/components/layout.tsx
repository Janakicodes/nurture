import { BottomNav } from "./bottom-nav";

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col w-full max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <main className={`flex-1 flex flex-col overflow-y-auto ${showNav ? "pb-20" : ""}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
