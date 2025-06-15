
export const PrivacyBadge = () => {
  return (
    <div className="flex items-center justify-center space-x-2 bg-gray-800/30 border border-gray-700/50 rounded-full px-4 py-2 inline-flex">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-gray-300 font-medium">Zero-Knowledge Privacy</span>
      <span className="text-xs text-gray-500">🔒</span>
    </div>
  );
};
