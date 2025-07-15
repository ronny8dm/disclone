/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Avatar from "@/components/ui/avatar";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VoiceStatus } from "@/lib/entities/user";
import { t } from "@/lib/i18n";
import { generateFakeCurrentUser } from "@/lib/utils/mock";
import { useCurrentUserStore } from "@/state/user";
import { useState, useEffect } from "react";
import VoiceControls from "./voice-status-controls";
import PopoverContentMain from "./voice-status-popover-content-main";

export default function VoiceStatusFooter() {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>({ mute: true });
  const { currentUser, setCurrentUser } = useCurrentUserStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Don't render anything during hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <div className="flex justify-center items-center bg-semibackground px-2 py-1.5 text-gray-400 text-xs">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {currentUser ? (
        <TooltipProvider>
          <Popover>
            <div className="flex justify-between gap-1 bg-semibackground px-2 py-1.5">
              <PopoverTrigger asChild>
                <button className="flex gap-2 rounded-md py-1 pl-0.5 pr-2 text-left leading-tight hover:bg-white/20">
                  <Avatar
                    src={currentUser.avatar}
                    status={currentUser.status}
                    alt={currentUser.name}
                  />
                  <div>
                    <div className="text-xs font-semibold">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {currentUser.username}
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <VoiceControls
                voiceStatus={voiceStatus}
                setVoiceStatus={setVoiceStatus}
              />
            </div>
            <PopoverContentMain
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          </Popover>
        </TooltipProvider>
      ) : (
        <div className="flex justify-center items-center bg-semibackground px-2 py-1.5 text-gray-400 text-xs">
          <div className="animate-pulse">Creating your account...</div>
        </div>
      )}
    </>
  );
}
