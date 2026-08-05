"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";

// Types
interface Stats {
  totalAppointments: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalDoctors: number;
  totalPatients: number;
  recentAppointments: Array<{
    id: string;
    patientName: string;
    doctorName: string;
    date: string;
    status: string;
  }>;
}

export default function AdminDashboard() {
  const { address, isConnected, isReconnecting } = useAccount();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [connectionConfirmed, setConnectionConfirmed] = useState(false);

  // ---- Connection stability check (matches AdminSettings EXACTLY) ----
  useEffect(() => {
    if (isConnected && address) {
      setConnectionConfirmed(true);
      return;
    }
    const timer = setTimeout(() => {
      if (!isConnected || !address) {
        setConnectionConfirmed(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isConnected, address]);

  // ---- Admin check + fetch stats (parallel, matches AdminSettings) ----
  useEffect(() => {
    if (!connectionConfirmed) return;

    if (isReconnecting) {
      setChecking(true);
      setLoading(true);
      return;
    }

    if (!isConnected || !address) {
      setChecking(false);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        // Parallel fetch: admin check + stats
        const [checkRes, statsRes] = await Promise.all([
          fetch(`/api/admin/check?wallet=${address}`),
          fetch(`/api/admin/stats?wallet=${address}`),
        ]);

        const { isAdmin: admin } = await checkRes.json();
        setIsAdmin(admin);
        setChecking(false);

        if (admin) {
          if (!statsRes.ok) throw new Error("Failed to fetch stats");
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [address, isConnected, isReconnecting, connectionConfirmed]);

  // ---- Status Badge Component ----
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {status}
      </span>
    );
  };

  // ---- Stats Cards Configuration ----
  const cards = [
    { label: "Total Appointments", value: stats?.totalAppointments || 0, icon: CalendarCheck, color: "bg-blue-500" },
    { label: "Pending", value: stats?.pending || 0, icon: Clock, color: "bg-yellow-500" },
    { label: "Confirmed", value: stats?.confirmed || 0, icon: CheckCircle, color: "bg-green-500" },
    { label: "Completed", value: stats?.completed || 0, icon: CalendarClock, color: "bg-purple-500" },
    { label: "Cancelled", value: stats?.cancelled || 0, icon: CalendarX, color: "bg-red-500" },
    { label: "Doctors", value: stats?.totalDoctors || 0, icon: Stethoscope, color: "bg-indigo-500" },
    { label: "Patients", value: stats?.totalPatients || 0, icon: User, color: "bg-pink-500" },
  ];

  // ---- Rendering (matches AdminSettings EXACTLY) ----
  if (!connectionConfirmed || isReconnecting || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {!connectionConfirmed
              ? "Connecting wallet..."
              : isReconnecting
              ? "Reconnecting wallet..."
              : "Verifying access..."}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <p className="text-gray-700 dark:text-gray-300">Please connect your wallet.</p>
        <Link href="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          🏠 Go Home
        </Link>
      </div>
    );
  }

  if (checking === false && isAdmin === false) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <p className="text-red-600 dark:text-red-400 text-lg font-semibold">⛔ Unauthorized – you are not an admin.</p>
        <Link href="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          🏠 Go Home
        </Link>
      </div>
    );
  }

  // ---- Admin Dashboard Content ----
  return (
    <AdminLayout wallet={address}>
      <h2 className="text-2xl sm:text-3xl font-serif text-blue-600 dark:text-blue-400 mb-4 sm:mb-6">
        Dashboard
      </h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Stats Cards Grid - responsive for mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-6 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                  {card.label}
                </p>
                <p className="text-lg sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-full p-1.5 sm:p-2 ${card.color} bg-opacity-10 flex-shrink-0 ml-2`}>
                <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Appointments Table - mobile responsive */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 shadow-md">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Recent Appointments
        </h3>
        {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Patient
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Doctor
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Date
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.recentAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {appt.patientName}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {appt.doctorName}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(appt.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No recent appointments found.
          </p>
        )}
      </div>
    </AdminLayout>
  );
}