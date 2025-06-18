import { Calendar, Mail, Shield, User } from 'lucide-react';
import type { UserInfo } from '~/api/types';

interface ProfileHeaderProps {
    user: UserInfo;
    isEditing: boolean;
    onEditToggle: () => void;
}

export const ProfileHeader = ({ user, isEditing, onEditToggle }: ProfileHeaderProps) => {
    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Profile Information</h1>
                <button
                    onClick={onEditToggle}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-400" />
                </div>

                <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-1">
                        {user.fullName || user.username}
                    </h2>
                    <div className="flex items-center text-slate-400 mb-2">
                        <Mail className="w-4 h-4 mr-2" />
                        {user.email}
                    </div>
                    <div className="flex items-center text-slate-400 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-slate-400">
                        <Shield className="w-4 h-4 mr-2" />
                        Role: {user.role}
                    </div>
                </div>
            </div>
        </div>
    );
};