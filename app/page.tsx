import Navbar from "@/components/Navbar";
import WalletConnect from "@/components/WalletConnect";


export default function Home() {
  return (
    <>
      <Navbar />
      <div className="p-10">
        <WalletConnect />
      </div>
      <main className="p-10 bg-blue-500 text-white text-2xl">
      Web3 Capstone Template Working 
    </main>
    </>
    
  );
}