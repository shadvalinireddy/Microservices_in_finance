const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Notification = require('./notificationModel');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

const cors = require('cors');
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/notificationDB1', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// RabbitMQ connection
async function connectToRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queue = 'notifications';

        await channel.assertQueue(queue, { durable: true });

        console.log('Waiting for messages in %s', queue);
        channel.consume(queue, async (msg) => {
            const content = JSON.parse(msg.content.toString());
            console.log("Received message:", content);

            // Check if custid exists before creating a Notification
            if (!content.email) {
                console.error('custid is missing. Cannot save notification:', content);
                channel.ack(msg); // Acknowledge the message even if it fails
                return; // Skip saving this notification
            }

            // Save to the database
            const notification = new Notification({
                email: content.email,
                message: content.message,
            });

            try {
                await notification.save();
                console.log('Notification saved:', notification);
            } catch (saveError) {
                console.error('Error saving notification:', saveError);
            }

            // Acknowledge the message
            channel.ack(msg);
        }, { noAck: false });
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}


connectToRabbitMQ();

app.get('/notifications/:email', (req, res) => {
    const email = req.params.email;
    console.log(`Request received for email: ${email}`); // Log email
    Notification.find({ email: email })
        .then(notifications => {
            console.log(`Notifications found: ${notifications.length}`); // Log number of notifications
            res.json(notifications);
        })
        .catch(error => {
            console.error('Error fetching notifications:', error); // Log error details
            res.status(500).json({ message: 'Error fetching notifications', error });
        });
});


// GET route to retrieve notifications
app.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find();
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).json({ message: 'Error retrieving notifications' });
    }
});

app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
});
