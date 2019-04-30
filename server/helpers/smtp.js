const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = {
  user: "event.owner.fvr@gmail.com",
  pass: "evnt@ownr2121"
}

exports.SendVerificationMail = async (req, res) => {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: auth
  });


  const token = jwt.sign({
    userId: req.user._id,
    username: req.user.username,
    email: req.user.email,
  }, config.SECRET, { expiresIn: '1h' });


  let link = 'http://localhost:3000/verification?security_code=' + token

  const mailOptions = {
    from: auth.user,
    to: req.body.email, // Admin Email Will Be Here
    subject: `Verification code from Book Here`,
    html: `<h3>Verify your account</h3><br/>
      <p><a href="${link}" target="_blank">${link}</a></p>
    `
  };

  try {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        res.json({
          status: false,
          message: "There is something error",
          error: err
        })
      } else {
        res.json({
          status: true,
          message: "Verification link sent to your email " + req.body.email 
        })
      }
    });
  } catch (e) {
    res.json({
      status: false,
      message: "Email connot be sent"
    })
  }
}