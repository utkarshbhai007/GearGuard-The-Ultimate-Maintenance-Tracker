import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CogIcon, 
  SparklesIcon,
  BoltIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { cn } from '../../utils/helpers';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <CogIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-4xl font-bold text-gray-900 flex items-center justify-center">
            Welcome to GearGuard
            <SparklesIcon className="w-8 h-8 ml-2 text-yellow-500" />
          </h2>
          <p className="mt-3 text-lg text-gray-600 flex items-center justify-center">
            <BoltIcon className="w-5 h-5 mr-2" />
            Sign in to your maintenance management account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                autoComplete="email"
                className={cn(
                  'input',
                  errors.email ? 'input-error' : ''
                )}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ShieldCheckIcon className="w-4 h-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn(
                    'input pr-12',
                    errors.password ? 'input-error' : ''
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ShieldCheckIcon className="w-4 h-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-4 text-lg font-semibold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-3" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <BoltIcon className="w-5 h-5 mr-2" />
                    Sign in to GearGuard
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 mr-1" />
              Demo Accounts (password: password123)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                  if (emailInput && passwordInput) {
                    emailInput.value = 'admin@gearguard.com';
                    passwordInput.value = 'password123';
                  }
                }}
                className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                  if (emailInput && passwordInput) {
                    emailInput.value = 'manager@gearguard.com';
                    passwordInput.value = 'password123';
                  }
                }}
                className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Manager Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                  if (emailInput && passwordInput) {
                    emailInput.value = 'tech@gearguard.com';
                    passwordInput.value = 'password123';
                  }
                }}
                className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                Tech Demo
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <ShieldCheckIcon className="w-4 h-4 mr-1" />
            Secure maintenance management platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;