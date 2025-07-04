require('dotenv').config();
const express = require('express');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
const { setupMetrics } = require('./controllers/metricsController');
const metricsRoutes = require('./routes/metrics');

// Configuration
const PORT = process.env.PORT || 3007;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialisation des métriques Prometheus
setupMetrics();

// Middleware Prometheus pour collecter les métriques HTTP automatiquement
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project_name: 'metrics-service' },
  promClient: { collectDefaultMetrics: {} }
});
app.use(metricsMiddleware);

// Routes
app.use('/api/metrics', metricsRoutes);

// Route pour les métriques Prometheus (exposée pour être scrapée)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end(promBundle.promClient.register.metrics());
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'metrics-service' });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    service: 'Metrics Service',
    status: 'running',
    endpoints: {
      metrics: '/metrics',
      health: '/health',
      api: '/api/metrics'
    }
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🔍 Service de métriques démarré sur le port ${PORT}`);
  console.log(`📊 Métriques Prometheus disponibles sur http://localhost:${PORT}/metrics`);
}); 