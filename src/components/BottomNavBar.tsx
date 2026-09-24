import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Calendar, UserRound, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pacientes", url: "/pacientes", icon: UserRound },
  { title: "Historias", url: "/historias", icon: FileText },
];

export function BottomNavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-card border-t border-border/40 md:hidden pb-safe">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.title}
            to={item.url as any}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "flex items-center justify-center p-1 rounded-full",
              active ? "bg-primary/10" : "bg-transparent"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
