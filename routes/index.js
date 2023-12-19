const express = require('express');
const router = express.Router();
const cors = require('cors');
const razorpayController = require('../controllers/razorpayController');
const bodyParser = require('body-parser');

router.use(cors());

router.use(bodyParser.json());
router.post('/webhook', razorpayController.webhook);
router.post('/create-order', razorpayController.createOrder);
router.post('/refund', razorpayController.refund);




module.exports = router;