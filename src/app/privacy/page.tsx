export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824] py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-blue-100">
          <p className="text-lg mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, submit reviews, or contact us. This may include your name, email address, and any content you post.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends, usage, and activities</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Information Sharing</h2>
          <p>We do not sell or share your personal information with third parties except as described in this policy or with your consent.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Authentication</h2>
          <p>We use Google OAuth for authentication. When you sign in with Google, we receive your basic profile information as permitted by Google's privacy settings.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Cookies</h2>
          <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information. See our Cookie Policy for more details.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time through your account settings.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:wokeornot.site@gmail.com" className="text-pink-400 hover:text-pink-300">wokeornot.site@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
