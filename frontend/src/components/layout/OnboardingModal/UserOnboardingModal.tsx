'use client';

import { useState, useEffect } from 'react';
import { User, StaticUserStatuses } from '@/lib/entities/user';
import { useCurrentUserStore } from '@/state/user';
import CreateUserForm from '@/components/layout/userForm/CreateUserForm';

export default function UserOnboardingModal() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const { currentUser, setCurrentUser } = useCurrentUserStore();

  // Helper function to convert numeric status to StaticUserStatuses
  const convertNumericStatusToEnum = (status: number): StaticUserStatuses => {
    switch (status) {
      case 0: return StaticUserStatuses.Online;
      case 1: return StaticUserStatuses.Idle;
      case 2: return StaticUserStatuses.DND;
      case 3: return StaticUserStatuses.Offline;
      case 4: return StaticUserStatuses.Mobile;
      default: return StaticUserStatuses.Online;
    }
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only run on client side after hydration
    if (!isHydrated || typeof window === 'undefined') return;

    const checkExistingUser = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('current_user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          
          // Convert numeric status to enum if needed
          if (typeof user.status === 'number') {
            user.status = convertNumericStatusToEnum(user.status);
          }
          
          setCurrentUser(user);
          console.log('✅ Found existing user:', user);
          setShowModal(false);
        } else {
          console.log('🎯 No existing user found, showing onboarding');
          setShowModal(true);
        }
      } catch (err) {
        console.error('❌ Error loading user data:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        setShowModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure the page has loaded
    const timer = setTimeout(checkExistingUser, 100);
    return () => clearTimeout(timer);
  }, [setCurrentUser, isHydrated]);

  const handleUserCreated = (user: User) => {
    console.log('🎉 User successfully created:', user);
    setShowModal(false);
  };

  // Don't render anything until hydrated
  if (!isHydrated) {
    return null;
  }

  // Don't render anything while checking for existing user
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-midground rounded-lg p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show modal if user already exists
  if (!showModal || currentUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-lg w-full">
        <CreateUserForm onSuccess={handleUserCreated} />
      </div>
    </div>
  );
}