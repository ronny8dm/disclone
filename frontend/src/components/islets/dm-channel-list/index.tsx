"use client";
import React, { useEffect, useState } from "react";
import { ListedDMChannel } from "@/lib/entities/channel";
import { List } from "@/components/ui/list";
import DMChannelListHeader from "./dm-channel-list-header";
import DMChannelListItem from "./dm-channel-list-item";
import { useParams } from "next/navigation";
import { useChannelStore } from "@/state/channel-list";
import { useCurrentUserStore } from "@/state/user";
import { UserService } from "@/lib/api/userService";

interface DMChannelListrops {
  channelsData: ListedDMChannel[];
}
export default function DMChannelList({ channelsData }: DMChannelListrops) {
  const { channels, setChannels } = useChannelStore();
  const { currentUser } = useCurrentUserStore();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const params = useParams();

const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    if (channelsData) {
      // Filter out current user from the list
      const filteredChannels = channelsData.filter(
        channel => channel.id !== currentUser?.id
      );
      setChannels(filteredChannels);
    }
  }, [channelsData, currentUser?.id, setChannels, isHydrated]);

  const handleChannelDelete = (channelId: string) => {
    if (channels !== null) {
      setChannels(channels.filter((channel) => channel.id !== channelId));
    }
  };

  const loadMoreUsers = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      console.log('🚀 Loading more users...');
      const response = await UserService.getAllUsers(2, 10); // Get next page
      
      const newChannels = response.users
        .filter(user => user.id !== currentUser?.id) // Filter out current user
        .map(user => UserService.convertUserResponseToDMChannel(user));
      
      if (channels && newChannels.length > 0) {
        // Add new channels, avoiding duplicates
        const existingIds = new Set(channels.map(ch => ch.id));
        const uniqueNewChannels = newChannels.filter(ch => !existingIds.has(ch.id));
        
        if (uniqueNewChannels.length > 0) {
          setChannels([...channels, ...uniqueNewChannels]);
          console.log(`✅ Added ${uniqueNewChannels.length} more users`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading more users:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  

  return (
    <div className="pt-4">
      <DMChannelListHeader onLoadMore={loadMoreUsers} isLoading={isLoadingMore} />
      <List className="mt-1">
        {channels?.map((channel) => (
          <DMChannelListItem
            active={params.id === channel.id}
            key={channel.id}
            channel={channel}
            onDelete={() => handleChannelDelete(channel.id)}
          />
        ))}
      </List>
      
      {/* Show loading indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span className="ml-2 text-xs text-gray-400">Loading more users...</span>
        </div>
      )}
      
      {/* Show count */}
      {channels && channels.length > 0 && (
        <div className="px-2 py-1 text-xs text-gray-500 text-center">
          {channels.length} conversations available
        </div>
      )}
    </div>
  );
}
