import * as farmService from '../services/farm.service.js';

export async function registerFarm(req, res, next) {
  try {
    const farm = await farmService.createFarm(req.body);
    res.status(201).json({
      success: true,
      message: 'Farm/Land registered successfully',
      data: farm,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFarms(req, res, next) {
  try {
    const farms = await farmService.getFarms(req.query.search);
    res.json({
      success: true,
      message: 'Farms/Land records retrieved successfully',
      data: farms,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFarmById(req, res, next) {
  try {
    const farm = await farmService.getFarmById(req.params.id);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    return res.json({
      success: true,
      message: 'Farm/Land record retrieved successfully',
      data: farm,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getFarmsByFarmerId(req, res, next) {
  try {
    const farms = await farmService.getFarmsByFarmer(req.params.farmerId);
    res.json({
      success: true,
      message: 'Farmer farms/land records retrieved successfully',
      data: farms,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFarm(req, res, next) {
  try {
    const farm = await farmService.updateFarm(req.params.id, req.body);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    return res.json({
      success: true,
      message: 'Farm/Land record updated successfully',
      data: farm,
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyFarm(req, res, next) {
  try {
    const farm = await farmService.verifyFarm(req.params.id, req.body.verificationStatus);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    return res.json({
      success: true,
      message: 'Farm verification status updated successfully',
      data: farm,
    });
  } catch (error) {
    return next(error);
  }
}

