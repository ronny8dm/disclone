import Sidebar from "@/components/layout/sidebar";
import FindChatButton from "@/components/islets/find-chat-button";

import Header from "@/components/layout/header";
import DMHeaderMenu from "@/components/islets/dm-header-menu";
import DMChannelList from "@/components/islets/dm-channel-list";
import VoiceStatusFooter from "@/components/islets/voice-status-footer";
import { UserService } from "@/lib/api/userService";
import { ListedDMChannel } from "@/lib/entities/channel";
import {
  MOCK_DELAY,
  MOCK_CHANNELS,
  generateRandomFakeChannels,
} from "@/lib/utils/mock";
import { delay } from "@/lib/utils";

export const getData = async (): Promise<{ channels: ListedDMChannel[] }> => {
  try {
    // Fetch real users from database
    console.log('🚀 Fetching real users for DM list...');
    const realUsersResponse = await UserService.getAllUsers(1, 10); // Get first 10 real users
    
    // Convert real users to DM channels
    const realUserChannels = realUsersResponse.users.map(user => 
      UserService.convertUserResponseToDMChannel(user)
    );
    
    // Generate some fake channels to mix with real ones
    const fakeChannels = generateRandomFakeChannels(Math.max(0, MOCK_CHANNELS - realUserChannels.length));
    
    // Combine real and fake channels
    const allChannels = [...realUserChannels, ...fakeChannels];
    
    console.log(`✅ Combined ${realUserChannels.length} real users with ${fakeChannels.length} fake channels`);
    
    return { channels: allChannels };
  } catch (error) {
    console.error('❌ Error fetching real users, falling back to fake data:', error);
    
    // Fallback to fake data if API fails
    const channels: ListedDMChannel[] = generateRandomFakeChannels(MOCK_CHANNELS);
    return { channels };
  }
};

export default async function DMLayout({ children }: React.PropsWithChildren) {
  const { channels } = await getData();
  return (
    <>
      <Sidebar className="bottom-70 flex flex-col">
        <Header verticalPadding="2" className="bg-midground">
          <FindChatButton />
        </Header>
        <div className="hover-scrollbar flex-1 overflow-y-auto py-2 pl-2 pr-0.5">
          <DMHeaderMenu />
          <DMChannelList channelsData={channels} />
        </div>
        <VoiceStatusFooter />
      </Sidebar>
      {children}
    </>
  );
}
