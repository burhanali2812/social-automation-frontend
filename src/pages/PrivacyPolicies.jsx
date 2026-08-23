import React from "react";
import { Link } from "react-router-dom";

function PrivacyPolicies() {
  const lastUpdated = "July 27, 2026";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-5">
      <div className="max-w-5xl mx-auto">

        {/* Small top bar: makes this page easy to navigate on its own
            (no login needed to reach it, no menu needed to leave it —
            satisfies TikTok's "clearly visible / reachable" requirement
            when a reviewer opens this URL directly). */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <Link to="/" className="text-blue-600 hover:underline font-medium">
            ← Back to home
          </Link>
          <Link to="/terms" className="text-gray-500 hover:text-blue-600 hover:underline">
            View Terms of Service
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8 md:p-12">

          <h1 className="text-4xl font-bold text-center text-gray-800 mb-3">
            Privacy Policy
          </h1>

          <p className="text-center text-gray-500 mb-10">
            Last Updated: {lastUpdated}
          </p>

          <p className="text-gray-700 leading-8 mb-8">
            Welcome to <strong>AI Social Automation</strong>. Your privacy is
            important to us. This Privacy Policy explains how we collect, use,
            store, and protect your information when you use our platform.
            By accessing or using our services, you agree to the practices
            described in this Privacy Policy.
          </p>

          {/* 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              1. Information We Collect
            </h2>

            <div className="space-y-5 text-gray-700 leading-8">

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Personal Information
                </h3>

                <ul className="list-disc pl-6 space-y-2">
                  <li>Name</li>
                  <li>Email Address</li>
                  <li>Profile Picture (if provided)</li>
                  <li>Company Information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Connected Social Media Accounts
                </h3>

                <ul className="list-disc pl-6 space-y-2">
                  <li>Facebook Pages</li>
                  <li>Instagram Business Accounts</li>
                  <li>LinkedIn Pages</li>
                  <li>TikTok Business Accounts</li>
                  <li>X (Twitter) Accounts</li>
                  <li>YouTube Channels</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Content You Upload
                </h3>

                <ul className="list-disc pl-6 space-y-2">
                  <li>Images</li>
                  <li>Videos</li>
                  <li>Captions</li>
                  <li>Hashtags</li>
                  <li>Scheduled Publishing Dates</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              2. How We Use Your Information
            </h2>

            <ul className="list-disc pl-6 text-gray-700 leading-8 space-y-2">
              <li>Schedule and publish social media posts.</li>
              <li>Generate AI-powered captions and hashtags.</li>
              <li>Manage multiple companies from one dashboard.</li>
              <li>Improve platform performance and user experience.</li>
              <li>Provide customer support.</li>
              <li>Maintain account security.</li>
              <li>Detect fraud or unauthorized access.</li>
            </ul>
          </section>

          {/* 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              3. AI Generated Content
            </h2>

            <p className="text-gray-700 leading-8">
              Our platform uses Artificial Intelligence to generate captions,
              hashtags, and content suggestions. AI-generated content is produced
              based on the information you provide and should always be reviewed
              before publishing. Users remain responsible for all content posted
              through the platform.
            </p>
          </section>

          {/* 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              4. Social Media Permissions
            </h2>

            <p className="text-gray-700 leading-8 mb-4">
              We request only the permissions necessary to operate the platform.
            </p>

            <ul className="list-disc pl-6 text-gray-700 leading-8 space-y-2">
              <li>Publish posts on your behalf.</li>
              <li>Access connected business pages.</li>
              <li>Retrieve account information.</li>
              <li>Manage scheduled publishing.</li>
              <li>Access media required for posting.</li>
            </ul>

            <p className="mt-5 text-gray-700">
              We never publish content without your authorization or scheduled
              instructions.
            </p>
          </section>

          {/* 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              5. Data Security
            </h2>

            <ul className="list-disc pl-6 text-gray-700 leading-8 space-y-2">
              <li>Encrypted communication (HTTPS).</li>
              <li>Secure authentication.</li>
              <li>Protected access tokens.</li>
              <li>Role-based access control.</li>
              <li>Regular monitoring of security practices.</li>
            </ul>
          </section>

          {/* 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              6. Data Sharing
            </h2>

            <p className="text-gray-700 leading-8">
              We do not sell, rent, or trade your personal information. Data is
              shared only with trusted third-party service providers required to
              operate the platform, such as cloud storage providers, AI services,
              and official social media APIs.
            </p>
          </section>

          {/* 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              7. Data Retention
            </h2>

            <p className="text-gray-700 leading-8">
              We retain your information only as long as necessary to provide our
              services or comply with legal obligations. You may request deletion
              of your account and associated data at any time.
            </p>
          </section>

          {/* 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              8. Your Rights
            </h2>

            <ul className="list-disc pl-6 text-gray-700 leading-8 space-y-2">
              <li>Access your personal information.</li>
              <li>Update your information.</li>
              <li>Delete your account.</li>
              <li>Disconnect social media accounts.</li>
              <li>Request removal of stored data.</li>
            </ul>
          </section>

          {/* 9 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              9. Cookies
            </h2>

            <p className="text-gray-700 leading-8">
              We may use cookies and similar technologies to maintain login
              sessions, improve user experience, analyse platform usage, and
              enhance security.
            </p>
          </section>

          {/* 10 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              10. Children's Privacy
            </h2>

            <p className="text-gray-700 leading-8">
              Our platform is not intended for individuals under 13 years of age.
              We do not knowingly collect personal information from children.
            </p>
          </section>

          {/* 11 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              11. Changes to this Privacy Policy
            </h2>

            <p className="text-gray-700 leading-8">
              We may update this Privacy Policy periodically. Any changes will be
              posted on this page along with the updated revision date.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              12. Contact Us
            </h2>

            <div className="bg-gray-100 rounded-lg p-6">
              <p className="text-gray-700 mb-2">
                If you have any questions regarding this Privacy Policy, please
                contact us:
              </p>

              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Application:</strong> Social Automation
                </p>

                <p>
                  <strong>Email:</strong> supportsocialautomation@gmail.com
                </p>

                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://social-automation-coral.vercel.app"
                    className="text-blue-600 hover:underline"
                  >
                    https://social-automation-coral.vercel.app
                  </a>
                </p>
              </div>
            </div>
          </section>

        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600 hover:underline">Home</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms" className="hover:text-blue-600 hover:underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicies;