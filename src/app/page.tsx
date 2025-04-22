import React from "react";
import Image from "next/image";
import Link from "next/link";
import TrendingSection from "@/components/ui/trending-section";

export default function Home() {


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
              <Link 
                href="/kids" 
                className="group relative px-8 py-4 bg-gradient-to-r from-green-400 to-teal-500 rounded-lg font-medium text-white overflow-hidden shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Browse Kids Content
                </span>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-teal-500 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0f0f1a] to-transparent z-10"></div>
      </section>

      {/* Trending Section - Compact Carousels */}
      <TrendingSection />

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
