'use client';

/**
 * BMAD Phase 4: Feature 6 - Video Shorts Library Browser
 * Browse pre-generated 60-second UPSC explainer videos
 * Like Unacademy's video library
 */

import React, { useState, useEffect } from 'react';
import { Video, Search, Filter, Clock, Eye, ThumbsUp, Download, Share2, Play, BookOpen, TrendingUp, Bookmark } from 'lucide-react';

interface VideoShort {
  id: string;
  title: string;
  topic: string;
  subject: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  views_count: number;
  likes_count: number;
  is_premium: boolean;
  seo_tags: string[];
  created_at: string;
}

interface ShortsLibraryProps {
  userId?: string;
  isPremium?: boolean;
}

export function ShortsLibrary({ userId, isPremium }: ShortsLibraryProps) {
  const [videos, setVideos] = useState<VideoShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'trending'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  const subjects = [
    { value: 'all', label: 'All Subjects', icon: '📚' },
    { value: 'GS1', label: 'GS1', icon: '🏛️' },
    { value: 'GS2', label: 'GS2', icon: '⚖️' },
    { value: 'GS3', label: 'GS3', icon: '💰' },
    { value: 'GS4', label: 'GS4', icon: '🤔' },
    { value: 'CSAT', label: 'CSAT', icon: '🧮' },
    { value: 'Essay', label: 'Essay', icon: '✍️' },
    { value: 'Current Affairs', label: 'Current Affairs', icon: '📰' },
  ];

  // Fetch video shorts library
  useEffect(() => {
    fetchVideos();
  }, [selectedSubject, sortBy]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') {
        params.set('subject', selectedSubject);
      }
      params.set('sort', sortBy);

      const response = await fetch(`/api/video/shorts/library?${params}`);
      const data = await response.json();

      if (data.success) {
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter videos by search query
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.seo_tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get subject icon
  const getSubjectIcon = (subject: string) => {
    const s = subjects.find((sub) => sub.value === subject);
    return s?.icon || '📹';
  };

  // Format views count
  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Video className="h-8 w-8 text-blue-600" />
              Video Shorts Library
            </h1>
            <p className="text-gray-600">
              {videos.length} snackable UPSC explainer videos for quick revision
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by topic, subject, or tags..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      {/* Subject Filters */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {subjects.map((subject) => (
            <button
              key={subject.value}
              onClick={() => setSelectedSubject(subject.value)}
              className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 transition-all ${
                selectedSubject === subject.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{subject.icon}</span>
              <span className="font-medium">{subject.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm text-gray-600">Sort by:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              sortBy === 'popular'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            Popular
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              sortBy === 'recent'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="h-4 w-4" />
            Recent
          </button>
          <button
            onClick={() => setSortBy('trending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              sortBy === 'trending'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Trending
          </button>
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="aspect-[9/16] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16">
          <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No videos found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : 'Be the first to generate a video short!'}
          </p>
          <a
            href="/dashboard/video-shorts/generate"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Video className="h-5 w-5" />
            Generate Video
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              userId={userId}
              isPremium={isPremium}
              formatViews={formatViews}
              formatDate={formatDate}
              getSubjectIcon={getSubjectIcon}
            />
          ))}
        </div>
      )}

      {/* Premium CTA */}
      {!isPremium && (
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">🌟 Upgrade to Premium</h3>
          <p className="mb-6 opacity-90">
            Get unlimited video generation, download access, and exclusive content
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckIcon /> Unlimited Generation
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon /> Download Videos
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon /> No Watermark
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon /> Priority Rendering
            </div>
          </div>
          <button className="mt-6 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Upgrade Now - ₹499/month
          </button>
        </div>
      )}
    </div>
  );
}

// Video Card Component
function VideoCard({
  video,
  userId,
  isPremium,
  formatViews,
  formatDate,
  getSubjectIcon,
}: {
  video: VideoShort;
  userId?: string;
  isPremium?: boolean;
  formatViews: (n: number) => string;
  formatDate: (s: string) => string;
  getSubjectIcon: (s: string) => string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Thumbnail */}
      <div className="aspect-[9/16] relative bg-gray-900 overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Video className="h-16 w-16 text-white opacity-50" />
          </div>
        )}

        {/* Play Button Overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Play className="h-8 w-8 text-blue-600 ml-1" />
          </div>
        </button>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-xs rounded">
          0:{video.duration_seconds.toString().padStart(2, '0')}
        </div>

        {/* Subject Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
          <span>{getSubjectIcon(video.subject)}</span>
          <span>{video.subject}</span>
        </div>

        {/* Premium Badge */}
        {video.is_premium && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold">
            ⭐ Premium
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {video.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {video.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {video.seo_tags?.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViews(video.views_count)}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {video.likes_count}
            </span>
          </div>
          <span>{formatDate(video.created_at)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-1">
            <Play className="h-4 w-4" />
            Watch
          </button>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 border rounded-lg transition-colors ${
              isBookmarked
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Bookmark className="h-4 w-4" />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Download - Premium Only */}
        {isPremium ? (
          <button className="w-full mt-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-1">
            <Download className="h-4 w-4" />
            Download
          </button>
        ) : (
          <button
            disabled
            className="w-full mt-2 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm font-medium flex items-center justify-center gap-1 cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Premium
          </button>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
