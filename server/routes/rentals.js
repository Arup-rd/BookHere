const express = require('express');
const router = express.Router();
const Rental = require('../models/rental');
const User = require('../models/user');
const { normalizeErrors } = require('../helpers/mongoose');

const UserCtrl = require('../controllers/user');

router.get('/secret', UserCtrl.authMiddleware, function (req, res) {
  res.json({ "secret": true });
});

router.get('/manage', UserCtrl.authMiddleware, function (req, res) {
  const user = res.locals.user;

  Rental
    .where({ user })
    .populate('bookings')
    .exec(function (err, foundRentals) {

      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      return res.json(foundRentals);
    });
});

router.get('/:id/verify-user', UserCtrl.authMiddleware, function (req, res) {
  const user = res.locals.user;

  Rental
    .findById(req.params.id)
    .populate('user')
    .exec(function (err, foundRental) {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      if (foundRental.user.id !== user.id) {
        return res.status(422).send({ errors: [{ title: 'Invalid User!', detail: 'You are not rental owner!' }] });
      }


      return res.json({ status: 'verified' });
    });
});

router.get('/:id', function (req, res) {
  const rentalId = req.params.id;

  Rental.findById(rentalId)
    .populate('user', 'username -_id')
    .populate('bookings', 'startAt endAt -_id')
    .exec(function (err, foundRental) {

      if (err || !foundRental) {
        return res.status(422).send({ errors: [{ title: 'Rental Error!', detail: 'Could not find Rental!' }] });
      }

      return res.json(foundRental);
    });
});

router.patch('/:id', UserCtrl.authMiddleware, function (req, res) {

  const rentalData = req.body;
  const user = res.locals.user;

  Rental
    .findById(req.params.id)
    .populate('user')
    .exec(function (err, foundRental) {

      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      if (foundRental.user.id !== user.id) {
        return res.status(422).send({ errors: [{ title: 'Invalid User!', detail: 'You are not rental owner!' }] });
      }

      foundRental.set(rentalData);
      foundRental.save(function (err) {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }

        return res.status(200).send(foundRental);
      });
    });
});

router.delete('/:id', UserCtrl.authMiddleware, function (req, res) {
  const user = res.locals.user;

  Rental
    .findById(req.params.id)
    .populate('user', '_id')
    .populate({
      path: 'bookings',
      select: 'startAt',
      match: { startAt: { $gt: new Date() } }
    })
    .exec(function (err, foundRental) {

      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      if (user.id !== foundRental.user.id) {
        return res.status(422).send({ errors: [{ title: 'Invalid User!', detail: 'You are not rental owner!' }] });
      }

      if (foundRental.bookings.length > 0) {
        return res.status(422).send({ errors: [{ title: 'Active Bookings!', detail: 'Cannot delete rental with active bookings!' }] });
      }

      foundRental.remove(function (err) {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }

        return res.json({ 'status': 'deleted' });
      });
    });
});

router.post('/', UserCtrl.authMiddleware, function (req, res) {
  const { title, city, street, category, image, shared, bedrooms, description, dailyRate } = req.body;
  const user = res.locals.user;

  const rental = new Rental({ title, city, street, category, image, shared, bedrooms, description, dailyRate });
  rental.user = user;

  Rental.create(rental, function (err, newRental) {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }

    User.update({ _id: user.id }, { $push: { rentals: newRental } }, function () { });

    return res.json(newRental);
  });
});

router.get('/', async (req, res) => {
  const city = req.query.city;
  const query = city ? { city: city.toLowerCase() } : {};

  if (city) {
    Rental.find(query)
      .select('-bookings')
      .exec(function (err, foundRentals) {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }

        if (city && foundRentals.length === 0) {
          return res.status(422).send({ errors: [{ title: 'No Rentals Found!', detail: `There are no rentals for city ${city}` }] });
        }

        if (req.headers.authorization) {
          var userInfo = UserCtrl.parseToken(req.headers.authorization)
          User.findOne({ _id: userInfo.userId }).then((user) => {
            if (city) {
              user.history.push(city);
              user.save();
            }
          })
        }
        
        return res.json(foundRentals.reverse());
      });
  } else if (req.headers.authorization) {
    var userInfo = UserCtrl.parseToken(req.headers.authorization)
    var user = await User.findOne({ _id: userInfo.userId });
    if (user.history.length === 0) {
      Rental.find(query)
        .select('-bookings')
        .exec((err, foundRentals) => {
          if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
          }
          return res.json(foundRentals.reverse());
        })
    } else {
      var last = user.history.reverse().slice(0, 10);
      var data = [];
      for(var i=0;i<last.length; i++) {
        var response = await Rental.find({ city: { $in: last[i] } });
        data = [...data, ...response];
      }
      return res.json(data);
    }
  } else {
    Rental.find(query)
      .select('-bookings')
      .exec((err, foundRentals) => {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json(foundRentals.reverse());
      })
  }
});

module.exports = router;


