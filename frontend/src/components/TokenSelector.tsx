import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
import { useTokenSearch, usePopularTokens } from "@/hooks/useTokenSearch";
import { Token } from "@/lib/tokenService";
import { cn } from "@/lib/utils";

interface TokenSelectorProps {
  selectedToken?: Token | null;
  onSelectToken: (token: Token) => void;
  placeholder?: string;
  className?: string;
}

const TokenImage = ({ token, size = "w-8 h-8" }: { token: Token; size?: string }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={cn("rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500", size)}>
      {token.logoURI && !imageError ? (
        <>
          <img
            src={token.logoURI}
            alt={token.name}
            className={cn("rounded-full transition-opacity duration-200", size, imageLoaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <span className="text-white text-sm font-bold">
          {token.symbol.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
};

const TokenItem = ({ token, onSelect }: { token: Token; onSelect: (token: Token) => void }) => {
  return (
    <CommandItem
      key={token.address}
      value={`${token.symbol} ${token.name} ${token.address}`}
      onSelect={() => onSelect(token)}
      className="text-white hover:bg-gray-700 cursor-pointer p-3"
    >
      <div className="flex items-center space-x-3 w-full">
        <TokenImage token={token} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="font-medium">{token.symbol}</div>
            {token.verified && (
              <CheckCircle className="w-3 h-3 text-green-400" />
            )}
          </div>
          <div className="text-xs text-gray-400 truncate">{token.name}</div>
          <div className="text-xs text-gray-500 font-mono">
            {token.address.slice(0, 8)}...{token.address.slice(-4)}
          </div>
        </div>
        <div className="text-right">
          {token.price && (
            <div className="text-sm">${token.price}</div>
          )}
          {token.change24h && (
            <div className={cn(
              "text-xs flex items-center justify-end",
              token.positive ? 'text-green-400' : 'text-red-400'
            )}>
              {token.positive ? 
                <TrendingUp className="w-3 h-3 mr-1" /> : 
                <TrendingDown className="w-3 h-3 mr-1" />
              }
              {token.change24h}
            </div>
          )}
        </div>
      </div>
    </CommandItem>
  );
};

export const TokenSelector = ({ 
  selectedToken, 
  onSelectToken, 
  placeholder = "Select token...",
  className 
}: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    tokens, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isSearching 
  } = useTokenSearch(searchQuery, 15);
  
  const { data: popularTokens, isLoading: isLoadingPopular } = usePopularTokens(8);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setOpen(false);
    setSearchQuery("");
  };

  const displayTokens = searchQuery.trim() ? tokens : (popularTokens || []);
  const showLoading = searchQuery.trim() ? (isLoading || isSearching) : isLoadingPopular;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700/80 h-auto p-4",
            className
          )}
        >
          {selectedToken ? (
            <div className="flex items-center space-x-3">
              <TokenImage token={selectedToken} size="w-10 h-10" />
              <div className="text-left">
                <div className="font-medium">{selectedToken.symbol}</div>
                <div className="text-sm text-gray-400">{selectedToken.name}</div>
              </div>
              <div className="ml-auto text-right">
                {selectedToken.price && (
                  <div className="text-sm">${selectedToken.price}</div>
                )}
                {selectedToken.change24h && (
                  <div className={cn(
                    "text-xs flex items-center",
                    selectedToken.positive ? 'text-green-400' : 'text-red-400'
                  )}>
                    {selectedToken.positive ? 
                      <TrendingUp className="w-3 h-3 mr-1" /> : 
                      <TrendingDown className="w-3 h-3 mr-1" />
                    }
                    {selectedToken.change24h}
                  </div>
                )}
              </div>
            </div>
          ) : (
            placeholder
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-gray-800 border-gray-600" align="start">
        <Command className="bg-gray-800" shouldFilter={false}>
          <div className="flex items-center border-b border-gray-600 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search tokens or paste address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
            />
          </div>
          <CommandList ref={scrollRef} className="max-h-[300px] overflow-y-auto">
            {isError && (
              <div className="flex items-center justify-center p-4 text-red-400">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Error loading tokens</span>
              </div>
            )}
            
            {showLoading && displayTokens.length === 0 && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-gray-400">Loading tokens...</span>
              </div>
            )}
            
            {!showLoading && displayTokens.length === 0 && !isError && (
              <CommandEmpty className="text-gray-400 p-4">
                {searchQuery.trim() ? "No tokens found." : "No popular tokens available."}
              </CommandEmpty>
            )}
            
            {displayTokens.length > 0 && (
              <CommandGroup>
                {!searchQuery.trim() && (
                  <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                    Popular Tokens
                  </div>
                )}
                {displayTokens.map((token) => (
                  <TokenItem 
                    key={token.address} 
                    token={token} 
                    onSelect={handleSelectToken} 
                  />
                ))}
              </CommandGroup>
            )}
            
            {isFetchingNextPage && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-gray-400">Loading more...</span>
              </div>
            )}
            
            {hasNextPage && !isFetchingNextPage && tokens.length > 0 && (
              <div className="p-2">
                <Button
                  variant="ghost"
                  onClick={() => fetchNextPage()}
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  Load more tokens
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}; 