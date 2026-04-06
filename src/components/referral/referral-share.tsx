'use client';

// ═══════════════════════════════════════════════════════════════
// REFERRAL SHARE COMPONENT
// Easy sharing of referral link
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';

interface ReferralShareProps {
    referralCode: string;
    referralCount?: number;
    rewardDays?: number;
}

export function ReferralShare({ referralCode, referralCount = 0, rewardDays = 0 }: ReferralShareProps) {
    const [copied, setCopied] = useState(false);

    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const text = `🎓 I'm preparing for UPSC with AI-powered notes and lectures! Join me on UPSC CSE Master and get 7 extra days free: ${referralLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareTelegram = () => {
        const text = `🎓 Join me on UPSC CSE Master - AI-powered UPSC preparation!`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareTwitter = () => {
        const text = `Preparing for UPSC with AI-powered notes and lectures! Try @UPSCMaster with 7 extra days free:`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank');
    };

    return (
        <div className="bg-gradient-to-r from-primary/10 to-purple-100 rounded-xl p-6">
            <div className="flex items-start gap-4">
                <span className="text-4xl">🎁</span>
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Invite Friends, Earn Rewards!</h3>
                    <p className="text-gray-600 mb-4">
                        Give friends 7 extra trial days. Get 7 free days when they sign up!
                    </p>

                    {/* Stats */}
                    <div className="flex gap-6 mb-4">
                        <div>
                            <p className="text-2xl font-bold text-primary">{referralCount}</p>
                            <p className="text-sm text-gray-500">Friends invited</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{rewardDays}</p>
                            <p className="text-sm text-gray-500">Free days earned</p>
                        </div>
                    </div>

                    {/* Referral Link */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={referralLink}
                            readOnly
                            className="flex-1 px-4 py-2 border rounded-lg bg-white text-sm"
                        />
                        <button
                            onClick={copyLink}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm whitespace-nowrap"
                        >
                            {copied ? '✓ Copied!' : 'Copy'}
                        </button>
                    </div>

                    {/* Share Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={shareWhatsApp}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
                        >
                            <span>📱</span> WhatsApp
                        </button>
                        <button
                            onClick={shareTelegram}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                        >
                            <span>✈️</span> Telegram
                        </button>
                        <button
                            onClick={shareTwitter}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
                        >
                            <span>🐦</span> Twitter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
