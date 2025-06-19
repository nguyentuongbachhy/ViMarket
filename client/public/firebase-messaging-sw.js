// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyB89tvlW-KEXMWNIXN8stqvOgkXkwsRKHE",
    authDomain: "vivibe-108ba.firebaseapp.com",
    projectId: "vivibe-108ba",
    storageBucket: "vivibe-108ba.firebasestorage.app",
    messagingSenderId: "126631239702",
    appId: "1:126631239702:web:bdeb179e2995537898d537",
    measurementId: "G-HKFQG7VL4T"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'Thông báo mới';
    const notificationOptions = {
        body: payload.notification?.body || 'Bạn có thông báo mới',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: payload.data?.notificationId || `notification_${Date.now()}`,
        data: payload.data,
        requireInteraction: payload.data?.priority === 'urgent',
        actions: [
            {
                action: 'view',
                title: 'Xem',
                icon: '/favicon.ico'
            },
            {
                action: 'dismiss',
                title: 'Đóng',
                icon: '/favicon.ico'
            }
        ],
        timestamp: Date.now(),
        renotify: true,
        silent: false
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
        // Open app to appropriate page based on notification type
        let url = '/notifications';
        
        if (event.notification.data) {
            const data = event.notification.data;
            if (data.type === 'cart.item.added' || data.type === 'cart.abandoned') {
                url = '/cart';
            } else if (data.type === 'wishlist.product.price.changed' && data.productId) {
                url = `/product/${data.productId}`;
            }
        }
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If app is open but not on the target page, navigate there
                if (clientList.length > 0 && 'navigate' in clientList[0]) {
                    return clientList[0].navigate(url).then(client => client?.focus());
                }
                // Otherwise open new window
                return clients.openWindow(url);
            })
        );
    }
});

self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
    // Track notification close event if needed
});