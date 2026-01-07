// app/auth/signin/page.tsx
"use client";

import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  ArrowRight,
  Sparkles,
  Shield,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err: any) {
      // User-friendly error messages
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        default:
          setError(err.message || 'Something went wrong. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    setError('');
    
    try {
      const providerInstance = provider === 'google' ? googleProvider : facebookProvider;
      await signInWithPopup(auth, providerInstance);
      router.push('/');
    } catch (err: any) {
      // User-friendly error messages for social login
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          setError('Login cancelled. Please try again.');
          break;
        case 'auth/popup-blocked':
          setError('Popup was blocked. Please allow popups for this site.');
          break;
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with this email. Please use a different sign-in method.');
          break;
        default:
          setError(err.message || `Failed to sign in with ${provider}. Please try again.`);
      }
    }
    setSocialLoading(null);
  };

  const passwordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 25;
    if (password.length < 8) return 50;
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 75;
    return 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/30">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Event Invites
              </h1>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back!'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isSignUp ? 'Join thousands creating beautiful invitations' : 'Sign in to access your dashboard'}
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3! mb-8">
              <button
                onClick={() => handleSocialSignIn('google')}
                disabled={loading || socialLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {socialLoading === 'google' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium">Continue with Google</span>
                  </>
                )}
              </button>

              {/* <button
                onClick={() => handleSocialSignIn('facebook')}
                disabled={loading || socialLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {socialLoading === 'facebook' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-medium">Continue with Facebook</span>
                  </>
                )}
              </button> */}
            </div>

            {/* Divider */}
            <div className="flex items-center mb-8">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">or continue with email</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  {!isSignUp && (
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                    disabled={loading}
                    minLength={isSignUp ? 6 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password strength indicator (only for sign up) */}
                {isSignUp && password.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Password strength</span>
                      <span>{passwordStrength()}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength() < 50 ? 'bg-red-500' :
                          passwordStrength() < 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength()}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {password.length < 6 ? 'At least 6 characters' :
                       !/[A-Z]/.test(password) ? 'Add uppercase letters' :
                       !/[0-9]/.test(password) ? 'Add numbers' : 'Strong password!'}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms and conditions (only for sign up) */}
              {isSignUp && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-purple-600 hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (isSignUp && passwordStrength() < 50)}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle between sign in/sign up */}
            <p className="text-center mt-8 text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="font-semibold text-purple-600 hover:text-purple-800 hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          {/* Right side - Visual/Info */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-600 to-pink-500 p-8 md:p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-white" />
                <span className="text-white/90 text-sm font-semibold">JOIN 10,000+ USERS</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Create stunning invitations in minutes
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white">✨</span>
                  </div>
                  <span className="text-white/90">Drag & drop designer</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white">🎨</span>
                  </div>
                  <span className="text-white/90">Custom templates</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white">📱</span>
                  </div>
                  <span className="text-white/90">Share via link or QR code</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white">🔒</span>
                  </div>
                  <span className="text-white/90">Private event options</span>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="relative z-10 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-white italic mb-4">
                  "This platform made my wedding invitations look professional and saved me so much time!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20"></div>
                  <div>
                    <p className="text-white font-semibold">Sarah Johnson</p>
                    <p className="text-white/70 text-sm">Event Planner</p>
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