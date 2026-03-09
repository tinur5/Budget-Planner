import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          userName={session.user.name}
          userRole={session.user.role}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={session.user.name} userRole={session.user.role} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
