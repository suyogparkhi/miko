
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SwapStatusProps {
  onProofReady: () => void;
}

export const SwapStatus = ({ onProofReady }: SwapStatusProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    { label: "Intent Received", description: "Your swap request is encrypted", icon: "📝" },
    { label: "Finding Liquidity", description: "Matching with available pools", icon: "🔍" },
    { label: "Generating Proof", description: "Creating zero-knowledge proof", icon: "⚡" },
    { label: "Proof Ready", description: "Ready for withdrawal", icon: "✅" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          onProofReady();
          return 100;
        }
        return prev + 2;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onProofReady]);

  useEffect(() => {
    setCurrentStage(Math.floor(progress / 25));
  }, [progress]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Processing Swap</h2>
      
      <div className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isActive = index === currentStage;
            const isCompleted = index < currentStage;
            
            return (
              <div 
                key={index}
                className={`
                  flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300
                  ${isActive ? 'border-blue-500 bg-blue-500/10' : 
                    isCompleted ? 'border-green-500 bg-green-500/10' : 
                    'border-gray-600 bg-gray-700/30'}
                `}
              >
                <div className="text-2xl">
                  {isCompleted ? "✅" : isActive ? 
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : 
                    stage.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${isActive || isCompleted ? 'text-white' : 'text-gray-400'}`}>
                    {stage.label}
                  </div>
                  <div className="text-sm text-gray-400">
                    {stage.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Swap Details */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">Swap Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">From</span>
              <span className="text-white">500 USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To</span>
              <span className="text-white">~2,450,000 BONK</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Slippage</span>
              <span className="text-white">0.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Privacy</span>
              <span className="text-green-400">Zero-Knowledge ✓</span>
            </div>
          </div>
        </div>

        {progress < 100 && (
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              Estimated time remaining: ~{Math.max(1, Math.ceil((100 - progress) / 10))} minutes
            </p>
            <p className="text-xs text-gray-500">
              Your privacy is protected throughout this process
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
