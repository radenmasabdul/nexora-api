const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');

describe('Member Management Integration Tests', () => {
    let authToken, testUserId, testTeam, testMember;

    beforeAll(async () => {
        // Create test user
        const userResponse = await request(app)
            .post('/auth/register')
            .send({
                name: 'Member Test User',
                email: `membertest${Date.now()}@example.com`,
                password: 'Password123!',
                role: 'admin'
            });

        if (userResponse.status === 201) {
            testUserId = userResponse.body.data.id;
            authToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test-secret');
            
            // Create test team
            const teamResponse = await request(app)
                .post('/teams/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Member Test Team ${Date.now()}`,
                    description: 'Team for member testing'
                });

            if (teamResponse.status === 201) {
                testTeam = teamResponse.body.data;
            }
        }
    });

    describe('POST /members/create', () => {
        it('should create member successfully', async () => {
            if (!testTeam || !testUserId) return;

            // Create another user to add as member
            const memberUserResponse = await request(app)
                .post('/auth/register')
                .send({
                    name: 'New Member',
                    email: `newmember${Date.now()}@example.com`,
                    password: 'Password123!',
                    role: 'member'
                });

            if (memberUserResponse.status !== 201) return;

            const memberData = {
                team_id: testTeam.id,
                user_id: memberUserResponse.body.data.id,
                role: 'member'
            };

            const response = await request(app)
                .post('/members/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(memberData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.role).toBe('member');
            expect(response.body.data.team.id).toBe(testTeam.id);
            expect(response.body.data.user.id).toBe(memberUserResponse.body.data.id);

            testMember = response.body.data;
        });

        it('should return 409 for duplicate member', async () => {
            if (!testMember || !testTeam) return;

            const memberData = {
                team_id: testTeam.id,
                user_id: testMember.user.id,
                role: 'lead'
            };

            const response = await request(app)
                .post('/members/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(memberData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Member already exists in the team.');
        });

        it('should return 422 for invalid data', async () => {
            const response = await request(app)
                .post('/members/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    team_id: 'invalid-uuid',
                    user_id: '',
                    role: 'invalid-role'
                });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should return 401 without auth token', async () => {
            const response = await request(app)
                .post('/members/create')
                .send({
                    team_id: testTeam?.id || 'test-id',
                    user_id: testUserId || 'test-id',
                    role: 'member'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /members/all', () => {
        it('should get all members with pagination', async () => {
            const response = await request(app)
                .get('/members/all?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.currentPage).toBe(1);
            expect(response.body.totalData).toBeGreaterThanOrEqual(0);
        });

        it('should search members by role', async () => {
            const response = await request(app)
                .get('/members/all?search=member')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 401 without auth token', async () => {
            const response = await request(app)
                .get('/members/all');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /members/:id', () => {
        it('should get member by ID', async () => {
            if (!testMember) return;

            const response = await request(app)
                .get(`/members/${testMember.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testMember.id);
            expect(response.body.data.team).toBeDefined();
            expect(response.body.data.user).toBeDefined();
        });

        it('should return 404 for non-existent member', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000';
            const response = await request(app)
                .get(`/members/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Member not found');
        });

        it('should return 401 without auth token', async () => {
            const response = await request(app)
                .get(`/members/${testMember?.id || 'test-id'}`);

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /members/update/:id', () => {
        it('should update member role successfully', async () => {
            if (!testMember) return;

            const updateData = { role: 'lead' };

            const response = await request(app)
                .put(`/members/update/${testMember.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.role).toBe('lead');
            expect(response.body.data.id).toBe(testMember.id);
        });

        it('should return 404 for non-existent member', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000';
            const response = await request(app)
                .put(`/members/update/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ role: 'member' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Member not found.');
        });

        it('should return 422 for invalid role', async () => {
            if (!testMember) return;

            const response = await request(app)
                .put(`/members/update/${testMember.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ role: 'invalid-role' });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should return 401 without auth token', async () => {
            const response = await request(app)
                .put(`/members/update/${testMember?.id || 'test-id'}`)
                .send({ role: 'member' });

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /members/delete/:id', () => {
        it('should delete member successfully', async () => {
            if (!testMember) return;

            const response = await request(app)
                .delete(`/members/delete/${testMember.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Member deleted successfully');

            // Verify member is deleted
            const checkResponse = await request(app)
                .get(`/members/${testMember.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(checkResponse.status).toBe(404);
        });

        it('should return 404 for non-existent member', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000';
            const response = await request(app)
                .delete(`/members/delete/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Member not found.');
        });

        it('should return 401 without auth token', async () => {
            const response = await request(app)
                .delete(`/members/delete/test-id`);

            expect(response.status).toBe(401);
        });
    });
});