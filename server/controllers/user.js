const User = require('../models/user');
const { normalizeErrors } = require('../helpers/mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');

exports.getUser = function(req, res) {
  const requestedUserId = req.params.id;
  const user = res.locals.user;

  if (requestedUserId === user.id) {
    User.findById(requestedUserId, function(err, foundUser) {
      if (err) {
        return res.status(422).send({errors: normalizeErrors(err.errors)});
      }

      return res.json(foundUser);
    })

  } else {
    User.findById(requestedUserId)
      .select('-revenue -stripeCustomerId -password')
      .exec(function(err, foundUser) {
        if (err) {
        return res.status(422).send({errors: normalizeErrors(err.errors)});
        }


        return res.json(foundUser);
      })
  }
}

exports.ValidateAccount = async (req, res) => {
  const token = req.headers.token;
  try {
    const userInfo = await jwtVerify(token);
    try {
      // user = await userModel.create(userInfo);
      const user = new User({
        username: userInfo.username,
        email: userInfo.email,
        password: userInfo.password
      });
      await user.save(function(err) {
        if (err) {
          return res.status(422).send({errors: normalizeErrors(err.errors)});
        }
        console.log("verified")
        res.json({
          status: true,
          message: "Your account verifcations successfull"
        })
      })
    } catch (e) {
      res.json({
        status: false,
        message: "Cannot verify"
      })
    }
  } catch (e) {
    res.json({
      status: false,
      message: "Security code expired...!"
    })
  }
}

const jwtVerify = token => new Promise((resolve, reject) => {
  jwt.verify(token, config.SECRET, (err, decoded) => {
    if (err || !decoded) {
      reject(err);
    }
    resolve(decoded);
  });
});


exports.auth =  function(req, res) {
  const { email, password } = req.body;


  if (!password || !email) {
    return res.status(422).send({errors: [{title: 'Data missing!', detail: 'Provide email and password!'}]});
  }

  User.findOne({email}, function(err, user) {
    if (err) {
      return res.status(422).send({errors: normalizeErrors(err.errors)});
    }

    if (!user) {
      return res.status(422).send({errors: [{title: 'Invalid User!', detail: 'User does not exist'}]});
    }
    if (user.hasSamePassword(password)) {
      const token = jwt.sign({
        userId: user.id,
        username: user.username
      }, config.SECRET, { expiresIn: '1h'});
      return res.json(token);
    } else {
      return res.status(422).send({errors: [{title: 'Wrong Data!', detail: 'Wrong email or password'}]});
    }
  });
}

exports.register =  function(req, res, next) {
  const { username, email, password, passwordConfirmation } = req.body;

  if (!password || !email) {
    return res.status(422).send({errors: [{title: 'Data missing!', detail: 'Provide email and password!'}]});
  }

  if (password !== passwordConfirmation) {
    return res.status(422).send({errors: [{title: 'Invalid passsword!', detail: 'Password is not a same as confirmation!'}]});
  }

  User.findOne({email}, function(err, existingUser) {
    if (err) {
      return res.status(422).send({errors: normalizeErrors(err.errors)});
    }

    if (existingUser) {
      return res.status(422).send({errors: [{title: 'Invalid email!', detail: 'User with this email already exist!'}]});
    }

    const user = new User({
      username,
      email,
      password
    });

    req.user = user;

    next();

  })
}

exports.authMiddleware = function(req, res, next) {
  const token = req.headers.authorization;

  if (token) {
    const user = parseToken(token);

    User.findById(user.userId, function(err, user) {
      if (err) {
        return res.status(422).send({errors: normalizeErrors(err.errors)});
      }

      if (user) {
        res.locals.user = user;
        next();
      } else {
        return notAuthorized(res);
      }
    })
  } else {
    return notAuthorized(res);
  }
}

const parseToken = (token) => {
  return jwt.verify(token.split(' ')[1], config.SECRET);
}

exports.parseToken = parseToken;

function notAuthorized(res) {
  return res.status(401).send({errors: [{title: 'Not authorized!', detail: 'You need to login to get access!'}]});
}

