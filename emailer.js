let nodemailer = require('nodemailer')

let emailer = function (obj) {
  let transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 465,
    secure: false,
    auth: {
      user: "ee3ae1e1718976",
      pass: "7b92081c0d5267"
    }
  })

  transporter.sendMail(obj).then(function (mail) {
    console.log("Mail Sent Successfully")
  }).catch(function (err) {
    console.log(err)
  })
}



module.exports = { emailer }