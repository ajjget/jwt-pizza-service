const request = require('supertest');
const app = require('../service');
const { createAdminUser } = require('./authRouter.js');
require('./franchiseRouter.js');


let testUserEmail = Math.random().toString(36).substring(2, 12) + '@test.com';

let testUserAuthToken;

let testMenuName = Math.random().toString(36).substring(2, 12);
const testMenuItem = { title: `${testMenuName}`, description: "yum", image: "pizza.png", price: 0.93 };
let testMenuId;

let addMenuRes;

beforeAll(async () => {
  //register a user to use for testing
  let user = await createAdminUser(testUserEmail);
  const loginRes = await request(app).put('/api/auth').send(user);

  testUserAuthToken = loginRes.body.token;

  addMenuRes = await request(app)
    .put('/api/order/menu')
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send(testMenuItem);

  testMenuId = addMenuRes.body.id;
});

test('login', async () => {
    expect(addMenuRes.status).toBe(200);
});

test('get the pizza menu', async () => {
    const getMenuRes = await request(app)
        .get('/api/order/menu');

    expect(getMenuRes.status).toBe(200);
    const lastMenuItem = getMenuRes.body[getMenuRes.body.length - 1];

    expect(lastMenuItem.title).toBe(testMenuName);
});

test('make an order to fake franchise/store', async () => {
    const postOrderRes = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send({ 
            franchiseId: -1, 
            storeId: -2, 
            items:[
                { 
                    menuId: testMenuId, 
                    description: testMenuItem.description, 
                    price: testMenuItem.price 
                }
            ]
        });

    expect(postOrderRes.status).toBe(500);
    
});