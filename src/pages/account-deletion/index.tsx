import './index.css';

const AccountDeletion = () => {
  return (
    <div className="account-deletion-page min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Account Deletion – CGC - Construction Group
          </h1>
          <p className="text-xl text-gray-600">
            CGC - Construction Group provides users full control over their account and data.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-8">
          {/* How to Delete Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">How to Delete Your Account</h2>
            <p className="text-gray-700">
              Users can delete their account directly inside the app:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">Open CGC - Construction Group</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">Open Side Menu from Home Screen</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">Tap "Delete Account"</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">Confirm</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mt-6">
              <p className="text-gray-700">
                The account and associated data are permanently deleted immediately.
              </p>
            </div>
          </section>

          {/* Important Warning Section */}
          <section className="space-y-4 bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <h2 className="text-2xl font-semibold text-red-900">Important Warning</h2>
            <p className="text-red-800 font-semibold text-lg">
              This action cannot be undone.
            </p>
            <p className="text-red-700">
              Once deleted, all your data including projects, files, and account information will be permanently removed from our servers.
            </p>
          </section>

          {/* Alternative Method Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Alternative Method</h2>
            <p className="text-gray-700">
              If unable to access the app:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-3">
              <div>
                <p className="text-gray-700"><strong>Email:</strong> support@cgc-construction.com</p>
              </div>
              <div>
                <p className="text-gray-700"><strong>Subject:</strong> Account Deletion Request</p>
              </div>
              <div>
                <p className="text-gray-700">
                  Include registered email address for verification.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
              <p className="text-gray-700">
                <strong>Note:</strong> Requests via email are processed within 7 working days.
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

export { AccountDeletion };
