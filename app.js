// jshint esversion:6

const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

const _ = require('lodash');
const moment = require('moment');

const fs = require('fs');

// Debugging with DevTools inspector
const inspector = require('inspector');
const session = new inspector.Session();
session.connect();
session.post('Profiler.enable');
session.post('Profiler.start');
setTimeout(_ => {
    session.post('Profiler.stop', (err, data) => {
        fs.writeFileSync('data.cpuprofile', JSON.stringify(data.profile));
    });
}, 3000);

const { host, port, cloud_db_username, cloud_db_password, cloud_db_server, blogs_db_name } = require('./configs/config.json');
const path = require('path');
const assert = require('assert');

// TinyMCE WYSIWYG editor
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));


// Set up mongoose connection for MongoDB
const mongoose = require('mongoose');

// for PROD MongoDB:
const credential_file = './certs/mongo-superuser-X509-cert.pem';
const dev_db_uri = `mongodb+srv://${cloud_db_server}/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority`;
let dev_db_uri_cert;
fs.readFile(credential_file, (err, fileData) => {
    if(err) {
        console.log('Some error while reading DB certificate file: '+err);
        // TODO: exit the server in this case
    } else {
        dev_db_uri_cert = {
            sslKey: fileData,
            sslCert: fileData,
            useNewUrlParser: true
        };
    }
});

// for Dev localhost MongoDB:
const local_db_url = `mongodb://localhost:2701/${blogs_db_name}`;

// for Dev Cloud server MongoDB:
const dev_db_url = `mongodb+srv://${cloud_db_username}:${cloud_db_password}@${cloud_db_server}/${blogs_db_name}`;
const mongoDB = process.env.MONGODB_URI || dev_db_url;

mongoose.connect(mongoDB, {useNewUrlParser: true}, (err) => {
    if(err) {
        console.log(`Database connection error:: ${err}`);
    } else {
        console.log('Database connected successfully');
    }
});
// mongoose.connect(prod_db_uri, prod_db_uri_cert);
// mongoose.connection.close();

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
    relationId: String
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


let displaySomeMessage = '';

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/blogs', (req, res) => {
    Blog.find(
        {
            status: { $ne: 'deleted' }
        }, (err, blogs) => {
        if(err) {
            console.log(`Some error occurred while finding: ${err}`)
            res.render('blogs', {posts: [], searchText: '', displaySomeMessage: `Some error occurred while finding: ${err}`});
        } else {
            console.log(`${blogs.length} blog(s) found (Blogs page).`)
            res.render('blogs', {posts: blogs, searchText: '', displaySomeMessage: `${blogs.length} blog(s) found`});
        }
    }).sort({timestamp: 'desc'});
});

app.get('/notepad', (req, res) => {
    res.render('notepad', {notes: [], searchText: '', displaySomeMessage: 'You have yet to create your first note!'});
});

app.get('/notepad/compose', (req, res) => {
    res.render('newNotepad');
});

app.get('/todo', (req, res) => {
    res.render('todo', {todo: [], searchText: '', displaySomeMessage: 'You have yet to create your first task!'});
});

app.get('/todo/compose', (req, res) => {
    res.render('newTodo');
});

app.get('/about', (req, res) => {
    res.render('about', {
        aboutContent: 'This web portal is about Blog posts', 
        contactContent: 'Contact Ajay on amalik007@gmail.com or +1 (306) 361 4491'
    });
});

app.get('/blog/compose', (req, res) => {
    res.render('newBlog');
});

