const request = require('supertest');
const express = require('express');
const metricsRouter = require('../routes/metrics');
const { register } = require('../controllers/metricsController');

// Créer une application Express pour les tests
const app = express();
app.use(express.json());
app.use('/metrics', metricsRouter);

describe('Metrics Service API', () => {

    // Vider les métriques avant chaque test pour assurer l'isolation
    beforeEach(() => {
        register.clear();
    });

    describe('POST /metrics/counter', () => {
        it('should increment a counter and return 200', async () => {
            const payload = {
                name: 'test_counter',
                help: 'A test counter',
                value: 2,
                labels: { code: '200' }
            };

            const response = await request(app)
                .post('/metrics/counter')
                .send(payload);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Vérifier que la métrique est correctement enregistrée
            const metrics = await register.metrics();
            expect(metrics).toContain('# HELP test_counter A test counter');
            expect(metrics).toContain('# TYPE test_counter counter');
            expect(metrics).toContain('test_counter{code="200"} 2');
        });

        it('should return 400 if name or help is missing', async () => {
            const response = await request(app)
                .post('/metrics/counter')
                .send({ help: 'Incomplete payload' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Les champs name et help sont requis');
        });
    });

    describe('POST /metrics/gauge', () => {
        it('should set a gauge and return 200', async () => {
            const payload = {
                name: 'test_gauge',
                help: 'A test gauge',
                value: 123.45
            };

            const response = await request(app)
                .post('/metrics/gauge')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const metrics = await register.metrics();
            expect(metrics).toContain('# HELP test_gauge A test gauge');
            expect(metrics).toContain('# TYPE test_gauge gauge');
            expect(metrics).toContain('test_gauge 123.45');
        });

        it('should return 400 if value is missing', async () => {
            const response = await request(app)
                .post('/metrics/gauge')
                .send({ name: 'test_gauge', help: 'Incomplete payload' });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Les champs name, help et value sont requis');
        });
    });

    describe('POST /metrics/histogram', () => {
        it('should observe a histogram value and return 200', async () => {
            const payload = {
                name: 'test_histogram',
                help: 'A test histogram',
                value: 0.8,
                labels: { route: '/users' }
            };

            const response = await request(app)
                .post('/metrics/histogram')
                .send(payload);
            
            expect(response.status).toBe(200);

            const metrics = await register.metrics();
            expect(metrics).toContain('# HELP test_histogram A test histogram');
            expect(metrics).toContain('# TYPE test_histogram histogram');
            expect(metrics).toContain('test_histogram_sum{route="/users"} 0.8');
            expect(metrics).toContain('test_histogram_count{route="/users"} 1');
        });
    });

    describe('GET /metrics', () => {
        it('should return all registered metrics in plain text', async () => {
            // Enregistrer une métrique pour s'assurer que la réponse n'est pas vide
            await request(app).post('/metrics/counter').send({ name: 'sample_metric', help: 'sample' });
            
            const response = await request(app).get('/metrics');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/plain');
            expect(response.text).toContain('sample_metric');
        });
    });
}); 