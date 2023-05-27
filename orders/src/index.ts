import mongoose from 'mongoose';
import { natsWrapper } from './nats-wrapper';
import { app } from'./app';
import { TicketCreatedListener } from './events/listeners/ticket-created-listener';
import { TicketUpdatedListener } from './events/listeners/ticket-updated-listener';

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
  } 
  try {
    if (!process.env.NATS_CLUSTER_ID || !process.env.NATS_URL || !process.env.NATS_CLIENT_ID) {
      throw new Error('NATS env variables must be defined');
    } 
    await natsWrapper.connect(process.env.NATS_CLUSTER_ID, process.env.NATS_CLIENT_ID, process.env.NATS_URL);
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed!');
      process.exit();
    });
    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI must be defined');
    } 
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');
  } catch (err) {
    console.error(err);
  }

  app.listen(3000, () => {
    console.log('listening on port 3000!');
  });
}

start();