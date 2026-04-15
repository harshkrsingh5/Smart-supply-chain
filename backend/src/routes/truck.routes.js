const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getTrucks, addTruck, deleteTruck, updateTruckStatus } = require('../controllers/truck.controller');

router.get('/', verifyToken, getTrucks);
router.post('/', verifyToken, addTruck);
router.delete('/:truckId', verifyToken, deleteTruck);
router.patch('/:truckId/status', verifyToken, updateTruckStatus);

module.exports = router;
