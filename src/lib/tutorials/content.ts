import { TutorialKey } from '@/contexts/tutorial-context';

export interface TutorialStep {
    title: string;
    description: string;
}

export interface TutorialContent {
    title: string;
    subtitle: string;
    steps: TutorialStep[];
}

export const tutorialContent: Record<TutorialKey, TutorialContent> = {
    dashboard: {
        title: 'Dashboard Overview',
        subtitle: 'Your command center for UPSC preparation',
        steps: [
            { title: 'Daily Progress', description: 'Track your study hours, notes created, and quizzes completed today.' },
            { title: 'Quick Actions', description: 'Use the cards to quickly access notes, quizzes, and current affairs.' },
            { title: 'Recent Activity', description: 'See your most recent study sessions and pick up where you left off.' },
            { title: 'Syllabus Coverage', description: 'Monitor how much of the UPSC syllabus you have covered.' },
        ],
    },
    notes: {
        title: 'Study Notes',
        subtitle: 'AI-generated comprehensive notes',
        steps: [
            { title: 'Browse Notes', description: 'View all your saved notes organized by subject and date.' },
            { title: 'Search & Filter', description: 'Use the search bar to find notes on specific topics.' },
            { title: 'Edit & Export', description: 'Click any note to edit it or export as PDF.' },
            { title: 'Create New', description: 'Click "New Note" to generate AI-powered study material on any topic.' },
        ],
    },
    'notes-new': {
        title: 'Create New Note',
        subtitle: 'Generate AI-powered study material',
        steps: [
            { title: 'Enter Topic', description: 'Type any UPSC-relevant topic in the input field.' },
            { title: 'Select Subject', description: 'Choose the GS paper or optional subject for better context.' },
            { title: 'Add Instructions', description: 'Optionally, specify focus areas like "include PYQs" or "add mnemonics".' },
            { title: 'Generate', description: 'Click Generate and wait for your comprehensive notes to be created.' },
        ],
    },
    quiz: {
        title: 'Practice Quizzes',
        subtitle: 'Test yourself with AI-generated MCQs',
        steps: [
            { title: 'Choose Mode', description: 'Select from Daily Practice, Topic-wise, or Mock Test modes.' },
            { title: 'Set Difficulty', description: 'Choose Easy, Medium, or Hard to match your preparation level.' },
            { title: 'Take the Quiz', description: 'Answer each question and get instant feedback with explanations.' },
            { title: 'Review Results', description: 'After completion, see detailed analytics and correct answers.' },
        ],
    },
    'current-affairs': {
        title: 'Current Affairs',
        subtitle: 'Stay updated with daily news analysis',
        steps: [
            { title: 'Daily Digest', description: 'Read today\'s curated news articles with UPSC relevance tags.' },
            { title: 'Categories', description: 'Filter by Polity, Economy, International, Science, Environment, etc.' },
            { title: 'Bookmark', description: 'Save important articles for revision before the exam.' },
            { title: 'Take Quiz', description: 'Test your understanding with a quick quiz on recently read articles.' },
        ],
    },
    videos: {
        title: 'Video Lectures',
        subtitle: 'AI-generated explainer videos',
        steps: [
            { title: 'Browse Library', description: 'View all generated video lectures by subject.' },
            { title: 'Watch & Learn', description: 'Click any video to play it with subtitles and controls.' },
            { title: 'Generate New', description: 'Enter a topic to create a new AI-generated video lecture.' },
            { title: 'Download', description: 'Download videos for offline viewing.' },
        ],
    },
    materials: {
        title: 'Study Materials',
        subtitle: 'Upload and manage your PDFs',
        steps: [
            { title: 'Upload PDFs', description: 'Drag and drop or click to upload your study materials.' },
            { title: 'Organize', description: 'Create folders and tag materials by subject.' },
            { title: 'Read & Annotate', description: 'Open any PDF to read, highlight, and add notes.' },
            { title: 'AI Summary', description: 'Generate AI summaries of lengthy documents.' },
        ],
    },
    planner: {
        title: 'Study Planner',
        subtitle: 'Plan your preparation schedule',
        steps: [
            { title: 'Set Goals', description: 'Define your target exam date and daily study hours.' },
            { title: 'Add Tasks', description: 'Create study tasks for each day with time allocations.' },
            { title: 'Track Progress', description: 'Mark tasks complete and see your adherence rate.' },
            { title: 'Adjust Plan', description: 'Drag and drop to reschedule tasks as needed.' },
        ],
    },
    bookmarks: {
        title: 'Bookmarks',
        subtitle: 'Your saved content for quick access',
        steps: [
            { title: 'View All', description: 'See all bookmarked notes, articles, and videos in one place.' },
            { title: 'Organize', description: 'Create collections to group related bookmarks.' },
            { title: 'Quick Revise', description: 'Use bookmarks for last-minute revision before exams.' },
            { title: 'Remove', description: 'Click the bookmark icon again to remove from saved.' },
        ],
    },
    'mind-maps': {
        title: 'Mind Maps',
        subtitle: 'Visualize topic connections',
        steps: [
            { title: 'Create New', description: 'Start a new mind map by entering a central topic.' },
            { title: 'Add Branches', description: 'Click the + button to add sub-topics and connections.' },
            { title: 'Customize', description: 'Change colors and styles to highlight important areas.' },
            { title: 'Export', description: 'Save your mind map as an image for revision.' },
        ],
    },
    revision: {
        title: 'Spaced Revision',
        subtitle: 'Smart revision using spaced repetition',
        steps: [
            { title: 'Due Today', description: 'See topics that are scheduled for revision today.' },
            { title: 'Rate Recall', description: 'After revising, rate how well you remembered (Easy/Hard/Forgot).' },
            { title: 'Algorithm', description: 'The system adjusts future revision dates based on your ratings.' },
            { title: 'Streak', description: 'Maintain a daily revision streak to build long-term memory.' },
        ],
    },
    profile: {
        title: 'Your Profile',
        subtitle: 'Manage your account and settings',
        steps: [
            { title: 'Edit Info', description: 'Update your name, email, and profile picture.' },
            { title: 'Subscription', description: 'View and manage your subscription plan.' },
            { title: 'Achievements', description: 'See your earned badges and milestones.' },
            { title: 'Preferences', description: 'Set notification preferences and theme options.' },
        ],
    },
    leaderboard: {
        title: 'Leaderboard',
        subtitle: 'Compete with fellow aspirants',
        steps: [
            { title: 'Rankings', description: 'See where you stand among all users this week.' },
            { title: 'Points', description: 'Earn points by completing quizzes, notes, and daily tasks.' },
            { title: 'Badges', description: 'View special badges earned by top performers.' },
            { title: 'Challenges', description: 'Participate in weekly challenges for bonus points.' },
        ],
    },
};
