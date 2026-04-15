const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getMonitorData } = require('../controllers/monitoring.controller');

router.get('/:routeId', verifyToken, getMonitorData);

module.exports = router;
