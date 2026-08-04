import Link from "next/link";
import { useAccount } from "wagmi";

type Appointment = {
  id: string; // ✅ UUID – database primary key, used for routing and status updates
  chainAppointmentId: string | number;
  patient: { name: string; wallet: string } | null;
  doctor: { name: string; wallet: string } | null;
  date: string | null;
  status: string;
  description: string;
};

interface AppointmentCardProps {
  appointment: Appointment;
  onDelete?: (id: string) => void; // ✅ UUID
  onStatusUpdate?: (id: string, status: string) => void; // ✅ UUID
  isPending?: boolean;
}

export default function AppointmentCard({
  appointment,
  onDelete,
  onStatusUpdate,
  isPending,
}: AppointmentCardProps) {
  const { address } = useAccount();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Not set" : d.toLocaleDateString();
  };

  const patientName = appointment.patient?.name || "Unknown";
  const doctorAddress = appointment.doctor?.wallet
    ? `${appointment.doctor.wallet.slice(0, 6)}...${appointment.doctor.wallet.slice(-4)}`
    : "Unknown";

  const isDoctor = address === appointment.doctor?.wallet;
  const canDelete = isDoctor;

  const canConfirm = isDoctor && appointment.status === "PENDING";
  const canComplete = isDoctor && appointment.status === "CONFIRMED";
  const canReject = isDoctor && appointment.status === "PENDING";

  const handleConfirm = () => {
    if (onStatusUpdate) onStatusUpdate(appointment.id, "CONFIRMED"); // ✅ UUID
  };

  const handleComplete = () => {
    if (onStatusUpdate) onStatusUpdate(appointment.id, "COMPLETED"); // ✅ UUID
  };

  const handleReject = () => {
    if (window.confirm("Reject this appointment?")) {
      if (onStatusUpdate) onStatusUpdate(appointment.id, "CANCELLED"); // ✅ UUID
    }
  };

  const handleDelete = () => {
    if (window.confirm("Delete this appointment?")) {
      if (onDelete) onDelete(appointment.id); // ✅ UUID
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Appointment #{appointment.chainAppointmentId || appointment.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span className="font-medium">Patient:</span> {patientName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Doctor:</span> {doctorAddress}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Date:</span> {formatDate(appointment.date)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span className="font-medium">Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                appointment.status === "CONFIRMED"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : appointment.status === "COMPLETED"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : appointment.status === "CANCELLED"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
              }`}
            >
              {appointment.status || "PENDING"}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* ✅ Always use the UUID for the detail link */}
          <Link
            href={`/appointments/${appointment.id}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            View Details →
          </Link>
          {canConfirm && (
            <button
              onClick={handleConfirm}
              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? "Confirming..." : "Confirm"}
            </button>
          )}
          {canReject && (
            <button
              onClick={handleReject}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
              disabled={isPending}
            >
              Reject
            </button>
          )}
          {canComplete && (
            <button
              onClick={handleComplete}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? "Completing..." : "Complete"}
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
