import React, { useState } from "react";
import axios from "axios";

function TestingUpload() {
  const [form, setForm] = useState({
    pageId: "",
    accessToken: "",
    imageUrl: "",
    caption: "",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setResponse(null);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/social-accounts/facebook/post-image",
        form
      );
      if (res.data.success) {
        alert("Image posted successfully!");
      }

      setResponse(res.data);
    } catch (err) {
      setResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-5">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Facebook Image Upload Test
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-semibold block mb-1">Page ID</label>
            <input
              type="text"
              name="pageId"
              value={form.pageId}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
              placeholder="Facebook Page ID"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">
              Page Access Token
            </label>
            <textarea
              name="accessToken"
              rows="4"
              value={form.accessToken}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
              placeholder="EAAB...."
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Image URL</label>
            <input
              type="text"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Caption</label>
            <textarea
              name="caption"
              rows="4"
              value={form.caption}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
              placeholder="Write your caption..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "Posting..." : "Post Image"}
          </button>
        </form>

        {response && (
          <div className="mt-8">
            <h2 className="font-bold text-lg mb-2">Response</h2>

            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestingUpload;