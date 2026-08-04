"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";

export default function AdminDoctors() {
  const { address, isConnected, isReconnecting } = useAccount();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [connectionConfirmed, setConnectionConfirmed] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    wallet: "",
    specialty: "",
    hospital: "",
    location: "",
    bio: "",
    yearsExperience: "",
    rating: "",
    isActive: true,
  });

  // ---- Connection stability check ----
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

  // ---- Admin check ----
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
        const [checkRes, doctorsRes] = await Promise.all([
          fetch(`/api/admin/check?wallet=${address}`),
          fetch(`/api/admin/doctors?wallet=${address}`),
        ]);

        const { isAdmin: admin } = await checkRes.json();
        setIsAdmin(admin);
        setChecking(false);

        if (admin) {
          const data = await doctorsRes.json();
          setDoctors(data);
        } else {
          setDoctors([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [address, isConnected, isReconnecting, connectionConfirmed]);

  // ---- Handlers ----
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`/api/admin/doctors?wallet=${address}`);
      if (!res.ok) throw new Error("Failed to fetch doctors");
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this doctor?")) return;
    try {
      await fetch(`/api/admin/doctors?wallet=${address}&id=${id}`, { method: "DELETE" });
      await fetchDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = `/api/admin/doctors?wallet=${address}`;
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;
    try {
      await fetch(url, {
        method,
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      setEditing(null);
      setForm({
        name: "",
        email: "",
        wallet: "",
        specialty: "",
        hospital: "",
        location: "",
        bio: "",
        yearsExperience: "",
        rating: "",
        isActive: true,
      });
      await fetchDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Rendering ----
  if (!connectionConfirmed || isReconnecting || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {!connectionConfirmed ? "Connecting wallet..." : isReconnecting ? "Reconnecting wallet..." : "Verifying access..."}
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <p className="text-gray-700 dark:text-gray-300">Please connect your wallet.</p>
        <Link href="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">🏠 Go Home</Link>
      </div>
    );
  }

  if (checking === false && isAdmin === false) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <p className="text-red-600 dark:text-red-400 text-lg font-semibold">⛔ Unauthorized – you are not an admin.</p>
        <Link href="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">🏠 Go Home</Link>
      </div>
    );
  }

  return (
    <AdminLayout wallet={address}>
      <h2 className="text-2xl sm:text-3xl font-serif text-blue-600 dark:text-blue-400 mb-4 sm:mb-6">Manage Doctors</h2>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{editing ? "Edit Doctor" : "Add New Doctor"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="Wallet Address" value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} required />
          <input className="input-field" placeholder="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required />
          <input className="input-field" placeholder="Hospital" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
          <input className="input-field" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className="input-field" placeholder="Years Experience" value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })} />
          <input className="input-field" placeholder="Rating (0-5)" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
          <textarea className="input-field col-span-1 sm:col-span-2" placeholder="Bio" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
        </div>
        <button type="submit" className="mt-4 btn-primary">{editing ? "Update" : "Add"} Doctor</button>
        {editing && (
          <button type="button" className="ml-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => { setEditing(null); setForm({ name: "", email: "", wallet: "", specialty: "", hospital: "", location: "", bio: "", yearsExperience: "", rating: "", isActive: true }); }}>Cancel</button>
        )}
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
            <tr><th className="p-2 sm:p-3 text-left text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th><th className="p-2 sm:p-3 text-left text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Specialty</th><th className="p-2 sm:p-3 text-left text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Hospital</th><th className="p-2 sm:p-3 text-left text-gray-600 dark:text-gray-300 uppercase tracking-wider">Active</th><th className="p-2 sm:p-3 text-left text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th></tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td className="p-2 sm:p-3 text-gray-800 dark:text-gray-200">{doc.name}</td>
                <td className="p-2 sm:p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{doc.specialty}</td>
                <td className="p-2 sm:p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{doc.hospital || "—"}</td>
                <td className="p-2 sm:p-3 text-gray-800 dark:text-gray-200">{doc.isActive ? "✅" : "❌"}</td>
                <td className="p-2 sm:p-3 space-x-2">
                  <button className="text-blue-600 dark:text-blue-400 hover:underline" onClick={() => { setEditing(doc); setForm({ ...doc, yearsExperience: String(doc.yearsExperience || 0), rating: String(doc.rating || 0) }); }}>Edit</button>
                  <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300" onClick={() => handleDelete(doc.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}