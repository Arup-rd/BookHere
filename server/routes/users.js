const express = require('express');
const User = require('../controllers/user');
const router = express.Router();
const smtp = require('../helpers/smtp')


router.post('/auth', User.auth);

router.post('/register', User.register, smtp.SendVerificationMail);
router.get('/validate', User.ValidateAccount)

router.get('/:id', User.authMiddleware, User.getUser);
module.exports = router;


