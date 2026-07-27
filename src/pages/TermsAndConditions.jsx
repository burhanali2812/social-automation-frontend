import React from "react";
import { Link } from "react-router-dom";
function TermsAndConditions() {
  const lastUpdated = "July 27, 2026";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-5">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">

        <h1 className="text-4xl font-bold text-center text-gray-800 mb-3">
          Terms & Conditions
        </h1>

        <p className="text-center text-gray-500 mb-10">
          Last Updated: {lastUpdated}
        </p>

        <p className="text-gray-700 leading-8 mb-8">
          Welcome to <strong>AI Social Automation</strong>. These Terms &
          Conditions govern your access to and use of our platform. By
          accessing or using our services, you agree to comply with these
          terms. If you do not agree with any part of these Terms, please do
          not use our services.
        </p>

        {/* 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            1. Acceptance of Terms
          </h2>

          <p className="text-gray-700 leading-8">
            By creating an account, connecting social media accounts, or using
            any feature of AI Social Automation, you confirm that you have read,
            understood, and agree to these Terms & Conditions and our Privacy
            Policy.
          </p>
        </section>

        {/* 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            2. Eligibility
          </h2>

          <p className="text-gray-700 leading-8">
            You must be at least 18 years old or the legal age required in your
            jurisdiction to use this platform. You are responsible for ensuring
            that your use complies with all applicable laws and regulations.
          </p>
        </section>

        {/* 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            3. User Accounts
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-8">
            <li>Provide accurate and up-to-date information.</li>
            <li>Maintain the security of your account credentials.</li>
            <li>Keep your login details confidential.</li>
            <li>You are responsible for all activity under your account.</li>
            <li>Notify us immediately if you suspect unauthorized access.</li>
          </ul>
        </section>

        {/* 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            4. Connected Social Media Accounts
          </h2>

          <p className="text-gray-700 leading-8 mb-4">
            Our platform allows you to connect supported social media accounts
            for automated publishing.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-8">
            <li>Facebook</li>
            <li>Instagram Business</li>
            <li>LinkedIn</li>
            <li>TikTok Business</li>
            <li>X (Twitter)</li>
            <li>YouTube</li>
          </ul>

          <p className="mt-5 text-gray-700 leading-8">
            You authorize our platform to publish content only according to your
            scheduled posts and permissions granted during account connection.
          </p>
        </section>

        {/* 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            5. AI-Generated Content
          </h2>

          <p className="text-gray-700 leading-8">
            Our platform may generate captions, hashtags, descriptions, and
            content suggestions using Artificial Intelligence. AI-generated
            content is provided for assistance only. You are solely responsible
            for reviewing, editing, and approving any content before it is
            published.
          </p>
        </section>

        {/* 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            6. User Responsibilities
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-8">
            <li>Only upload content you own or have permission to use.</li>
            <li>Do not upload copyrighted or illegal material.</li>
            <li>Do not use the platform for spam or fraudulent activities.</li>
            <li>Follow the policies of all connected social media platforms.</li>
            <li>Comply with all applicable laws and regulations.</li>
          </ul>
        </section>

        {/* 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            7. Prohibited Activities
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-8">
            <li>Attempting to hack or disrupt the platform.</li>
            <li>Uploading malware or malicious software.</li>
            <li>Impersonating another person or business.</li>
            <li>Violating intellectual property rights.</li>
            <li>Using bots or scripts to abuse the platform.</li>
            <li>Posting illegal, abusive, or harmful content.</li>
          </ul>
        </section>

        {/* 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            8. Intellectual Property
          </h2>

          <p className="text-gray-700 leading-8">
            All software, branding, logos, designs, features, and platform
            content are the property of AI Social Automation or its licensors.
            You may not copy, distribute, modify, or reverse engineer any part
            of the platform without written permission.
          </p>
        </section>

        {/* 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            9. Service Availability
          </h2>

          <p className="text-gray-700 leading-8">
            While we strive to provide uninterrupted service, we cannot
            guarantee continuous availability. Features may occasionally be
            unavailable due to maintenance, third-party API limitations, or
            unforeseen technical issues.
          </p>
        </section>

        {/* 10 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            10. Third-Party Services
          </h2>

          <p className="text-gray-700 leading-8">
            Our platform integrates with third-party services such as social
            media platforms, AI providers, cloud storage, and analytics tools.
            We are not responsible for outages, policy changes, or actions taken
            by these third-party providers.
          </p>
        </section>

        {/* 11 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            11. Limitation of Liability
          </h2>

          <p className="text-gray-700 leading-8">
            AI Social Automation shall not be liable for any indirect,
            incidental, or consequential damages resulting from the use of our
            services, including content errors, scheduling failures, account
            suspensions by third-party platforms, or temporary service
            interruptions.
          </p>
        </section>

        {/* 12 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            12. Account Suspension & Termination
          </h2>

          <p className="text-gray-700 leading-8">
            We reserve the right to suspend or terminate accounts that violate
            these Terms, engage in fraudulent activities, misuse the platform,
            or violate third-party platform policies.
          </p>
        </section>

        {/* 13 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            13. Changes to Terms
          </h2>

          <p className="text-gray-700 leading-8">
            We may update these Terms & Conditions at any time. Continued use of
            the platform after changes are published constitutes acceptance of
            the revised Terms.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            14. Contact Information
          </h2>

          <div className="bg-gray-100 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              If you have any questions regarding these Terms & Conditions,
              please contact us:
            </p>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Application:</strong> AI Social Automation
              </p>

              <p>
                <strong>Email:</strong> support@social-automation-coral.vercel.app
              </p>

              <p>
                <strong>Website:</strong> <Link to="https://social-automation-coral.vercel.app" className="text-blue-600 hover:underline">
                                  https://social-automation-coral.vercel.app
                                </Link>
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default TermsAndConditions;