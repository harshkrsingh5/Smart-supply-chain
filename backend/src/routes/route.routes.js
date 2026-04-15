const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { generateRoute, getRoute, getTransport } = require('../controllers/route.controller');
router.post('/generate', verifyToken, generateRoute);
router.get('/:id', verifyToken, getRoute);
router.post('/transport', verifyToken, getTransport);
module.exports = router;
