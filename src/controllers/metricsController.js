const promClient = require('prom-client');
const winston = require('winston');

// Configuration du logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/metrics.log' })
  ]
});

// Registre Prometheus
const register = new promClient.Registry();

// Métriques personnalisées
let serviceCounters = {};
let serviceGauges = {};
let serviceHistograms = {};

/**
 * Initialise les métriques Prometheus
 */
const setupMetrics = () => {
  // Collecter les métriques par défaut
  promClient.collectDefaultMetrics({ register });
  
  logger.info('Métriques Prometheus initialisées');
};

/**
 * Crée ou récupère un compteur
 */
const getCounter = (name, help, labelNames = []) => {
  if (!serviceCounters[name]) {
    serviceCounters[name] = new promClient.Counter({
      name,
      help,
      labelNames,
      registers: [register]
    });
    logger.info(`Compteur créé: ${name}`);
  }
  return serviceCounters[name];
};

/**
 * Crée ou récupère une jauge
 */
const getGauge = (name, help, labelNames = []) => {
  if (!serviceGauges[name]) {
    serviceGauges[name] = new promClient.Gauge({
      name,
      help,
      labelNames,
      registers: [register]
    });
    logger.info(`Jauge créée: ${name}`);
  }
  return serviceGauges[name];
};

/**
 * Crée ou récupère un histogramme
 */
const getHistogram = (name, help, labelNames = [], buckets = [0.1, 0.5, 1, 2, 5]) => {
  if (!serviceHistograms[name]) {
    serviceHistograms[name] = new promClient.Histogram({
      name,
      help,
      labelNames,
      buckets,
      registers: [register]
    });
    logger.info(`Histogramme créé: ${name}`);
  }
  return serviceHistograms[name];
};

/**
 * Enregistre une métrique de compteur
 */
const incrementCounter = (req, res) => {
  try {
    const { name, help, labels = {}, value = 1 } = req.body;
    
    if (!name || !help) {
      return res.status(400).json({ error: 'Les champs name et help sont requis' });
    }
    
    const labelNames = Object.keys(labels);
    const counter = getCounter(name, help, labelNames);
    
    counter.inc(labels, value);
    
    logger.info(`Compteur incrémenté: ${name}`, { labels, value });
    res.status(200).json({ success: true, message: `Compteur ${name} incrémenté` });
  } catch (error) {
    logger.error('Erreur lors de l\'incrémentation du compteur', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la métrique' });
  }
};

/**
 * Enregistre une métrique de jauge
 */
const setGauge = (req, res) => {
  try {
    const { name, help, labels = {}, value } = req.body;
    
    if (!name || !help || value === undefined) {
      return res.status(400).json({ error: 'Les champs name, help et value sont requis' });
    }
    
    const labelNames = Object.keys(labels);
    const gauge = getGauge(name, help, labelNames);
    
    gauge.set(labels, value);
    
    logger.info(`Jauge définie: ${name}`, { labels, value });
    res.status(200).json({ success: true, message: `Jauge ${name} définie à ${value}` });
  } catch (error) {
    logger.error('Erreur lors de la définition de la jauge', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la métrique' });
  }
};

/**
 * Enregistre une métrique d'histogramme
 */
const observeHistogram = (req, res) => {
  try {
    const { name, help, labels = {}, value, buckets } = req.body;
    
    if (!name || !help || value === undefined) {
      return res.status(400).json({ error: 'Les champs name, help et value sont requis' });
    }
    
    const labelNames = Object.keys(labels);
    const histogram = getHistogram(name, help, labelNames, buckets);
    
    histogram.observe(labels, value);
    
    logger.info(`Histogramme observé: ${name}`, { labels, value });
    res.status(200).json({ success: true, message: `Histogramme ${name} observé avec la valeur ${value}` });
  } catch (error) {
    logger.error('Erreur lors de l\'observation de l\'histogramme', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la métrique' });
  }
};

/**
 * Récupère toutes les métriques
 */
const getAllMetrics = (req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    res.end(register.metrics());
  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des métriques' });
  }
};

module.exports = {
  setupMetrics,
  incrementCounter,
  setGauge,
  observeHistogram,
  getAllMetrics,
  register
}; 