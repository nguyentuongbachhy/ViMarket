import { useHydrated } from '~/hooks/utils/useHydrated';

interface ClientOnlyProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    className?: string;
}

export function ClientOnly({ children, fallback = null, className }: ClientOnlyProps) {
    const hydrated = useHydrated();

    if (!hydrated) {
        return fallback ? (
            <div className={className}>
                {fallback}
            </div>
        ) : null;
    }

    return (
        <div className={className}>
            {children}
        </div>
    );
}

export function ClientOnlyRender({ children, fallback = null }: ClientOnlyProps) {
    const hydrated = useHydrated();

    if (!hydrated) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}