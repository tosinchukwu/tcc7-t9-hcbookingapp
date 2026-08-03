"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterDoctor() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    specialty: "",
    hospital: "",
    location: "",
    bio: "",
    yearsExperience: "",
    autoConfirm: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert("Please connect your wallet first.");
      return;
    }
    setSubmitting(true);
    const payload = { ...form, wallet: address, role: "DOCTOR" };
    try {
      const res = await fetch("/api/doctors/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        alert("Registration successful!");
        router.push("/dashboard");
      } else {
        const err = await res.text();
        alert("Registration failed: " + err);
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Link
        href="/"
        className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mb-4 transition text-sm sm:text-base"
      >
        ← Back to Home
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Register as Doctor</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Specialty *</label>
          <input
            type="text"
            required
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Hospital</label>
          <input
            type="text"
            value={form.hospital}
            onChange={(e) => setForm({ ...form, hospital: e.target.value })}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Years of Experience</label>
          <input
            type="number"
            value={form.yearsExperience}
            onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.autoConfirm}
              onChange={(e) => setForm({ ...form, autoConfirm: e.target.checked })}
            />
            Auto-confirm appointments
          </label>
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}