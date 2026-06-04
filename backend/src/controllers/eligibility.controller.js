import * as eligibilityService from '../services/eligibility.service.js';

export async function checkEligibility(req, res, next) {
  try {
    const eligibility = await eligibilityService.checkEligibility(req.body);
    res.status(201).json({
      success: true,
      message: 'Eligibility check completed',
      data: eligibility,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEligibilityChecks(req, res, next) {
  try {
    const eligibilityChecks = await eligibilityService.getEligibilityChecks(req.query.search);
    res.json({
      success: true,
      message: 'Eligibility checks retrieved successfully',
      data: eligibilityChecks,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEligibilityById(req, res, next) {
  try {
    const eligibility = await eligibilityService.getEligibilityById(req.params.id);

    if (!eligibility) {
      return res.status(404).json({
        success: false,
        message: 'Eligibility check not found',
      });
    }

    return res.json({
      success: true,
      message: 'Eligibility check retrieved successfully',
      data: eligibility,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getEligibilityByFarmerId(req, res, next) {
  try {
    const eligibilityChecks = await eligibilityService.getEligibilityByFarmer(req.params.farmerId);
    res.json({
      success: true,
      message: 'Farmer eligibility checks retrieved successfully',
      data: eligibilityChecks,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEligibilityByFarmId(req, res, next) {
  try {
    const eligibilityChecks = await eligibilityService.getEligibilityByFarm(req.params.farmId);
    res.json({
      success: true,
      message: 'Farm eligibility checks retrieved successfully',
      data: eligibilityChecks,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEligibilityByCropId(req, res, next) {
  try {
    const eligibilityChecks = await eligibilityService.getEligibilityByCrop(req.params.cropId);
    res.json({
      success: true,
      message: 'Crop eligibility checks retrieved successfully',
      data: eligibilityChecks,
    });
  } catch (error) {
    next(error);
  }
}

