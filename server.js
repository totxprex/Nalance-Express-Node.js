let express = require('express')
let app = express()
app.listen(process.env.PORT, function () {
  console.log('Server started at 127.0.0.1:5500')
})
let cors = require('cors')

app.use(cors({
  methods: ["POST", "GET", "PATCH", "PUT", "DELETE"],
  origin: "*",
  credentials: true
}))

app.use(express.json())

let helmet = require('helmet')
app.use(helmet())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

let dotenv = require('dotenv')
dotenv.config({ path: "./config.env" })

let morgan = require('morgan')
app.use(morgan('dev'))

let bcrypt = require('bcryptjs')
let jwt = require('jsonwebtoken')

let mongoose = require('mongoose')
mongoose.connect(process.env.mongo, {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Database Connected")
}).catch(function (err) {
  console.log("Error Connecting To Databse")
})


let schemas = require('./schemas.js')

let dbUsers = mongoose.model('users', schemas.usersSchema)

let dbGigs = mongoose.model('Gigs-Pool', schemas.gigPoolSchema)

let dbOrdersPool = mongoose.model('orders-pool', schemas.orderSchema)

module.exports = { dbUsers }

let errorResponce = function (resObj, message, error) {
  resObj.status(404).send({
    status: message || "Error",
    error: error?.message || "Internal Server Error"
  })
}

app.param('token', function (req, res, next) {
  jwt.verify(req.params.token, process.env.jwtKey, function (err, obj) {
    if (err) return errorResponce(res, "Authetication Failed")
    else {
      next()
    }
  })
})


app.param('key', function (req, res, next, param) {
  if (req.params.key !== "1680") return errorResponce(res, "Invalid Request")

  next()
})


app.use('/users', function (req, res, next) {
  if (req.body.password) {
    bcrypt.hash(req.body.password, 12).then(function (pass) {
      req.body.password = pass
      next()
    })
  }
  else {
    next()
  }
})

app.use('/signup', function (req, res, next) {
  if (req.body.password) {
    bcrypt.hash(req.body.password, 12).then(function (pass) {
      req.body.password = pass
      next()
    })
  }
  else {
    next()
  }
})




//Users Route

app.route('/users/:key/:token/:username?').get(function (request, responce) {
  let username = request.params.username
  dbUsers.findOne({ userName: username }).then(function (data) {
    responce.status(200).header({
      "content-type": "application/json"
    }).send({
      status: "One User Found",
      data: data
    })
  }).catch(function (err) {
    errorResponce(responce, "Error", err.message)
  })
}).post(function (request, responce) {
  if (request.body) {
    dbUsers.findOne({ userName: request.body.userName }).then(function (data) {
      if (data) return errorResponce(responce, "User Already Exists")

      dbUsers.create(request.body).then(function (data) {
        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          "status": "User Posted"
        })
      }).catch(function (err) {
        errorResponce(responce, "Error", err.message)
      })
    }).catch(function (err) {
      errorResponce(responce, "Error", err.message)
    })

  }
  else {
    errorResponce(responce, "Missing Info")
  }

}).delete(function (request, responce) {
  if (request.params.username) {
    dbUsers.findOneAndDelete({ userName: request.params.username }, {
      returnDocument: true
    }).then(function (data) {
      responce.status(200).send({
        status: "User Deleted"
      })
    }).catch(function (err) {
      errorResponce(responce, "Error Deleting User", err.message)
    })
  }
  else {
    errorResponce(responce, "Invalid Request")
  }
})





//signup

let { emailer } = require('./emailer.js')

app.post('/signup/:key', function (request, responce) {
  if (request.body) {
    dbUsers.findOne({ userName: request.body.userName }).then(function (data) {
      if (data) return errorResponce(responce, "User Already Exists")

      dbUsers.create(request.body).then(function (data) {

        let options = {
          from: "totxprex@gmail.com",
          to: request.body.email,
          subject: "Welcome to Nolancer!",
          html: "<p>Thanks for signing up to Nolancer. We are happy to have you. \n If you need any help, please reach out to our support at totxprex@gmail.com and we will be happ to help. \n Explore our amazing freelance talents and get a discount on your first order!</p>",
          text: ""
        }

        emailer(options)


        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          "status": "User Posted"
        })
      }).catch(function (err) {
        errorResponce(responce, "Error", err.message)
      })
    }).catch(function (err) {
      errorResponce(responce, "Error", err.message)
    })

  }
  else {
    errorResponce(responce, "Missing Info")
  }
})





//login to get token

