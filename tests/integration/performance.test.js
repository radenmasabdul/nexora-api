const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

describe('Performance Testing', () => {
    let authToken;
    let testUserId;
    let testTeamId;
    let testProjectId;

    beforeAll(async () => {
        // Create test user
        const userResponse = await request(app)
            .post('/auth/register')
            .send({
                name: 'Performance Test User',
                email: `perftest${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'admin'
            });

        if (userResponse.status === 201) {
            testUserId = userResponse.body.data.id;
            authToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test-secret');
        }
    });

    describe('Response Time Performance', () => {
        it('should respond to auth endpoints within acceptable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/auth/logout');
            
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });

        it('should respond to user list endpoint within acceptable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/users/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);
            
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
        });

        it('should respond to team list endpoint within acceptable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/teams/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);
            
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
        });
    });

    describe('Concurrent Request Handling', () => {
        it('should handle multiple concurrent read requests', async () => {
            const concurrentRequests = 10;
            const requests = [];

            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    request(app)
                        .get('/users/all?page=1&limit=5')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Total time should be reasonable for concurrent requests
            expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
        });

        it('should handle concurrent team creation requests', async () => {
            const concurrentRequests = 5;
            const requests = [];

            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    request(app)
                        .post('/teams/create')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            name: `Concurrent Team ${i} ${Date.now()}`,
                            description: `Team created in concurrent test ${i}`
                        })
                );
            }

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
            });

            // Total time should be reasonable
            expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
        });
    });

    describe('Large Dataset Performance', () => {
        beforeAll(async () => {
            // Create test team for projects
            const teamResponse = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Performance Test Team ${Date.now()}`,
                    description: 'Team for performance testing'
                });

            if (teamResponse.status === 201) {
                testTeamId = teamResponse.body.data.id;
            }
        });

        it('should handle pagination efficiently with large datasets', async () => {
            // Test different page sizes
            const pageSizes = [10, 50, 100];

            for (const pageSize of pageSizes) {
                const startTime = Date.now();
                
                const response = await request(app)
                    .get(`/users/all?page=1&limit=${pageSize}`)
                    .set('Authorization', `Bearer ${authToken}`);
                
                const responseTime = Date.now() - startTime;
                
                expect(response.status).toBe(200);
                expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
                expect(response.body.data.length).toBeLessThanOrEqual(pageSize);
            }
        });

        it('should handle search queries efficiently', async () => {
            const searchQueries = ['test', 'user', 'admin', 'performance'];

            for (const query of searchQueries) {
                const startTime = Date.now();
                
                const response = await request(app)
                    .get(`/users/all?search=${query}`)
                    .set('Authorization', `Bearer ${authToken}`);
                
                const responseTime = Date.now() - startTime;
                
                expect(response.status).toBe(200);
                expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
            }
        });
    });

    describe('Memory Usage Performance', () => {
        it('should not cause memory leaks with repeated requests', async () => {
            const iterations = 20;
            const initialMemory = process.memoryUsage().heapUsed;

            for (let i = 0; i < iterations; i++) {
                await request(app)
                    .get('/users/all?page=1&limit=10')
                    .set('Authorization', `Bearer ${authToken}`);
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });
    });

    describe('Database Query Performance', () => {
        it('should perform complex queries efficiently', async () => {
            if (!testTeamId) return;

            // Create a project to test complex queries
            const projectResponse = await request(app)
                .post('/projects/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    team_id: testTeamId,
                    name: `Performance Test Project ${Date.now()}`,
                    description: 'Project for performance testing',
                    status: 'planning',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (projectResponse.status === 201) {
                testProjectId = projectResponse.body.data.id;

                // Test getting project with relationships
                const startTime = Date.now();
                
                const response = await request(app)
                    .get(`/projects/${testProjectId}`)
                    .set('Authorization', `Bearer ${authToken}`);
                
                const responseTime = Date.now() - startTime;
                
                expect(response.status).toBe(200);
                expect(responseTime).toBeLessThan(1500); // Should respond within 1.5 seconds
                expect(response.body.data).toHaveProperty('team');
            }
        });

        it('should handle multiple related entity queries efficiently', async () => {
            const startTime = Date.now();
            
            // Make multiple related queries
            const [usersResponse, teamsResponse, projectsResponse, tasksResponse] = await Promise.all([
                request(app).get('/users/all?page=1&limit=5').set('Authorization', `Bearer ${authToken}`),
                request(app).get('/teams/all?page=1&limit=5').set('Authorization', `Bearer ${authToken}`),
                request(app).get('/projects/all?page=1&limit=5').set('Authorization', `Bearer ${authToken}`),
                request(app).get('/tasks/all?page=1&limit=5').set('Authorization', `Bearer ${authToken}`)
            ]);
            
            const totalTime = Date.now() - startTime;
            
            expect(usersResponse.status).toBe(200);
            expect(teamsResponse.status).toBe(200);
            expect(projectsResponse.status).toBe(200);
            expect(tasksResponse.status).toBe(200);
            expect(totalTime).toBeLessThan(4000); // Should complete within 4 seconds
        });
    });

    describe('Rate Limiting Performance', () => {
        it('should handle rate limiting gracefully', async () => {
            const requests = [];
            const maxRequests = 10;

            // Make rapid requests to test rate limiting
            for (let i = 0; i < maxRequests; i++) {
                requests.push(
                    request(app)
                        .post('/auth/login')
                        .send({
                            email: 'nonexistent@example.com',
                            password: 'wrongpassword'
                        })
                );
            }

            const responses = await Promise.all(requests);
            
            // Some requests should succeed (404 for user not found)
            // Some might be rate limited (429)
            const statusCodes = responses.map(r => r.status);
            const validStatuses = [404, 429];
            
            statusCodes.forEach(status => {
                expect(validStatuses).toContain(status);
            });
        });
    });

    describe('File Upload Performance', () => {
        it('should handle file upload requests efficiently', async () => {
            // Test with small file simulation
            const fileData = 'x'.repeat(1024); // 1KB of data
            
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/users/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'File Test User',
                    email: `filetest${Date.now()}@example.com`,
                    password: 'Password123!',
                    role: 'member',
                    bio: fileData // Simulate larger data
                });
            
            const responseTime = Date.now() - startTime;
            
            expect([201, 422]).toContain(response.status); // 422 if bio field doesn't exist
            expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
        });
    });

    describe('Error Handling Performance', () => {
        it('should handle validation errors efficiently', async () => {
            const invalidRequests = [
                { endpoint: '/users/create', data: { name: '', email: 'invalid' } },
                { endpoint: '/teams/create', data: { name: '' } },
                { endpoint: '/projects/create', data: { name: 'test' } }
            ];

            for (const req of invalidRequests) {
                const startTime = Date.now();
                
                const response = await request(app)
                    .post(req.endpoint)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(req.data);
                
                const responseTime = Date.now() - startTime;
                
                expect(response.status).toBe(422);
                expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
            }
        });

        it('should handle 404 errors efficiently', async () => {
            const notFoundRequests = [
                '/users/non-existent-id',
                '/teams/non-existent-id',
                '/projects/non-existent-id',
                '/tasks/non-existent-id'
            ];

            for (const endpoint of notFoundRequests) {
                const startTime = Date.now();
                
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${authToken}`);
                
                const responseTime = Date.now() - startTime;
                
                expect(response.status).toBe(404);
                expect(responseTime).toBeLessThan(500); // Should respond within 0.5 seconds
            }
        });
    });
});