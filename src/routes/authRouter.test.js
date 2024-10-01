const request = require('supertest');
const app = require('../service');
const { setAuthUser } = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a', id: -1 };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  expect(registerRes.status).toBe(200);
  
  testUserAuthToken = registerRes.body.token;
  testUser.id = registerRes.body.user.id;

  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
});

test('login when already logged in', async () => {
  //check if user is already logged in
  const reloginRes = await request(app).put('/api/auth').send(testUser);
  expect(reloginRes.status).toBe(500);
});

test('update user', async() => {
    const newEmail = 'updatedemail' + Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = 'updatednewpassword'

    const updateRes = await request(app)
    .put(`/api/auth/${testUser.id}`)
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({ email: newEmail, password: newPassword });

    expect(updateRes.status).toBe(200);

    //now login with new password
    const loginNewPassword = await request(app).put('/api/auth').send({ email: newEmail, password: newPassword });
    expect(updateRes.status).toBe(200);
});

test('logout', async () => {
    const logoutRes = await request(app).delete(`/api/auth/`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('logout successful');
});