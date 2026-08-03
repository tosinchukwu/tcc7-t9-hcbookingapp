import AppointmentForm from "@/components/AppointmentForm";
import Link from "next/link";

export default function CreatePage() {
  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mb-4 transition text-sm sm:text-base"
        >
          ← Back to Home
        </Link>
        <AppointmentForm />
      </div>
    </div>
  );
}