import * as enrollmentService from '../services/enrollment.service.js';

export async function enrollFarmer(req, res, next) {
  try {
    const enrollment = await enrollmentService.createEnrollment(req.body);
    res.status(201).json({
      success: true,
      message: 'Farmer enrolled successfully',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEnrollments(req, res, next) {
  try {
    const enrollments = await enrollmentService.getEnrollments(req.query.search);
    res.json({
      success: true,
      message: 'Enrollments retrieved successfully',
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEnrollmentById(req, res, next) {
  try {
    const enrollment = await enrollmentService.getEnrollmentById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    return res.json({
      success: true,
      message: 'Enrollment retrieved successfully',
      data: enrollment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getEnrollmentsByFarmerId(req, res, next) {
  try {
    const enrollments = await enrollmentService.getEnrollmentsByFarmer(req.params.farmerId);
    res.json({ success: true, message: 'Farmer enrollments retrieved successfully', data: enrollments });
  } catch (error) {
    next(error);
  }
}

export async function getEnrollmentsByFarmId(req, res, next) {
  try {
    const enrollments = await enrollmentService.getEnrollmentsByFarm(req.params.farmId);
    res.json({ success: true, message: 'Farm enrollments retrieved successfully', data: enrollments });
  } catch (error) {
    next(error);
  }
}

export async function getEnrollmentsByCropId(req, res, next) {
  try {
    const enrollments = await enrollmentService.getEnrollmentsByCrop(req.params.cropId);
    res.json({ success: true, message: 'Crop enrollments retrieved successfully', data: enrollments });
  } catch (error) {
    next(error);
  }
}

export async function getEnrollmentsByEligibilityId(req, res, next) {
  try {
    const enrollments = await enrollmentService.getEnrollmentsByEligibility(req.params.eligibilityId);
    res.json({
      success: true,
      message: 'Eligibility enrollments retrieved successfully',
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEnrollmentApproval(req, res, next) {
  try {
    const enrollment = await enrollmentService.updateEnrollmentApproval(
      req.params.id,
      req.body.approvalStatus,
      req.body.notes
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    return res.json({
      success: true,
      message: 'Enrollment approval status updated successfully',
      data: enrollment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function cancelEnrollment(req, res, next) {
  try {
    const enrollment = await enrollmentService.cancelEnrollment(req.params.id, req.body.notes);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    return res.json({
      success: true,
      message: 'Enrollment cancelled successfully',
      data: enrollment,
    });
  } catch (error) {
    return next(error);
  }
}

