export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824] py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white mb-6">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-blue-100">
          <p className="text-lg mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using WokeOrNot, you accept and agree to be bound by the terms and provision of this agreement.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Use License</h2>
          <p>Permission is granted to temporarily use WokeOrNot for personal, non-commercial transitory viewing only.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Content</h2>
          <p>Users are responsible for the content of their reviews and comments. Content must not be offensive, defamatory, or violate any laws.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Disclaimer</h2>
          <p>The materials on WokeOrNot are provided on an 'as is' basis. WokeOrNot makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Contact</h2>
          <p>For questions about these Terms, please contact us at <a href="mailto:wokeornot.site@gmail.com" className="text-pink-400 hover:text-pink-300">wokeornot.site@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
