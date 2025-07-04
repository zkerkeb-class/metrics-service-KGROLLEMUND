# Service de Métriques

Ce service est responsable de la collecte, du stockage et de la visualisation des métriques provenant de tous les autres microservices de l'application.

## Fonctionnalités

- Collecte de métriques en temps réel des différents microservices
- Exposition des métriques au format Prometheus
- Visualisation des métriques via Grafana
- API REST pour l'enregistrement de métriques personnalisées

## Prérequis

- Node.js v14+
- Docker et Docker Compose
- Les autres microservices de l'application configurés pour exposer leurs métriques

## Installation

1. Cloner le dépôt
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Créer un fichier `.env` basé sur `.env.example`
4. Démarrer le service :
   ```bash
   npm run dev
   ```

## Déploiement de Prometheus et Grafana

```bash
docker-compose up -d
```

Cela démarrera :
- Prometheus sur http://localhost:9090
- Grafana sur http://localhost:3008 (identifiants par défaut : admin/admin)

## Intégration avec les autres services

Pour que les autres microservices exposent leurs métriques, ils doivent :

1. Installer les dépendances :
   ```bash
   npm install prom-client express-prom-bundle
   ```

2. Ajouter le middleware Prometheus dans leur fichier principal :
   ```javascript
   const promBundle = require('express-prom-bundle');
   
   // Middleware Prometheus
   const metricsMiddleware = promBundle({
     includeMethod: true,
     includePath: true,
     includeStatusCode: true,
     includeUp: true,
     customLabels: { project_name: 'nom-du-service' },
     promClient: { collectDefaultMetrics: {} }
   });
   app.use(metricsMiddleware);
   
   // Exposer les métriques
   app.get('/metrics', (req, res) => {
     res.set('Content-Type', 'text/plain');
     res.end(promBundle.promClient.register.metrics());
   });
   ```

3. Pour envoyer des métriques personnalisées, utiliser l'API du service de métriques :
   ```javascript
   // Exemple d'envoi d'un compteur
   axios.post('http://localhost:3007/api/metrics/counter', {
     name: 'api_requests_total',
     help: 'Total number of API requests',
     labels: { service: 'auth-service', endpoint: '/login' },
     value: 1
   });
   ```

## API

### Compteurs

```
POST /api/metrics/counter
{
  "name": "nom_du_compteur",
  "help": "Description du compteur",
  "labels": { "label1": "valeur1", "label2": "valeur2" },
  "value": 1
}
```

### Jauges

```
POST /api/metrics/gauge
{
  "name": "nom_de_la_jauge",
  "help": "Description de la jauge",
  "labels": { "label1": "valeur1", "label2": "valeur2" },
  "value": 42.5
}
```

### Histogrammes

```
POST /api/metrics/histogram
{
  "name": "nom_de_l_histogramme",
  "help": "Description de l'histogramme",
  "labels": { "label1": "valeur1", "label2": "valeur2" },
  "value": 0.25,
  "buckets": [0.1, 0.5, 1, 2, 5]
}
```

## Tableaux de bord Grafana

Des tableaux de bord prédéfinis sont disponibles dans le dossier `dashboards/`. Vous pouvez les importer dans Grafana pour visualiser les métriques des différents services. 