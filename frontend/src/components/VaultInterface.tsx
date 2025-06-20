import { useState } from "react";
import { DepositForm } from "./DepositForm";
import { SwapForm } from "./SwapForm";
import { SwapStatus } from "./SwapStatus";
import { WithdrawForm } from "./WithdrawForm";
import { SwapHistory } from "./SwapHistory";

type VaultStep = "deposit" | "swap" | "status" | "withdraw" | "history";

export const VaultInterface = () => {
  const [currentStep, setCurrentStep] = useState<VaultStep>("deposit");
  const [depositComplete, setDepositComplete] = useState(false);
  const [swapIntent, setSwapIntent] = useState(false);
  const [proofReady, setProofReady] = useState(false);

  const steps = [
    { id: "deposit", label: "Deposit", icon: "💰" },
    { id: "swap", label: "Swap Intent", icon: "🔄" },
    { id: "status", label: "zk-Proof", icon: "🔐" },
    { id: "withdraw", label: "Withdraw", icon: "📤" },
  ];

  const navigationTabs = [
    { id: "deposit", label: "Deposit", icon: "💰" },
    { id: "swap", label: "Swap", icon: "🔄" },
    { id: "status", label: "Status", icon: "🔐" },
    { id: "withdraw", label: "Withdraw", icon: "📤" },
    { id: "history", label: "History", icon: "📊" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
      {/* Navigation Tabs */}
      <nav className="flex flex-wrap items-center justify-center mb-8 gap-2 bg-gray-800/30 p-2 rounded-2xl backdrop-blur-sm transition-all duration-300" aria-label="Vault navigation">
        {navigationTabs.map((tab) => {
          const isActive = tab.id === currentStep;
          const isAccessible = 
            tab.id === "deposit" ||
            (tab.id === "swap" && depositComplete) ||
            (tab.id === "status" && swapIntent) ||
            (tab.id === "withdraw" && proofReady) ||
            tab.id === "history";
          return (
            <button
              key={tab.id}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={!isAccessible}
              onClick={() => isAccessible && setCurrentStep(tab.id as VaultStep)}
              disabled={!isAccessible}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-xl font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                  : isAccessible
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                    : 'text-gray-600 cursor-not-allowed'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Step Progress Indicator (only for main flow) */}
      {currentStep !== "history" && (
        <div className="flex flex-wrap items-center justify-center mb-8 gap-2 sm:gap-4 transition-all duration-300">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = 
              (step.id === "deposit" && depositComplete) ||
              (step.id === "swap" && swapIntent) ||
              (step.id === "status" && proofReady);
            return (
              <div key={step.id} className="flex items-center gap-2 sm:gap-4">
                <div className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${isActive ? 'bg-blue-600 text-white scale-105' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}
                `}>
                  <span className="text-lg">{step.icon}</span>
                  <span>{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-6 h-0.5 bg-gray-600"></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Interface */}
      <div className="flex flex-col lg:flex-row gap-8 transition-all duration-300">
        {/* Left Column - Current Action */}
        <section className="w-full lg:w-2/3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6 mb-4 lg:mb-0 transition-all duration-300 shadow-md">
          {currentStep === "deposit" && (
            <DepositForm 
              onComplete={() => {
                setDepositComplete(true);
                setCurrentStep("swap");
              }} 
            />
          )}
          {currentStep === "swap" && (
            <SwapForm 
              onComplete={() => {
                setSwapIntent(true);
                setCurrentStep("status");
              }} 
            />
          )}
          {currentStep === "status" && (
            <SwapStatus 
              onProofReady={() => {
                setProofReady(true);
                setCurrentStep("withdraw");
              }} 
            />
          )}
          {currentStep === "withdraw" && <WithdrawForm />}
          {currentStep === "history" && <SwapHistory />}
        </section>

        {/* Right Column - Account Overview */}
        {currentStep !== "history" && (
          <aside className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-24 self-start transition-all duration-300">
            {/* Balance Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-white mb-4">Vault Balance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">USDC</span>
                  <span className="text-white font-medium">1,250.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">SOL</span>
                  <span className="text-white font-medium">0.5</span>
                </div>
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Value</span>
                    <span className="text-white font-semibold">$1,345.50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Info */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-white mb-2">Privacy Protection</h3>
              <p className="text-sm text-gray-300 mb-4">
                Your swap intents are encrypted and processed off-chain. Only the final proof is submitted to Solana.
              </p>
              <div className="flex items-center space-x-2 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Zero-knowledge proofs active</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Swaps</span>
                  <span className="text-white font-medium">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Volume (24h)</span>
                  <span className="text-white font-medium">$2,450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-400 font-medium">98.5%</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
