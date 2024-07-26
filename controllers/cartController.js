const Product = require('../models/productModel')
const mongoose = require('mongoose'); 
const Cart = require('../models/cartModel')





const loadCart = async (req,res,next) => {
    try {

        const user = req.session.user_id;
        console.log(user);

        if (!user) {
            throw new Error("User not found in session");
        }
        
        const userId = new mongoose.Types.ObjectId(user._id);


        const cart = await Cart.findOne({ userId });
        let cartCount = 0;
      
        if (!cart) {
            return res.render('cart', { products: [] });
        }
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        const pipeline = [
            { $match: { userId } },
            { $unwind: "$products" },
            {
                $project: {
                    product: "$products.productId",
                    quantity: "$products.quantity",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "items",
                },
            },
            { $unwind: "$items" }, 
            {
                $project: {
                    productId: "$items._id",
                    productName: "$items.productName",
                    productCategory: "$items.productCategory",
                    productDescription: "$items.productDescription",
                    productPrice: "$items.productPrice",
                    num_of_stocks: "$items.num_of_stocks",
                    images: "$items.images",
                    is_blocked: "$items.is_blocked",
                    reviews: "$items.reviews",
                    quantity: "$quantity",
                    totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },

                }
            }
        ];


        const TotalPricePipeline = [
            { $match: { userId } },
            { $unwind: "$products" },
            {
                $project: {
                    product: "$products.productId",
                    quantity: "$products.quantity",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "items",
                },
            },
            { $unwind: "$items" }, 
            {
                $project: {
                    productId: "$items._id",
                    productName: "$items.productName",
                    productCategory: "$items.productCategory",
                    productDescription: "$items.productDescription",
                    productPrice: "$items.productPrice",
                    num_of_stocks: "$items.num_of_stocks",
                    images: "$items.images",
                    is_blocked: "$items.is_blocked",
                    reviews: "$items.reviews",
                    quantity: "$quantity",
                    totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },

                }
            },
            {
                $group: {
                    _id: null,
                    grandTotal: { $sum: "$totalPrice" }
                }
            },
            {
                $project: {
                    _id: 0,
                    grandTotal: 1
                }
            }
        
        ]
        const findProducts = await Cart.aggregate(pipeline);
        const totalPriceResult = await Cart.aggregate(TotalPricePipeline);

        const grandTotal = totalPriceResult[0]?.grandTotal || 0; 

        res.render('cart', { products: findProducts ,cartCount,userId:user , grandTotal} );
    } catch (error) {
        next(error)
    }
};





const addToCart = async(req,res,next)=>{
    try {
        const productId = req.body.productId
        let quantity = 1
        if(req.body.quantity){
            quantity = parseInt(req.body.quantity)
        }
        const userId = req.session.user_id._id
        const product = await Product.findOne({_id:productId})
        const cart = await Cart.findOne({userId:userId})
        const checkCart = await Cart.findOne({userId:userId,"products.productId":productId})
        const page =req.query.page
        console.log(checkCart);
        if(page){
            if(checkCart){
                return res.status(200).json({alreadyincart:"product is out of stock"})
            }
            }
       
        if(product.num_of_stocks==0){
            return res.status(200).json({outofstock:"product is out of stock"})
        }
        if(!cart){
            const newCart = new Cart({
                userId,
                products: [
                  {
                    productId,
                    quantity: quantity || 1,
                  },
                ],
              });
             const saveToCart = await newCart.save();
            if(saveToCart){
             const count = newCart.products.reduce((total, item) => total + item.quantity, 0);
                res.status(200).json({count})
            }
        }else{


            const productIndex = cart.products.findIndex(p => p.productId.equals(productId));
            if (productIndex !== -1) {
                cart.products[productIndex].quantity = quantity;
            } else {
                cart.products.push({
                    productId,
                    quantity: quantity|| 1,
                });
            }

            const data = await cart.save();
            const count= cart.products.reduce((total, item) => total + item.quantity, 0);

            res.status(200).json({count})

            
        }

    } catch (error) {
        next(error);
    }

}





