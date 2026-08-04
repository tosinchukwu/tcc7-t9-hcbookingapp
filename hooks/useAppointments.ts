// hooks/useAppointments.ts
import { useState } from "react";
import { useReadContract, useWriteContract as useWagmiWriteContract } from "wagmi";
import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import { contractConfig } from "@/lib/contract";
import { encodeFunctionData, decodeEventLog, type TransactionReceipt } from "viem";
import { publicClient } from "@/lib/viem";

// Define the shape of the result returned by write()
type WriteResult = {
  hash: `0x${string}`;
  receipt: TransactionReceipt;
  decodedEvents?: any[];
};

// Helper to decode events from transaction receipt
function decodeEventsFromReceipt(receipt: TransactionReceipt, abi: any) {
  const events: any[] = [];
  
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: abi,
        data: log.data,
        topics: log.topics,
        strict: false,
      });
      events.push(decoded);
    } catch {
      // Skip logs that can't be decoded
      continue;
    }
  }
  
  return events;
}

function useContractWrite(functionName: string) {
  const { wallets } = useWallets();
  const isEmbedded = wallets.some((w) => w.walletClientType === "privy");
  const { sendTransaction } = useSendTransaction();
  const { writeContract, isPending: wagmiPending } = useWagmiWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [data, setData] = useState<WriteResult | null>(null);

  const write = async (args: any[]): Promise<WriteResult> => {
    setIsPending(true);
    setData(null);
    try {
      let hash: `0x${string}`;
      let receipt: TransactionReceipt;

      if (isEmbedded) {
        // Embedded wallet: use Privy's sendTransaction
        const encodedData = encodeFunctionData({
          abi: contractConfig.abi,
          functionName,
          args,
        });

        const txResponse = await sendTransaction(
          {
            to: contractConfig.address,
            data: encodedData,
            chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"),
          },
          { sponsor: true }
        );

        hash = (txResponse?.hash || txResponse) as `0x${string}`;
        if (!hash) throw new Error("No transaction hash returned");

        receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted on-chain");
        }

      } else {
        // External wallet (EOA): use wagmi's writeContract
        return new Promise((resolve, reject) => {
          writeContract(
            {
              address: contractConfig.address,
              abi: contractConfig.abi,
              functionName,
              args,
            },
            {
              onSuccess: async (txHash) => {
                try {
                  const txReceipt = await publicClient.waitForTransactionReceipt({ 
                    hash: txHash 
                  });
                  if (txReceipt.status === "reverted") {
                    reject(new Error("Transaction reverted on-chain"));
                  } else {
                    const decodedEvents = decodeEventsFromReceipt(txReceipt, contractConfig.abi);
                    
                    const result: WriteResult = { 
                      hash: txHash, 
                      receipt: txReceipt,
                      decodedEvents 
                    };
                    setData(result);
                    resolve(result);
                  }
                } catch (err) {
                  reject(err);
                } finally {
                  setIsPending(false);
                }
              },
              onError: (error) => {
                reject(error);
                setIsPending(false);
              },
            }
          );
        });
      }

      // Decode events from receipt (for embedded wallet)
      const decodedEvents = decodeEventsFromReceipt(receipt, contractConfig.abi);
      
      const result: WriteResult = { 
        hash, 
        receipt,
        decodedEvents 
      };
      setData(result);
      return result;

    } catch (error) {
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { write, isPending: isPending || wagmiPending, data };
}

// ---------- Public hooks ----------
export function useCreateAppointment() {
  const { write, isPending, data } = useContractWrite("createAppointment");
  
  const create = async (doctorAddress: string, date: number): Promise<WriteResult> => {
    console.log("⛓️ create() called with args:", [doctorAddress, date]);
    return await write([doctorAddress, BigInt(date)]);
  };
  
  return { create, isPending, data };
}

export function useConfirmAppointment() {
  const { write, isPending, data } = useContractWrite("confirmAppointment");
  
  const confirm = async (appointmentId: number): Promise<WriteResult> => {
    console.log("⛓️ confirm() called with args:", [appointmentId]);
    return await write([BigInt(appointmentId)]);
  };
  
  return { confirm, isPending, data };
}

export function useCompleteAppointment() {
  const { write, isPending, data } = useContractWrite("completeAppointment");
  
  const complete = async (appointmentId: number): Promise<WriteResult> => {
    console.log("⛓️ complete() called with args:", [appointmentId]);
    return await write([BigInt(appointmentId)]);
  };
  
  return { complete, isPending, data };
}

// Helper hook to get appointment data
export function useGetAppointment(id: number) {
  const result = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: "getAppointment",
    args: [BigInt(id)],
    query: {
      enabled: id >= 0,
    },
  });
  return result;
}

// Helper to extract AppointmentCreated event from transaction
export function extractAppointmentCreatedEvent(decodedEvents: any[]) {
  if (!decodedEvents) return null;
  
  for (const event of decodedEvents) {
    if (event.eventName === 'AppointmentCreated') {
      return {
        appointmentId: Number(event.args.appointmentId),
        patient: event.args.patient,
        doctor: event.args.doctor,
        date: Number(event.args.date),
      };
    }
  }
  return null;
}
