const request = require('supertest');
const app = require('../service');
const { authRouter, createAdminUser } = require('./authRouter.js');

let testUserEmail = Math.random().toString(36).substring(2, 12) + '@test.com';

let testUserAuthToken;
let testUserId;

let testFranchiseName = Math.random().toString(36).substring(2, 12);
const testFranchise = { name: `${testFranchiseName}`, admins: [{"email": `${testUserEmail}`}] };
let testFranchiseId;

let testStoreName = Math.random().toString(36).substring(2, 12);
const testStore = { franchiseId: 0, name: testStoreName }
let testStoreId;

beforeAll(async () => {
  //register a user to use for testing
  let user = await createAdminUser(testUserEmail);
  const loginRes = await request(app).put('/api/auth').send(user);
  expect(loginRes.status).toBe(200);

  testUserAuthToken = loginRes.body.token;
  testUserId = loginRes.body.user.id;

  //create franchise in db associated with test user
  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send(testFranchise);

  expect(createFranchiseRes.status).toBe(200);
  expect(createFranchiseRes.body.name).toBe(testFranchise.name);

  testFranchiseId = createFranchiseRes.body.id;
  testStore.franchiseId = testFranchiseId;
});

test('get franchise for a user', async () => {
    const getUserFranchiseRes = await request(app)
        .get(`/api/franchise/${testUserId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);
    
    expect(getUserFranchiseRes.status).toBe(200);
    expect(getUserFranchiseRes.body[0].name).toBe(testFranchise.name);
    expect(getUserFranchiseRes.body[0].id).toBe(testFranchiseId);
});

test('get all franchises', async () => {
    const getAllFranchisesRes = await request(app)
        .get('/api/franchise');
    
    expect(getAllFranchisesRes.status).toBe(200);
    expect(getAllFranchisesRes.body.length).toBeGreaterThanOrEqual(1);
});

test('create a new franchise store', async () => {
    const postStoreRes = await request(app)
        .post(`/api/franchise/${testFranchiseId}/store`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(testStore);

    expect(postStoreRes.status).toBe(200);
    testStoreId = postStoreRes.body.id;    

    const getUserFranchiseRes = await request(app)
        .get(`/api/franchise/${testUserId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);
    
    expect(getUserFranchiseRes.status).toBe(200);

    expect(getUserFranchiseRes.body[0].stores[0]).toBeDefined();
    const firstStore = getUserFranchiseRes.body[0].stores[0];

    expect(firstStore.name).toBe(testStore.name);    
});

afterAll(async () => {
    const deleteStoreRes = await request(app)
        .delete(`/api/franchise/${testFranchiseId}/store/${testStoreId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(deleteStoreRes.status).toBe(200);

    const getUserFranchiseRes = await request(app)
        .get(`/api/franchise/${testUserId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(getUserFranchiseRes.body[0]).toBeDefined();
    expect(getUserFranchiseRes.body[0].stores.length).toBe(0);

    // const deleteFranchiseRes = await request(app)
    //     .delete(`/api/franchise/${testFranchiseId}`)
    //     .set('Authorization', `Bearer ${testUserAuthToken}`);
    // expect(deleteFranchiseRes.status).toBe(200);

    const logoutRes = await request(app)
        .delete(`/api/auth/`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
});