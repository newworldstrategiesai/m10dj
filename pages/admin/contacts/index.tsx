'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ContactsWrapper from '@/components/ui/Contacts/ContactsWrapper';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function ContactsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState<any>({});
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                router.push('/signin');
                return;
            }

            // Check if user is platform admin or has access via subscription
            const { isPlatformAdmin } = await import('@/utils/auth-helpers/platform-admin');
            const { canAccessAdminPage } = await import('@/utils/subscription-access');
            
            const isAdmin = isPlatformAdmin(user.email);
            
            if (!isAdmin) {
                // Check subscription access for SaaS users
                const access = await canAccessAdminPage(supabase, user.email, 'contacts');
                
                if (!access.canAccess) {
                    // Redirect starter tier users to their dashboard with upgrade prompt
                    router.push('/admin/dashboard-starter');
                    return;
                }
            }

            setUser(user);

            // Get API keys if they exist (optional for contacts)
            const { data: apiKeysData } = await supabase
                .from('api_keys')
                .select('twilio_sid, twilio_auth_token')
                .eq('user_id', user.id)
                .single();

            setApiKeys({
                twilioSid: apiKeysData?.twilio_sid || process.env.TWILIO_ACCOUNT_SID,
                twilioAuthToken: apiKeysData?.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN
            });

        } catch (error) {
            console.error('Error fetching user data:', error);
            router.push('/signin');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Contacts" description="M10 DJ Company Contacts">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#fcba00]"></div>
                        <p className="mt-4 text-gray-600">Loading contacts...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <AdminLayout title="Contacts" description="M10 DJ Company Contacts">
            <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 overflow-hidden">
                {/* Decorative elements - Glowing orbs */}
                <div className="absolute top-20 left-10 w-64 h-64 bg-[#fcba00]/10 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-black/5 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#fcba00]/5 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                
                {/* Main content */}
                <div className="relative z-10 container mx-auto px-3 lg:px-4 py-4 lg:py-8">
                    <div className="rounded-2xl backdrop-blur-sm bg-white/90 border border-gray-200 shadow-xl overflow-hidden">
                        <div className="pt-4 lg:pt-6 px-4 lg:px-6">
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center font-sans">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fcba00] to-black">
                                        M10 DJ Contacts
                                    </span>
                                    <div className="ml-2 lg:ml-3 h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                                </h1>
                            </div>
                            <p className="text-gray-600 text-xs lg:text-sm mb-2 font-sans">Manage your DJ business leads and client contacts</p>
                        </div>
                        
                        <ContactsWrapper userId={user.id} apiKeys={apiKeys} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
