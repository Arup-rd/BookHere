const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    min: [4, 'Too short, min is 4 characters'],
    max: [32, 'Too long, max is 32 characters']
  },
  email: {
    type: String,
    min: [4, 'Too short, min is 4 characters'],
    max: [32, 'Too long, max is 32 characters'],
    unique: true,
    lowercase: true,
    required: 'Email is required',
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
  },
  password: {
    type: String,
    min: [4, 'Too short, min is 4 characters'],
    max: [32, 'Too long, max is 32 characters'],
    required: 'Password is required'
  },
  stripeCustomerId: String,
  revenue: Number,
  rentals: [{type: Schema.Types.ObjectId, ref: 'Rental'}],
  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  history: [{
    type: String
  }],
  is_active: {
    type: Boolean,
    default: false
  }
});

userSchema.methods = {
  hasSamePassword(requestedPassword) {
    return bcrypt.compareSync(requestedPassword, this.password);
  },
  _hashPassword(password) {
    return bcrypt.hashSync(password);
  },
}
userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = this._hashPassword(this.password);
    return next();
  }
  return next();
});


module.exports = mongoose.model('User', userSchema );
