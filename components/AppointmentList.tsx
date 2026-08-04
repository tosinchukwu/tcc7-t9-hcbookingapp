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
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string; status: string; comment: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<{ id: string; status: string } | null>(null);

  const { confirm: confirmAppointment, data: confirmData } = useConfirmAppointment();
  const { complete: completeAppointment, data: completeData } = useCompleteAppointment();

  const { isLoading: isWaiting, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

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

  // Set txHash when data arrives
  useEffect(() => {
    if (confirmData) {
      console.log("⛓️ confirmData received:", confirmData);
      setTxHash(confirmData.hash);
    }
    if (completeData) {
      console.log("⛓️ completeData received:", completeData);
      setTxHash(completeData.hash);
    }
  }, [confirmData, completeData]);

  // When transaction succeeds, update the database and refresh
  useEffect(() => {
    if (isSuccess && pendingUpdate && receipt) {
      console.log("✅ Transaction mined – updating database status");
      const { id: uuid, status, comment } = pendingUpdate;
      const txHash = receipt.transactionHash;
      const blockNumber = Number(receipt.blockNumber);

      // Update the appointment status, comment, txHash, and blockNumber
      fetch(`/api/appointments/${uuid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status, 
          doctorComment: comment, 
          txHash, 
          blockNumber 
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to update appointment status");
          console.log(`✅ Appointment ${uuid} updated to ${status} with txHash ${txHash}`);
          // Refresh the list
          fetchAppointments();
          setRefreshTrigger((prev) => prev + 1);
          if (onUpdate) onUpdate();
        })
        .catch((err) => {
          console.error("Error updating appointment status:", err);
          alert("Transaction succeeded but failed to update database. Please refresh.");
        })
        .finally(() => {
          setTxHash(undefined);
          setPendingUpdate(null);
        });
    }
  }, [isSuccess, pendingUpdate, receipt]);

  // Fallback: after 15 seconds, refresh anyway
  useEffect(() => {
    if (txHash && !isSuccess) {
      const timeout = setTimeout(() => {
        console.log("⏳ Fallback refresh after 15 seconds");
        fetchAppointments();
        setRefreshTrigger((prev) => prev + 1);
        if (onUpdate) onUpdate();
        setTxHash(undefined);
        setPendingUpdate(null);
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [txHash, isSuccess]);

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

  // Open modal for status update
  const handleStatusUpdate = (id: string, status: string) => {
    setModalAction({ id, status });
    setModalOpen(true);
  };

  // Confirm status update with comment
  const confirmStatusUpdate = (comment: string) => {
    if (!modalAction) return;
    const { id, status } = modalAction;
    setModalOpen(false);
    processStatusUpdate(id, status, comment);
  };

  // Process the actual status update (called after modal)
  const processStatusUpdate = (id: string, status: string, comment: string) => {
    console.log("📤 processStatusUpdate called:", { id, status, comment });

    if (isWaiting || txHash) {
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

        // Store the pending update info (uuid, target status, and comment)
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
          // For cancellation, we update the DB directly (no contract call)
          setPendingUpdate(null);
          // No txHash/blockNumber for off-chain cancellation
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

  const combinedPending = isPending || isWaiting || !!txHash;

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
      {/* Doctor Comment Modal */}
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
