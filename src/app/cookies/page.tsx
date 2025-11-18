export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824] py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white mb-6">Cookie Policy</h1>
        <div className="prose prose-invert max-w-none text-blue-100">
          <p className="text-lg mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">What Are Cookies?</h2>
          <p>Cookies are small pieces of text sent to your web browser by a website you visit. They help the website remember information about your visit, making it easier to visit again and making the site more useful to you.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How We Use Cookies</h2>
          <p>WokeOrNot uses cookies for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Authentication:</strong> We use cookies to keep you signed in to your account</li>
            <li><strong>Preferences:</strong> Cookies help us remember your settings and preferences</li>
            <li><strong>Security:</strong> We use cookies to protect your account and data</li>
            <li><strong>Analytics:</strong> We use cookies to understand how visitors use our site</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">Essential Cookies</h3>
          <p>These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you, such as signing in or filling in forms.</p>

          <h3 className="text-xl font-semibold text-white mt-6 mb-3">Session Cookies</h3>
          <p>We use NextAuth.js session cookies to maintain your authentication state across pages.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Managing Cookies</h2>
          <p>Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact your experience of our site.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Updates to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
          <p>If you have questions about our use of cookies, please contact us at <a href="mailto:wokeornot.site@gmail.com" className="text-pink-400 hover:text-pink-300">wokeornot.site@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
