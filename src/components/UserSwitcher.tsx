'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { User } from '@/types';
import { Check, ChevronDown, UserCircle2, ShieldAlert } from 'lucide-react';

export function UserSwitcher() {
  const { currentUser, users, setCurrentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-xs"
        title="Switch active user to test document permissions"
      >
        <div
          className={`w-7 h-7 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-xs font-semibold shadow-xs`}
        >
          {getInitials(currentUser.name)}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
            {currentUser.name}
            <span className="text-[10px] font-normal px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
              {currentUser.role}
            </span>
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Reviewer Mode Active</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Switch persona to test ownership, editor permissions, and view-only enforcement.
            </p>
          </div>

          <div className="py-1">
            {users.map((user: User) => {
              const isSelected = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setCurrentUser(user);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-indigo-50/60' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-xs font-semibold shrink-0`}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate flex items-center justify-between">
                      {user.name}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{user.role}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
