import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/auth/auth-config';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let user;
    try {
        user = await getCurrentUser();
    } catch (error) {
        console.error('[Admin Layout] Error fetching user:', error);
        redirect('/login');
    }

    if (!user) {
        redirect('/login');
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />

            {/* Main Content */}
            <div className="ml-64">
                <AdminHeader
                    user={{
                        name: user.name || 'Admin',
                        email: user.email,
                        role: user.role,
                    }}
                />

                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
