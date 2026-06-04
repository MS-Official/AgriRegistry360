const okResponse = {
  description: 'Successful response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/SuccessResponse' },
    },
  },
};

const errorResponse = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

function listOperation(tag, summary, description = summary) {
  return {
    tags: [tag],
    summary,
    description,
    parameters: [{ $ref: '#/components/parameters/SearchQuery' }],
    responses: { 200: okResponse, 500: errorResponse },
  };
}

function getByIdOperation(tag, summary, parameterName = 'id') {
  return {
    tags: [tag],
    summary,
    parameters: [{ $ref: `#/components/parameters/${parameterName}` }],
    responses: { 200: okResponse, 400: errorResponse, 404: errorResponse, 500: errorResponse },
  };
}

function postOperation(tag, summary, schemaName) {
  return {
    tags: [tag],
    summary,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    },
    responses: { 201: okResponse, 400: errorResponse, 404: errorResponse, 409: errorResponse, 500: errorResponse },
  };
}

function patchOperation(tag, summary, schemaName) {
  return {
    tags: [tag],
    summary,
    parameters: [{ $ref: '#/components/parameters/id' }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    },
    responses: { 200: okResponse, 400: errorResponse, 404: errorResponse, 500: errorResponse },
  };
}

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AgriRegistry360 Farm Registry API',
    version: '1.0.0',
    description:
      'AgriRegistry360 API for Farmer Registry, Farm/Land Registry, Crop Registry, Eligibility Check, Program Enrollment, and Odoo-style Inventory Reservation. Prepared for future WSO2 API Manager publishing.',
  },
  servers: [{ url: 'http://localhost:5001', description: 'Local AgriRegistry360 backend' }],
  tags: [
    { name: 'Health', description: 'API health and metadata endpoints' },
    { name: 'Farmer Registry', description: 'Farmer registry APIs' },
    { name: 'Farm / Land Registry', description: 'Farm and land registry APIs' },
    { name: 'Crop Registry', description: 'Crop registry APIs' },
    { name: 'Eligibility Check', description: 'Eligibility check APIs' },
    { name: 'Program Enrollment', description: 'Program enrollment APIs' },
    { name: 'Odoo Inventory Reservation', description: 'Simulated Odoo inventory APIs' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Get API health status',
        responses: { 200: okResponse },
      },
    },
    '/api/catalog': {
      get: {
        tags: ['Health'],
        summary: 'Get WSO2-ready API catalog metadata',
        responses: { 200: okResponse },
      },
    },
    '/api/farmers/register': { post: postOperation('Farmer Registry', 'Register farmer', 'FarmerRegisterRequest') },
    '/api/farmers': { get: listOperation('Farmer Registry', 'List and search farmers') },
    '/api/farmers/{id}': {
      get: getByIdOperation('Farmer Registry', 'Get farmer by ID'),
      put: postOperation('Farmer Registry', 'Update farmer', 'FarmerRegisterRequest'),
    },
    '/api/farmers/{id}/verify': { patch: patchOperation('Farmer Registry', 'Verify or reject farmer', 'VerificationRequest') },
    '/api/farms/register': { post: postOperation('Farm / Land Registry', 'Register farm or land record', 'FarmRegisterRequest') },
    '/api/farms': { get: listOperation('Farm / Land Registry', 'List and search farms') },
    '/api/farms/{id}': {
      get: getByIdOperation('Farm / Land Registry', 'Get farm by ID'),
      put: postOperation('Farm / Land Registry', 'Update farm', 'FarmRegisterRequest'),
    },
    '/api/farmers/{farmerId}/farms': { get: getByIdOperation('Farm / Land Registry', 'Get farms by farmer', 'farmerId') },
    '/api/farms/{id}/verify': { patch: patchOperation('Farm / Land Registry', 'Verify or reject farm', 'VerificationRequest') },
    '/api/crops/register': { post: postOperation('Crop Registry', 'Register crop', 'CropRegisterRequest') },
    '/api/crops': { get: listOperation('Crop Registry', 'List and search crops') },
    '/api/crops/{id}': {
      get: getByIdOperation('Crop Registry', 'Get crop by ID'),
      put: postOperation('Crop Registry', 'Update crop', 'CropRegisterRequest'),
    },
    '/api/farms/{farmId}/crops': { get: getByIdOperation('Crop Registry', 'Get crops by farm', 'farmId') },
    '/api/farmers/{farmerId}/crops': { get: getByIdOperation('Crop Registry', 'Get crops by farmer', 'farmerId') },
    '/api/crops/{id}/verify': { patch: patchOperation('Crop Registry', 'Verify or reject crop', 'VerificationRequest') },
    '/api/eligibility/check': { post: postOperation('Eligibility Check', 'Run eligibility check', 'EligibilityCheckRequest') },
    '/api/eligibility': { get: listOperation('Eligibility Check', 'List and search eligibility checks') },
    '/api/eligibility/{id}': { get: getByIdOperation('Eligibility Check', 'Get eligibility check by ID') },
    '/api/farmers/{farmerId}/eligibility': { get: getByIdOperation('Eligibility Check', 'Get eligibility checks by farmer', 'farmerId') },
    '/api/farms/{farmId}/eligibility': { get: getByIdOperation('Eligibility Check', 'Get eligibility checks by farm', 'farmId') },
    '/api/crops/{cropId}/eligibility': { get: getByIdOperation('Eligibility Check', 'Get eligibility checks by crop', 'cropId') },
    '/api/enrollments': {
      post: postOperation('Program Enrollment', 'Create program enrollment', 'EnrollmentCreateRequest'),
      get: listOperation('Program Enrollment', 'List and search enrollments'),
    },
    '/api/enrollments/{id}': { get: getByIdOperation('Program Enrollment', 'Get enrollment by ID') },
    '/api/farmers/{farmerId}/enrollments': { get: getByIdOperation('Program Enrollment', 'Get enrollments by farmer', 'farmerId') },
    '/api/farms/{farmId}/enrollments': { get: getByIdOperation('Program Enrollment', 'Get enrollments by farm', 'farmId') },
    '/api/crops/{cropId}/enrollments': { get: getByIdOperation('Program Enrollment', 'Get enrollments by crop', 'cropId') },
    '/api/eligibility/{eligibilityId}/enrollments': { get: getByIdOperation('Program Enrollment', 'Get enrollments by eligibility', 'eligibilityId') },
    '/api/enrollments/{id}/approval': { patch: patchOperation('Program Enrollment', 'Update enrollment approval', 'ApprovalRequest') },
    '/api/enrollments/{id}/cancel': { patch: patchOperation('Program Enrollment', 'Cancel enrollment', 'NotesRequest') },
    '/api/odoo/inventory/items': { get: listOperation('Odoo Inventory Reservation', 'List inventory items') },
    '/api/odoo/inventory/items/{id}': { get: getByIdOperation('Odoo Inventory Reservation', 'Get inventory item by ID') },
    '/api/odoo/inventory/reserve': { post: postOperation('Odoo Inventory Reservation', 'Reserve inventory for approved enrollment', 'InventoryReserveRequest') },
    '/api/odoo/inventory/reservations': { get: listOperation('Odoo Inventory Reservation', 'List and search inventory reservations') },
    '/api/odoo/inventory/reservations/{id}': { get: getByIdOperation('Odoo Inventory Reservation', 'Get reservation by ID') },
    '/api/enrollments/{enrollmentId}/reservations': { get: getByIdOperation('Odoo Inventory Reservation', 'Get reservations by enrollment', 'enrollmentId') },
    '/api/farmers/{farmerId}/reservations': { get: getByIdOperation('Odoo Inventory Reservation', 'Get reservations by farmer', 'farmerId') },
    '/api/farms/{farmId}/reservations': { get: getByIdOperation('Odoo Inventory Reservation', 'Get reservations by farm', 'farmId') },
    '/api/crops/{cropId}/reservations': { get: getByIdOperation('Odoo Inventory Reservation', 'Get reservations by crop', 'cropId') },
    '/api/odoo/inventory/reservations/{id}/cancel': { patch: patchOperation('Odoo Inventory Reservation', 'Cancel reservation', 'NotesRequest') },
    '/api/odoo/inventory/reservations/{id}/issue': { patch: patchOperation('Odoo Inventory Reservation', 'Issue reservation', 'NotesRequest') },
  },
  components: {
    parameters: {
      id: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      farmerId: { name: 'farmerId', in: 'path', required: true, schema: { type: 'string' } },
      farmId: { name: 'farmId', in: 'path', required: true, schema: { type: 'string' } },
      cropId: { name: 'cropId', in: 'path', required: true, schema: { type: 'string' } },
      eligibilityId: { name: 'eligibilityId', in: 'path', required: true, schema: { type: 'string' } },
      enrollmentId: { name: 'enrollmentId', in: 'path', required: true, schema: { type: 'string' } },
      SearchQuery: { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true }, message: { type: 'string' }, data: {} },
      },
      ErrorResponse: {
        type: 'object',
        properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } },
      },
      FarmerRegisterRequest: {
        type: 'object',
        example: {
          fullName: 'Mohamed Ameen',
          nationalId: '901234567V',
          mobileNumber: '0771234567',
          district: 'Anuradhapura',
          gnDivision: 'Nochchiyagama',
          farmerType: 'SMALLHOLDER',
          registeredBy: 'Field Officer',
        },
      },
      FarmRegisterRequest: {
        type: 'object',
        example: {
          farmerId: 'EXISTING_FARMER_ID',
          landSize: 2.5,
          landSizeUnit: 'ACRES',
          ownershipType: 'OWNED',
          district: 'Anuradhapura',
          gnDivision: 'Nochchiyagama',
          soilType: 'LOAM',
          irrigationType: 'CANAL',
          farmStatus: 'ACTIVE',
          registeredBy: 'Field Officer',
        },
      },
      CropRegisterRequest: {
        type: 'object',
        example: {
          farmId: 'EXISTING_FARM_ID',
          cropType: 'PADDY',
          season: 'MAHA',
          seasonYear: 2026,
          cultivationArea: 2,
          cultivationAreaUnit: 'ACRES',
          plantingDate: '2026-06-01',
          expectedHarvestDate: '2026-09-20',
          expectedYield: 4500,
          expectedYieldUnit: 'KG',
          cropStatus: 'GROWING',
          registeredBy: 'Field Officer',
        },
      },
      VerificationRequest: { type: 'object', example: { verificationStatus: 'VERIFIED' } },
      EligibilityCheckRequest: {
        type: 'object',
        example: {
          farmerId: 'EXISTING_FARMER_ID',
          farmId: 'EXISTING_FARM_ID',
          cropId: 'EXISTING_CROP_ID',
          programCode: 'FERTILIZER_SUBSIDY_2026',
          checkedBy: 'Field Officer',
        },
      },
      EnrollmentCreateRequest: {
        type: 'object',
        example: {
          eligibilityId: 'EXISTING_ELIGIBLE_ELIGIBILITY_ID',
          enrolledBy: 'Field Officer',
          notes: 'Demo enrollment for fertilizer subsidy',
        },
      },
      ApprovalRequest: { type: 'object', example: { approvalStatus: 'APPROVED', notes: 'Approved for demo' } },
      NotesRequest: { type: 'object', example: { notes: 'Demo note' } },
      InventoryReserveRequest: {
        type: 'object',
        example: {
          enrollmentId: 'EXISTING_APPROVED_ENROLLMENT_ID',
          reservedBy: 'Field Officer',
          notes: 'Reserve fertilizer for approved enrollment',
        },
      },
    },
  },
};

