const express = require('express');
const mongoose = require('mongoose');
const Comment = require('./models/comments');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); // Import the 'http' module
const { Server } = require('socket.io'); // Import 'socket.io'

const app = express();
require('dotenv').config();
app.use(cors());

mongoose.connect('mongodb+srv://rajessh781:R%40jesh2512@personal-blog.dtfxubi.mongodb.net/CodeBlog', {
  useNewUrlParser: true,
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
mongoose.set('strictQuery', true);

// Create an HTTP server using Express app
const server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server
const io = new Server(server);

// Define a Comment model (assuming it's already defined)

// Create or update a comment by ID
app.post('/Sensor/add/:commentId', async (req, res) => {
  const { data } = req.body;
  const commentId = req.params.commentId;

  try {
    // Check if a comment with the given ID exists
    let existingComment = await Comment.findById(commentId);

    if (existingComment) {
      // If the comment with the given ID exists, update its data
      existingComment.data = data;
      await existingComment.save();
      res.send('Comment Updated');
    } else {
      // If the comment with the given ID doesn't exist, create a new comment
      const newComment = new Comment({ _id: commentId, data });
      await newComment.save();
      res.send('Comment Created');
    }

    // Emit an event to notify clients about the update
    io.emit('commentUpdate', { commentId, data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments
app.get('/Sensor', async (req, res) => {
  try {
    const comments = await Comment.find({});
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment by ID
app.delete('/Sensor/delete/:commentId', async (req, res) => {
  const commentId = req.params.commentId;

  try {
    // Find the comment by ID and remove it from the database
    const deletedComment = await Comment.findByIdAndRemove(commentId);

    if (!deletedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Emit an event to notify clients about the deletion
    io.emit('commentDeleted', { commentId });
    res.status(200).json({ message: 'Comment deleted successfully', deletedComment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Listen on the same port as the Express app
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`You're Connected on port ${port}`);
});

// Set up WebSocket event handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
