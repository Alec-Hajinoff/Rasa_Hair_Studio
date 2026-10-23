import React, { useEffect, useState } from "react";
import { blog } from "./ApiService";
import "./Blog.css";

function formatBlogDate(value) {
  if (!value) return "";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function Blog() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await blog();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load blog posts.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="blog-message" role="status">
        Loading blog posts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger mt-4" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <main className="blog-wrapper">
      <div className="container">
        <h1 className="blog-page-title">Blog</h1>

        {posts.length === 0 ? (
          <p className="blog-empty">No blog posts to display yet.</p>
        ) : (
          <div className="blog-list">
            {posts.map((post) => (
              <article className="blog-card" key={post.id}>
                {post.image_path && (
                  <img
                    className="blog-image"
                    src={`${API_BASE_URL}${post.image_path}`}
                    alt={post.title}
                    loading="lazy"
                  />
                )}

                <div className="blog-card-content">
                  <h2 className="blog-post-title">{post.title}</h2>

                  {post.created_at && (
                    <time
                      className="blog-post-date"
                      dateTime={post.created_at.replace(" ", "T")}
                    >
                      {formatBlogDate(post.created_at)}
                    </time>
                  )}

                  <div className="blog-post-body">{post.content}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Blog;