app.get('/login/:key/:username/:password', function (request, responce) {
  let username = request.params.username
  let password = request.params.password

  let startFinding = dbUsers.findOne({ userName: username }).select('+password')

  startFinding.then(function (data) {
    if (data) {
      bcrypt.compare(password, data.password).then(function (verified) {
        if (!verified) return errorResponce(responce, "Incorrect Login Details")
        else {
          let token = jwt.sign({ userName: username }, process.env.jwtKey, {
            expiresIn: "24h"
          })
          // responce.cookie("token", token, {
          //   expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
          //   secure: true,
          //   httpOnly: true,
          //   sameSite: "none"
          // })

          // let options = {
          //   from: "totxprex@gmail.com",
          //   to: data.email,
          //   subject: "Nolancer Login Attempt",
          //   html: "<p>A login attempt was made to your Nolancer accout. If this was not you, please contact support immediately",
          //   text: ""
          // }

          // emailer(options)

          responce.status(200).send({
            status: "Login successful",
            token: token
          })

        }

      })
    }
    else {
      errorResponce(responce, "Incorrect Login Details")
    }
  }).catch(function (err) {
    errorResponce(responce, "Error", err.message)
  })
})



//password reset routes
app.get('/passwordReset/:key/:email', function (request, responce) {
  dbUsers.findOne({ email: request.params.email }).then(function (data) {
    if (!data) return errorResponce(responce, "Invalid email address")

    let resetToken = jwt.sign({ email: request.params.email }, process.env.jwtKey, {
      expiresIn: "10m"
    })

    let options = {
      from: "totxprex@gmail.com",
      to: request.params.email,
      subject: "Password Reset",
      html: `<p>Please follow the link below to rest your password: \n http://127.0.0.1:5500/password/${resetToken}</p> `
    }

    emailer(options)

    responce.status(200).send({
      "status": "Password reset link sent to user email"
    })

  })
})


app.post('/password/:token', function (request, responce) {

  let newPass = request.body.password

  if (request.body.password) {
    jwt.verify(request.params.token, process.env.jwtKey, function (err, obj) {
      if (err) return errorResponce(responce, "Authentication Failed")
      dbUsers.findOneAndUpdate({ email: obj.email }, { password: newPass }, {
        new: true,
        runValidators: true
      }).then(function (data) {
        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          status: "Password changed succesfully",
          data: data
        })

        let options = {
          from: "totxprex@gmail.com",
          to: obj.email,
          subject: "Password Changed",
          html: `<p>Password Changed Successful</p> `
        }

        emailer(options)

      }).catch(function (err) {
        errorResponce(responce, "Error", err.message)
      })
    })
  }
  else {
    errorResponce(responce, "Error")
  }
})




//add a gig
app.post('/addp/:key/:username/:token', function (request, responce) {
  if (!request.body.price) return errorResponce(responce, "Invalid Request")

  let product = request.body

  let startFinding = dbUsers.findOne({ userName: request.params.username }).select('+password')
  startFinding.then(function (data) {
    if (!data) return errorResponce(responce, "User Does Not Exist")

    let obj = { ...data._doc }

    let find = obj.userGigs.find(function (e) {
      return e.gigName === product.gigName
    })

    if (find) return errorResponce(responce, "Product Already Exist")

    obj.userGigs.push(product)

    product.gigOwner = obj

    dbUsers.findOneAndUpdate({ userName: request.params.username }, { userGigs: obj.userGigs }, {
      runValidators: true,
      new: true
    }).then(function (data) {
      dbGigs.create(product).then(function (da) {
        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          "status": "Product Added Succesfully"
        })
      }).catch(function (err) {
        errorResponce(responce, "Error 1", err.message)
      })
    }).catch(function (err) {
      errorResponce(responce, "Error 2", err.message)
    })
  })
})




//search and advanced query

app.get('/products/:key/:token/:productTag?', function (request, responce) {
  if (request.params.productTag) {
    let requestName = request.params.productTag.replaceAll("-", ` `)
    dbGigs.findOne({ gigName: requestName }).then(function (data) {
      if (data) {
        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          status: "Found One Gig",
          data: data
        })
      }
      else {
        let tagName = request.params.productTag.split("-")[0]
        let startFinding = dbGigs.find({ tags: tagName })

        if (request.query.page && request.query.limit) {
          let page = Number(request.query.page)
          let limit = Number(request.query.limit)
          startFinding.skip((page - 1) * limit).limit(limit)
        }

        if (request.query.sort) {
          console.log(request.query.sort)
          let so = request.query.sort.replaceAll(',', ` `)
          startFinding.sort(so)
        }

        startFinding.then(function (data) {
          if (!data) return errorResponce(responce, "Cannot find gig!")
          responce.status(200).header({
            "content-type": "application/json"
          }).send({
            status: "Found All Gigs By Tag",
            data: data
          })
        })
      }
    }).catch(function (err) {
      errorResponce(responce, "Error 1", err.message)
    })
  }
  else if (request.query.productName) {
    dbGigs.findOne({ gigName: request.query.productName.replaceAll('-', ` `) }).then(function (data) {
      if (data) {
        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          status: "Found One Gig",
          data: data
        })
      }
      else {
        errorResponce(responce, 'Cannot Find Product')
      }
    }).catch(function (err) {
      errorResponce(responce, "Error 1", err.message)
    })
  }
  else {
    let startFinding = dbGigs.find()
    if (request.query.page && request.query.limit) {
      let page = Number(request.query.page)
      let limit = Number(request.query.limit)
      startFinding.skip((page - 1) * limit).limit(limit)
    }

    if (request.query.sort) {
      let so = request.query.sort.replaceAll(",", ` `)
      startFinding.sort(so)
    }

    startFinding.then(function (data) {
      responce.status(200).header({
        "content-type": "application/json"
      }).send({
        status: "Found All Gigs",
        data: data
      })
    }).catch(function (err) {
      errorResponce(responce, "Error 1", err.message)
    })
  }
})


