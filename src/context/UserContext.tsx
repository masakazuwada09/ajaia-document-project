'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SEEDED_USERS } from '@/types';

interface UserContextType {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User>(SEEDED_USERS[0]); // Alice by default
  const [users, setUsers] = useState<User[]>(SEEDED_USERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Load users from server if available
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          // Check saved preference
          const savedId = localStorage.getItem('ajaia_current_user_id');
          if (savedId) {
            const found = data.users.find((u: User) => u.id === savedId);
            if (found) {
              setCurrentUserState(found);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ajaia_current_user_id', user.id);
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, users, setCurrentUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
