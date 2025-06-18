// app/routes/profile.tsx
import { ArrowLeft, RefreshCw, Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router';
import { ChangePasswordForm } from '~/components/features/profile/ChangePasswordForm';
import { ProfileForm } from '~/components/features/profile/ProfileForm';
import { ProfileHeader } from '~/components/features/profile/ProfileHeader';
import { useAuth } from '~/hooks/auth';
import { useUser } from '~/hooks/user';
import type { Route } from './+types/profile';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Profile | ViMarket" },
        { name: "description", content: "Manage your profile and account settings" },
    ];
}

export default function Profile() {
    const { isAuthenticated, loading: authLoading, user: authUser } = useAuth();
    const { updateUserProfile, refreshUser, loading: userLoading } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    // Show loading chỉ khi đang kiểm tra auth và chưa có user data
    if (authLoading && !authUser) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    // Hiện user data từ Redux state (đã có từ localStorage)
    const user = authUser;

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 mb-4">No user data found</p>
                    <button
                        onClick={() => refreshUser()}
                        disabled={userLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {userLoading ? 'Refreshing...' : 'Refresh Profile'}
                    </button>
                </div>
            </div>
        );
    }

    const handleSaveProfile = async (userData: any) => {
        try {
            await updateUserProfile(userData);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const handleRefreshProfile = async () => {
        try {
            await refreshUser();
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    };

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: User },
        { id: 'security' as const, label: 'Security', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => window.history.back()}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                                <p className="text-slate-400">Manage your profile and preferences</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleRefreshProfile}
                                disabled={userLoading}
                                className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                title="Refresh profile data"
                            >
                                <RefreshCw className={`w-5 h-5 ${userLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <Settings className="w-6 h-6 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800 rounded-lg border border-slate-700">
                            <div className="p-4">
                                <h3 className="text-sm font-medium text-slate-300 mb-4">Settings</h3>
                                <nav className="space-y-1">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 mr-3" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeTab === 'profile' && (
                            <>
                                {isEditing ? (
                                    <ProfileForm
                                        user={user}
                                        onSave={handleSaveProfile}
                                        onCancel={() => setIsEditing(false)}
                                        loading={userLoading}
                                    />
                                ) : (
                                    <ProfileHeader
                                        user={user}
                                        isEditing={isEditing}
                                        onEditToggle={() => setIsEditing(!isEditing)}
                                    />
                                )}

                                {/* Additional profile sections */}
                                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Account Statistics</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-slate-700 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-400">0</div>
                                            <div className="text-sm text-slate-400">Orders</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-700 rounded-lg">
                                            <div className="text-2xl font-bold text-green-400">0</div>
                                            <div className="text-sm text-slate-400">Wishlist Items</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-700 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-400">0</div>
                                            <div className="text-sm text-slate-400">Reviews</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'security' && (
                            <ChangePasswordForm />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}