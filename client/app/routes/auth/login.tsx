import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector, useAuth } from "~/hooks/utils/reduxHooks";
import { cn } from "~/lib/utils";
import { selectAuthError, selectAuthLoading } from "~/store/selectors";
import { clearError, loginAsync } from "~/store/slices/authSlice";
import type { Route } from "./+types/login";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Đăng nhập | E-Commerce" },
        { name: "description", content: "Đăng nhập vào tài khoản E-Commerce của bạn" },
        { name: "robots", content: "noindex, nofollow" },
    ];
}

interface FormData {
    username: string;
    password: string;
}

interface FormErrors {
    username?: string;
    password?: string;
    submit?: string;
}

export default function Login() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const loading = useAppSelector(selectAuthLoading);
    const authError = useAppSelector(selectAuthError);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        username: "",
        password: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

    // Clear auth errors when component mounts
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Validation functions
    const validateUsername = (username: string): string | undefined => {
        if (!username) return "Username là bắt buộc";
        return undefined;
    };

    const validatePassword = (password: string): string | undefined => {
        if (!password) return "Mật khẩu là bắt buộc";
        if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
        return undefined;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        newErrors.username = validateUsername(formData.username);
        newErrors.password = validatePassword(formData.password);

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== undefined);
    };

    // Handle input changes
    const handleInputChange = (field: keyof FormData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }

        // Clear auth error when user starts typing
        if (authError) {
            dispatch(clearError());
        }
    };

    // Handle input blur
    const handleInputBlur = (field: keyof FormData) => () => {
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate field on blur
        let fieldError: string | undefined;
        if (field === 'username') {
            fieldError = validateUsername(formData[field]);
        } else if (field === 'password') {
            fieldError = validatePassword(formData[field]);
        }

        setErrors(prev => ({ ...prev, [field]: fieldError }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({ username: true, password: true });

        if (!validateForm()) return;

        try {
            await dispatch(loginAsync({
                username: formData.username,
                password: formData.password,
            })).unwrap();

            // Login successful, navigation will be handled by useEffect
        } catch (error) {
            // Error is handled by Redux store
            console.error('Login failed:', error);
        }
    };

    const handleGoogleLogin = () => {
        // TODO: Implement Google OAuth
        console.log('Google login clicked');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const getFieldError = (field: keyof FormData): string | undefined => {
        return touched[field] ? errors[field] : undefined;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="flex min-h-screen">
                {/* Left Side - Login Form */}
                <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        {/* Logo and Header */}
                        <div className="text-center">
                            <Link to="/" className="inline-block">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    E-Commerce
                                </h1>
                            </Link>
                            <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
                                Chào mừng trở lại
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Đăng nhập vào tài khoản của bạn
                            </p>
                        </div>

                        {/* Login Form */}
                        <div className="mt-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Username Field */}
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                        Username
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            autoComplete="username"
                                            value={formData.username}
                                            onChange={handleInputChange('username')}
                                            onBlur={handleInputBlur('username')}
                                            className={cn(
                                                "block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm transition-colors sm:text-sm",
                                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                                                getFieldError('username')
                                                    ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 text-gray-900"
                                            )}
                                            placeholder="Nhập username của bạn"
                                            disabled={loading}
                                        />
                                        {getFieldError('username') && (
                                            <p className="mt-1 text-sm text-red-600">{getFieldError('username')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Mật khẩu
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            value={formData.password}
                                            onChange={handleInputChange('password')}
                                            onBlur={handleInputBlur('password')}
                                            className={cn(
                                                "block w-full rounded-md border px-3 py-2 pr-10 placeholder-gray-400 shadow-sm transition-colors sm:text-sm",
                                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                                                getFieldError('password')
                                                    ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 text-gray-900"
                                            )}
                                            placeholder="Nhập mật khẩu của bạn"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                            disabled={loading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                        {getFieldError('password') && (
                                            <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Remember Me and Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            disabled={loading}
                                        />
                                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                            Ghi nhớ đăng nhập
                                        </label>
                                    </div>

                                    <div className="text-sm">
                                        <Link
                                            to="/forgot-password"
                                            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
                                </div>

                                {/* Auth Error */}
                                {authError && (
                                    <div className="rounded-md bg-red-50 p-4">
                                        <div className="text-sm text-red-700">{authError}</div>
                                    </div>
                                )}

                                {/* Login Button */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={cn(
                                            "flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                            loading
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                                        )}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang đăng nhập...
                                            </>
                                        ) : (
                                            "Đăng nhập"
                                        )}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-2 text-gray-500">Hoặc đăng nhập với</span>
                                    </div>
                                </div>

                                {/* Google Login */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                        className="flex w-full justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        Đăng nhập với Google
                                    </button>
                                </div>
                            </form>

                            {/* Register Link */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Chưa có tài khoản?{" "}
                                    <Link
                                        to="/register"
                                        className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                    >
                                        Đăng ký ngay
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Image/Illustration */}
                <div className="relative hidden w-0 flex-1 lg:block">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700">
                        <div className="flex h-full items-center justify-center p-12">
                            <div className="text-center text-white">
                                <div className="mx-auto mb-8 h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <svg className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold">Chào mừng bạn đến với E-Commerce</h3>
                                <p className="mt-4 text-blue-100">
                                    Khám phá hàng ngàn sản phẩm chất lượng với giá tốt nhất.
                                    Đăng nhập để trải nghiệm mua sắm tuyệt vời!
                                </p>
                                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold">1M+</div>
                                        <div className="text-sm text-blue-100">Sản phẩm</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">500K+</div>
                                        <div className="text-sm text-blue-100">Khách hàng</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">24/7</div>
                                        <div className="text-sm text-blue-100">Hỗ trợ</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}