import React, { useState } from 'react';
import { Box, Typography, Container, Paper, Button, TextField, Card, CardContent } from '@mui/material';

// Simple test component for the feed functionality
const TestFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  // Add a new post
  const handleAddPost = () => {
    if (newPost.trim()) {
      const post = {
        id: Date.now(),
        content: newPost,
        author: 'Test User',
        timestamp: new Date().toLocaleString()
      };
      setPosts([post, ...posts]);
      setNewPost('');
    }
  };

  // Add a comment to a post
  const handleAddComment = (postId) => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        content: newComment,
        author: 'Test User',
        timestamp: new Date().toLocaleString()
      };

      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), comment]
      });

      setNewComment('');
      setActiveCommentPost(null);
    }
  };

  // Delete a post
  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
    // Also delete associated comments
    const newComments = { ...comments };
    delete newComments[postId];
    setComments(newComments);
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Feed Component Test
        </Typography>

        {/* Post creation form */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Write a new post"
            multiline
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleAddPost}
            disabled={!newPost.trim()}
          >
            Post
          </Button>
        </Box>

        {/* Posts list */}
        {posts.length === 0 ? (
          <Typography>No posts yet. Create one!</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {posts.map(post => (
              <Card key={post.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">{post.author}</Typography>
                    <Typography variant="caption" color="text.secondary">{post.timestamp}</Typography>
                  </Box>

                  <Typography variant="body1" sx={{ mb: 2 }}>{post.content}</Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                    >
                      Comment ({(comments[post.id] || []).length})
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      Delete
                    </Button>
                  </Box>

                  {/* Comment section */}
                  {activeCommentPost === post.id && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Write a comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment.trim()}
                      >
                        Add Comment
                      </Button>

                      {/* Comments list */}
                      {(comments[post.id] || []).length > 0 && (
                        <Box sx={{ mt: 2, pl: 2, borderLeft: '1px solid #eee' }}>
                          {(comments[post.id] || []).map(comment => (
                            <Box key={comment.id} sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2">{comment.author}</Typography>
                                <Typography variant="caption" color="text.secondary">{comment.timestamp}</Typography>
                              </Box>
                              <Typography variant="body2">{comment.content}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TestFeed;
