export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824] py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white mb-6">Contact Us</h1>
        <div className="prose prose-invert max-w-none text-blue-100">
          
          <p className="text-lg mb-8">We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Email</h2>
          <p>
            <a href="mailto:wokeornot.site@gmail.com" className="text-pink-400 hover:text-pink-300 text-xl font-semibold">
              wokeornot.site@gmail.com
            </a>
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">What We Can Help With</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Technical Support:</strong> Issues with your account or using the site</li>
            <li><strong>Content Questions:</strong> Questions about specific movies or TV shows</li>
            <li><strong>Feedback:</strong> Suggestions for improving WokeOrNot</li>
            <li><strong>Partnerships:</strong> Business inquiries and collaboration opportunities</li>
            <li><strong>Reporting:</strong> Report inappropriate content or user behavior</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Response Time</h2>
          <p>We typically respond to inquiries within 24-48 hours during business days. For urgent matters, please mark your email as "Urgent" in the subject line.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Social Media</h2>
          <p>Follow us on social media for updates, featured reviews, and community highlights. (Links coming soon!)</p>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-3">Before You Contact Us</h3>
            <p className="text-sm">Please check our <a href="/terms" className="text-pink-400 hover:text-pink-300">Terms of Service</a> and <a href="/privacy" className="text-pink-400 hover:text-pink-300">Privacy Policy</a> pages, as they may already answer your question.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
