const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).json('Server error')
    }
});

// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  Public
router.post('/', [
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;
    try{
        // see if user exists
        let user = await User.findOne({email});

        if(!user){
            return res.status(400).json({errors : [{msg:'Invalid credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({errors : [{msg:'Invalid credentials'}]})
        }

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