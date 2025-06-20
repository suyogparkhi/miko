import { WalletConnect } from "@/components/WalletConnect";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WalletContext } from "@/contexts/WalletContext";

const features = [
  {
    icon: "🔒",
    title: "Private Swaps",
    desc: "Trade tokens with zero-knowledge privacy. Your activity stays confidential."
  },
  {
    icon: "⚡",
    title: "Fast Settlement",
    desc: "Experience lightning-fast swaps on Solana with minimal fees."
  },
  {
    icon: "🛡️",
    title: "MEV Protection",
    desc: "Your trades are protected from front-running and MEV attacks."
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isConnected } = useContext(WalletContext);

  useEffect(() => {
    if (isConnected) {
      navigate("/app");
    }
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Hero Section */}
      <header className="flex items-center justify-between p-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">ZK</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">ZKSwap Vault</span>
        </div>
        <WalletConnect />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6 animate-fade-in">
            Private Swaps on Solana
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto animate-fade-in delay-100">
            The next generation of privacy-first DeFi. Swap tokens with zero-knowledge proofs and total confidentiality.
          </p>
          <button
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all animate-fade-in delay-200"
            onClick={() => navigate("/app")}
          >
            Get Started
          </button>
        </div>
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute left-1/2 top-1/3 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 to-purple-600/20 rounded-full blur-3xl animate-pulse-slow" style={{transform: 'translate(-50%, -50%)'}} />
          <div className="absolute right-0 bottom-0 w-[300px] h-[300px] bg-gradient-to-tr from-purple-500/20 to-blue-400/10 rounded-full blur-2xl animate-pulse-slower" />
        </div>
        {/* Features */}
        <section className="relative z-10 mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900/70 border border-gray-700/50 rounded-2xl p-8 flex flex-col items-center shadow-lg hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-base">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="p-6 text-center text-gray-500 border-t border-gray-800/50 mt-16">
        &copy; 2024 ZKSwap Vault. Built for privacy on Solana.
      </footer>
    </div>
  );
};

export default Landing; 