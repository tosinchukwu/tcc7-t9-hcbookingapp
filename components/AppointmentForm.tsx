"use client";
import { useState, useEffect } from "react";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { useRouter } from "next/navigation";
import { sepolia } from "viem/chains";
import { decodeEventLog } from "viem";
import { contractConfig } from "@/lib/contract";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  location: string;
  wallet: string;
  rating: number;
  bio: string;
  yearsExperience: number;
};

type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

export default function AppointmentForm() {
  const { address, isConnected, chainId } = useAccount();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedDoctorId") || "";
    }
    return "";
  });
  const [selectedSlot, setSelectedSlot] = useState("");
  const [patientName, setPatientName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDoctorAddress, setSelectedDoctorAddress] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  // Store the timestamp for database insertion
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);

  const { create, isPending, data: createData } = useCreateAppointment();
  const { switchChain } = useSwitchChain();

  const { isLoading: isWaiting, isSuccess, isError, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const fetchDoctors = () => {
    setLoadingDoctors(true);
    fetch("/api/doctors")
      .then((res) => res.json())
      .then((data) => {
        setDoctors(data);
        setLoadingDoctors(false);
      })
      .catch(() => setLoadingDoctors(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0 && selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor);
      if (doctor) {
        setSelectedDoctorAddress(doctor.wallet);
        setSelectedDoctorId(doctor.id);
      } else {
        localStorage.removeItem("selectedDoctorId");
        setSelectedDoctor("");
      }
    }
  }, [doctors, selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/availability?doctorId=${selectedDoctorId}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data);
        setLoadingSlots(false);
      })
      .catch(() => setLoadingSlots(false));
  }, [selectedDoctorId]);

  const handleDoctorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doctorId = e.target.value;
    const doctor = doctors.find((d) => d.id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctorId);
      setSelectedDoctorAddress(doctor.wallet);
      setSelectedDoctorId(doctorId);
      setSelectedSlot("");
      localStorage.setItem("selectedDoctorId", doctorId);
    }
  };

  const handleSlotSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slotId = e.target.value;
    setSelectedSlot(slotId);
    // When slot is selected, compute and store timestamp
    if (slotId) {
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        const timestamp = Math.floor(new Date(slot.date).getTime() / 1000);
        setSelectedTimestamp(timestamp);
      }
    } else {
      setSelectedTimestamp(null);
    }
  };

  const refreshDoctors = () => {
    fetchDoctors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      alert("Please connect your wallet first.");
      return;
    }
    if (chainId !== sepolia.id) {
      alert(`Please switch to Sepolia. Your current chain is ${chainId}.`);
      try {
        await switchChain({ chainId: sepolia.id });
        alert("Chain switched to Sepolia. Click 'Book Appointment' again.");
      } catch (err) {
        console.error("Chain switch failed:", err);
        alert("Failed to switch network. Please manually switch to Sepolia.");
      }
      return;
    }
    if (!selectedDoctorAddress) {
      alert("Please select a doctor.");
      return;
    }
    if (!selectedDoctorId) {
      alert("Doctor ID is missing. Please select a doctor again.");
      return;
    }
    if (!selectedSlot) {
      alert("Please select an available slot.");
      return;
    }
    if (!patientName || !description) {
      alert("Please fill in all fields.");
      return;
    }

    const slot = slots.find((s) => s.id === selectedSlot);
    if (!slot) {
      alert("Selected slot not found.");
      return;
    }

    const dateTimestamp = Math.floor(new Date(slot.date).getTime() / 1000);
    // Store timestamp for later use
    setSelectedTimestamp(dateTimestamp);

    setIsSubmitting(true);
    const doctorAddress = selectedDoctorAddress as `0x${string}`;

    console.log("⛓️ Calling createAppointment with:", { doctorAddress, dateTimestamp });

    try {
      const result = await create(doctorAddress, dateTimestamp);
      console.log("✅ Transaction sent:", result);
    } catch (err: any) {
      console.error("❌ Contract call failed:", err);
      alert("Contract call failed: " + (err.message || "Unknown error"));
      setIsSubmitting(false);
    }
  };

  // Handle createData -> set txHash
  useEffect(() => {
    if (createData) {
      setTxHash(createData.hash);
    }
  }, [createData]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && receipt) {
      const saveAppointment = async () => {
        try {
          // Decode event
          let appointmentId: number | null = null;
          let contractDate: bigint | null = null;

          for (const log of receipt.logs) {
            try {
              const event = decodeEventLog({
                abi: contractConfig.abi,
                data: log.data,
                topics: log.topics,
                strict: false,
              }) as { eventName: string; args: { appointmentId: bigint; date: bigint } };
              
              if (event.eventName === 'AppointmentCreated') {
                appointmentId = Number(event.args.appointmentId);
                contractDate = event.args.date;
                console.log("✅ Found AppointmentCreated event:", { appointmentId, contractDate });
                break;
              }
            } catch {
              // Skip
            }
          }

          if (!appointmentId) {
            console.warn("⚠️ AppointmentCreated event not found, using fallback");
            appointmentId = Date.now();
            const slot = slots.find((s) => s.id === selectedSlot);
            contractDate = BigInt(slot ? Math.floor(new Date(slot.date).getTime() / 1000) : 0);
          }

          // Use the stored timestamp for the database
          let dbDateTimestamp = selectedTimestamp;
          if (!dbDateTimestamp) {
            // Fallback: use contract date
            dbDateTimestamp = Number(contractDate);
          }

          const payload = {
            chainAppointmentId: appointmentId,
            patientWallet: address,
            patientName,
            doctorId: selectedDoctorId,
            date: dbDateTimestamp, // 👈 Now sending a number (timestamp)
            description,
            availabilityId: selectedSlot,
            status: "PENDING",
            txHash: receipt.transactionHash,
            blockNumber: Number(receipt.blockNumber),
          };

          console.log("📤 Sending to /api/appointments:", payload);

          const res = await fetch("/api/appointments", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to save appointment");
          console.log("✅ Appointment saved:", data);
          alert("✅ Appointment booked successfully!");
          setIsSubmitting(false);
          router.push("/");
        } catch (err: any) {
          console.error("❌ Error saving appointment:", err);
          alert("Appointment was created on-chain but failed to save to database: " + err.message);
          setIsSubmitting(false);
        }
      };
      saveAppointment();
    }
    if (isError) {
      alert("❌ Transaction failed. Please try again.");
      setIsSubmitting(false);
    }
  }, [isSuccess, isError, receipt, address, patientName, selectedDoctorId, description, selectedSlot, slots, selectedTimestamp, router]);

  if (loadingDoctors) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading doctors...</div>;
  }
  if (doctors.length === 0) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">No doctors available.</div>;
  }

  let statusText = "Book Appointment";
  if (isPending || isSubmitting) statusText = "Sending transaction...";
  if (isWaiting) statusText = "Confirming on blockchain...";
  if (isSuccess) statusText = "Confirmed! ✅";
  const disabled = isPending || isSubmitting || isWaiting || isSuccess;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4 bg-white dark:bg-slate-800 rounded-xl shadow-card">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create Appointment</h1>

      <div>
        <label className="block text-sm font-medium">Select Doctor</label>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDoctor}
            onChange={handleDoctorSelect}
            className="flex-1 min-w-[120px] p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 text-sm"
            required
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} – {doctor.specialty} ({doctor.hospital})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={refreshDoctors}
            className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
            disabled={loadingDoctors}
          >
            {loadingDoctors ? "..." : "⟳ Refresh"}
          </button>
        </div>
        {selectedDoctor && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <p>Wallet: {selectedDoctorAddress.slice(0, 6)}...{selectedDoctorAddress.slice(-4)}</p>
            <p>Rating: ⭐ {doctors.find(d => d.id === selectedDoctor)?.rating?.toFixed(1) || "N/A"}</p>
          </div>
        )}
      </div>

      {selectedDoctorId && (
        <div>
          <label className="block text-sm font-medium">Available Slots</label>
          {loadingSlots ? (
            <p className="text-sm text-gray-500">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-yellow-600">No available slots for this doctor.</p>
          ) : (
            <select
              value={selectedSlot}
              onChange={handleSlotSelect}
              className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              required
            >
              <option value="">Select a slot...</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {new Date(slot.date).toLocaleDateString()} {slot.startTime} - {slot.endTime}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Your Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description / Symptoms</label>
        <textarea
          placeholder="Describe your symptoms"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        className="w-full btn-primary"
        disabled={disabled || !selectedSlot}
      >
        {statusText}
      </button>
    </form>
  );
}
