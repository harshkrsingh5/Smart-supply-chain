const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getAlerts, acknowledgeAlert } = require('../controllers/alert.controller');

router.get('/', verifyToken, getAlerts);
router.post('/ack', verifyToken, acknowledgeAlert);

module.exports = router;
