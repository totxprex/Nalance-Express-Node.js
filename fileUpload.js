let multer = require('multer')
let express = require('express')
let server = require('./server.js')

let fileRouterApp = express.Router()

let upload = multer({ dest: "./public/img" })

fileRouterApp.post("/img/:username", upload.single('img'), function (req, res) {
  server.dbUsers.findOneAndUpdate({ userName: req.params.username }, { img: req.file.filename }, {
    runValidators: true
  }).then(function () {
    res.status(200).header({
      "content-type": "text/html"
    }).send(`<!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title class="title">Loading...</title>
      <link rel="stylesheet" href="dashboard.css">
      <link rel="icon" href="./images/logo1.png">
      <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,500;1,500&family=Roboto+Flex:opsz,wght@8..144,100;8..144,300;8..144,1000&display=swap">
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@200&family=Roboto+Flex:opsz,wght@8..144,100;8..144,300;8..144,1000&display=swap"
        rel="stylesheet">
    
    </head>
    
    <body>
    </body>
    <script src="/reload.js"></script>
    </html>`)
  }).catch(function () {
    res.status(404)
  })
})



module.exports = { fileRouterApp }

