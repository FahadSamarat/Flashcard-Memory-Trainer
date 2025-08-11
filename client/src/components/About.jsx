
export default function About() {
  return (
    <section id="about" className="min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-8 text-[color:var(--color-text)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-[color:var(--color-accent)]">
            About Our Platform
          </h2>
          <p className="text-xl text-[color:var(--color-muted)] leading-relaxed">
            Discover the science behind effective learning and how our platform helps you achieve your educational goals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">Why Flashcards Work</h3>
            <div className="space-y-4 text-[color:var(--color-muted)]">
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

          <div className="bg-[color:var(--color-surface)]/70 rounded-lg p-8 border border-[color:var(--color-primary)]/30">
            <h3 className="text-2xl font-bold mb-6 text-center">Platform Features</h3>
            <ul className="space-y-4 text-[color:var(--color-muted)]">
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                Custom deck creation and management
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                Spaced repetition algorithm
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                Progress analytics and insights
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                Mobile-responsive design
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                Import/export functionality
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                Collaborative learning features
              </li>
            </ul>
          </div>
        </div>

          <div className="text-center mt-16">
          <div className="bg-[color:var(--color-surface)]/70 rounded-lg p-8 inline-block border border-[color:var(--color-primary)]/30">
            <h3 className="text-2xl font-bold mb-4 text-center">Our Mission</h3>
            <p className="text-[color:var(--color-muted)] max-w-2xl leading-relaxed">
              To make learning more effective, engaging, and accessible for everyone. 
              We believe that with the right tools and techniques, anyone can master any subject.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}