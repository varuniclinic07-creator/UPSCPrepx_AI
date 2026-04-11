// ═══════════════════════════════════════════════════════════════
// NEXTAUTH CONFIGURATION
// Google OAuth + Custom credentials
// ═══════════════════════════════════════════════════════════════

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const authOptions: NextAuthOptions = {
    providers: [
        // Google OAuth
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code'
                }
            }
        }),

        // Mobile OTP (handled via credentials)
        CredentialsProvider({
            id: 'mobile-otp',
            name: 'Mobile OTP',
            credentials: {
                phone: { label: 'Phone', type: 'text' },
                otp: { label: 'OTP', type: 'text' }
            },
            async authorize(credentials) {
                if (!credentials?.phone || !credentials?.otp) {
                    return null;
                }

                // Verify OTP
                const { verifyOTP } = await import('@/lib/sms/otp-service');
                const verified = await verifyOTP(credentials.phone, credentials.otp);

                if (!verified) {
                    return null;
                }

                // Get or create user
                const supabase = await createClient();
                const { data: user } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', credentials.phone)
                    .single() as { data: { id: string; email: string; name: string; phone: string; role: string; subscription_tier: string } | null };

                if (user) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        phone: user.phone,
                        role: user.role,
                        subscriptionTier: user.subscription_tier
                    };
                }

                return null;
            }
        }),

        // Email/Password (optional)
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const supabase = await createClient();

                // Use Supabase Auth
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: credentials.email,
                    password: credentials.password
                });

                if (error || !data.user) {
                    return null;
                }

                // Get user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single() as { data: { id: string; email: string; name: string; phone: string; role: string; subscription_tier: string } | null };

                if (!profile) {
                    return null;
                }

                return {
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    phone: profile.phone,
                    role: profile.role,
                    subscriptionTier: profile.subscription_tier
                };
            }
        })
    ],

    callbacks: {
        async signIn({ user, account }: { user: any; account: any }) {
            const supabase = await createClient();

            // For Google OAuth
            if (account?.provider === 'google') {
                // Check if user exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', user.email!)
                    .single();

                if (!existingUser) {
                    // Create new user
                    const { data: newUser, error } = await supabase
                        .from('users')
                        .insert({
                            email: user.email,
                            name: user.name,
                            avatar_url: user.image
                        } as any)
                        .select()
                        .single();

                    if (error) {
                        console.error('Error creating user:', error);
                        return false;
                    }

                    user.id = (newUser as any).id;
                } else {
                    user.id = (existingUser as any).id;
                }
            }

            return true;
        },

        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.subscriptionTier = user.subscriptionTier;
            }
            return token;
        },

        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).subscriptionTier = token.subscriptionTier;
            }
            return session;
        }
    },

    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        newUser: '/auth/welcome'
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };