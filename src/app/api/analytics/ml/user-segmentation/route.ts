/**
 * ML Analytics API - User Segmentation
 * Get user segmentation and targeting data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSegmentationService } from '@/lib/analytics/user-segmentation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const bulk = searchParams.get('bulk') === 'true';

    const service = getUserSegmentationService();

    if (userId) {
      // Get segmentation for specific user
      const segment = await service.getUserSegment(userId);
      const targeting = await service.getTargetingStrategy(userId);

      return NextResponse.json({
        success: true,
        data: {
          segment: segment.segment,
          scores: {
            engagement: segment.engagementScore,
            value: segment.valueScore,
            churn: segment.churnScore,
          },
          targeting,
        },
      });
    }

    if (bulk) {
      // Get bulk segmentation
      const bulkSegments = await service.getBulkSegmentation();

      // Summarize for performance
      const segmentCounts: Record<string, number> = {};
      for (const data of Object.values(bulkSegments)) {
        segmentCounts[data.segment] = (segmentCounts[data.segment] || 0) + 1;
      }

      return NextResponse.json({
        success: true,
        data: {
          totalUsers: Object.keys(bulkSegments).length,
          segmentDistribution: segmentCounts,
          sample: Object.entries(bulkSegments).slice(0, 10).map(([userId, data]) => ({
            userId,
            segment: data.segment,
            engagementScore: data.engagementScore,
            valueScore: data.valueScore,
          })),
        },
      });
    }

    // Default: return summary
    const bulkSegments = await service.getBulkSegmentation();
    const segmentCounts: Record<string, number> = {};

    for (const data of Object.values(bulkSegments)) {
      segmentCounts[data.segment] = (segmentCounts[data.segment] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: Object.keys(bulkSegments).length,
        segmentDistribution: segmentCounts,
      },
    });
  } catch (error) {
    console.error('Error in user segmentation API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user segmentation' },
      { status: 500 }
    );
  }
}
