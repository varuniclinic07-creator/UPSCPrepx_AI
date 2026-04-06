'use client';

import { useState, useEffect } from 'react';
import { Cpu, Check, X, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

interface AIProvider {
    id: string;
    name: string;
    provider_type: string;
    is_active: boolean;
    is_default: boolean;
    rate_limit_rpm: number;
    base_url: string | null;
    created_at: string;
}

export default function AIProvidersPage() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const response = await fetch('/api/admin/ai-providers');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setProviders(data.providers);
        } catch (error) {
            console.error('Error fetching providers:', error);
            toast.error('Failed to load AI providers');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (provider: AIProvider) => {
        setUpdating(provider.id);
        try {
            const response = await fetch('/api/admin/ai-providers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: provider.id,
                    isActive: !provider.is_active,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            toast.success(`Provider ${provider.is_active ? 'disabled' : 'enabled'}`);
            fetchProviders();
        } catch (error) {
            console.error('Error updating provider:', error);
            toast.error('Failed to update provider');
        } finally {
            setUpdating(null);
        }
    };

    const handleSetDefault = async (provider: AIProvider) => {
        setUpdating(provider.id);
        try {
            const response = await fetch('/api/admin/ai-providers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: provider.id,
                    isDefault: true,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            toast.success('Default provider updated');
            fetchProviders();
        } catch (error) {
            console.error('Error updating provider:', error);
            toast.error('Failed to update provider');
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">AI Providers</h1>
                <p className="text-muted-foreground">
                    Manage AI service providers and configurations
                </p>
            </div>

            {/* Providers Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {providers.length === 0 ? (
                    <Card className="glass-card col-span-full">
                        <CardContent className="p-12 text-center">
                            <Cpu className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No Providers</h3>
                            <p className="text-muted-foreground">
                                No AI providers configured. Add providers in the database.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    providers.map((provider) => (
                        <Card
                            key={provider.id}
                            className={`glass-card relative overflow-hidden ${provider.is_default ? 'border-green-500/50' : ''
                                }`}
                        >
                            {provider.is_default && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-bl-lg">
                                    Default
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${provider.is_active ? 'bg-green-500/10' : 'bg-red-500/10'
                                        }`}>
                                        <Cpu className={`w-5 h-5 ${provider.is_active ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                    </div>
                                    <div>
                                        <span className="text-lg">{provider.name}</span>
                                        <p className="text-sm font-normal text-muted-foreground">
                                            {provider.provider_type}
                                        </p>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <p className={`font-medium ${provider.is_active ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {provider.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Rate Limit</p>
                                        <p className="font-medium text-foreground">
                                            {provider.rate_limit_rpm} RPM
                                        </p>
                                    </div>
                                </div>

                                {provider.base_url && (
                                    <div className="text-sm">
                                        <p className="text-muted-foreground">Base URL</p>
                                        <p className="font-mono text-xs text-foreground truncate">
                                            {provider.base_url}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant={provider.is_active ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={() => handleToggleActive(provider)}
                                        disabled={updating === provider.id}
                                    >
                                        {provider.is_active ? (
                                            <>
                                                <X className="w-4 h-4 mr-1" />
                                                Disable
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 mr-1" />
                                                Enable
                                            </>
                                        )}
                                    </Button>
                                    {!provider.is_default && provider.is_active && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSetDefault(provider)}
                                            disabled={updating === provider.id}
                                        >
                                            <Activity className="w-4 h-4 mr-1" />
                                            Set Default
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
