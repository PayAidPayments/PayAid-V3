export default function LandingLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
      <div
        className="w-12 h-12 rounded-xl border-4 border-[#53328A] border-t-[#F5C700] animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium text-gray-600">Loading PayAid...</p>
    </div>
  )
}
