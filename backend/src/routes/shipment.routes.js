const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getShipments, createShipment } = require('../controllers/shipment.controller');

router.get('/', verifyToken, getShipments);
router.post('/', verifyToken, createShipment);

module.exports = router;
