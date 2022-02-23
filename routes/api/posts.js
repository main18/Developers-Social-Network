const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Posts');

// @route   POST api/posts
// @desc    Create Post
// @access  Private
router.post('/', [auth,
        [
            body('text', 'text is required').not().isEmpty(),
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post({
                text:req.body.text,
                name:user.name,
                avatar:user.avatar,
                user:req.user.id,
            });

            const post = await newPost.save();
            return res.json(post);
        } catch (err) {
            console.error(err.message);
            res.status(500).json('Server Error');
        }

    });


// @route   GET api/posts
// @desc    Get All Posts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        //sort from the most recent to the oldest
        const posts = await Post.find().sort({date:-1});
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server Error');
    }
});


// @route   GET api/posts/:id
// @desc    Get Post By ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            res.status(404).json({msg:' Post Not Found'});
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            res.status(404).json({msg:' Post Not Found'});
        }
        res.status(500).json('Server Error');
    } 
});


// @route   DELETE api/posts/:id
// @desc    Delete Post By id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findByIdAndRemove(req.params.id);

        if(!post){
            res.status(404).json({msg:'Post Not Found'});
        }

        //Check user : only the owner of the post can delete the post
        if(post.user.toString() !== req.user.id){
            res.status(401).json({msg:'Not Authorized'});
        }

        res.json({msg:'Post removed'});

    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            res.status(404).json({msg:'Post Not Found'});
        }
        res.status(500).json('Server Error');
    } 
});


// @route   PUT api/posts/like/:id
// @desc    Like Post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({msg:' Post Not Found'});
        }

        // check if the post is already liked by the same user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
            res.status(400).json({msg:'Post already liked'})
        }

        post.likes.unshift({user:req.user.id});

        await post.save();

        res.json(post.likes)

    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            res.status(404).json({msg:' Post Not Found'});
        }
        res.status(500).json('Server Error');
    } 
});


// @route   PUT api/posts/unlike/:id
// @desc    Like Post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({msg:' Post Not Found'});
        }

        // check if the post is already liked by the same user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            return res.json({msg:'Post has not yet been liked'})
        }

        const unlike = post.likes.filter(like => {
            return like.user.toString() !== req.user.id
        })

        post.likes = unlike;

        await post.save();

        res.json(post.likes)

    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            res.status(404).json({msg:' Post Not Found'});
        }
        res.status(500).json('Server Error');
    } 
});


// @route   POST api/posts/comments/:id
// @desc    Comment on a post
// @access  Private
router.post('/comment/:id', [auth,
    [
        body('text', 'text is required').not().isEmpty(),
    ]
],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({msg:' Post Not Found'});
        }

        const newComment = {
            text:req.body.text,
            name:user.name,
            avatar:user.avatar,
            user:req.user.id,
        };

        post.comments.unshift(newComment);

        await post.save();
        
        return res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server Error');
    }

});


// @route   DELETE api/posts/comments/:id/:comment_id
// @desc    Delete a post
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({msg:' Post Not Found'});
        }

        // Pull out the comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id)

        // Make sure the comment exists
        if(!comment){
            return res.status(404).json({ msg: 'Comment does not exist'});
        }

        // Check user : has to be the owner
        if(req.user.id !== comment.user.toString()){
            return res.status(401).json({ msg: 'Not Authorized'});
        }

        // remove comment
        post.comments = post.comments.filter(comment => {
            return comment.id !== req.params.comment_id
        })

        await post.save();
        
        return res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server Error');
    }

});




module.exports = router;