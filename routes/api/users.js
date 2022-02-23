const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route   POST api/users
// @desc    Register user
// @access  Public

router.post('/', [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({min:6})
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {name, email, password} = req.body;
    try{
        // see if user exists
        let user = await User.findOne({email});

        if(user){
            return res.status(500).json({errors : [{msg:'User already exists'}]});
        }

        // get user gravatar
        const avatar = gravatar.url(email, {
            s:'200',
            r: 'pg',
            d: 'mm',
        })

        user = new User({
            name,
            email,
            password,
            avatar
        });

        // encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // saving the user
        await user.save();

        // in mongodb the user's id is stored with _id but in mongoose we can use id
        const payload = {
            user: {
                id:user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            {expiresIn: 360000},
            (err, token) => {
                if(err) throw err;
                res.json({ token })
            }
        )

    }catch(err){
        console.log(err.message);
        res.json('Server error');
    }
    

});

module.exports = router;