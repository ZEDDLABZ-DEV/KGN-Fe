/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import './todolist.css';
import { AuthContext } from '../../context/AuthContext';

interface Post {
  id: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: Comment[];
  timestamp: Date;
  isLiked: boolean;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
}

interface Story {
  id: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  isViewed: boolean;
}

export const TodoList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) as any;
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [newPostCaption, setNewPostCaption] = useState<string>('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadMockData();
    }
  }, [user, navigate]);

  const loadMockData = () => {
    const mockStories: Story[] = [
      { id: '1', username: 'john_doe', userAvatar: '👤', imageUrl: '🌅', isViewed: false },
      { id: '2', username: 'jane_smith', userAvatar: '👩', imageUrl: '🌆', isViewed: false },
      { id: '3', username: 'mike_wilson', userAvatar: '👨', imageUrl: '🌃', isViewed: true },
    ];

    const mockPosts: Post[] = [
      {
        id: '1',
        username: 'travel_lover',
        userAvatar: '✈️',
        imageUrl: '🏖️',
        caption: 'Beautiful sunset at the beach! #travel #sunset',
        likes: 234,
        comments: [
          { id: '1', username: 'user1', text: 'Amazing view!', timestamp: new Date() }
        ],
        timestamp: new Date(Date.now() - 3600000),
        isLiked: false
      },
      {
        id: '2',
        username: 'foodie_life',
        userAvatar: '🍕',
        imageUrl: '🍜',
        caption: 'Best ramen in town! 🍜 #foodie #ramen',
        likes: 567,
        comments: [],
        timestamp: new Date(Date.now() - 7200000),
        isLiked: false
      }
    ];

    setStories(mockStories);
    setPosts(mockPosts);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newComment: Comment = {
          id: Date.now().toString(),
          username: user?.username || 'current_user',
          text: text,
          timestamp: new Date()
        };
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setCommentText({ ...commentText, [postId]: '' });
  };

  const handleCreatePost = () => {
    if (!newPostImage || !newPostCaption) return;

    const newPost: Post = {
      id: Date.now().toString(),
      username: user?.username || 'current_user',
      userAvatar: '👤',
      imageUrl: newPostImage,
      caption: newPostCaption,
      likes: 0,
      comments: [],
      timestamp: new Date(),
      isLiked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostImage('');
    setNewPostCaption('');
    setShowCreatePost(false);
  };

  const handleViewStory = (storyId: string) => {
    setStories(stories.map(story => 
      story.id === storyId ? { ...story, isViewed: true } : story
    ));
  };

  return (
    <div className="instagram-clone">
      <header className="instagram-header">
        <div className="header-content">
          <h1 className="logo">📷 Instagram Clone</h1>
          <div className="header-actions">
            <button className="icon-btn">🏠</button>
            <button className="icon-btn">💬</button>
            <button className="icon-btn" onClick={() => setShowCreatePost(!showCreatePost)}>➕</button>
            <button className="icon-btn">❤️</button>
            <div className="user-avatar">👤</div>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="stories-section">
          <div className="stories-container">
            {stories.map(story => (
              <div 
                key={story.id} 
                className={`story ${story.isViewed ? 'viewed' : ''}`}
                onClick={() => handleViewStory(story.id)}
              >
                <div className="story-avatar">{story.userAvatar}</div>
                <span className="story-username">{story.username}</span>
              </div>
            ))}
          </div>
        </div>

        {showCreatePost && (
          <div className="create-post-modal">
            <div className="modal-content">
              <h2>Create New Post</h2>
              <input
                type="text"
                placeholder="Image emoji (e.g., 🌅)"
                value={newPostImage}
                onChange={(e) => setNewPostImage(e.target.value)}
                className="post-input"
              />
              <textarea
                placeholder="Write a caption..."
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
                className="post-textarea"
              />
              <div className="modal-actions">
                <button onClick={handleCreatePost} className="btn-primary">Post</button>
                <button onClick={() => setShowCreatePost(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="posts-container">
          {posts.map(post => (
            <div key={post.id} className="post">
              <div className="post-header">
                <div className="post-user">
                  <span className="post-avatar">{post.userAvatar}</span>
                  <span className="post-username">{post.username}</span>
                </div>
                <button className="post-options">⋯</button>
              </div>

              <div className="post-image">
                <div className="image-placeholder">{post.imageUrl}</div>
              </div>

              <div className="post-actions">
                <div className="action-buttons">
                  <button 
                    className={`action-btn ${post.isLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    {post.isLiked ? '❤️' : '🤍'}
                  </button>
                  <button className="action-btn">💬</button>
                  <button className="action-btn">📤</button>
                </div>
                <button className="action-btn bookmark">🔖</button>
              </div>

              <div className="post-likes">
                <strong>{post.likes} likes</strong>
              </div>

              <div className="post-caption">
                <strong>{post.username}</strong> {post.caption}
              </div>

              {post.comments.length > 0 && (
                <div className="post-comments">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <strong>{comment.username}</strong> {comment.text}
                    </div>
                  ))}
                </div>
              )}

              <div className="post-timestamp">
                {Math.floor((Date.now() - post.timestamp.getTime()) / 60000)} minutes ago
              </div>

              <div className="add-comment">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                />
                <button 
                  onClick={() => handleComment(post.id)}
                  disabled={!commentText[post.id]?.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar">
          <div className="user-profile">
            <div className="profile-avatar">👤</div>
            <div className="profile-info">
              <strong>{user?.username || 'current_user'}</strong>
              <span className="profile-name">User Name</span>
            </div>
            <button className="switch-btn">Switch</button>
          </div>

          <div className="suggestions">
            <div className="suggestions-header">
              <span>Suggestions For You</span>
              <button className="see-all">See All</button>
            </div>
            {['user1', 'user2', 'user3'].map((username, idx) => (
              <div key={idx} className="suggestion-item">
                <div className="suggestion-avatar">👤</div>
                <div className="suggestion-info">
                  <strong>{username}</strong>
                  <span>Followed by user + 2 more</span>
                </div>
                <button className="follow-btn">Follow</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
