import mongoose from "mongoose";
import request from "supertest";
import { app } from '../../app';
import { Ticket, TicketDoc } from "../../models/ticket";

const API_URL = '/api/orders/';

const createTicket = async (title: string) => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title,
    price: 20
  });
  await ticket.save();

  return ticket;
}

const createOrder = (user: string[], ticket: TicketDoc) => {
  return request(app)
    .post(API_URL)
    .set('Cookie', user)
    .send({
      ticketId: ticket.id
    })
}

it('can fetch a list of orders for a particular order', async () => {
  // Create three tickets
  const ticketOne = await createTicket('Concert1');
  const ticketTwo = await createTicket('Concert2');
  const ticketThree = await createTicket('Concert3');

  const userOne = global.signin();
  const userTwo = global.signin();

  // Create one order as User #1
  await createOrder(userOne, ticketOne).expect(201);

  // Create one order as User #2
  const { body: orderOne } = await createOrder(userTwo, ticketTwo).expect(201);
  const { body: orderTwo } = await createOrder(userTwo, ticketThree).expect(201);

  // Make request to get orders for User #2
  const response = await request(app)
    .get(API_URL)
    .set('Cookie', userTwo)
    .expect(200);

  // Make sure we only got the orders for User #2
  expect(response.body.length).toEqual(2);
  expect(response.body[0].id).toEqual(orderOne.id);
  expect(response.body[1].id).toEqual(orderTwo.id);
  expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
  expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});
