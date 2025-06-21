import { useState } from "react";
import { Clock, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const SwapHistory = () => {
  const [filter, setFilter] = useState("all");

  const swapHistory = [
    {
      id: "1",
      date: "2024-06-12 14:30",
      fromToken: "USDC",
      toToken: "BONK",
      fromAmount: "100.00",
      toAmount: "4,761,904",
      status: "completed",
      txHash: "5KJp9c2...7Qx3mN",
      profit: "+$2.34",
      positive: true
    },
    {
      id: "2", 
      date: "2024-06-11 09:15",
      fromToken: "USDC",
      toToken: "WIF",
      fromAmount: "250.00",
      toAmount: "102.04",
      status: "completed",
      txHash: "3Wp8x1...9Lm2kP",
      profit: "-$1.20",
      positive: false
    },
    {
      id: "3",
      date: "2024-06-10 16:45",
      fromToken: "USDC", 
      toToken: "JUP",
      fromAmount: "500.00",
      toAmount: "561.79",
      status: "pending",
      txHash: "8Qm4n7...2Dx5wR",
      profit: "+$15.67",
      positive: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const filteredHistory = filter === "all" 
    ? swapHistory 
    : swapHistory.filter(swap => swap.status === filter);

  return (
    <div className="w-full flex flex-col items-center justify-center py-4">
      <div className="w-full max-w-3xl bg-gray-900/80 border border-gray-800/60 rounded-2xl p-4 sm:p-8 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Swap History</h2>
            <p className="text-gray-400">Track your private swap transactions</p>
          </div>
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {["all", "completed", "pending"].map((filterType) => (
              <Button
                key={filterType}
                variant="outline"
                size="sm"
                onClick={() => setFilter(filterType)}
                className={`capitalize focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 rounded-full px-4 py-2 font-semibold text-sm shadow-sm ${
                  filter === filterType
                    ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
                aria-label={`Show ${filterType} swaps`}
              >
                {filterType}
              </Button>
            ))}
          </div>
        </div>
        {/* History Table - Responsive, No Horizontal Scroll */}
        <div className="w-full rounded-xl shadow-lg border border-gray-700/50 bg-gray-800/60">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[110px] min-w-[90px] max-w-[120px]" />
              <col className="w-[90px] min-w-[80px] max-w-[110px]" />
              <col className="w-[120px] min-w-[100px] max-w-[140px]" />
              <col className="w-[90px] min-w-[80px] max-w-[110px]" />
              <col className="w-[80px] min-w-[70px] max-w-[100px]" />
              <col className="w-[160px] min-w-[120px] max-w-[200px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-gray-300 font-semibold py-3 px-2 text-left text-xs sm:text-sm">Date</th>
                <th className="text-gray-300 font-semibold py-3 px-2 text-left text-xs sm:text-sm">Swap</th>
                <th className="text-gray-300 font-semibold py-3 px-5 text-left text-xs sm:text-sm">Amount</th>
                <th className="text-gray-300 font-semibold py-3 px-2 text-left text-xs sm:text-sm">Status</th>
                <th className="text-gray-300 font-semibold py-3 px-2 text-left text-xs sm:text-sm">P&L</th>
                <th className="text-gray-300 font-semibold py-3 px-2 text-left text-xs sm:text-sm">Txn</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((swap, idx) => (
                  <tr
                    key={swap.id}
                    className={`border-l-4 transition-all duration-200 ${
                      swap.status === "completed"
                        ? "border-green-500"
                        : swap.status === "pending"
                        ? "border-yellow-400"
                        : swap.status === "failed"
                        ? "border-red-500"
                        : "border-gray-700"
                    } ${idx % 2 === 0 ? "bg-gray-900/60" : "bg-gray-800/40"} hover:bg-blue-950/30`}
                  >
                    <td className="py-2 px-2 align-middle text-gray-300 whitespace-nowrap text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{swap.date}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 align-middle whitespace-nowrap text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium">{swap.fromToken}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-white font-medium">{swap.toToken}</span>
                      </div>
                    </td>
                    <td className="py-2 px-5 align-middle whitespace-nowrap text-xs sm:text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white leading-tight">{swap.fromAmount} {swap.fromToken}</span>
                        <span className="text-gray-400 leading-tight">{swap.toAmount} {swap.toToken}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 align-middle whitespace-nowrap text-xs sm:text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        swap.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : swap.status === "pending"
                          ? "bg-yellow-400/10 text-yellow-300"
                          : swap.status === "failed"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-gray-400/10 text-gray-400"
                      }`}>
                        {swap.status === "completed" && <span>✅</span>}
                        {swap.status === "pending" && <span>⏳</span>}
                        {swap.status === "failed" && <span>❌</span>}
                        {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-2 align-middle whitespace-nowrap text-xs sm:text-sm">
                      <div className={`flex items-center gap-1 justify-start ${swap.positive ? 'text-green-400' : 'text-red-400'}`}> 
                        {swap.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-medium align-middle">{swap.profit}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 align-middle whitespace-nowrap text-xs sm:text-sm max-w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 rounded-full px-2 min-w-0"
                        onClick={() => window.open(`https://solscan.io/tx/${swap.txHash}`, '_blank')}
                        aria-label={`View transaction ${swap.txHash}`}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-[80px] inline-block align-middle">{swap.txHash}</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🕵️‍♂️</span>
                      <span className="text-lg font-semibold">No swaps found for the selected filter.</span>
                      <span className="text-sm text-gray-500">Try a different filter or make your first swap!</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile Card/List Layout */}
        <div className="md:hidden flex flex-col gap-4 mt-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((swap, idx) => (
              <div
                key={swap.id}
                className={`border-l-4 transition-all duration-200 ${
                  swap.status === "completed"
                    ? "border-green-500"
                    : swap.status === "pending"
                    ? "border-yellow-400"
                    : swap.status === "failed"
                    ? "border-red-500"
                    : "border-gray-700"
                } bg-gray-900/60 rounded-xl p-4 shadow-md flex flex-col gap-2`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Clock className="w-4 h-4" />
                    <span>{swap.date}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    swap.status === "completed"
                      ? "bg-green-500/10 text-green-400"
                      : swap.status === "pending"
                      ? "bg-yellow-400/10 text-yellow-300"
                      : swap.status === "failed"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-gray-400/10 text-gray-400"
                  }`}>
                    {swap.status === "completed" && <span>✅</span>}
                    {swap.status === "pending" && <span>⏳</span>}
                    {swap.status === "failed" && <span>❌</span>}
                    {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white font-medium text-base">
                  {swap.fromToken} <span className="text-gray-400">→</span> {swap.toToken}
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">From</div>
                    <div className="text-white">{swap.fromAmount} {swap.fromToken}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">To</div>
                    <div className="text-white">{swap.toAmount} {swap.toToken}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">P&L</div>
                    <div className={`flex items-center gap-1 ${swap.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {swap.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-medium">{swap.profit}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 rounded-full px-3"
                    onClick={() => window.open(`https://solscan.io/tx/${swap.txHash}`, '_blank')}
                    aria-label={`View transaction ${swap.txHash}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    <span>View Transaction</span>
                  </Button>
                  <span className="text-xs text-gray-400 break-all">{swap.txHash}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 bg-gray-900/60 rounded-xl">
              <span className="text-4xl">🕵️‍♂️</span>
              <span className="text-lg font-semibold">No swaps found for the selected filter.</span>
              <span className="text-sm text-gray-500">Try a different filter or make your first swap!</span>
            </div>
          )}
        </div>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gray-800/70 border border-gray-700/50 rounded-2xl p-6 shadow-lg flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-1">Total Swaps</div>
            <div className="text-3xl font-extrabold text-white">{swapHistory.length}</div>
          </div>
          <div className="bg-gray-800/70 border border-gray-700/50 rounded-2xl p-6 shadow-lg flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-1">Total Volume</div>
            <div className="text-3xl font-extrabold text-white">$850.00</div>
          </div>
          <div className="bg-gray-800/70 border border-gray-700/50 rounded-2xl p-6 shadow-lg flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-1">Net P&L</div>
            <div className="text-3xl font-extrabold text-green-400">+$16.81</div>
          </div>
        </div>
      </div>
    </div>
  );
};
