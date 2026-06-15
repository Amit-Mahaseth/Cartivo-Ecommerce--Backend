const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type:String, required: true },
    isdefault: { type: Boolean, default: false },
    country: { type: String, required: true }
});
const userSchema = new mongoose.Schema({
    username: { type: String,
         required: true,
          unique: true
         },
    email: { type: String,
         required: true,
          unique: true
         },
    password: { type: String,
         required: true,
         select: false
         },
         FullName: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true }
         },
         phone: { type: String,
            required: true,
             unique: true
            },
            Address: [AddressSchema],
role:{
    type: String,
    enum: ['user', 'seller'],
    default:'user'
},
    createdAt: { type: Date,
         default: Date.now
         }
})

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;