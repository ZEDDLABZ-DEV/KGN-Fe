import './index.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600">
            Your privacy matters to us
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-8">
          {/* Title Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Privacy Policy – CGC - Construction Group
            </h2>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Effective Date:</strong> January 1, 2026</p>
              <p><strong>Last Updated:</strong> January 31, 2026</p>
            </div>
            <p className="text-gray-700 mt-4">
              CGC - Construction Group is a construction site management application operated by CGC - Construction Group ("Company", "we", "our", "us").
            </p>
            <p className="text-gray-700 mt-2">
              This Privacy Policy explains how we collect, use, and protect user information when using the CGC - Construction Group mobile application and related services.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">1. Information We Collect</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Personal Information</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Full Name</li>
                  <li>Email Address</li>
                  <li>Phone Number</li>
                  <li>Company Name</li>
                  <li>User Role</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Project & Site Data</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Construction project details</li>
                  <li>Task updates</li>
                  <li>Site reports</li>
                  <li>Uploaded files, documents, and images</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Device & Technical Information</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Device type</li>
                  <li>Operating system</li>
                  <li>App version</li>
                  <li>Crash logs</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Location Data</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Site location only when provided by the user</li>
                  <li>We do NOT track background location</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">2. How We Use Information</h3>
            <p className="text-gray-700">
              We use collected data to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Create and manage user accounts</li>
              <li>Enable project management features</li>
              <li>Assign and track tasks</li>
              <li>Send push notifications</li>
              <li>Improve performance and security</li>
              <li>Provide customer support</li>
            </ul>
            <p className="text-gray-700 font-semibold mt-4">
              We do not sell or rent user data.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">3. Data Storage & Security</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Data is stored on secure cloud servers</li>
              <li>Encrypted transmission (HTTPS)</li>
              <li>Restricted administrative access</li>
              <li>Industry-standard security practices</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">4. Data Sharing</h3>
            <p className="text-gray-700">
              We do not sell personal data.
            </p>
            <p className="text-gray-700">
              Data may be shared only with trusted service providers required to operate the app (e.g., hosting, notifications, analytics).
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">5. Data Retention</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Data is retained while the account remains active.</li>
              <li>Upon account deletion, personal and project data is permanently removed.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">6. User Rights</h3>
            <p className="text-gray-700">
              Users can:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Access their data</li>
              <li>Request corrections</li>
              <li>Delete their account at any time</li>
              <li>Contact support regarding data concerns</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">7. Children's Privacy</h3>
            <p className="text-gray-700">
              CGC - Construction Group is not intended for users under 18 years of age.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">8. Contact Information</h3>
            <div className="text-gray-700 space-y-2">
              <p><strong>Email:</strong> support@cgc-construction.com</p>
              <p><strong>Website:</strong> https://www.cgc-construction.com</p>
              <p><strong>Company:</strong> CGC - Construction Group</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2026 CGC - Construction Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export { PrivacyPolicy };
