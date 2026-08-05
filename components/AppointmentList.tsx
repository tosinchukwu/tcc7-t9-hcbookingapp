"use client";
import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import AppointmentCard from "./AppointmentCard";
import { useConfirmAppointment, useCompleteAppointment } from "@/hooks/useAppointments";
import DoctorCommentModal from "./DoctorCommentModal";

type Appointment = {
  id: string;
  chainAppointmentId: string | number;
  patient: { name: string; wallet: string } | null;
  doctor: { name: string; wallet: string } | null;
  date: string | null;
  status: string;
  description: string;
};

interface AppointmentListProps {
  patientId?: string;
  patientWallet?: string;
  doctorId?: string;
  refresh?: number;
  onUpdate?: () => void;
  isPending?: boolean;
}

export default function AppointmentList({
  patientId,
  patientWallet,
  doctorId,
  refresh,
  onUpdate,
  isPending,
}: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string; status: string; comment: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<{ id: string; status: string } | null>(null);

  // Hooks
  const { confirm: confirmAppointment, data: confirmData, isPending: isConfirmPending } = useConfirmAppointment();
  const { complete: completeAppointment, data: completeData, isPending: isCompletePending } = useCompleteAppointment();

  // For fallback: watch the transaction hash from the hook data
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isWaiting, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  // Combined pending state
  const isTransactionPending = isConfirmPending || isCompletePending || isWaiting;
  const combinedPending = isPending || isTransactionPending || !!pendingUpdate;

  // Fetch appointments
  const fetchAppointments = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (patientId) params.append("patientId", patientId);
    if (patientWallet) params.append("patientWallet", patientWallet);
    if (doctorId) params.append("doctorId", doctorId);
    const url = `/api/appointments?${params.toString()}`;
    console.log("📡 Fetching appointments with params:", params.toString());
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch appointments");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Fetched appointments:", data.length);
        setAppointments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching appointments:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId, patientWallet, doctorId, refresh, refreshTrigger]);

  // ---- Handle successful transaction (called by both receipt and fallback) ----
  const handleTransactionSuccess = (receipt: any, pending: { id: string; status: string; comment: string }) => {
    const { id: uuid, status, comment } = pending;
    const txHash = receipt.transactionHash;
    const blockNumber = Number(receipt.blockNumber);

    console.log(`✅ Transaction mined – updating appointment ${uuid} to ${status}`);
    fetch(`/api/appointments/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        doctorComment: comment,
        txHash,
        blockNumber,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update appointment status");
        return res.json();
      })
      .then((data) => {
        console.log(`✅ Appointment ${uuid} updated to ${status}`, data);
        fetchAppointments();
        setRefreshTrigger((prev) => prev + 1);
        if (onUpdate) onUpdate();
      })
      .catch((err) => {
        console.error("Error updating appointment status:", err);
        alert("Transaction succeeded but failed to update database. Please refresh.");
      })
      .finally(() => {
        setPendingUpdate(null);
        setTxHash(undefined);
      });
  };

  // ---- Primary: use receipt from the hook ----
  useEffect(() => {
    console.log("🔍 confirmData changed:", confirmData);
    if (confirmData && pendingUpdate && confirmData.receipt) {
      handleTransactionSuccess(confirmData.receipt, pendingUpdate);
    }
  }, [confirmData]);

  useEffect(() => {
    console.log("🔍 completeData changed:", completeData);
    if (completeData && pendingUpdate && completeData.receipt) {
      handleTransactionSuccess(completeData.receipt, pendingUpdate);
    }
  }, [completeData]);

  // ---- Fallback: use the transaction hash with wagmi's useWaitForTransactionReceipt ----
  useEffect(() => {
    // Set txHash when we get a hash from the hook data (but no receipt yet)
    if (confirmData && confirmData.hash && !pendingUpdate) {
      // If we have a hash but no pendingUpdate, we might have missed it? Not likely.
    }
    if (completeData && completeData.hash && !pendingUpdate) {
      // same
    }
  }, [confirmData, completeData]);

  // When the hook provides a hash but no receipt (shouldn't happen with our hook), we use the fallback
  useEffect(() => {
    if (confirmData && confirmData.hash && !confirmData.receipt && pendingUpdate) {
      console.log("⏳ Fallback: using confirmData.hash for receipt watch");
      setTxHash(confirmData.hash);
    }
  }, [confirmData]);

  useEffect(() => {
    if (completeData && completeData.hash && !completeData.receipt && pendingUpdate) {
      console.log("⏳ Fallback: using completeData.hash for receipt watch");
      setTxHash(completeData.hash);
    }
  }, [completeData]);

  // Fallback: when the receipt arrives via wagmi
  useEffect(() => {
    if (isSuccess && pendingUpdate && receipt) {
      console.log("✅ Fallback: receipt arrived via wagmi");
      handleTransactionSuccess(receipt, pendingUpdate);
    }
  }, [isSuccess, receipt]);

  // ---- Extra safety: fallback timeout (60s) ----
  useEffect(() => {
    if (pendingUpdate) {
      const timeout = setTimeout(() => {
        console.log("⏳ Fallback timeout – forcing refresh");
        fetchAppointments();
        setRefreshTrigger((prev) => prev + 1);
        if (onUpdate) onUpdate();
        setPendingUpdate(null);
        setTxHash(undefined);
      }, 60000);
      return () => clearTimeout(timeout);
    }
  }, [pendingUpdate]);

  // ---- Delete handler ----
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete appointment");
      fetchAppointments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Failed to delete appointment. Please try again.");
    }
  };

  // ---- Modal and status update ----
  const handleStatusUpdate = (id: string, status: string) => {
    setModalAction({ id, status });
    setModalOpen(true);
  };

  const confirmStatusUpdate = (comment: string) => {
    if (!modalAction) return;
    const { id, status } = modalAction;
    setModalOpen(false);
    processStatusUpdate(id, status, comment);
  };

  const processStatusUpdate = (id: string, status: string, comment: string) => {
    console.log("📤 processStatusUpdate called:", { id, status, comment });

    if (isTransactionPending) {
      alert("⏳ A transaction is already in progress. Please wait.");
      return;
    }

    fetch(`/api/appointments/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Appointment not found");
        return res.json();
      })
      .then((app) => {
        const chainId = Number(app.chainAppointmentId);
        if (!chainId || chainId === 0) {
          alert("❌ Invalid appointment ID. Please refresh and try again.");
          return;
        }

        setPendingUpdate({ id, status, comment });

        if (status === "CONFIRMED") {
          console.log("⛓️ Calling confirmAppointment with chainId:", chainId);
          confirmAppointment(chainId);
          alert("⏳ Confirm transaction sent. Please approve in your wallet.");
        } else if (status === "COMPLETED") {
          console.log("⛓️ Calling completeAppointment with chainId:", chainId);
          completeAppointment(chainId);
          alert("⏳ Complete transaction sent. Please approve in your wallet.");
        } else if (status === "CANCELLED") {
          setPendingUpdate(null);
          fetch(`/api/appointments/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status, doctorComment: comment }),
            headers: { "Content-Type": "application/json" },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Failed to update database");
              alert("✅ Appointment rejected.");
              fetchAppointments();
              if (onUpdate) onUpdate();
            })
            .catch((err) => {
              console.error("Error rejecting appointment:", err);
              alert("❌ Failed to reject appointment.");
            });
        }
      })
      .catch((err) => {
        console.error("Error fetching appointment:", err);
        alert("❌ Failed to process appointment.");
      });
  };

  // ---- Render ----
  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse bg-gray-100 dark:bg-slate-700 h-24" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">No appointments yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Click "New Appointment" to book a consultation
        </p>
      </div>
    );
  }

  const grouped = appointments.reduce((acc, app) => {
    const date = app.date ? new Date(app.date).toLocaleDateString() : "Unknown";
    if (!acc[date]) acc[date] = [];
    acc[date].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6">
      <DoctorCommentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmStatusUpdate}
        title={modalAction?.status === "CONFIRMED" ? "Confirm Appointment" : 
               modalAction?.status === "COMPLETED" ? "Complete Appointment" : 
               "Reject Appointment"}
        actionLabel={modalAction?.status === "CONFIRMED" ? "Confirm" : 
                     modalAction?.status === "COMPLETED" ? "Complete" : 
                     "Reject"}
        status={modalAction?.status || ""}
      />

      {Object.entries(grouped).map(([date, apps]) => (
        <div key={date}>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{date}</h3>
          <div className="grid gap-4">
            {apps.map((app) => (
              <AppointmentCard
                key={app.id}
                appointment={app}
                onDelete={handleDelete}
                onStatusUpdate={handleStatusUpdate}
                isPending={combinedPending}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}