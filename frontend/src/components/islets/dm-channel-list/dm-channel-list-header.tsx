"use client";
import { clsx } from "@/lib/utils";
import { BsPlus } from "react-icons/bs";
import { MdRefresh } from "react-icons/md";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import DMChannelPopover from "./dm-channel-popover";
import { useState } from "react";

interface DMChannelListHeaderProps {
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export default function DMChannelListHeader({ onLoadMore, isLoading }: DMChannelListHeaderProps) {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="flex h-5 items-center justify-between pl-3 pr-2.5">
      <div className="text-xs font-semibold uppercase text-gray-400">
        Direct Messages
      </div>
      <div className="flex items-center gap-1">
        {/* Load More Button */}
        {onLoadMore && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className={clsx(
                    "flex h-4 w-4 items-center justify-center rounded text-gray-400 transition-colors",
                    "hover:bg-gray-600 hover:text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <MdRefresh className={clsx("h-3 w-3", isLoading && "animate-spin")} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isLoading ? "Loading..." : "Load more users"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Original Add Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover open={showPopover} onOpenChange={setShowPopover}>
                <PopoverTrigger asChild>
                  <button
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded text-gray-400 transition-colors",
                      "hover:bg-gray-600 hover:text-white"
                    )}
                  >
                    <BsPlus className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <DMChannelPopover position="top-8 left-0" setOpen={setShowPopover} />
              </Popover>
            </TooltipTrigger>
            <TooltipContent>Create DM</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}