const incQuantity = async (req,res,next)=>{
    try {
        const productId= req.body.productId
        const user = req.session.user_id
        const quantity = req.body.quantity

        const userId = new mongoose.Types.ObjectId(user._id);


        const cart = await Cart.findOne({ userId });
                if(cart){
            const productIndex = cart.products.findIndex(p => p.productId.equals(productId));

            if(productIndex != -1){
                cart.products[productIndex].quantity = quantity;
              
                await cart.save();
                const count= cart.products.reduce((total, item) => total + item.quantity, 0);


        const TotalPricePipeline = [
            { $match: { userId } },
            { $unwind: "$products" },
            {
                $project: {
                    product: "$products.productId",
                    quantity: "$products.quantity",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "items",
                },
            },
            { $unwind: "$items" }, 
            {
                $project: {
                    productId: "$items._id",
                    productName: "$items.productName",
                    productCategory: "$items.productCategory",
                    productDescription: "$items.productDescription",
                    productPrice: "$items.productPrice",
                    num_of_stocks: "$items.num_of_stocks",
                    images: "$items.images",
                    is_blocked: "$items.is_blocked",
                    reviews: "$items.reviews",
                    quantity: "$quantity",
                    totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },

                }
            },
            {
                $group: {
                    _id: null,
                    grandTotal: { $sum: "$totalPrice" }
                }
            },
            {
                $project: {
                    _id: 0,
                    grandTotal: 1
                }
            }
        
        ]

        const eachProductTotalPricePipeline = [
            { $match: { userId } },
            { $unwind: "$products" },
            {
                $project: {
                    product: "$products.productId",
                    quantity: "$products.quantity",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "items",
                },
            },
            { $unwind: "$items" }, 
            {
                $project: {
                    productId: "$items._id",
                    productName: "$items.productName",
                    productCategory: "$items.productCategory",
                    productDescription: "$items.productDescription",
                    productPrice: "$items.productPrice",
                    num_of_stocks: "$items.num_of_stocks",
                    images: "$items.images",
                    is_blocked: "$items.is_blocked",
                    reviews: "$items.reviews",
                    quantity: "$quantity",
                    totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },

                }
            },
            {
                $project: {
                    _id: 0,
                    totalPrice: 1,productId:1
                }
            }
        
        ]

        const totalPriceResult = await Cart.aggregate(TotalPricePipeline);
        const total = await Cart.aggregate(eachProductTotalPricePipeline);

        const grandTotal = totalPriceResult[0]?.grandTotal || 0; 
        const totalPrice = eachProductTotalPricePipeline[0]?.totalPrice || 0; 
        const singleProductTotal=  total.filter((item)=>{
            return item.productId == productId
        })



                res.status(200).json({quantity,count,grandTotal,totalPrice:singleProductTotal[0].totalPrice})

            }



        }

    } catch (error) {
        next(error);
    }
}


const removeFromCart = async(req,res,next)=>{
    try {
        const user = req.session.user_id
        const productId =req.body.productId
        console.log(productId);
        
        const userId = new mongoose.Types.ObjectId(user._id);
        const cart = await Cart.findOne({ userId });





        const TotalPricePipeline = [
            { $match: { userId } },
            { $unwind: "$products" },
            {
                $project: {
                    product: "$products.productId",
                    quantity: "$products.quantity",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "items",
                },
            },
            { $unwind: "$items" }, 
            {
                $project: {
                    productId: "$items._id",
                    productName: "$items.productName",
                    productCategory: "$items.productCategory",
                    productDescription: "$items.productDescription",
                    productPrice: "$items.productPrice",
                    num_of_stocks: "$items.num_of_stocks",
                    images: "$items.images",
                    is_blocked: "$items.is_blocked",
                    reviews: "$items.reviews",
                    quantity: "$quantity",
                    totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },

                }
            },
            {
                $group: {
                    _id: null,
                    grandTotal: { $sum: "$totalPrice" }
                }
            },
            {
                $project: {
                    _id: 0,
                    grandTotal: 1
                }
            }
        
        ]


        


        
        
    

        console.log("userId ====" +userId +" productID ====="+productId);
        if(cart){
            cart.products = cart.products.filter(product => !product.productId.equals(productId));
            const data = await cart.save()
            console.log(data);
            const totalPriceResult = await Cart.aggregate(TotalPricePipeline);

        const grandTotal = totalPriceResult[0]?.grandTotal || 0; 

        console.log(grandTotal);
            const count= cart.products.reduce((total, item) => total + item.quantity, 0);

            res.status(200).json({data,count,grandTotal})

           
        }
        

    } catch (error) {
        next(error);
    }
}




module.exports ={
    loadCart,
    addToCart,
    removeFromCart,
    incQuantity,
}