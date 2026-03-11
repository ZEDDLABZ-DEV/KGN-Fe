import './index.css';

const DataSafety = () => {
  return (
    <div className="data-safety-page min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Safety – CGC - Construction Group
          </h1>
          <p className="text-xl text-gray-600">
            CGC - Construction Group values user privacy and transparency.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-8">
          {/* Data We Collect Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data We Collect</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Project data</li>
              <li>Device information</li>
            </ul>
          </section>

          {/* Data Usage Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data Usage</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Account management</li>
              <li>Project management functionality</li>
              <li>Notifications</li>
              <li>App improvement and security</li>
            </ul>
          </section>

          {/* Data Sharing Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data Sharing</h2>
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
              <p className="text-gray-700 font-semibold mb-2">
                We do not sell personal data.
              </p>
              <p className="text-gray-700">
                Data is shared only with secure service providers required to operate the app.
              </p>
            </div>
          </section>

          {/* Data Security Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data Security</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encrypted transmission</li>
              <li>Secure cloud storage</li>
              <li>Restricted access control</li>
            </ul>
          </section>

          {/* Data Deletion Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data Deletion</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-gray-700 mb-2">
                Users can request deletion anytime via the{' '}
                <a 
                  href="/account-deletion" 
                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  Account Deletion
                </a>{' '}
                page.
              </p>
              <p className="text-gray-700 font-semibold">
                Your data will be permanently removed upon request.
              </p>
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

export { DataSafety };
