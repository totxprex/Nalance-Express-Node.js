let mongoose = require('mongoose')
let validator = require('validator')

let usersSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "User Full Name Required"]
  },
  rating: {
    type: String,
    default: "100%"
  },
  balance: {
    type: Number,
    default: 0
  },
  about: {
    type: String,
    maxLength: 1500
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Error Validating Email"],
    trim: true,
    required: [true, "Email Not Specified"]
  },
  mobileNumber: {
    type: String,
    default: "Nil"
  },
  userName: {
    type: String,
    require: [true, "No Username"],
    trim: true
  },
  password: {
    type: String,
    select: false
  },
  userProfilePic: String,
  conversations: Array,
  userGigs: [
    {
      gigName: {
        type: String,
        maxLength: 100,
        trim: true
      },
      price: {
        type: Number,
        max: 2000,
      },
      rating: {
        type: Number,
        default: 1,
        max: 5
      },
      gigDescription: {
        type: String,
        maxLength: 2000
      },
      deliveryDays: {
        type: Number,
        default: 1
      },
      gigImage: String,
      tags: [String]
    }
  ],
  orders: {
    type: Array
  },
  img: {
    type: String
  }
})


//had to bring this model here, so i can add new order to users order
let dbUsers = mongoose.model('users', usersSchema)



let gigPoolSchema = new mongoose.Schema(
  {
    gigName: {
      type: String,
      maxLength: 100,
      trim: true,
      required: [true, "Gig must have a name"]
    },
    price: {
      type: Number,
      max: 2000,
      required: [true, "Gig must have a price"]
    },
    rating: {
      type: Number,
      default: 1,
      max: 5
    },
    gigDescription: {
      type: String,
      maxLength: 2000,
      required: [true, "Gig must have a description"]
    },
    deliveryDays: {
      type: Number,
      required: [true, "Gig must have a delivery days"],
      default: 1
    },
    gigImage: String,
    tags: [String],
    gigOwner: {
      name: {
        type: String,
        trim: true,
        required: [true, "User Full Name Required"]
      },
      rating: {
        type: String,
        default: "100%"
      },
      balance: {
        type: Number,
        default: 0
      },
      about: {
        type: String,
        maxLength: 1500
      },
      email: {
        type: String,
        validate: [validator.isEmail, "Error Validating Email"],
        trim: true,
        required: [true, "Email Not Specified"]
      },
      mobileNumber: {
        type: String,
        default: "Nil"
      },
      userName: {
        type: String,
        require: [true, "No Username"],
        trim: true
      },
      password: {
        type: String,
        select: false
      },
      userProfilePic: String,
      conversations: Array,
      userGigs: [
        {
          gigName: {
            type: String,
            maxLength: 100,
            trim: true
          },
          price: {
            type: Number,
            max: 2000,
          },
          rating: {
            type: Number,
            default: 1,
            max: 5
          },
          gigDescription: {
            type: String,
            maxLength: 2000
          },
          deliveryDays: {
            type: Number,
            default: 1
          },
          gigImage: String,
          tags: [String]
        }
      ]
    }
  }
)



let orderSchema = new mongoose.Schema({
  buyerDetails: {
    name: {
      type: String,
      trim: true,
      required: [true, "User Full Name Required"]
    },
    rating: {
      type: String,
      default: "100%"
    },
    balance: {
      type: Number,
      default: 0
    },
    about: {
      type: String,
      maxLength: 1500
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Error Validating Email"],
      trim: true,
      required: [true, "Email Not Specified"]
    },
    mobileNumber: {
      type: String,
      default: "Nil"
    },
    userName: {
      type: String,
      require: [true, "No Username"],
      trim: true
    },
    userProfilePic: String,
    conversations: Array,
    orders: Array
  },
  sellerDetails: {
    name: {
      type: String,
      trim: true,
      required: [true, "User Full Name Required"]
    },
    rating: {
      type: String,
      default: "100%"
    },
    balance: {
      type: Number,
      default: 0
    },
    about: {
      type: String,
      maxLength: 1500
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Error Validating Email"],
      trim: true,
      required: [true, "Email Not Specified"]
    },
    mobileNumber: {
      type: String,
      default: "Nil"
    },
    userName: {
      type: String,
      require: [true, "No Username"],
      trim: true
    },
    userProfilePic: String,
    conversations: Array,
    orders: Array
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  orderName: {
    type: String,
    required: true
  },
  orderPrice: {
    type: Number,
    required: true
  },
  conversations: [{
    name: String,
    message: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now()
    }
  }],
  orderQty: {
    type: Number,
    required: true
  },
  orderDeadlineDate: {
    type: Date,
    default: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  },
  orderDuration: Number,
  active: {
    type: Boolean,
    default: true
  }
})


orderSchema.post('save', function (doc, next) {

  dbUsers.findOne({ userName: doc.buyerDetails.userName }).then(function (data) {
    let userData = data
    let orderId = doc._id
    userData.orders.push(orderId)
    dbUsers.findOneAndUpdate({ userName: doc.buyerDetails.userName }, { orders: userData.orders }, {
      runValidators: true
    }).then(function () {
      dbUsers.findOne({ userName: doc.sellerDetails.userName }).then(function (data) {
        let userData = data
        let orderId = doc._id
        userData.orders.push(orderId)
        dbUsers.findOneAndUpdate({ userName: doc.sellerDetails.userName }, { orders: userData.orders }, {
          runValidators: true
        }).then(function () {
          console.log("Users orders updated")
        })
      })
    })
  })
  next()
})





module.exports = { usersSchema, gigPoolSchema, orderSchema }