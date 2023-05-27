import request from "supertest";
import { app } from '../../app';

const API_URL = '/api/tickets/';

const createTicket = () => {
  return request(app)
    .post(API_URL)
    .set('Cookie', global.signin())
    .send({
      title: 'kjndsgf',
      price: 20
    })
}

it('can fetch a list of tickets', async () => {
  await createTicket();
  await createTicket();
  await createTicket();

  const response = await request(app)
    .get(API_URL)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(3);
});
