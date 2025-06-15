// src/components/Header.tsx (updated)
import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onClearChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onClearChat }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logout();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              E-commerce Chatbot
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Online</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* User Info */}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
            <div className="text-xs text-gray-500">@{user?.username}</div>
          </div>

          {/* Clear Chat Button */}
          <button
            className="
              p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
              transition-colors duration-200
            "
            onClick={onClearChat}
            title="Clear Chat"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
            </svg>
          </button>

          {/* Logout Button */}
          <button
            className="
              p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50
              transition-colors duration-200
            "
            onClick={handleLogout}
            title="Logout"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};