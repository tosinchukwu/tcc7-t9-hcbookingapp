import abi from "@/abis/HealthConsultationBooking.json";

export const contractConfig = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  abi: abi as any,
};