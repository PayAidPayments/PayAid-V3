'use client'

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-[#53328A] to-[#F5C700] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            Choose Your Suite
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Build the perfect business management system with our modular approach
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#modules"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Browse Modules
            </a>
            <a
              href="#bundles"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
            >
              View Bundles
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

