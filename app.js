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

let displaySomeMessage = '';

app.get('/', (req, res) => {
    Blog.find((err, blogs) => {
        if(err) {
            console.log(`Some error occurred while finding: ${err}`)
            res.render('home', {posts: [], searchText: '', displaySomeMessage: `Some error occurred while finding: ${err}`});
        } else {
            console.log(`${blogs.length} blog(s) found (Home page).`)
            res.render('home', {posts: blogs, searchText: '', displaySomeMessage: `${blogs.length} blog(s) found`});
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

/**
 * Search blog matching given _id, maximum "one" blog retrieved.
 */
app.get('/posts/:id', (req, res) => {
    Blog.findOne({_id: req.params.id}, (err, blogs) => {
        if(err) {
            console.log(`Some error occurred: ${err}`);
            res.render('post', { posts: []});
        } else if(blogs === null) {
            console.log(`No blog found matching _id ${req.params.id}`);
            res.render('post', { posts: []});
        } else {
            console.log(`Blog found matching _id ${req.params.id}`);
            res.render('post', { posts: [blogs]});
        }
    });
});

/**
 * Search blogs containing given test string in the Title or Tags
 */
app.post('/search', (req, res) => {
    // TODO - sort by date, ratings & review
    const searchText = req.body.searchText;
    if(_.trim(searchText) === '') {
        res.redirect('/');
    } else {
    Blog.find(
        {
            title: searchText
            // _.lowerCase(title): _.lowerCase(req.body.searchText)
        }, 
        (err, blogs) => {
            if(err) {
                console.log(`Some error occurred: ${err}`);
                res.render('home', { posts: [], searchText: searchText, displaySomeMessage: `Some error occurred: ${err}`});
            } else if (blogs === null || blogs.length === 0) {
                console.log(`No blog found matching criteria: ${searchText}`);
                res.render('home', { posts: [], searchText: searchText, displaySomeMessage: `No blog found matching criteria`});
            } else {
                console.log(`Blog found matching criteria: ${searchText}`);
                if(blogs.length === 'undefined') {
                    console.log('One blog found');
                    res.render('home', { posts: [blogs], searchText: searchText, displaySomeMessage: 'One blog found'});
                } else {
                    console.log(`Array of ${blogs.length} blogs found`);
                    res.render('home', { posts: blogs, searchText: searchText, displaySomeMessage: `${blogs.length} blogs found`});
                }
            }
        });
    }
});

/**
 * Deletes a blog for given matching _id, maximum "one" blog deleted.
 */
app.post('/remove', (req, res) => {
    Blog.deleteOne({_id: req.params.id}, (err, blogs) => {
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
