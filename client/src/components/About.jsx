
export default function About() {
  return (
    <section id="about" className="min-h-screen flex flex-col items-center justify-center text-white px-4 pt-16 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            About Our Platform
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            Discover the science behind effective learning and how our platform helps you achieve your educational goals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-purple-300">Why Flashcards Work</h3>
            <div className="space-y-4 text-gray-300">
              <p className="leading-relaxed">
                Flashcards leverage the power of active recall and spaced repetition, 
                two scientifically-proven learning techniques that enhance long-term memory retention.
              </p>
              <p className="leading-relaxed">
                Our intelligent algorithm identifies your weak points and adjusts the review 
                schedule accordingly, ensuring you spend time on what matters most.
              </p>
              <p className="leading-relaxed">
                With personalized learning paths and detailed progress tracking, 
                you'll see measurable improvements in your knowledge retention.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-center text-purple-300">Platform Features</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Custom deck creation and management
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Spaced repetition algorithm
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Progress analytics and insights
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Mobile-responsive design
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Import/export functionality
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Collaborative learning features
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 inline-block">
            <h3 className="text-2xl font-bold mb-4 text-purple-300">Our Mission</h3>
            <p className="text-gray-300 max-w-2xl leading-relaxed">
              To make learning more effective, engaging, and accessible for everyone. 
              We believe that with the right tools and techniques, anyone can master any subject.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}