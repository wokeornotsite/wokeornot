export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824] py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white mb-6">About WokeOrNot</h1>
        <div className="prose prose-invert max-w-none text-blue-100">
          
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Our Mission</h2>
          <p className="text-lg">WokeOrNot provides a platform for users to rate and review movies and TV shows based on their perceived level of progressive social and political messaging.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Community Reviews:</strong> Real user ratings and detailed reviews</li>
            <li><strong>Wokeness Categories:</strong> Rate content across multiple dimensions</li>
            <li><strong>Comprehensive Database:</strong> Powered by TMDB with thousands of titles</li>
            <li><strong>Anonymous Reviews:</strong> Share your opinion without creating an account</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How It Works</h2>
          <p>Users can browse our extensive library of movies and TV shows, view wokeness ratings from the community, and submit their own reviews. Each review includes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>An overall wokeness score (0-10)</li>
            <li>Category-specific ratings</li>
            <li>Written review (optional)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Data Source</h2>
          <p>This site uses The Movie Database (TMDB) API to provide movie and TV show information, images, and metadata. WokeOrNot is not endorsed, certified, or otherwise approved by TMDB.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Community Guidelines</h2>
          <p>We encourage respectful discourse and honest reviews. All content must comply with our Terms of Service and should contribute to meaningful discussion about media content.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Get Involved</h2>
          <p>Join our community by creating an account and sharing your perspectives on the latest movies and shows. Your reviews help others make informed viewing decisions.</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
          <p>Have questions, suggestions, or feedback? We'd love to hear from you at <a href="mailto:wokeornot.site@gmail.com" className="text-pink-400 hover:text-pink-300">wokeornot.site@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
