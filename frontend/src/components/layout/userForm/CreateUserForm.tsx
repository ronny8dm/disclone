'use client';

import { useState } from 'react';
import { UserService, CreateUserRequest } from '@/lib/api/userService';
import { User, StaticUserStatuses } from '@/lib/entities/user';
import { useCurrentUserStore } from '@/state/user';
import { webSocketService } from '@/lib/api/webSocketService';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/button/button';
import { BsPersonFill, BsImageFill, BsX } from 'react-icons/bs';
import Avatar from '@/components/ui/avatar';

interface CreateUserFormProps {
  onSuccess: (user: User) => void;
  onCancel?: () => void;
}

// Predefined avatar options
const avatarOptions = [
  'https://picsum.photos/seed/avatar1/100/100',
  'https://picsum.photos/seed/avatar2/100/100',
  'https://picsum.photos/seed/avatar3/100/100',
  'https://picsum.photos/seed/avatar4/100/100',
  'https://picsum.photos/seed/avatar5/100/100',
  'https://picsum.photos/seed/avatar6/100/100',
  'https://picsum.photos/seed/avatar7/100/100',
  'https://picsum.photos/seed/avatar8/100/100',
];

export default function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    username: '',
    avatar: avatarOptions[0]
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [showCustomAvatar, setShowCustomAvatar] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>(''); // New state for connection status

  const { setCurrentUser } = useCurrentUserStore();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Display name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Display name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Display name must be less than 50 characters';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🚀 Creating user with data:', formData);
      
      // Step 1: Create user account
      setConnectionStatus('Creating account...');
      const response = await UserService.createUser(formData);
      console.log('✅ User created successfully:', response);
      
      // Step 2: Convert backend response to frontend User type
      const user: User = {
        id: response.id,
        name: response.name,
        username: response.username,
        avatar: response.avatar,
        status: StaticUserStatuses.Online, // Set to online by default
        token: response.token,
        createdAt: response.createdAt,
        type: 'user'
      };
      
      // Step 3: Store user data locally
      setConnectionStatus('Saving user data...');
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('current_user', JSON.stringify(user));
      setCurrentUser(user);
      
      console.log('💾 User data stored successfully');
      
      // Step 4: Establish WebSocket connection
      setConnectionStatus('Connecting to chat service...');
      console.log('🔌 Establishing WebSocket connection for user:', user.id);
      
      try {
        await webSocketService.connect(user.id);
        console.log('✅ WebSocket connected successfully');
        setConnectionStatus('Connected! Welcome to Disclone!');
        
        // Small delay to show success message
        setTimeout(() => {
          onSuccess(user);
        }, 1000);
        
      } catch (wsError) {
        console.warn('⚠️ WebSocket connection failed, but user created successfully:', wsError);
        setConnectionStatus('Account created! (Chat connection will retry automatically)');
        
        // Still call onSuccess even if WebSocket fails
        setTimeout(() => {
          onSuccess(user);
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      setConnectionStatus('');
      
      if (error instanceof Error) {
        if (error.message.includes('Username is already taken')) {
          setErrors({ username: 'This username is already taken' });
        } else {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ general: 'Failed to create user. Please try again.' });
      }
    } finally {
      if (!connectionStatus.includes('Connected') && !connectionStatus.includes('Account created')) {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectAvatar = (avatar: string) => {
    setSelectedAvatar(avatar);
    setFormData(prev => ({ ...prev, avatar }));
    setShowCustomAvatar(false);
    setCustomAvatar('');
  };

  const handleCustomAvatar = () => {
    if (customAvatar.trim()) {
      setFormData(prev => ({ ...prev, avatar: customAvatar }));
      setSelectedAvatar(customAvatar);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-midground rounded-lg p-6 shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Disclone!</h2>
        <p className="text-gray-400 text-sm">Create your account to start chatting</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-300">
            Choose Your Avatar
          </label>
          
          <div className="flex justify-center mb-4">
            <Avatar
              src={formData.avatar}
              alt="Selected avatar"
              size="lg"
              className="scale-150"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {avatarOptions.map((avatar, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectAvatar(avatar)}
                className={`p-1 rounded-lg border-2 transition-colors ${
                  selectedAvatar === avatar 
                    ? 'border-blue-500' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                disabled={isLoading}
              >
                <Avatar src={avatar} alt={`Avatar option ${index + 1}`} size="sm" />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCustomAvatar(!showCustomAvatar)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500"
              disabled={isLoading}
            >
              <BsImageFill />
              Use custom avatar URL
            </button>

            {showCustomAvatar && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter image URL"
                  value={customAvatar}
                  onChange={(e) => setCustomAvatar(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={handleCustomAvatar}
                  className="px-4"
                  disabled={!customAvatar.trim() || isLoading}
                >
                  Use
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-semibold text-gray-300">
            Display Name *
          </label>
          <div className="relative">
            <BsPersonFill className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              id="name"
              type="text"
              placeholder="Your display name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.name && (
            <p className="text-red-400 text-xs">{errors.name}</p>
          )}
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-semibold text-gray-300">
            Username *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
            <Input
              id="username"
              type="text"
              placeholder="your_username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
              className={`pl-8 ${errors.username ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.username && (
            <p className="text-red-400 text-xs">{errors.username}</p>
          )}
          <p className="text-gray-500 text-xs">
            Only letters, numbers, and underscores allowed
          </p>
        </div>

        {/* Connection Status */}
        {connectionStatus && (
          <div className={`p-3 rounded-lg text-center ${
            connectionStatus.includes('Connected') || connectionStatus.includes('Welcome')
              ? 'bg-green-900/30 border border-green-600 text-green-400'
              : connectionStatus.includes('Account created')
              ? 'bg-yellow-900/30 border border-yellow-600 text-yellow-400'
              : 'bg-blue-900/30 border border-blue-600 text-blue-400'
          }`}>
            <p className="text-sm">{connectionStatus}</p>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-900/30 border border-red-600 rounded p-3">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              {connectionStatus || 'Creating Account...'}
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Cancel Button */}
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            className="w-full"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </form>

      <p className="text-center text-xs text-gray-500 mt-4">
        By creating an account, you agree to start chatting responsibly
      </p>
    </div>
  );
}