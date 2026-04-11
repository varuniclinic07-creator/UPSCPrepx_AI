/**
 * ML Analytics API - Cost Optimization
 * Get cost analysis, provider efficiency, and optimization recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCostOptimizationService } from '@/lib/analytics/cost-optimization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'summary';

    const service = getCostOptimizationService();

    if (userId) {
      // User-specific cost analysis
      if (type === 'analysis') {
        const analysis = await service.analyzeUserCost(userId);
        return NextResponse.json({
          success: true,
          data: analysis,
        });
      }

      if (type === 'budget') {
        const optimization = await service.getBudgetOptimization(userId);
        return NextResponse.json({
          success: true,
          data: optimization,
        });
      }

      // Default: return all user cost data
      const [analysis, optimization] = await Promise.all([
        service.analyzeUserCost(userId),
        service.getBudgetOptimization(userId),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          analysis,
          optimization,
        },
      });
    }

    // Global/Platform analytics
    if (type === 'providers') {
      const periodDays = parseInt(searchParams.get('period') || '30');
      const providers = await service.analyzeProviderCosts(periodDays);
      return NextResponse.json({
        success: true,
        data: providers,
      });
    }

    if (type === 'efficiency') {
      const periodDays = parseInt(searchParams.get('period') || '30');
      const efficiency = await service.getProviderEfficiencyReport(periodDays);
      return NextResponse.json({
        success: true,
        data: efficiency,
      });
    }

    if (type === 'recommendations') {
      const periodDays = parseInt(searchParams.get('period') || '30');
      const recommendations = await service.getGlobalRecommendations(periodDays);
      return NextResponse.json({
        success: true,
        data: recommendations,
      });
    }

    // Default: return summary
    const periodDays = parseInt(searchParams.get('period') || '30');
    const [providers, efficiency, recommendations] = await Promise.all([
      service.analyzeProviderCosts(periodDays),
      service.getProviderEfficiencyReport(periodDays),
      service.getGlobalRecommendations(periodDays),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        providers,
        efficiency,
        recommendations,
      },
    });
  } catch (error) {
    console.error('Error in cost optimization API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cost optimization data' },
      { status: 500 }
    );
  }
}
