const express = require('express');
const { 
  incrementCounter, 
  setGauge, 
  observeHistogram, 
  getAllMetrics 
} = require('../controllers/metricsController');
const router = express.Router();

router.post('/counter', incrementCounter);
router.post('/gauge', setGauge);
router.post('/histogram', observeHistogram);
router.get('/', getAllMetrics);

module.exports = router; 