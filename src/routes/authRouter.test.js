const request = require('supertest');
const app = require('../service');


const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a', id: -1 };
let testUserAuthToken;

let registerRes;
let loginRes;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  registerRes = await request(app).post('/api/auth').send(testUser);
  
  testUserAuthToken = registerRes.body.token;
  testUser.id = registerRes.body.user.id;

  loginRes = await request(app).put('/api/auth').send(testUser);
  console.log("heyo");
  // console.log(loginRes);
});

test('register', async () => {
  expect(registerRes.status).toBe(200);
});

test('login', async () => {
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
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
    const loginNewPasswordRes = await request(app).put('/api/auth').send({ email: newEmail, password: newPassword });
    expect(loginNewPasswordRes.status).toBe(200);
});

test('logout', async () => {
    const logoutRes = await request(app).delete(`/api/auth/`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('logout successful');
});