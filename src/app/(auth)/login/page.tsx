'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Brain, BookOpen, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { GradientShimmerButton } from '@/components/magic-ui/shimmer-button';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { getOAuthRedirectUrl, logUrlConfig } from '@/lib/utils/url-validator';

const features = [
  { icon: Brain, text: 'AI-Powered Study Notes' },
  { icon: BookOpen, text: 'Smart Practice Quizzes' },
  { icon: Newspaper, text: 'Daily Current Affairs' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before logging in');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    // Log URL config in development
    logUrlConfig();

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Use production-safe URL utility
      const redirectUrl = getOAuthRedirectUrl('/dashboard');
      
      console.log('[Google Login] Redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[Google Login] OAuth error:', error);
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-light text-foreground leading-[1.1] tracking-tight">
            Welcome<br />
            <span className="font-bold text-gradient">Back</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-md">
            Continue your UPSC preparation journey with AI-powered tools designed for success.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/30 group hover:border-primary/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <feature.icon className="w-6 h-6" />
              </div>
              <span className="text-foreground font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full max-w-md mx-auto lg:mx-0">
        <div className="bento-card p-8 lg:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-wider">Secure Login</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground text-sm mt-1">Enter your credentials to continue</p>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-foreground font-medium disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <BorderBeamInput active={email.length > 0}>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-muted/30 border-border/50 rounded-xl focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
              </BorderBeamInput>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <BorderBeamInput active={password.length > 0}>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-muted/30 border-border/50 rounded-xl focus:border-primary"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </BorderBeamInput>
            </div>

            <GradientShimmerButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              className="w-full h-12 text-base"
            >
              Sign In
              <ArrowRight className="w-5 h-5 ml-2" />
            </GradientShimmerButton>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}