app.post('/blog/compose', (req, res) => {
    relatedPosts = ( req.body.relatedPosts === '' ? [] : [req.body.relatedPosts] );

    const blog = new Blog({
        title: req.body.postTitle, 
        content: req.body.blogData-expressjs-tinymce-app, 
        author: req.body.author, 
        contentSource: req.body.contentSource, 
        timestamp: moment(new Date()).format('llll'),
        overallRating: 0, // 0 means no ratings available
        tags: req.body.tags, 
        relatedPosts: relatedPosts, 
        reviews: dummyReviewData
    });

    blog.save().then(
        () => {console.log('Blog created: ' + req.body.postTitle);}
    );

    // const id = Blog.bulkSave([ blog ], (err) => {
    //     if(err) {
    //         console.log('Some error occurred while saving: ' + err);
    //     } else {
    //         // mongoose.connection.close();
    //         console.log('Blog created: ' + req.body.postTitle);
    //     }
    // });

    // const savedDoc = {};
    // console.log('savedDoc:   ' + savedDoc);
    // Blog.updateOne({_id: savedDoc._id}, {reviews: dummyReviewData}, (err) => {
    //     if(err) {
    //         console.log('Some error occurred while updating reviews. ' + err);
    //     } else {
    //         console.log('Blog updated with reviews.');
    //     }
    // });

    res.redirect('/blogs');
});

/**
 * Search blog matching given _id, maximum "one" blog retrieved.
 */
app.get('/blog/:id', (req, res) => {
    Blog.findOne(
        {
            _id: req.params.id, 
            status: { $ne: 'deleted' }
        }, (err, blogs) => {
        if(err) {
            console.log(`Some error occurred: ${err}`);
            res.render('blogDetails', { posts: []});
        } else if(blogs === null) {
            console.log(`No blog found matching _id ${req.params.id}`);
            res.render('blogDetails', { posts: []});
        } else {
            console.log(`Blog found matching _id ${req.params.id}`);
            res.render('blogDetails', { posts: [blogs]});
        }
    });
});

/**
 * Search blogs containing given test string in the Title or Tags
 */
app.post('/blogs/search', (req, res) => {
    const searchText = req.body.searchText;

    if(_.trim(searchText) === '') {
        res.redirect('/blogs');
    } else {
        Blog.find(
        {
            title: searchText, 
            status: { $ne: 'deleted' }
            // _.lowerCase(title): _.lowerCase(req.body.searchText)
        }, 
        (err, blogs) => {
            if(err) {
                console.log(`Some error occurred while searching: ${err}`);
                res.render('blogs', { posts: [], searchText: searchText, displaySomeMessage: `Some error occurred: ${err}`});
            } else if (blogs === null || blogs.length === 0) {
                console.log(`No blog found matching criteria: ${searchText}`);
                res.render('blogs', { posts: [], searchText: searchText, displaySomeMessage: `No blog found matching criteria`});
            } else {
                console.log(`Blog found matching criteria: ${searchText}`);
                if(blogs.length === 'undefined') {
                    console.log('One blog found');
                    res.render('blogs', { posts: [blogs], searchText: searchText, displaySomeMessage: 'One blog found'});
                } else {
                    console.log(`Array of ${blogs.length} blogs found`);
                    res.render('blogs', { posts: blogs, searchText: searchText, displaySomeMessage: `${blogs.length} blogs found`});
                }
            }
        })
        .sort({timestamp: 'desc'})
        .limit(25)
        .setOptions({ maxTimeMS: 1000 });
    }
});

/**
 * Deletes a blog for given matching _id, maximum "one" blog deleted.
 */
app.post('/remove', (req, res) => {
    // method-1
    // Blog.findByIdAndRemove(req.body.id, function(err) {
    //     if(err) {
    //         console.log(`Some error occurred while deleting: ${err}`);
    //     } else {
    //         console.log(`Successfully deleted ID ${req.body.id}`);
    //     }
    //     res.redirect('/');
    // });

    // method-2
    // Blog.deleteOne({_id: req.body.id}, (err, blogs) => {
    //     if(err) {
    //         console.log(`Some error occurred while deleting: ${err}`);
    //     } else {
    //         console.log(`Successfully deleted ID ${req.body.id}`);
    //     }
    //     res.redirect('/');
    // });

    // method-3 (mark Blog status as deleted)
    // TODO : this is NOT working
    Blog.findOneAndUpdate({_id: req.body.id}, {'status': 'deleted'}, function(err, foundItem) {
        if(err) {
            console.log(`Some error occurred while deleting: ${err}`);
        } else {
            console.log(`Blog marked as deleted for ID ${foundItem._id}`);
        }
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
