/**
 * Internationalization translations for UPSC CSE Master
 * Supports English and Hindi (हिंदी)
 */

export type Language = 'en' | 'hi';

export interface Translations {
    // Navigation
    nav: {
        dashboard: string;
        studyNotes: string;
        practiceQuiz: string;
        currentAffairs: string;
        profile: string;
        settings: string;
        signOut: string;
        backToApp: string;
    };

    // Common
    common: {
        loading: string;
        error: string;
        success: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        search: string;
        filter: string;
        generate: string;
        submit: string;
        retry: string;
        goBack: string;
        viewMore: string;
    };

    // Dashboard
    dashboard: {
        title: string;
        greeting: string;
        notesCreated: string;
        quizzesCompleted: string;
        studyStreak: string;
        quickActions: string;
        recentActivity: string;
        studyGoals: string;
        upcomingSchedule: string;
    };

    // Notes
    notes: {
        title: string;
        generateNotes: string;
        noNotes: string;
        topic: string;
        subject: string;
        summary: string;
        detailedNotes: string;
        keyPoints: string;
        upscRelevance: string;
        mnemonics: string;
        relatedTopics: string;
        sources: string;
    };

    // Quiz
    quiz: {
        title: string;
        generateQuiz: string;
        noQuizzes: string;
        difficulty: string;
        questions: string;
        timeLimit: string;
        startQuiz: string;
        submitQuiz: string;
        score: string;
        correct: string;
        incorrect: string;
        explanation: string;
    };

    // Current Affairs
    currentAffairs: {
        title: string;
        todayHighlights: string;
        category: string;
        viewCount: string;
        keyPoints: string;
        upscRelevance: string;
        pyqConnections: string;
    };

    // Profile
    profile: {
        title: string;
        subscription: string;
        statistics: string;
        achievements: string;
        preferences: string;
        accountSettings: string;
    };

    // Admin
    admin: {
        dashboard: string;
        users: string;
        aiProviders: string;
        features: string;
        leads: string;
        totalUsers: string;
        activeUsers: string;
        notesGenerated: string;
        quizzesCreated: string;
    };

    // Subscription Tiers
    tiers: {
        trial: string;
        basic: string;
        premium: string;
    };
}

