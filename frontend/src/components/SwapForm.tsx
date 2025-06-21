import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Settings, TrendingUp, TrendingDown, Clock } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { TokenSelector } from "@/components/TokenSelector";
import { Token } from "@/lib/tokenService";

interface SwapFormProps {
  onComplete: () => void;
}

export const SwapForm = ({ onComplete }: SwapFormProps) => {
  const [fromToken] = useState("USDC");
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState([0.5]);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const estimatedOutput = amount && toToken?.price
    ? (parseFloat(amount) / parseFloat(toToken.price)).toLocaleString()
    : "0";

  const handleSubmitIntent = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 1500);
  };

  const handleTokenSelect = (token: Token) => {
    setToToken(token);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Create Swap Intent</h2>
        <p className="text-gray-400">Set up your private swap with zero-knowledge protection</p>
      </div>
      
      <div className="space-y-6">
        {/* From Token */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">From</Label>
          <div className="bg-gray-800/80 border border-gray-600 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  💵
                </div>
                <div>
                  <div className="font-semibold text-white">{fromToken}</div>
                  <div className="text-sm text-gray-400">USD Coin</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">Available</div>
                <div className="text-white font-medium">1,250.00</div>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-3">
          <Label htmlFor="swap-amount" className="text-sm font-medium text-gray-300">
            Amount to Swap
          </Label>
          <div className="relative">
            <Input
              id="swap-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800/90 border-gray-600 text-white text-lg py-6 rounded-xl focus:border-blue-500"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              USDC
            </div>
          </div>
        </div>

        {/* Swap Arrow with Settings */}
        <div className="flex justify-center items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center transform rotate-90">
            <span className="text-white">⟷</span>
          </div>
          
          {/* Settings Button */}
          <DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-gray-800 border-gray-600">
              <DropdownMenuLabel className="text-white">Swap Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm text-gray-300 mb-3 block">
                    Slippage Tolerance: {slippage[0]}%
                  </Label>
                  <Slider
                    value={slippage}
                    onValueChange={setSlippage}
                    max={5}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>0.1%</span>
                    <span>5%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">MEV Protection</span>
                  <span className="text-xs text-green-400">Enabled</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Transaction Deadline</span>
                  <span className="text-xs text-gray-400">20 minutes</span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* To Token Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">To</Label>
          <TokenSelector
            selectedToken={toToken}
            onSelectToken={handleTokenSelect}
            placeholder="Select destination token..."
          />
        </div>

        {/* Price Estimate */}
        {amount && toToken && (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600/30 rounded-xl p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Estimated Output</span>
                <span className="text-white font-semibold">~{estimatedOutput} {toToken.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Rate</span>
                <span className="text-white text-sm">1 USDC = {toToken.price ? (1 / parseFloat(toToken.price)).toFixed(2) : '0'} {toToken.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Price Impact</span>
                <span className="text-green-400 text-sm">{"<0.1%"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Network Fee</span>
                <span className="text-white text-sm">~$0.02</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Intent Button */}
        <Button
          onClick={handleSubmitIntent}
          disabled={!amount || parseFloat(amount) <= 0 || !toToken || isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-6 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Submitting Intent...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>🔐</span>
              <span>Submit Private Swap Intent</span>
            </div>
          )}
        </Button>

        {/* Privacy Notice */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">🔒</span>
            </div>
            <div>
              <div className="text-blue-300 font-medium mb-1 text-sm">Zero-Knowledge Privacy</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Your swap intent will be encrypted and processed off-chain using zero-knowledge proofs. 
                No trading activity is visible on-chain until final execution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
