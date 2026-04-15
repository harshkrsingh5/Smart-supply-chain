const { trucks } = require('../data/mockData');

function getTrucks(req, res) {
  try {
    const stats = {
      total: trucks.length,
      available: trucks.filter(t => t.status === 'Available').length,
      inTransit: trucks.filter(t => t.status === 'In Transit').length,
      maintenance: trucks.filter(t => t.status === 'Maintenance').length
    };

    res.json({ trucks, stats });
  } catch (err) {
    console.error('Get trucks error:', err);
    res.status(500).json({ error: 'Failed to fetch trucks.' });
  }
}

function addTruck(req, res) {
  try {
    const { truckNumber, driverName, truckType, capacity } = req.body;

    // Validate required fields
    if (!truckNumber || !driverName) {
      return res.status(400).json({ error: 'Truck number and driver name are required.' });
    }

    // Check for duplicate truck number
    const exists = trucks.find(t => t.truckNumber.toLowerCase() === truckNumber.toLowerCase());
    if (exists) {
      return res.status(409).json({ error: `Truck with number "${truckNumber}" already exists.` });
    }

    const newTruck = {
      id: `TRK_${String(trucks.length + 1).padStart(3, '0')}`,
      truckNumber: truckNumber.toUpperCase(),
      driverName,
      truckType: truckType || 'Medium',
      capacity: capacity || '5,000 kg',
      status: 'Available',
      addedAt: new Date().toISOString()
    };

    trucks.push(newTruck);
    res.status(201).json({ truck: newTruck, message: 'Truck added successfully!' });
  } catch (err) {
    console.error('Add truck error:', err);
    res.status(500).json({ error: 'Failed to add truck.' });
  }
}

function deleteTruck(req, res) {
  try {
    const { truckId } = req.params;
    const index = trucks.findIndex(t => t.id === truckId);
    if (index === -1) {
      return res.status(404).json({ error: 'Truck not found.' });
    }

    const removed = trucks.splice(index, 1)[0];
    res.json({ message: `Truck ${removed.truckNumber} removed.`, truck: removed });
  } catch (err) {
    console.error('Delete truck error:', err);
    res.status(500).json({ error: 'Failed to delete truck.' });
  }
}

function updateTruckStatus(req, res) {
  try {
    const { truckId } = req.params;
    const { status } = req.body;
    const truck = trucks.find(t => t.id === truckId);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found.' });
    }

    truck.status = status;
    res.json({ message: `Truck ${truck.truckNumber} status updated to "${status}".`, truck });
  } catch (err) {
    console.error('Update truck status error:', err);
    res.status(500).json({ error: 'Failed to update truck status.' });
  }
}

module.exports = { getTrucks, addTruck, deleteTruck, updateTruckStatus };
