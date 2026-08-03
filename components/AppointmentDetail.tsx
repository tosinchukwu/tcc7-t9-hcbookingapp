"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useGetAppointment } from "@/hooks/useAppointments";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

type AppointmentContract = {
  id: bigint;
  patient: string;
  doctor: string;
  date: bigint;
  isConfirmed: boolean;
  isCompleted: boolean;
};

type AppointmentDB = {
  id: string;
  chainAppointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  txHash: string | null;
  blockNumber: number | null;
  isConfirmed: boolean;
  isCompleted: boolean;
  description: string;
  doctorComment: string | null;
  status: string;
  patient: {
    id: string;
    wallet: string;
    name: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: string;
    wallet: string;
    name: string;
    specialty: string;
    isActive: boolean;
  };
};

export default function AppointmentDetail({ id }: { id: number }) {
  const { address: wagmiAddress, isConnected } = useAccount();
  const { user, authenticated } = usePrivy();
  
  const [dbData, setDbData] = useState<AppointmentDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [walletType, setWalletType] = useState<'eoa' | 'privy' | 'none'>('none');

  const validId = Number.isInteger(id) && id >= 0 ? id : 0;
  const { data: contractData, refetch: refetchContract } = useGetAppointment(validId);

  // ✅ FIX: Detect wallet type – Privy first, then fallback to wagmi
  useEffect(() => {
    if (authenticated && user?.wallet) {
      setWalletType('privy');
    } else if (isConnected && wagmiAddress) {
      setWalletType('eoa');
    } else {
      setWalletType('none');
    }
  }, [authenticated, user, isConnected, wagmiAddress]);

  const getConnectedAddress = (): string | null => {
    if (authenticated && user?.wallet?.address) {
      return user.wallet.address;
    } else if (isConnected && wagmiAddress) {
      return wagmiAddress;
    }
    return null;
  };

  const connectedAddress = getConnectedAddress();

  // ✅ Sync appointment from contract to database
  const syncAppointmentToDB = async (contractData: AppointmentContract) => {
    try {
      const { patient, doctor, date, isConfirmed, isCompleted } = contractData;
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainAppointmentId: validId,
          patientAddress: patient,
          doctorAddress: doctor,
          date: Number(date),
          isConfirmed,
          isCompleted,
          description: 'Synced from blockchain',
        }),
      });

      if (!response.ok) {
        console.error('Failed to sync appointment to DB');
      }
      return response;
    } catch (error) {
      console.error('Error syncing appointment:', error);
      return null;
    }
  };

  // ✅ Fetch both sources
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      const dbRes = await fetch(`/api/appointments/${id}`);
      
      if (dbRes.status === 404) {
        console.log('Appointment not in DB, checking contract...');
        const result = await refetchContract();
        const contractResult = result.data as AppointmentContract | null;
        
        if (contractResult && contractResult.patient && contractResult.doctor) {
          await syncAppointmentToDB(contractResult);
          const retryRes = await fetch(`/api/appointments/${id}`);
          if (retryRes.ok) {
            const retryJson = await retryRes.json();
            setDbData(retryJson);
          } else {
            setDbData(null);
          }
        } else {
          setDbData(null);
        }
      } else if (!dbRes.ok) {
        throw new Error("Failed to fetch appointment");
      } else {
        const dbJson = await dbRes.json();
        setDbData(dbJson);
      }

      await refetchContract();
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load appointment");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Initial load
  useEffect(() => {
    fetchData(true);
  }, [id]);

  // ✅ Refresh when contract data changes
  useEffect(() => {
    if (contractData) {
      const data = contractData as any;
      if (data && data.patient && data.doctor) {
        fetchData(false);
      }
    }
  }, [contractData]);

  // ✅ Manual refresh
  const handleRefresh = () => {
    fetchData(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading appointment details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
          <p className="font-semibold">❌ Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-sm bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-700/30 px-4 py-2 rounded transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if we have data
  const data = contractData as unknown as AppointmentContract | null;
  const hasContractData = data && data.patient && data.doctor;
  const hasDBData = dbData !== null;

  if (!hasContractData && !hasDBData) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No appointment data available.</p>
        <button
          onClick={handleRefresh}
          className="mt-2 text-sm bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Display wallet type badge
  const WalletBadge = () => (
    <span className={`text-xs px-2 py-1 rounded-full ${
      walletType === 'eoa' 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        : walletType === 'privy'
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }`}>
      {walletType === 'eoa' ? '🦊 EOA Wallet' : walletType === 'privy' ? '🔐 Privy Wallet' : 'No Wallet'}
    </span>
  );

  // Use data from either source
  const patientAddress = hasContractData ? data.patient : dbData?.patient?.wallet || 'N/A';
  const doctorAddress = hasContractData ? data.doctor : dbData?.doctor?.wallet || 'N/A';
  
  // Prioritize database status
  let isConfirmed = dbData?.isConfirmed || false;
  let isCompleted = dbData?.isCompleted || false;
  let displayStatus = dbData?.status || 'PENDING';
  
  // If no DB data, fall back to contract
  if (!hasDBData && hasContractData) {
    isConfirmed = data.isConfirmed;
    isCompleted = data.isCompleted;
    displayStatus = data.isCompleted ? 'COMPLETED' : data.isConfirmed ? 'CONFIRMED' : 'PENDING';
  }
  
  const contractDate = hasContractData && data.date
    ? new Date(Number(data.date) * 1000).toLocaleString()
    : dbData?.date 
    ? new Date(dbData.date).toLocaleString()
    : "N/A";

  const patientName = dbData?.patient?.name || 'Unknown Patient';
  const doctorName = dbData?.doctor?.name || 'Unknown Doctor';
  const description = dbData?.description || 'No description';
  const doctorComment = dbData?.doctorComment || 'No comment from doctor';
  const txHash = dbData?.txHash || 'N/A';
  const blockNumber = dbData?.blockNumber || 'N/A';

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
        >
          ← Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <WalletBadge />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded transition disabled:opacity-50"
          >
            {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Appointment #{validId}
        </h1>
        
        {connectedAddress && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
          </p>
        )}

        <div className="mt-6 space-y-3 border-t border-gray-200 dark:border-slate-700 pt-4">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-600 dark:text-gray-300">Patient</span>
            <span className="text-gray-900 dark:text-white text-right">
              {patientName}
              <span className="block text-xs text-gray-500 dark:text-gray-400 break-all max-w-[200px]">
                {patientAddress}
              </span>
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-600 dark:text-gray-300">Doctor</span>
            <span className="text-gray-900 dark:text-white text-right">
              {doctorName}
              <span className="block text-xs text-gray-500 dark:text-gray-400 break-all max-w-[200px]">
                {doctorAddress}
              </span>
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-600 dark:text-gray-300">Date & Time</span>
            <span className="text-gray-900 dark:text-white">{contractDate}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-600 dark:text-gray-300">Patient's Description</span>
            <span className="text-gray-900 dark:text-white text-right max-w-[50%]">
              {description}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-600 dark:text-gray-300">Doctor's Comment</span>
            <span className="text-gray-900 dark:text-white text-right max-w-[50%] italic">
              {doctorComment === 'No comment from doctor' ? (
                <span className="text-gray-400 dark:text-gray-500 text-sm">No comment</span>
              ) : (
                doctorComment
              )}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-600 dark:text-gray-300">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(displayStatus)}`}
            >
              {displayStatus === 'CONFIRMED' && '✓ CONFIRMED'}
              {displayStatus === 'COMPLETED' && '✅ COMPLETED'}
              {displayStatus === 'CANCELLED' && '❌ CANCELLED'}
              {displayStatus === 'PENDING' && '⏳ PENDING'}
            </span>
          </div>

          {txHash !== 'N/A' && txHash !== 'synced' && txHash !== null && (
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="font-medium text-gray-600 dark:text-gray-300">Latest Transaction</span>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all text-right max-w-[50%]"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}

          {blockNumber !== 'N/A' && blockNumber !== 0 && blockNumber !== null && (
            <div className="flex justify-between py-2">
              <span className="font-medium text-gray-600 dark:text-gray-300">Block</span>
              <span className="text-gray-900 dark:text-white">#{blockNumber}</span>
            </div>
          )}
        </div>

        {!hasDBData && hasContractData && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚡ Data from blockchain only. Syncing to database...
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔗 Data fetched from {hasContractData ? 'blockchain' : ''} 
            {hasContractData && hasDBData ? ' & ' : ''}
            {hasDBData ? 'database' : ''}
            {!hasContractData && !hasDBData ? 'No data available' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
