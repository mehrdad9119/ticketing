import request from "supertest";
import { app } from '../../app';
import mongoose from "mongoose";
import { natsWrapper } from "../../nats-wrapper";
import { Ticket } from "../../models/ticket";

const API_URL = '/api/tickets/';

const createTicket = (cookie: string[]) => {
  return request(app)
    .post(API_URL)
    .set('Cookie', cookie)
    .send({
      title: 'kjndsgf',
      price: 20
    })
}

it('returns a 404 if the provided id does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`${API_URL}${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'dsgsgf',
      price: 20
    })
    .expect(404);
});

it('returns a 401 if the user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`${API_URL}${id}`)
    .send({
      title: 'dsgsgf',
      price: 20
    })
    .expect(401);
});

it('returns a 400 if the user tries to update a reserved ticket', async () => {
  const cookie = global.signin();
  const response = await createTicket(cookie);
  
  const ticket = await Ticket.findById(response.body.id);
  ticket!.set({ orderId: new mongoose.Types.ObjectId().toHexString() });
  await ticket!.save();

  await request(app)
    .put(`${API_URL}${response.body.id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'djngfss',
      price: 10
    })
    .expect(400);
});

it('returns a 401 if the user does not own the ticket', async () => {
  const response = await createTicket(global.signin());

  await request(app)
    .put(`${API_URL}${response.body.id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'djngfss',
      price: 10
    })
    .expect(401);
});

it('returns a 400 if the user provides an invalid title or price', async () => {
  const cookie = global.signin();
  const response = await createTicket(cookie);

  await request(app)
    .put(`${API_URL}${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 10
    })
    .expect(400);

    await request(app)
    .put(`${API_URL}${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'dsgfdsgf',
      price: -10
    })
    .expect(400);
});

it('updates a ticket provided valid inputs', async () => {
  const cookie = global.signin();
  const response = await createTicket(cookie);

  await request(app)
    .put(`${API_URL}${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'updated title',
      price: 10
    })
    .expect(200);

  const ticketResponse = await request(app)
    .get(`${API_URL}${response.body.id}`)
    .send();

  expect(ticketResponse.body.title).toEqual('updated title');
  expect(ticketResponse.body.price).toEqual(10);
});

it('publishes an event', async () => {
  const cookie = global.signin();
  const response = await createTicket(cookie);
  
  await request(app)
    .put(`${API_URL}${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'updated title',
      price: 10
    })
    .expect(200);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});
