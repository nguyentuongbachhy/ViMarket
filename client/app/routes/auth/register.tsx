import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector, useAuth } from "~/hooks/utils/reduxHooks";
import { cn } from "~/lib/utils";
import { selectAuthError, selectAuthLoading } from "~/store/selectors";
import { clearError, registerAsync } from "~/store/slices/authSlice";
import type { Route } from "./+types/register";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Đăng ký | E-Commerce" },
        { name: "description", content: "Tạo tài khoản E-Commerce mới" },
        { name: "robots", content: "noindex, nofollow" },
    ];
}

interface FormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
}

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    submit?: string;
}

export default function Register() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const loading = useAppSelector(selectAuthLoading);
    const authError = useAppSelector(selectAuthError);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Clear auth errors when component mounts
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    // Validation functions
    const validateUsername = (username: string): string | undefined => {
        if (!username) return "Tên đăng nhập là bắt buộc";
        if (username.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự";
        if (username.length > 20) return "Tên đăng nhập không được quá 20 ký tự";
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới";
        return undefined;
    };

    const validateEmail = (email: string): string | undefined => {
        if (!email) return "Email là bắt buộc";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Email không hợp lệ";
        return undefined;
    };

    const validatePassword = (password: string): string | undefined => {
        if (!password) return "Mật khẩu là bắt buộc";
        if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
        if (!/(?=.*[a-z])/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ thường";
        if (!/(?=.*[A-Z])/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ hoa";
        if (!/(?=.*\d)/.test(password)) return "Mật khẩu phải chứa ít nhất 1 số";
        return undefined;
    };

    const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
        if (!confirmPassword) return "Xác nhận mật khẩu là bắt buộc";
        if (confirmPassword !== password) return "Mật khẩu xác nhận không khớp";
        return undefined;
    };

    const validateFullName = (fullName: string): string | undefined => {
        if (!fullName) return "Họ và tên là bắt buộc";
        if (fullName.length < 2) return "Họ và tên phải có ít nhất 2 ký tự";
        if (fullName.length > 50) return "Họ và tên không được quá 50 ký tự";
        return undefined;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        newErrors.username = validateUsername(formData.username);
        newErrors.email = validateEmail(formData.email);
        newErrors.password = validatePassword(formData.password);
        newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password);
        newErrors.fullName = validateFullName(formData.fullName);

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

        // Real-time validation for confirm password
        if (field === 'confirmPassword' && formData.password) {
            const confirmPasswordError = validateConfirmPassword(value, formData.password);
            setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
        }
    };

    // Handle input blur
    const handleInputBlur = (field: keyof FormData) => () => {
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate field on blur
        let fieldError: string | undefined;
        switch (field) {
            case 'username':
                fieldError = validateUsername(formData[field]);
                break;
            case 'email':
                fieldError = validateEmail(formData[field]);
                break;
            case 'password':
                fieldError = validatePassword(formData[field]);
                break;
            case 'confirmPassword':
                fieldError = validateConfirmPassword(formData[field], formData.password);
                break;
            case 'fullName':
                fieldError = validateFullName(formData[field]);
                break;
        }

        setErrors(prev => ({ ...prev, [field]: fieldError }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({
            username: true,
            email: true,
            password: true,
            confirmPassword: true,
            fullName: true
        });

        if (!validateForm()) return;

        if (!agreeToTerms) {
            setErrors(prev => ({ ...prev, submit: "Bạn phải đồng ý với điều khoản sử dụng" }));
            return;
        }

        try {
            await dispatch(registerAsync({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
            })).unwrap();

            // Navigate to login page after successful registration
            navigate("/login", {
                replace: true,
                state: {
                    message: "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.",
                    type: "success"
                }
            });

        } catch (error) {
            // Error is handled by Redux store
            console.error('Register failed:', error);
        }
    };

    const handleGoogleRegister = () => {
        // TODO: Implement Google OAuth
        console.log('Google register clicked');
    };

    const getFieldError = (field: keyof FormData): string | undefined => {
        return touched[field] ? errors[field] : undefined;
    };

    // Password strength indicator
    const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/(?=.*[a-z])/.test(password)) strength++;
        if (/(?=.*[A-Z])/.test(password)) strength++;
        if (/(?=.*\d)/.test(password)) strength++;
        if (/(?=.*[^a-zA-Z\d])/.test(password)) strength++;

        const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

        return {
            strength,
            label: labels[strength] || 'Rất yếu',
            color: colors[strength] || 'bg-red-500'
        };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <div className="flex min-h-screen">
                {/* Left Side - Illustration */}
                <div className="relative hidden w-0 flex-1 lg:block">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-green-700">
                        <div className="flex h-full items-center justify-center p-12">
                            <div className="text-center text-white">
                                <div className="mx-auto mb-8 h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <svg className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold">Tham gia cộng đồng E-Commerce</h3>
                                <p className="mt-4 text-green-100">
                                    Tạo tài khoản để trải nghiệm mua sắm trực tuyến tuyệt vời với hàng triệu sản phẩm chất lượng.
                                </p>
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg className="h-5 w-5 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-green-100">Miễn phí đăng ký</span>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg className="h-5 w-5 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-green-100">Giao hàng toàn quốc</span>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg className="h-5 w-5 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-green-100">Thanh toán an toàn</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Register Form */}
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
                                Tạo tài khoản mới
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Đăng ký để bắt đầu mua sắm ngay hôm nay
                            </p>
                        </div>

                        {/* Register Form */}
                        <div className="mt-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name Field */}
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                        Họ và tên
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            autoComplete="name"
                                            value={formData.fullName}
                                            onChange={handleInputChange('fullName')}
                                            onBlur={handleInputBlur('fullName')}
                                            className={cn(
                                                "block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm transition-colors sm:text-sm",
                                                "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
                                                getFieldError('fullName')
                                                    ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 text-gray-900"
                                            )}
                                            placeholder="Nhập họ và tên đầy đủ"
                                            disabled={loading}
                                        />
                                        {getFieldError('fullName') && (
                                            <p className="mt-1 text-sm text-red-600">{getFieldError('fullName')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Username Field */}
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                        Tên đăng nhập
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
                                                "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
                                                getFieldError('username')
                                                    ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 text-gray-900"
                                            )}
                                            placeholder="Chọn tên đăng nhập"
                                            disabled={loading}
                                        />
                                        {getFieldError('username') && (
                                            <p className="mt-1 text-sm text-red-600">{getFieldError('username')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={handleInputChange('email')}
                                            onBlur={handleInputBlur('email')}
                                            className={cn(
                                                "block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm transition-colors sm:text-sm",
                                                "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
                                                getFieldError('email')
                                                    ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 text-gray-900"
                                            )}
                                            placeholder="Nhập địa chỉ email"
                                            disabled={loading}
                                        />
                                        {getFieldError('email') && (
                                            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
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
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={handleInputChange('password')}
                                            onBlur={handleInputBlur('password')}
                                            className={cn(
                                                "block w-full rounded-md border px-3 py-2 pr-10 placeholder-gray-400 shadow-sm transition-colors sm:text-sm",
                                                "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
                                                getFieldError('password')
                                                    ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 text-gray-900"
                                            )}
                                            placeholder="Tạo mật khẩu mạnh"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                            disabled={loading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {formData.password && (
                                        <div className="mt-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={cn("h-2 rounded-full transition-all", passwordStrength.color)}
                                                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                                            </div>
                                        </div>
                                    )}

                                    {getFieldError('password') && (
                                        <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                        Xác nhận mật khẩu
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange('confirmPassword')}
                                            onBlur={handleInputBlur('confirmPassword')}
                                            className={cn(
                                                "block w-full rounded-md border px-3 py-2 pr-10 placeholder-gray-400 shadow-sm transition-colors sm:text-sm",
                                                "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
                                                getFieldError('confirmPassword')
                                                    ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 text-gray-900"
                                            )}
                                            placeholder="Nhập lại mật khẩu"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                        {getFieldError('confirmPassword') && (
                                            <p className="mt-1 text-sm text-red-600">{getFieldError('confirmPassword')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Terms Agreement */}
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="agree-terms"
                                            name="agree-terms"
                                            type="checkbox"
                                            checked={agreeToTerms}
                                            onChange={(e) => {
                                                setAgreeToTerms(e.target.checked);
                                                if (errors.submit) {
                                                    setErrors(prev => ({ ...prev, submit: undefined }));
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="agree-terms" className="text-gray-700">
                                            Tôi đồng ý với{" "}
                                            <Link
                                                to="/terms"
                                                className="font-medium text-emerald-600 hover:text-emerald-500"
                                            >
                                                Điều khoản sử dụng
                                            </Link>{" "}
                                            và{" "}
                                            <Link
                                                to="/privacy"
                                                className="font-medium text-emerald-600 hover:text-emerald-500"
                                            >
                                                Chính sách bảo mật
                                            </Link>
                                        </label>
                                    </div>
                                </div>

                                {/* Submit Error */}
                                {(authError || errors.submit) && (
                                    <div className="rounded-md bg-red-50 p-4">
                                        <div className="text-sm text-red-700">{authError || errors.submit}</div>
                                    </div>
                                )}

                                {/* Register Button */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading || !agreeToTerms}
                                        className={cn(
                                            "flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all",
                                            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                                            loading || !agreeToTerms
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                                        )}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang tạo tài khoản...
                                            </>
                                        ) : (
                                            "Tạo tài khoản"
                                        )}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-2 text-gray-500">Hoặc đăng ký với</span>
                                    </div>
                                </div>

                                {/* Google Register */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleGoogleRegister}
                                        disabled={loading}
                                        className="flex w-full justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                        Đăng ký với Google
                                    </button>
                                </div>
                            </form>

                            {/* Login Link */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Đã có tài khoản?{" "}
                                    <Link
                                        to="/login"
                                        className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                                    >
                                        Đăng nhập ngay
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}