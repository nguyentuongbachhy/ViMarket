import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "~/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useTypedDispatch = useAppDispatch;
export const useTypedSelector = useAppSelector;

export const useAuth = () => {
    const isLogged = useAppSelector(state => state.auth.isLogged);
    const token = useAppSelector(state => state.auth.token);
    const userId = useAppSelector(state => state.auth.userId);
    const user = useAppSelector(state => state.auth.user);
    const loading = useAppSelector(state => state.auth.loading || false);
    const error = useAppSelector(state => state.auth.error);

    return {
        isLogged,
        token,
        userId,
        user,
        loading,
        error,
        isAuthenticated: isLogged && !!token
    };
};

export const useAppLoading = () => {
    return useAppSelector(state => ({
        auth: state.auth.loading || false,
    }));
};

export const useAppError = () => {
    return useAppSelector(state => ({
        auth: state.auth.error,
    }));
};

export const useAsyncDispatch = () => {
    const dispatch = useAppDispatch();

    const dispatchAsync = async <T>(
        asyncAction: any,
        onSuccess?: (result: T) => void,
        onError?: (error: string) => void
    ) => {
        try {
            const result = await dispatch(asyncAction).unwrap();
            onSuccess?.(result);
            return result;
        } catch (error) {
            const errorMessage = error as string;
            onError?.(errorMessage);
            throw error;
        }
    };

    return dispatchAsync;
};