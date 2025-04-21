import Image from "next/image";
import Link from "next/link";

export default function Home() {
  // Sample featured content with wokeness scores
  const featuredContent = [
    {
      id: "1",
      tmdbId: 100088,  // Actual TMDB ID for The Last of Us
      title: "The Last of Us",
      score: 8.2,
      image: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
      type: "TV Show"
    },
    {
      id: "2",
      tmdbId: 346698,  // Actual TMDB ID for Barbie
      title: "Barbie",
      score: 9.5,
      image: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
      type: "Movie"
    },
    {
      id: "3",
      tmdbId: 609681,  // Actual TMDB ID for The Marvels
      title: "The Marvels",
      score: 7.8,
      image: "https://image.tmdb.org/t/p/w500/Ag3D9qXjhJ2FUkrlJ0Cv1pgxqYQ.jpg",
      type: "Movie"
    },
    {
      id: "4",
      tmdbId: 114461,  // Actual TMDB ID for Ahsoka
      title: "Ahsoka",
      score: 4.2,
      image: "https://image.tmdb.org/t/p/w500/laCJxgT0CEvKFJ9D9n03Ky9KNLJ.jpg",
      type: "TV Show"
    }
  ];

  // Sample categories for the wokeness rating
  const categories = [
    "Transgender Themes",
    "Gay Marriages",
    "Race Swapping",
    "Feminist Agenda",
    "LGBT Representation",
    "Gender Nonconformity"
  ];

  return (
    <div className="w-full bg-[#0f0f1a] text-white">
      {/* Hero Section - Modern, Cinematic Design */}
      <section className="relative overflow-hidden">
        {/* Background with overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-[#0f0f1a] z-10"></div>
        <div className="absolute inset-0 bg-[url('https://image.tmdb.org/t/p/original/pWsD91G2R1Da3AKM3ymr3UoIfRb.jpg')] bg-cover bg-center opacity-40"></div>
        
        {/* Animated particles/stars effect */}
        <div className="absolute inset-0 z-0 opacity-30 bg-[radial-gradient(white,_rgba(255,255,255,.2)_2px,_transparent_40px)] bg-[length:50px_50px]"></div>
        
        <div className="container mx-auto px-6 py-28 md:py-40 relative z-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">Is Your Favorite Show</span>
              <div className="flex items-center gap-4 mt-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-500">Woke</span>
                <span className="text-white">or</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">Not?</span>
              </div>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
              Discover and rate the wokeness level of movies and TV shows. Join our community to share your opinions and see what others think.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/movies" 
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg font-medium text-white overflow-hidden shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h-2v-2h2zm-2-2h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4 0h2v-2H7v2zm0 4h2v-2H7v2z" clipRule="evenodd" />
                  </svg>
                  Browse Movies
                </span>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
              </Link>
              <Link 
                href="/tv-shows" 
                className="group relative px-8 py-4 bg-transparent border border-purple-500 rounded-lg font-medium text-purple-300 overflow-hidden shadow-lg hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                  Browse TV Shows
                </span>
                <div className="absolute top-0 left-0 w-full h-full bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0f0f1a] to-transparent z-10"></div>
      </section>

      {/* Featured Content Section - Modern Card Layout */}
      <section className="py-20 bg-[#0f0f1a]">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-white">
              <span className="inline-block relative">
                Trending Content
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></span>
              </span>
            </h2>
            <Link href="/movies" className="text-purple-400 hover:text-purple-300 transition-colors duration-300 text-sm font-medium flex items-center gap-1">
              View all
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredContent.map((item) => (
              <Link 
                key={item.id} 
                href={`/${item.type === 'TV Show' ? 'tv-shows' : 'movies'}/${item.tmdbId}`}
                className="block"
              >
                <div className="group relative bg-gradient-to-br from-gray-900 to-[#131328] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-500 h-full cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  
                  {/* Glass effect border */}
                  <div className="absolute inset-0 rounded-xl border border-white/5 z-20 group-hover:border-purple-500/20 transition-colors duration-300"></div>
                  
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <Image 
                      src={item.image || '/images/placeholder.png'} 
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Content type badge */}
                    <div className="absolute top-3 left-3 z-30 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium border border-white/10">
                      {item.type}
                    </div>
                    
                    {/* Wokeness score badge */}
                    <div className="absolute top-3 right-3 z-30">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${item.score <= 3 ? 'bg-green-500' : item.score <= 6 ? 'bg-yellow-500' : 'bg-red-500'} text-white font-bold text-sm shadow-lg`}>
                        {item.score}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 relative z-20">
                    <h3 className="font-semibold text-lg text-white group-hover:text-purple-300 transition-colors duration-300">{item.title}</h3>
                    
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-xs text-gray-400">Wokeness:</div>
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.score <= 3 ? 'bg-gradient-to-r from-green-400 to-green-600' : item.score <= 6 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                          style={{ width: `${(item.score / 10) * 100}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link 
              href="/search" 
              className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium"
            >
              View All Content
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-[#0f0f1a] to-[#131328]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            <span className="relative inline-block">
              How It Works
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"></span>
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a1a2e] rounded-xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 border border-purple-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-purple-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-white">Find Content</h3>
              <p className="text-gray-400 text-center">Search for your favorite movies and TV shows or browse our extensive catalog of entertainment media.</p>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 border border-purple-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-purple-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-white">Rate & Review</h3>
              <p className="text-gray-400 text-center">Rate the wokeness level and provide detailed reviews with category tagging for different aspects.</p>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 border border-purple-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-purple-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-white">Join Discussions</h3>
              <p className="text-gray-400 text-center">Participate in community discussions about content and wokeness trends in modern entertainment.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16 bg-[#131328]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            <span className="relative inline-block">
              Wokeness Categories
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"></span>
            </span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-gray-900 to-[#1a1a2e] p-4 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group cursor-pointer"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center text-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-full border border-purple-500/20 group-hover:border-purple-500/40 transition-all duration-300">
                    {category.includes("Transgender") ? "🏳️‍⚧️" : 
                     category.includes("Gay") ? "🏳️‍🌈" : 
                     category.includes("Race") ? "👥" : 
                     category.includes("Feminist") ? "♀️" : 
                     category.includes("LGBT") ? "🌈" : 
                     "⚧️"}
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">{category}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-b from-[#131328] to-[#0f0f1a]">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-2xl p-8 border border-purple-500/10 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to rate your favorite content?</h3>
                <p className="text-gray-300">Join our community and share your opinions on the wokeness of movies and TV shows. Help others make informed viewing decisions.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/movies" 
                  className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg font-medium text-white shadow-lg hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1 text-center"
                >
                  Start Rating Now
                </Link>
                <Link 
                  href="/register" 
                  className="whitespace-nowrap px-6 py-3 bg-transparent border border-purple-400 text-purple-300 hover:bg-purple-500/10 rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-1 text-center"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
