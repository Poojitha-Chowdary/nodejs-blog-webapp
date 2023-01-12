// jshint esversion:6

const _ = require('lodash');
const moment = require('moment');
const { host, port, mongo_db_url, blogs_db_name } = require('./configs/config.json');
const path = require('path');
const assert = require('assert');

// Set up mongoose connection for MongoDB
const mongoose = require('mongoose');
const dev_db_url = `${mongo_db_url}/${blogs_db_name}`;
const mongoDB = process.env.MONGODB_URI || dev_db_url;

const dummyReviewData = [
    { author: 'Rahul', rating: 4, comment: "This is a great article. The level of author's research is worth appreciation", approval: 'approved' },
    { author: 'Rahul', rating: 4, comment: 'Great article', approval: 'pending' },
    { author: 'Abhishek', rating: 5, comment: 'Nice one', approval: 'approved' },
    { author: 'Rahul', rating: 4, comment: 'Great article', approval: 'approved' },
    { author: 'Abhishek', rating: 5, comment: 'Nice one', approval: 'pending'} ];
const reviewSchema = {
    author: String,
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    comment: String,
    approval: {
        type: String,
        enum: ['pending', 'approved']
    }
};
const relatedPostSchema = {
    relationId: Number
};
const postSchema = {
    title: {
        type: String, 
        required: [true, 'missing title']
    }, 
    content:  {
        type: String, 
        required: [true, 'missing content']
    }, 
    author:  {
        type: String, 
        required: [true, 'missing author']
    }, 
    contentSource:  {
        type: String, 
        required: [true, 'missing source']
    }, 
    timestamp:  {
        type: Date, 
        // required: [true, 'missing timestamp'],
        default: Date.now
    }, 
    overallRating: {
        type: Number,
        min: 0, // 0 means no ratings available
        max: 5
    },
    tags: String, 
    relatedPosts: [relatedPostSchema], 
    reviews: [reviewSchema]
};
const blogSchema = new mongoose.Schema(postSchema);
const Blog = mongoose.model('Blog', blogSchema);
mongoose.connect(mongoDB, {useNewUrlParser: true});
// mongoose.connection.close();

const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/', (req, res) => {
    Blog.find((err, blogs) => {
        if(err) {
            console.log('Some error occurred while finding: ' + err)
            res.render('home', {posts: []});
        } else {
            console.log(blogs.length + ' blog(s) found (Home page).')
            res.render('home', {posts: blogs});
        }
    });
});

app.get('/about', (req, res) => {
    res.render('about', {aboutContent: 'This web portal is about Blog posts'});
});

app.get('/contact', (req, res) => {
    res.render('contact', {contactContent: 'Contact Ajay on amalik007@gmail.com or +1 (306) 361 4491'});
});

app.get('/compose', (req, res) => {
    res.render('compose');
});

app.post('/compose', (req, res) => {
    // mongoose.connect(mongoDB, {useNewUrlParser: true});
    const blog = new Blog({
        title: req.body.postTitle, 
        content: req.body.postData, 
        author: req.body.author, 
        contentSource: req.body.contentSource, 
        timestamp: moment(new Date()).format('llll'),
        overallRating: 2, // 0 means no ratings available
        tags: 'blockchain,technology', 
        relatedPosts: [], 
        reviews: dummyReviewData
    });
    // const id = Blog.bulkSave([ blog ], (err) => {
    //     if(err) {
    //         console.log('Some error occurred while saving: ' + err);
    //     } else {
    //         // mongoose.connection.close();
    //         console.log('Blog created: ' + req.body.postTitle);
    //     }
    // });
    const innerDoc = blog.save().then(
        () => {console.log('Blog created: ' + req.body.postTitle);}
    );
    console.log('innerDoc._id:   '+innerDoc._id);

    Blog.updateOne({_id: innerDoc._id}, {reviews: dummyReviewData}, (err) => {
        if(err) {
            console.log('Some error occurred while updating reviews. ' + err);
        } else {
            // mongoose.connection.close();
            console.log('Blog updated with reviews.');
        }
    });

    res.redirect('/');
});

app.get('/posts/:postId', (req, res) => {
    Blog.findOne({_id: req.params.postId}, (err, blogs) => {
        if(err) {
            console.log('Some error occurred: ' + err)
            res.render('post', { posts: []});
        } else {
            console.log(blogs.length + ' Blog found');
            res.render('post', { posts: blogs});
        }
    });
});

app.post('/search', (req, res) => {
    // TODO - sort by date, ratings & review
    // mongoose.connect(mongoDB, {useNewUrlParser: true});
    console.log("req.params.searchText: "+req.params.searchText);
    Blog.find({title: _.lowerCase(req.params.searchText)}, (err, blogs) => {
        if(err) {
            console.log('Some error occurred: ' + err)
            res.render('post', {posts: []});
        } else {
            // mongoose.connection.close();
            console.log(blogs.length + ' Blog found matching criteria ');
            res.render('home', { posts: blogs});
        }
    });
});

app.post('/remove', (req, res) => {
    Blog.deleteOne({_id: req.params.postId}, (err, blogs) => {
        res.redirect('/');
    });
});
/**
 * Spin NodeJS web server on port 3000
 */
app.listen(port, function() {
	// host and port are defined in ./modules/config.json and loaded in this file via require module
	console.log(`Node server started at http://${host}:${port}`);
});
