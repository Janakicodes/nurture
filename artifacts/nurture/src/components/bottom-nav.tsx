import { Link, useLocation } from "wouter";
import { Home, Activity, Calendar, Award, User } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/track", icon: Activity, label: "Track" },
    { href: "/appointments", icon: Calendar, label: "Visits" },
    { href: "/benefits", icon: Award, label: "Benefits" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center w-full h-full space-y-1">
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
