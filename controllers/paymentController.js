require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose'); 


const razorpayKeyId = process.env.RAZORPAY_PAYMENT_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_PAYMENT_SECRET;

const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_fKh2fGYnPvSVrM',
    key_secret: 'hSMt3HNxZBv4csbZMtVdaEBB',
});


const createOrder = async (req, res) => {
    const { amount, currency } = req.body;

    const options = {
        amount: amount * 100, 
        currency: currency,
        receipt: 'receipt#1', 
    };

    try {
        const response = await razorpayInstance.orders.create(options);
        res.json({ id: response.id });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
};

function randomOrderID() {
    return Math.floor(100000 + Math.random() * 900000);
  }

const generateOrderID = async () => {
    let orderid = randomOrderID();

    const checkOrderId = await Order.findOne({orderId:orderid});
    if (!checkOrderId) {
       return orderid

    }else{
        generateOrderID();

    }
  };
  



const verifyPayment = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, cart, grandTotal,usersId,cartId } = req.body;
    console.log("asdfsdfasdfasdfasdfasdfsdfassdsd");
    console.log(razorpayOrderId);


    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Invalid payment details' });
    }


    const generatedSignature = crypto
        .createHmac('sha256', 'hSMt3HNxZBv4csbZMtVdaEBB')
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');


        if (generatedSignature === razorpaySignature) {

            try {
            const user = await User.findById(usersId);
            const cart = await Cart.findOne({_id:cartId})

            console.log(user,cart);
            const activeAddress = user.address.find(addr => addr.isActive);

              const applyCoupon = cart.applyedCoupon
               const applyedDiscount = cart.applyedDiscount
               const coupon = await Coupon.findOne({couponName:applyCoupon})
               if(coupon){
                let couponlimit = coupon.limit-1
               coupon.limit= couponlimit
               await coupon.save()
               }

               let shippingChargeAmount = (grandTotal >= 2500 && grandTotal !== 0) ? 0 : 200;


               const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);


            const newOrder = new Order({
                orderId: await generateOrderID(),
                customerId: user._id,
                customer: user.name,
                phone: activeAddress.number,
                address: activeAddress._id,
                items: cart.products,
                totalPrice: grandTotal,
                shippingCharge:shippingChargeAmount,
                paymentMethod: 'online',
                createdAt: Date.now(),
                addresss: {
                    fullName: activeAddress.fullName,
                    number: activeAddress.number,
                    house: activeAddress.house,
                    street: activeAddress.street,
                    landMark: activeAddress.landMark,
                    city: activeAddress.city,
                    state: activeAddress.state,
                    pincode: activeAddress.pincode,
                },
                applyedCoupon: cart.applyedCoupon,
                applyedDiscount: cart.applyedDiscount,
                onlineTransactionId:razorpayOrderId,
                expectedDeliveryDate: expectedDeliveryDate,

            });

            await newOrder.save()
                  for (const product of cart.products) {
            const productId = product.productId;
            const objectId = new mongoose.Types.ObjectId(productId);
            const actualProduct = await Product.findOne({_id:objectId});


            if (actualProduct) {

                actualProduct.num_of_stocks -= product.quantity;
                await actualProduct.save();

            } else {
                console.log(`Product not found`);
            }
        }
            const clearCart = await Cart.findByIdAndDelete(cart._id)
                 

            if(clearCart){

                            res.json({ success: true});

                }

        } catch (error) {
            console.error('Error saving order:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.status(400).json({ success: false });
    }
};


module.exports={
    verifyPayment,
    createOrder
}