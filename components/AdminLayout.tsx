"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children, wallet }: { children: React.ReactNode; wallet?: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Doctors", href: "/admin/doctors" },
    { name: "Settings", href: "/admin/settings" },
    { name: "🏠 Home", href: "/" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col sm:flex-row">
      <aside className="w-full sm:w-64 bg-white dark:bg-slate-800 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-slate-700 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-md">
        <div className="text-center border-b border-gray-200 dark:border-slate-700 pb-4">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-blue-600 dark:text-blue-400 tracking-wide">Admin</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {wallet ? `${wallet.slice(0, 10)}...` : "No wallet"}
          </p>
        </div>
        <nav className="flex flex-row sm:flex-col gap-2 sm:gap-1 overflow-x-auto sm:overflow-x-visible flex-wrap">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap sm:whitespace-normal text-sm sm:text-base ${
                pathname === item.href
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="hidden sm:block absolute bottom-6 text-xs text-gray-400">
          <p>© 2026 HealthBooking</p>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}