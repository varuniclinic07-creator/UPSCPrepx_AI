'use client';

import { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Eye, EyeOff, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

interface Feature {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    is_enabled: boolean;
    is_visible: boolean;
    min_tier: 'trial' | 'basic' | 'premium';
    sort_order: number;
}

const tierColors = {
    trial: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    basic: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    premium: 'bg-green-500/10 text-green-500 border-green-500/20',
};

export default function FeaturesPage() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const response = await fetch('/api/admin/features');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setFeatures(data.features);
        } catch (error) {
            console.error('Error fetching features:', error);
            toast.error('Failed to load features');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (feature: Feature, field: 'isEnabled' | 'isVisible') => {
        setUpdating(feature.id);
        try {
            const updates: Record<string, boolean> = {};
            updates[field] = field === 'isEnabled' ? !feature.is_enabled : !feature.is_visible;

            const response = await fetch('/api/admin/features', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureId: feature.id,
                    ...updates,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            toast.success('Feature updated');
            fetchFeatures();
        } catch (error) {
            console.error('Error updating feature:', error);
            toast.error('Failed to update feature');
        } finally {
            setUpdating(null);
        }
    };

    const handleUpdateTier = async (feature: Feature, minTier: string) => {
        setUpdating(feature.id);
        try {
            const response = await fetch('/api/admin/features', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureId: feature.id,
                    minTier,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            toast.success('Tier requirement updated');
            fetchFeatures();
        } catch (error) {
            console.error('Error updating feature:', error);
            toast.error('Failed to update feature');
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
                <h1 className="text-2xl font-bold text-foreground">Feature Management</h1>
                <p className="text-muted-foreground">
                    Enable/disable features and set tier requirements
                </p>
            </div>

            {/* Features List */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                    {features.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ToggleLeft className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No features configured</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {features.map((feature) => (
                                <div
                                    key={feature.id}
                                    className={`p-4 rounded-xl border ${feature.is_enabled
                                            ? 'border-green-500/20 bg-green-500/5'
                                            : 'border-border bg-accent/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-foreground">
                                                    {feature.display_name}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${tierColors[feature.min_tier]}`}>
                                                    <Crown className="w-3 h-3 inline mr-1" />
                                                    {feature.min_tier}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {feature.description || feature.name}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Visibility Toggle */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggle(feature, 'isVisible')}
                                                disabled={updating === feature.id}
                                                className={feature.is_visible ? 'text-foreground' : 'text-muted-foreground'}
                                            >
                                                {feature.is_visible ? (
                                                    <Eye className="w-4 h-4" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4" />
                                                )}
                                            </Button>

                                            {/* Enable Toggle */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggle(feature, 'isEnabled')}
                                                disabled={updating === feature.id}
                                                className={feature.is_enabled ? 'text-green-500' : 'text-red-500'}
                                            >
                                                {feature.is_enabled ? (
                                                    <ToggleRight className="w-6 h-6" />
                                                ) : (
                                                    <ToggleLeft className="w-6 h-6" />
                                                )}
                                            </Button>

                                            {/* Tier Select */}
                                            <select
                                                value={feature.min_tier}
                                                onChange={(e) => handleUpdateTier(feature, e.target.value)}
                                                disabled={updating === feature.id}
                                                className="px-2 py-1 text-xs rounded-lg border border-border bg-background"
                                            >
                                                <option value="trial">Trial</option>
                                                <option value="basic">Basic</option>
                                                <option value="premium">Premium</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
