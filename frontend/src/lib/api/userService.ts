import { ListedDMChannel } from "../entities/channel";
import { StaticUserStatuses } from "../entities/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5120';

export interface CreateUserRequest {
  name: string;
  username: string;
  avatar?: string;
}

export interface CreateUserResponse {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: number;
  token: string;
  createdAt: string;
}

export interface UserResponse {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: number;
  lastActiveAt: string;
}

export interface UpdateStatusResponse {
  message: string;
  status: number;
  userId?: string;
}

export interface GetUsersResponse {
  users: UserResponse[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiError {
  error: string;
}

export class UserService {
  static async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      console.log('🚀 API Request: Creating user...', userData);
      
      const response = await fetch(`${API_BASE_URL}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('📡 API Response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to create user (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  static async getCurrentUser(token: string): Promise<UserResponse> {
    try {
      console.log('🚀 API Request: Getting current user...');
      

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📡 API Response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to get current user (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      throw error;
    }
  }

  static async updateUserStatus(token: string, status: number): Promise<UpdateStatusResponse> {
    try {
      console.log('🚀 API Request: Updating status to', status);
      
      const response = await fetch(`${API_BASE_URL}/api/users/me/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      console.log('📡 API Response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to update status (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error updating status:', error);
      throw error;
    }
  }

  static async checkUsername(username: string): Promise<{ available: boolean }> {
    try {
      console.log('🚀 API Request: Checking username availability...', username);
      
      const response = await fetch(`${API_BASE_URL}/api/users/check-username/${encodeURIComponent(username)}`);
      const data = await response.json();
      
      console.log('📡 API Response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to check username (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error checking username:', error);
      throw error;
    }
  }

    static async getAllUsers(page: number = 1, limit: number = 50): Promise<GetUsersResponse> {
      try {
        console.log('🚀 API Request: Getting all users, page:', page, 'limit:', limit);

        const response = await fetch(`${API_BASE_URL}/api/users?page=${page}&limit=${limit}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('📡 API Response:', response.status, data);

        if (!response.ok){
          throw new Error(data.error || `Failed to get users (${response.status})`);
        }

        return data;
      } catch (error) {
        console.error('❌ Error getting all users:', error);
        throw error;
      }
    }

    static convertUserResponseToDMChannel(userResponse: UserResponse): ListedDMChannel {
    return {
      id: userResponse.id,
      name: userResponse.name,
      username: userResponse.username,
      avatar: userResponse.avatar,
      status: this.convertNumericStatusToEnum(userResponse.status),
      // No activity for real users (you can add this later)
      activity: undefined,
    };
  }

  private static convertNumericStatusToEnum(status: number): StaticUserStatuses {
    switch (status) {
      case 0: return StaticUserStatuses.Online;
      case 1: return StaticUserStatuses.Idle;
      case 2: return StaticUserStatuses.DND;
      case 3: return StaticUserStatuses.Offline;
      case 4: return StaticUserStatuses.Mobile;
      default: return StaticUserStatuses.Online;
    }
    
  }
}