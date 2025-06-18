import { useEffect, useState } from 'react';

export function useHydrated() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}

export function useSSRSafe() {
    const [isSafe, setIsSafe] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            setIsSafe(true);
        }
    }, []);

    return isSafe;
}