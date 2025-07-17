import ChannelDM from "@/components/islets/dm-channel";
import { Page } from "@/components/layout/page";
import { delay } from "@/lib/utils";
import { MOCK_DELAY, generateRandomFakeChannels } from "@/lib/utils/mock";
import { UserService } from "@/lib/api/userService";
import { User } from "@/lib/entities/user";

const getChannelByID = async (id: string) => {
  if (!id) throw new Error("Invalid ID");

  try {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // If ID is numeric, generate a fake channel
      console.log("Fetching real user id with ID:", id);

      try {
        const userResponse = await UserService.getUserById(id);
        const realUser = UserService.convertUserResponseToUser(userResponse);
        console.log("Real user fetched:", realUser);
        return { channel: realUser };
      } catch (error) {
        console.error("Error fetching user:", error);

      }
    }
    console.log('🎭 Generating fake user for ID:', id);
    const channel = generateRandomFakeChannels(1)[0];
    const fakeUser: User = {
      id: id, // Use the actual ID from the URL
      name: channel.name,
      username: channel.username || undefined,
      avatar: channel.avatar || undefined,
      status: channel.status,
      activity: channel.activity,
      type: 'user',
      token: crypto.randomUUID(), // Fake token
    };
    
    await delay(MOCK_DELAY);
    return { channel: fakeUser };

  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
  
};

export default async function ChannelPage({
  params,
}: {
  params: { id: string };
}) {
  const { channel } = await getChannelByID(params.id);
  return (
    <Page>
      <ChannelDM user={channel} />
    </Page>
  );
}
