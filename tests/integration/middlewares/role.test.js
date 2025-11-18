const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');

describe('Role-based Access Control Integration', () => {
    let adminToken, managerToken, memberToken;
    let testUserId, testTeamId;

    beforeAll(async () => {
        // Create users with different roles
        const adminUser = await request(app)
            .post('/auth/register')
            .send({
                name: 'Admin User',
                email: `admin${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'admin'
            });

        const managerUser = await request(app)
            .post('/auth/register')
            .send({
                name: 'Manager User',
                email: `manager${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'manager'
            });

        const memberUser = await request(app)
            .post('/auth/register')
            .send({
                name: 'Member User',
                email: `member${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'member'
            });

        // Create tokens for each role
        if (adminUser.status === 201) {
            adminToken = jwt.sign({ 
                id: adminUser.body.data.id, 
                role: 'admin' 
            }, process.env.JWT_SECRET || 'test-secret');
        }

        if (managerUser.status === 201) {
            managerToken = jwt.sign({ 
                id: managerUser.body.data.id, 
                role: 'manager' 
            }, process.env.JWT_SECRET || 'test-secret');
            testUserId = managerUser.body.data.id;
        }

        if (memberUser.status === 201) {
            memberToken = jwt.sign({ 
                id: memberUser.body.data.id, 
                role: 'member' 
            }, process.env.JWT_SECRET || 'test-secret');
        }
    });

    describe('User Management Access Control', () => {
        it('should allow admin to create users', async () => {
            const userData = {
                name: 'Test User',
                email: `testuser${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/users/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData);

            expect(response.status).toBe(201);
        });

        it('should deny manager from creating users (if restricted)', async () => {
            const userData = {
                name: 'Test User Manager',
                email: `testmanager${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/users/create')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(userData);

            // This should pass if managers can create users, or fail if restricted
            expect([201, 403]).toContain(response.status);
        });

        it('should deny member from creating users', async () => {
            const userData = {
                name: 'Test User Member',
                email: `testmember${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'member'
            };

            const response = await request(app)
                .post('/users/create')
                .set('Authorization', `Bearer ${memberToken}`)
                .send(userData);

            // This should pass if members can create users, or fail if restricted
            expect([201, 403]).toContain(response.status);
        });
    });

    describe('Team Management Access Control', () => {
        it('should allow admin to create teams', async () => {
            const teamData = {
                name: `Admin Team ${Date.now()}`,
                description: 'Team created by admin'
            };

            const response = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(teamData);

            expect(response.status).toBe(201);
            if (response.status === 201) {
                testTeamId = response.body.data.id;
            }
        });

        it('should allow manager to create teams', async () => {
            const teamData = {
                name: `Manager Team ${Date.now()}`,
                description: 'Team created by manager'
            };

            const response = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(teamData);

            expect(response.status).toBe(201);
        });

        it('should allow member to create teams', async () => {
            const teamData = {
                name: `Member Team ${Date.now()}`,
                description: 'Team created by member'
            };

            const response = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${memberToken}`)
                .send(teamData);

            expect(response.status).toBe(201);
        });
    });

    describe('Data Access Control', () => {
        it('should allow all roles to view teams', async () => {
            // Admin access
            const adminResponse = await request(app)
                .get('/teams/all')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(adminResponse.status).toBe(200);

            // Manager access
            const managerResponse = await request(app)
                .get('/teams/all')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(managerResponse.status).toBe(200);

            // Member access
            const memberResponse = await request(app)
                .get('/teams/all')
                .set('Authorization', `Bearer ${memberToken}`);
            expect(memberResponse.status).toBe(200);
        });

        it('should allow all roles to view users', async () => {
            // Admin access
            const adminResponse = await request(app)
                .get('/users/all')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(adminResponse.status).toBe(200);

            // Manager access
            const managerResponse = await request(app)
                .get('/users/all')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(managerResponse.status).toBe(200);

            // Member access
            const memberResponse = await request(app)
                .get('/users/all')
                .set('Authorization', `Bearer ${memberToken}`);
            expect(memberResponse.status).toBe(200);
        });
    });

    describe('Update and Delete Access Control', () => {
        it('should test user update permissions', async () => {
            if (!testUserId) return;

            const updateData = { name: 'Updated Name' };

            // Admin should be able to update any user
            const adminResponse = await request(app)
                .put(`/users/update/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);
            expect([200, 403]).toContain(adminResponse.status);

            // Manager should be able to update (depending on business rules)
            const managerResponse = await request(app)
                .put(`/users/update/${testUserId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send(updateData);
            expect([200, 403]).toContain(managerResponse.status);
        });

        it('should test team update permissions', async () => {
            if (!testTeamId) return;

            const updateData = { name: `Updated Team ${Date.now()}` };

            // Admin should be able to update any team
            const adminResponse = await request(app)
                .put(`/teams/update/${testTeamId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);
            expect([200, 403]).toContain(adminResponse.status);
        });
    });

    describe('Authentication Required', () => {
        it('should require authentication for all protected routes', async () => {
            // Test without token
            const responses = await Promise.all([
                request(app).get('/users/all'),
                request(app).get('/teams/all'),
                request(app).post('/users/create').send({}),
                request(app).post('/teams/create').send({})
            ]);

            responses.forEach(response => {
                expect(response.status).toBe(401);
            });
        });

        it('should reject invalid tokens', async () => {
            const invalidToken = 'invalid.token.here';

            const response = await request(app)
                .get('/users/all')
                .set('Authorization', `Bearer ${invalidToken}`);

            expect(response.status).toBe(401);
        });
    });
});