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
    <div className="space-y-6 max-w-3xl mx-auto w-full bg-gray-900/80 border border-gray-800/60 rounded-2xl p-4 sm:p-8 shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className={`capitalize focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 ${
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
      {/* History Table */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-x-auto shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700/50 hover:bg-gray-700/30">
              <TableHead className="text-gray-300">Date</TableHead>
              <TableHead className="text-gray-300">Swap</TableHead>
              <TableHead className="text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">P&L</TableHead>
              <TableHead className="text-gray-300">Transaction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((swap) => (
                <TableRow key={swap.id} className="border-gray-700/50 hover:bg-gray-700/20">
                  <TableCell className="text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{swap.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{swap.fromToken}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-white font-medium">{swap.toToken}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-white">{swap.fromAmount} {swap.fromToken}</div>
                      <div className="text-gray-400">{swap.toAmount} {swap.toToken}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(swap.status)}`}>
                      {swap.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center space-x-1 ${swap.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {swap.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-medium">{swap.profit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200"
                      onClick={() => window.open(`https://solscan.io/tx/${swap.txHash}`, '_blank')}
                      aria-label={`View transaction ${swap.txHash}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {swap.txHash}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No swaps found for the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 shadow-md">
          <div className="text-sm text-gray-400 mb-1">Total Swaps</div>
          <div className="text-2xl font-bold text-white">{swapHistory.length}</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 shadow-md">
          <div className="text-sm text-gray-400 mb-1">Total Volume</div>
          <div className="text-2xl font-bold text-white">$850.00</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 shadow-md">
          <div className="text-sm text-gray-400 mb-1">Net P&L</div>
          <div className="text-2xl font-bold text-green-400">+$16.81</div>
        </div>
      </div>
    </div>
  );
};
