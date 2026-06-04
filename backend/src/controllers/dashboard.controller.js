import * as dashboardService from '../services/dashboard.service.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const summary = await dashboardService.getDashboardSummary();

    res.json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
