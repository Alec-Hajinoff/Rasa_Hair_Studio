import React, { useEffect, useState } from "react";
import { adminBlogManagerGet, adminBlogManagerPost } from "./ApiService";
import "./AdminBlogManager.css";

function AdminBlogManager({ posts, setPosts, refreshKey }) {
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      setMessage("");
      setMessageType("");

      try {
        const result = await adminBlogManagerGet();

        setPosts(Array.isArray(result.posts) ? result.posts : []);
      } catch (error) {
        setMessage(error.message || "Unable to load blog posts.");
        setMessageType("danger");
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [refreshKey, setPosts]);

  const handleDelete = async (post) => {
    const confirmed = window.confirm(
      `Delete "${post.title}"? This will also delete its featured image, if it has one.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);
    setMessage("");
    setMessageType("");

    try {
      const result = await adminBlogManagerPost({ id: post.id });

      if (result.status !== "success") {
        throw new Error(
          result.message || "The blog post could not be deleted.",
        );
      }

      setPosts((currentPosts) =>
        currentPosts.filter(
          (currentPost) => String(currentPost.id) !== String(post.id),
        ),
      );

      setMessage(result.message || "Blog post deleted successfully.");
      setMessageType(result.image_deleted === false ? "warning" : "success");
    } catch (error) {
      setMessage(error.message || "An error occurred while deleting the post.");
      setMessageType("danger");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-blog-manager card shadow-sm">
      <div className="card-body">
        <h4 className="card-title mb-3">Manage blog posts</h4>

        {message && (
          <div className={`alert alert-${messageType}`} role="alert">
            {message}
          </div>
        )}

        {isLoading ? (
          <p className="text-muted mb-0" role="status">
            Loading blog posts…
          </p>
        ) : posts.length === 0 ? (
          <p className="text-muted mb-0">There are no blog posts yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle admin-blog-manager__table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="admin-blog-manager__title-cell">
                        <span className="fw-semibold">{post.title}</span>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(post)}
                          disabled={String(deletingId) === String(post.id)}
                          aria-label={`Delete blog post ${post.title}`}
                        >
                          {String(deletingId) === String(post.id)
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                    <td>{post.created_at}</td>
                    <td>{post.updated_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminBlogManager;
