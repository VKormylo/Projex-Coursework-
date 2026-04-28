import { type ReactNode, useMemo } from "react";
import Sidebar from "~/components/sidebar/Sidebar";

function formatDate() {
  return new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const date = useMemo(() => formatDate(), []);

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-[#e2e8f0] bg-white px-6">
          <p className="text-sm font-normal leading-5 text-[#45556c]">{date}</p>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
