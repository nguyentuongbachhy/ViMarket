import { type AxiosResponse } from 'axios';
import instance, { handleApiError, handleApiResponse } from '~/api/axios';
import type {
    ApiResponse,
    DeviceToken,
    NotificationEvent,
    NotificationListData,
    RegisterDeviceRequest,
    UpdatePreferencesRequest,
    UserNotificationPreferences
} from '~/api/types';

export class NotificationService {
    private readonly baseUrl = '/notifications';

    // ✅ SỬA METHOD NÀY ĐỂ HANDLE RESPONSE MỚI
    async getNotifications(limit: number = 20, offset: number = 0): Promise<NotificationListData> {
        try {
            const response: AxiosResponse<ApiResponse<NotificationListData>> = await instance.get(
                `${this.baseUrl}?limit=${limit}&offset=${offset}`
            );
            return handleApiResponse<NotificationListData>(response);
        } catch (error) {
            console.error('Failed to get notifications:', error);
            return {
                notifications: [],
                unreadCount: 0,
                pagination: {
                    limit,
                    offset,
                    hasMore: false
                }
            };
        }
    }

    async markAsRead(notificationId: string): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.put(
                `${this.baseUrl}/${notificationId}/read`
            );
            handleApiResponse<null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async markAllAsRead(): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.put(
                `${this.baseUrl}/read-all`
            );
            handleApiResponse<null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async deleteNotification(notificationId: string): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.delete(
                `${this.baseUrl}/${notificationId}`
            );
            handleApiResponse<null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async registerDevice(request: RegisterDeviceRequest): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.post(
                `${this.baseUrl}/devices`,
                request
            );
            handleApiResponse<null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getDevices(): Promise<Omit<DeviceToken, 'token'>[]> {
        try {
            const response: AxiosResponse<ApiResponse<Omit<DeviceToken, 'token'>[]>> = await instance.get(
                `${this.baseUrl}/devices`
            );
            return handleApiResponse<Omit<DeviceToken, 'token'>[]>(response);
        } catch (error) {
            console.error('Failed to get devices:', error);
            return [];
        }
    }

    async unregisterDevice(deviceId: string): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.delete(
                `${this.baseUrl}/devices/${deviceId}`
            );
            handleApiResponse<null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getPreferences(): Promise<UserNotificationPreferences | null> {
        try {
            const response: AxiosResponse<ApiResponse<UserNotificationPreferences>> = await instance.get(
                `${this.baseUrl}/preferences`
            );
            return handleApiResponse<UserNotificationPreferences>(response);
        } catch (error) {
            console.error('Failed to get preferences:', error);
            return null;
        }
    }

    async updatePreferences(updates: UpdatePreferencesRequest): Promise<UserNotificationPreferences> {
        try {
            const response: AxiosResponse<ApiResponse<UserNotificationPreferences>> = await instance.put(
                `${this.baseUrl}/preferences`,
                updates
            );
            return handleApiResponse<UserNotificationPreferences>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async sendTestNotification(): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.post(
                `${this.baseUrl}/test`
            );
            handleApiResponse<null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ SỬA METHOD NÀY
    async getUnreadCount(): Promise<number> {
        try {
            const data = await this.getNotifications(1, 0); // Chỉ lấy 1 để get unreadCount
            return data.unreadCount;
        } catch (error) {
            console.error('Failed to get unread count:', error);
            return 0;
        }
    }
}

export const notificationService = new NotificationService();
export default notificationService;