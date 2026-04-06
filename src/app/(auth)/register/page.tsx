'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, Crown, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ShimmerButton, GradientShimmerButton } from '@/components/magic-ui/shimmer-button';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Loading } from '@/components/ui/loading';
import { getOAuthRedirectUrl, getEmailRedirectUrl, logUrlConfig } from '@/lib/utils/url-validator';

const planDetails = {
  trial: {
    name: 'Free Trial',
    icon: Zap,
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
    textClass: 'text-primary',
    benefits: [
      '5 AI-generated notes per day',
      '3 Practice quizzes per day',
      'Daily current affairs access',
      '14-day free trial period',
    ],
  },
  basic: {
    name: 'Basic Plan',
    icon: Star,
    bgClass: 'bg-secondary/10',
    borderClass: 'border-secondary/20',
    textClass: 'text-secondary',
    benefits: [
      'Unlimited AI-generated notes',
      'Unlimited practice quizzes',
      'Video lessons library access',
      'Essay evaluation feedback',
    ],
  },
  premium: {
    name: 'Premium Plan',
    icon: Crown,
    bgClass: 'bg-accent/10',
    borderClass: 'border-accent/20',
    textClass: 'text-accent',
    benefits: [
      'Everything in Basic plan',
      'AI Mock Interview practice',
      'Personal study planner',
      'Priority 24/7 support',
    ],
  },
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = (searchParams.get('plan') || 'trial') as keyof typeof planDetails;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const currentPlan = planDetails[plan] || planDetails.trial;
  const PlanIcon = currentPlan.icon;

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Use production-safe URL utility for email redirect
      const emailRedirectUrl = getEmailRedirectUrl('/dashboard');
      console.log('[Email Register] Redirect URL:', emailRedirectUrl);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            subscription_tier: plan,
          },
          emailRedirectTo: emailRedirectUrl,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Check your email to verify your account!');
      router.push('/login?message=verify-email');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Use production-safe URL utility for OAuth redirect
      const redirectUrl = getOAuthRedirectUrl('/dashboard');
      console.log('[Google Register] Redirect URL:', redirectUrl);
      logUrlConfig(); // Debug logging in development

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
        console.error('[Google Register] OAuth error:', error);
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Google registration error:', error);
      toast.error('Failed to sign up with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      {/* Left Side - Plan Benefits */}
      <div className="hidden lg:block">
        <div className="bento-card p-8 sticky top-8">
          {/* Plan Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${currentPlan.bgClass} border ${currentPlan.borderClass} mb-6`}>
            <PlanIcon className={`w-4 h-4 ${currentPlan.textClass}`} />
            <span className={`${currentPlan.textClass} text-sm font-bold`}>{currentPlan.name}</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-3">
            {plan === 'trial' ? 'Start Free Today' : 'Unlock Your Potential'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {plan === 'trial'
              ? 'Experience the power of AI-driven UPSC preparation for 14 days.'
              : 'Get unlimited access to all features and accelerate your preparation.'}
          </p>

          {/* Benefits List */}
          <div className="space-y-4">
            {currentPlan.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/30"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-card flex items-center justify-center text-white text-xs font-bold"
                  >
                    {['A', 'S', 'R', 'P'][i]}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Join 10,000+ aspirants</p>
                <p className="text-xs text-muted-foreground">who trust UPSC CSE Master</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full max-w-md mx-auto lg:mx-0">
        <div className="bento-card p-8 lg:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <Sparkles className="w-3 h-3 text-green-500" />
              <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Create Account</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Get Started Free</h2>
            <p className="text-muted-foreground text-sm mt-1">No credit card required</p>
          </div>

          {/* Google Registration */}
          <button
            onClick={handleGoogleRegister}
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
              <span className="bg-card px-3 text-muted-foreground">Or register with email</span>
            </div>
          </div>

          {/* Email Registration Form */}
          <form onSubmit={handleEmailRegister} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <BorderBeamInput active={name.length > 0}>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-12 bg-muted/30 border-border/50 rounded-xl focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
              </BorderBeamInput>
            </div>

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
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <BorderBeamInput active={password.length > 0}>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
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
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <GradientShimmerButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              className="w-full h-12 text-base"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </GradientShimmerButton>
          </form>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading size="lg" />}>
      <RegisterForm />
    </Suspense>
  );
}