//update user bio

app.patch('/bio/:key/:username/:token', function (request, responce) {
  let bio = request.body.about
  console.log(bio)
  let username = request.params.username
  if (!bio) return errorResponce(responce, "Error")

  dbUsers.findOneAndUpdate({ userName: username }, { about: bio }, {
    new: true,
    runValidators: true
  }).then(function (data) {
    responce.status(200).header({
      "content-type": "application/json"
    }).send({
      status: "User Updated",
      data: data
    })
  }).catch(function (err) {
    errorResponce(responce, "Error", err.message)
  })
})




//delete a gig

app.delete('/delete/:key/:username/:token', function (request, responce) {
  if (request.body) {
    let user = request.params.username
    let startFinding = dbUsers.findOne({ userName: user }).select('+password')
    startFinding.then(function (data) {
      if (!data) return errorResponce(responce, "Internal Server Error")
      let userFound = data

      let newUserGigs = userFound.userGigs.filter(function (e, i) {
        return e.gigName !== request.body.gigName
      })
      userFound.userGigs = newUserGigs

      dbUsers.findOneAndUpdate({ userName: user }, userFound, {
        runValidators: true
      }).then(function (data) {
        dbGigs.findOneAndDelete(request.body).then(function (data) {
          responce.status(200).send({
            status: "Gig Deleted"
          })
        }).catch(function (err) {
          errorResponce(responce, "Error", err.message)
        })
      }).catch(function (err) {
        errorResponce(responce, "Error", err.message)
      })
    })
  }

  else {
    errorResponce(responce, "Internal Server Error")
  }
})





//Open an order and get an order by mongoDB generated ID and approve/close order PATCH http protocol

app.route('/order/:key/:token/:id?').post(function (request, responce) {
  let order = request.body
  if (!request.body.orderName) errorResponce(responce, "Server Error")

  dbOrdersPool.create(request.body).then(function (data) {
    responce.status(200).header({
      "content-type": "application/json"
    }).send({
      "status": "Order created",
      data: data
    })

    let options = {
      from: "totxprex@gmail.com",
      to: data.buyerDetails.email,
      subject: `Your Order (${data._id})`,
      text: `Thanks for creating an order. You can now send a message to the seller, ${data.sellerDetails.name}. \n \n Order ID - ${data._id} \n \n If there are any problems, be sure to write customer support and we'll be happy to help! \n \n Nalance Inc.`
    }
    emailer(options)
  }).catch(function (err) {
    errorResponce(responce, "Error", err.message)
  })
}).get(function (request, responce) {
  let id = request.params.id
  if (!id) return errorResponce(responce, "Error")

  dbOrdersPool.findById(id).then(function (data) {
    if (!data) return errorResponce(responce, "Error")

    responce.status(200).header({
      "content-type": "application/json"
    }).send({
      status: "Order Found",
      data: data
    })
  }).catch(function (err) {
    errorResponce(responce, "Error", err.message)
  })
}).patch(function (request, responce) {
  //Note this route closes an order please
  let orderID = request.params.id
  if (!orderID) return errorResponce(responce, "Error")

  dbOrdersPool.findByIdAndUpdate(orderID, { active: false }, {
    runValidators: true
  }).then(function (data) {
    responce.status(200).send({
      status: "order closed"
    })
  }).catch(function (err) {
    errorResponce(responce, "Error", err.message)
  })
})



//Send Message For Order Page
app.post('/message/:key/:token/:id', function (request, responce) {
  let sender = request.query.sender.replaceAll(`-`, ` `)
  let reciever = request.query.reciever.replaceAll(`-`, ` `)
  let message = request.body.message
  dbOrdersPool.findById(request.params.id).then(function (data) {
    let orderObj = data
    orderObj.conversations.push({
      name: sender,
      message: message,
      data: Date.now()
    })
    dbOrdersPool.findByIdAndUpdate(request.params.id, { conversations: orderObj.conversations }).then(function (data) {
      responce.status(200).send({
        status: "Message sent"
      })
    }).catch(function (err) {
      errorResponce(responce, "Error", err.message)
    })
  }).catch(function (err) {
    errorResponce(responce, "Error", err.message)
  })
})




//File Upload
let file = require('./fileUpload.js')
app.use(express.static("./public"))


app.use("/file", file.fileRouterApp)


































































































































//File Upload

let multer = require('multer')

let upload = multer({ dest: "./userProfilePics" })


app.use('/file', upload.single("attached_file"))

app.post('/file/:key/:token', function (request, responce) {
  responce.status(200).send({
    status: "File Upload Succesful"
  })
  console.log(request.file)
})








app.use(function (req, res) {
  res.status(404).send("Cannot find route")
})