export const translations: Record<Language, Translations> = {
    en: {
        nav: {
            dashboard: 'Dashboard',
            studyNotes: 'Study Notes',
            practiceQuiz: 'Practice Quiz',
            currentAffairs: 'Current Affairs',
            profile: 'Profile',
            settings: 'Settings',
            signOut: 'Sign Out',
            backToApp: 'Back to App',
        },
        common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            search: 'Search',
            filter: 'Filter',
            generate: 'Generate',
            submit: 'Submit',
            retry: 'Retry',
            goBack: 'Go Back',
            viewMore: 'View More',
        },
        dashboard: {
            title: 'Dashboard',
            greeting: 'Welcome back',
            notesCreated: 'Notes Created',
            quizzesCompleted: 'Quizzes Completed',
            studyStreak: 'Study Streak',
            quickActions: 'Quick Actions',
            recentActivity: 'Recent Activity',
            studyGoals: 'Study Goals',
            upcomingSchedule: 'Upcoming Schedule',
        },
        notes: {
            title: 'Study Notes',
            generateNotes: 'Generate Notes',
            noNotes: 'No notes yet',
            topic: 'Topic',
            subject: 'Subject',
            summary: 'Summary',
            detailedNotes: 'Detailed Notes',
            keyPoints: 'Key Points',
            upscRelevance: 'UPSC Relevance',
            mnemonics: 'Memory Tricks & Mnemonics',
            relatedTopics: 'Related Topics',
            sources: 'Standard Sources',
        },
        quiz: {
            title: 'Practice Quiz',
            generateQuiz: 'Generate Quiz',
            noQuizzes: 'No quizzes yet',
            difficulty: 'Difficulty',
            questions: 'Questions',
            timeLimit: 'Time Limit',
            startQuiz: 'Start Quiz',
            submitQuiz: 'Submit Quiz',
            score: 'Score',
            correct: 'Correct',
            incorrect: 'Incorrect',
            explanation: 'Explanation',
        },
        currentAffairs: {
            title: 'Current Affairs',
            todayHighlights: "Today's Highlights",
            category: 'Category',
            viewCount: 'Views',
            keyPoints: 'Key Points',
            upscRelevance: 'UPSC Relevance',
            pyqConnections: 'Previous Year Question Connections',
        },
        profile: {
            title: 'Profile',
            subscription: 'Subscription',
            statistics: 'Statistics',
            achievements: 'Achievements',
            preferences: 'Preferences',
            accountSettings: 'Account Settings',
        },
        admin: {
            dashboard: 'Admin Dashboard',
            users: 'Users',
            aiProviders: 'AI Providers',
            features: 'Features',
            leads: 'Leads',
            totalUsers: 'Total Users',
            activeUsers: 'Active Users',
            notesGenerated: 'Notes Generated',
            quizzesCreated: 'Quizzes Created',
        },
        tiers: {
            trial: 'Trial',
            basic: 'Basic',
            premium: 'Premium',
        },
    },
    hi: {
        nav: {
            dashboard: 'डैशबोर्ड',
            studyNotes: 'अध्ययन नोट्स',
            practiceQuiz: 'अभ्यास प्रश्नोत्तरी',
            currentAffairs: 'करंट अफेयर्स',
            profile: 'प्रोफ़ाइल',
            settings: 'सेटिंग्स',
            signOut: 'साइन आउट',
            backToApp: 'ऐप पर वापस जाएं',
        },
        common: {
            loading: 'लोड हो रहा है...',
            error: 'त्रुटि',
            success: 'सफलता',
            save: 'सेव करें',
            cancel: 'रद्द करें',
            delete: 'हटाएं',
            edit: 'संपादित करें',
            search: 'खोजें',
            filter: 'फ़िल्टर',
            generate: 'उत्पन्न करें',
            submit: 'जमा करें',
            retry: 'पुनः प्रयास करें',
            goBack: 'वापस जाएं',
            viewMore: 'और देखें',
        },
        dashboard: {
            title: 'डैशबोर्ड',
            greeting: 'स्वागत है',
            notesCreated: 'बनाए गए नोट्स',
            quizzesCompleted: 'पूर्ण प्रश्नोत्तरी',
            studyStreak: 'अध्ययन स्ट्रीक',
            quickActions: 'त्वरित कार्य',
            recentActivity: 'हाल की गतिविधि',
            studyGoals: 'अध्ययन लक्ष्य',
            upcomingSchedule: 'आगामी कार्यक्रम',
        },
        notes: {
            title: 'अध्ययन नोट्स',
            generateNotes: 'नोट्स बनाएं',
            noNotes: 'अभी कोई नोट्स नहीं',
            topic: 'विषय',
            subject: 'विषय',
            summary: 'सारांश',
            detailedNotes: 'विस्तृत नोट्स',
            keyPoints: 'मुख्य बिंदु',
            upscRelevance: 'यूपीएससी प्रासंगिकता',
            mnemonics: 'स्मरण युक्तियाँ',
            relatedTopics: 'संबंधित विषय',
            sources: 'मानक स्रोत',
        },
        quiz: {
            title: 'अभ्यास प्रश्नोत्तरी',
            generateQuiz: 'प्रश्नोत्तरी बनाएं',
            noQuizzes: 'अभी कोई प्रश्नोत्तरी नहीं',
            difficulty: 'कठिनाई',
            questions: 'प्रश्न',
            timeLimit: 'समय सीमा',
            startQuiz: 'प्रश्नोत्तरी शुरू करें',
            submitQuiz: 'प्रश्नोत्तरी जमा करें',
            score: 'स्कोर',
            correct: 'सही',
            incorrect: 'गलत',
            explanation: 'स्पष्टीकरण',
        },
        currentAffairs: {
            title: 'करंट अफेयर्स',
            todayHighlights: 'आज की मुख्य बातें',
            category: 'श्रेणी',
            viewCount: 'व्यूज',
            keyPoints: 'मुख्य बिंदु',
            upscRelevance: 'यूपीएससी प्रासंगिकता',
            pyqConnections: 'पिछले वर्ष के प्रश्न कनेक्शन',
        },
        profile: {
            title: 'प्रोफ़ाइल',
            subscription: 'सब्सक्रिप्शन',
            statistics: 'आंकड़े',
            achievements: 'उपलब्धियां',
            preferences: 'प्राथमिकताएं',
            accountSettings: 'खाता सेटिंग्स',
        },
        admin: {
            dashboard: 'एडमिन डैशबोर्ड',
            users: 'उपयोगकर्ता',
            aiProviders: 'एआई प्रोवाइडर',
            features: 'फीचर्स',
            leads: 'लीड्स',
            totalUsers: 'कुल उपयोगकर्ता',
            activeUsers: 'सक्रिय उपयोगकर्ता',
            notesGenerated: 'बनाए गए नोट्स',
            quizzesCreated: 'बनाई गई प्रश्नोत्तरी',
        },
        tiers: {
            trial: 'ट्रायल',
            basic: 'बेसिक',
            premium: 'प्रीमियम',
        },
    },
};

export function getTranslation(lang: Language): Translations {
    return translations[lang] || translations.en;
}
