const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
    orderId: { type: String, required: true },
    payId: { type: String },
    status: { type: String, default: "pending" },
    products: [{ productId: String, skuId: String, quantity: Number, price: Number }],
    amount: { type: Number },
})

module.exports = model('RazorpayOrders', orderSchema);