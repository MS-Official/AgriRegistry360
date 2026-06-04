import express from 'express';
import { openG2PMappingMetadata } from '../docs/openG2PMapping.js';

export const openG2PRouter = express.Router();

openG2PRouter.get('/mapping', (req, res) => {
  res.json({
    success: true,
    message: 'OpenG2P mapping metadata retrieved successfully',
    data: openG2PMappingMetadata,
  });
});

