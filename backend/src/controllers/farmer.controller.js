import * as farmerService from '../services/farmer.service.js';

export async function registerFarmer(req, res, next) {
  try {
    const farmer = await farmerService.registerFarmer(req.body);
    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: farmer,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFarmers(req, res, next) {
  try {
    const farmers = await farmerService.getFarmers(req.query.search);
    res.json({
      success: true,
      message: 'Farmers retrieved successfully',
      data: farmers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFarmerById(req, res, next) {
  try {
    const farmer = await farmerService.getFarmerById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    return res.json({
      success: true,
      message: 'Farmer retrieved successfully',
      data: farmer,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateFarmer(req, res, next) {
  try {
    const farmer = await farmerService.updateFarmer(req.params.id, req.body);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    return res.json({
      success: true,
      message: 'Farmer updated successfully',
      data: farmer,
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyFarmer(req, res, next) {
  try {
    const farmer = await farmerService.updateFarmerVerification(
      req.params.id,
      req.body.verificationStatus
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    return res.json({
      success: true,
      message: 'Farmer verification status updated successfully',
      data: farmer,
    });
  } catch (error) {
    return next(error);
  }
}

