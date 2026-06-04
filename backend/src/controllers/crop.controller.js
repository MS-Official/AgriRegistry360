import * as cropService from '../services/crop.service.js';

export async function registerCrop(req, res, next) {
  try {
    const crop = await cropService.createCrop(req.body);
    res.status(201).json({
      success: true,
      message: 'Crop registered successfully',
      data: crop,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCrops(req, res, next) {
  try {
    const crops = await cropService.getCrops(req.query.search);
    res.json({
      success: true,
      message: 'Crops retrieved successfully',
      data: crops,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCropById(req, res, next) {
  try {
    const crop = await cropService.getCropById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found',
      });
    }

    return res.json({
      success: true,
      message: 'Crop retrieved successfully',
      data: crop,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCropsByFarmId(req, res, next) {
  try {
    const crops = await cropService.getCropsByFarm(req.params.farmId);
    res.json({
      success: true,
      message: 'Farm crops retrieved successfully',
      data: crops,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCropsByFarmerId(req, res, next) {
  try {
    const crops = await cropService.getCropsByFarmer(req.params.farmerId);
    res.json({
      success: true,
      message: 'Farmer crops retrieved successfully',
      data: crops,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCrop(req, res, next) {
  try {
    const crop = await cropService.updateCrop(req.params.id, req.body);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found',
      });
    }

    return res.json({
      success: true,
      message: 'Crop updated successfully',
      data: crop,
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyCrop(req, res, next) {
  try {
    const crop = await cropService.verifyCrop(req.params.id, req.body.verificationStatus);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found',
      });
    }

    return res.json({
      success: true,
      message: 'Crop verification status updated successfully',
      data: crop,
    });
  } catch (error) {
    return next(error);
  }
}

