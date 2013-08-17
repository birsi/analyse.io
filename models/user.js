/**!
 * analyse.io
 *
 * user.js
 * User model
 * Using mongoose object data modelling for creating the user model
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    crypto = require('crypto'),
    authTypes = ['twitter'];

/**
 *  User Schema definition
 *  http://mongoosejs.com/docs/guide.html
 **/
var UserSchema = mongoose.Schema({

    name: {
        type: 'String',
        default: ''
    },
    email: {
        type: 'String',
        default: ''
    },
    password: {
        type: 'String',
        default: ''
    },
    salt: {
        type: 'String',
        default: ''
    },
    provider: {
        type: 'String',
        default: ''
    },
    passwordResetToken: {
        type: 'String',
        default: null
    },
    passwordResetDate: {
        type: Date,
        default: null
    },
    twitter: {}

});

/**
 *  User Validation
 *  Server-side validation of the users input
 *  The user input is validated against empty fields and
 *  it checks if a user with a specific email already exists
 *  http://mongoosejs.com/docs/validation.html
 **/
UserSchema
    .path('name')
    .validate(function(name) {
        return name.length;
    }, 'Name cannot be blank');

UserSchema
    .path('email')
    .validate(function(email) {
        // Only validate if the user doesn't login via twitter
        if (authTypes.indexOf(this.provider) !== -1) {
            return true;
        }
        return email.length;
    }, 'Email cannot be blank');

UserSchema
    .path('email')
    .validate(function(email, respond) {
        // Only validate if the user doesn't login via twitter
        if (authTypes.indexOf(this.provider) !== -1) {
            respond(true);
        }
        // Asynchronous validation to see if a user with this email already exists
        var User = mongoose.model('User');
        if (this.isNew || this.isModified('email')) {
            User.find({
                email: email
            }).exec(function(err, users) {
                respond(!err && users.length === 0);
            });
        } else {
            respond(true);
        }
    }, 'Email already exists');

UserSchema
    .path('password')
    .validate(function(password) {
        // Only validate if the user doesn't login via twitter
        if (authTypes.indexOf(this.provider) !== -1) {
            return true;
        }
        return password.length;
    }, 'Password cannot be blank');

/**
 *  User Pre Save
 *  Middleware to create the secure password before saving
 *  http://mongoosejs.com/docs/middleware.html
 **/
UserSchema
    .pre('save', function(next) {

        var user = this;

        if (!user.isModified('password')) return next();

        if (user.password.length < 6) {
            next(new Error('Password to short!'));
        }

        if (!user.password) {
            user.password = '';
        } else {
            user.createSecurePassword(user, next);
        }

    });

/**
 *  User Methods
 *  Available prototype methods which get inherited to the user model
 *  http://mongoosejs.com/docs/guide.html#methods
 **/
UserSchema.methods = {

    // Compares the plain password with the stored password
    authenticate: function(plainText) {
        return bcrypt.compareSync(plainText, this.password);
    },

    // Create user salt and secure password
    createSecurePassword: function(user, next) {
        console.log('Trying to create password');
        bcrypt.genSalt(10, function(err, salt) {
            if (err) return next(err);
            bcrypt.hash(user.password, salt, function(err, hash) {
                if (err) return next(err);
                user.salt = salt;
                user.password = hash;
                return next();
            });
        });
    },

    // Create password reset token
    createPasswordResetToken: function(next) {
        var user = this;

        // Set the date
        user.passwordResetDate = Date.now();

        // Create the password reset token
        require('crypto').randomBytes(48, function(err, buf) {
            if (err) return next(err);
            user.passwordResetToken = buf.toString('hex');
            return next(err, user.passwordResetToken);
        });

    }

};

// Construct the user model according to the defined schema
mongoose.model('User', UserSchema);