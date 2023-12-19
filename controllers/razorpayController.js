require('dotenv').config();
const Order = require('../models/orderModel');
const Razorpay = require('razorpay');
const crypto = require('crypto')
const instance = new Razorpay({ key_id: process.env.key_id, key_secret: process.env.key_secret });


exports.createOrder = async (req, res) => {
    const saveOrderToMongoDB = async (orderId, products, amount) => {
        try {
            const mongoOrder = new Order({
                orderId,
                products,
                amount,
            });

            await mongoOrder.save();
            //console.log("Order saved to MongoDB:", mongoOrder);
        } catch (error) {
            console.error("Error saving order to MongoDB:", error);
            throw new Error("Failed to save order to MongoDB");
        }
    };

    try {
        const orderOptions = {
            amount: req.body.amount * 100,
            currency: "INR",
        };

        // Create order using async/await
        const response = await instance.orders.create(orderOptions);

        // Save order details to MongoDB
        await saveOrderToMongoDB(response.id, req.body.products, req.body.amount);

        // Respond with the order details
        res.status(200).json({ order: response });
    } catch (error) {
        console.error("Error creating or saving order:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
};

exports.webhook = async (req, res) => {
    // do a validation
    const secret = '123456'

    console.log(req.body.event)


    try {
        const shasum = crypto.createHmac('sha256', secret)
        shasum.update(JSON.stringify(req.body))
        const digest = shasum.digest('hex')

        console.log(digest, req.headers['x-razorpay-signature'])

        if (digest === req.headers['x-razorpay-signature']) {
            console.log('request is legit')
            const eventType = req.body.event;
            const payload = req.body.payload;
            switch (eventType) {
                case 'order.paid':
                    const order = await Order.findOne({ orderId: payload.order.entity.id });
                    if (!order) {
                        throw new Error('Order not found');
                    }

                    order.status = 'paid';
                    order.payId = payload.payment.entity.id;
                    await order.save();
                    break;

                case 'payment.failed':
                    const failedOrder = await Order.findOne({ orderId: payload.payment.entity.order_id });
                    if (!failedOrder) {
                        throw new Error('Failed order not found');
                    }
                    failedOrder.status = 'failed';
                    await failedOrder.save();
                    break;

                case 'refund.created':
                    const refundOrder = await Order.findOne({ orderId: payload.payment.entity.order_id });
                    if (!refundOrder) {
                        throw new Error('Refund order not found');
                    }
                    refundOrder.status = 'refund created';
                    await refundOrder.save();
                    break;

                default:
                    console.log(`Unhandled event type ${eventType}`);
            }


        } else {
            throw new Error('Invalid signature');
        }
        res.json({ status: 'ok' })
    }
    catch (err) {
        console.log(err)
    }
}

exports.refund = async (req, res) => {
    console.log(req.body);
    const { paymentId } = req.body;
    console.log(paymentId);
    try {
        instance.payments.refund(paymentId, {
            "amount": "100",
            "speed": "normal",
            "notes": {
                "notes_key_1": "Beam me up Scotty.",
                "notes_key_2": "Engage"
            },
            "receipt": "Receipt No. 31"
        }).then(response => {
            res.status(200).json({ response });
        }).catch(err => {
            res.status(500).json({ message: err });
        });
    } catch (error) {
        console.error("Error creating or saving order:", error);
        res.status(500).json({ message: error });
    }
}

