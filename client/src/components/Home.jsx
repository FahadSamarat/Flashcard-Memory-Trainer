
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const handleStart = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/decks');
    } else {
      const evt = new Event('open-login-modal');
      document.dispatchEvent(evt);
    }
  };
  return (
    <section id="home" className="min-h-screen flex flex-col items-center justify-center px-4 text-[color:var(--color-text)]">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6 text-[color:var(--color-accent)]">
          Flashcard Memory Trainer
        </h1>
        <p className="text-2xl mb-8 text-[color:var(--color-muted)] leading-relaxed">
          Master any subject with our intelligent flashcard system. 
          Boost your memory, track your progress, and achieve your learning goals.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-[color:var(--color-surface)]/60 rounded-lg p-6 border border-[color:var(--color-primary)]/30 hover:bg-[color:var(--color-surface)] transition-all duration-300">
            <h3 className="text-2xl font-semibold mb-2">Progress Tracking</h3>
            <p className="text-[color:var(--color-muted)] text-xl">Detailed analytics to monitor your learning journey and improvements</p>
          </div>
          <div className="bg-[color:var(--color-surface)]/60 rounded-lg p-6 border border-[color:var(--color-primary)]/30 hover:bg-[color:var(--color-surface)] transition-all duration-300">
            <h3 className="text-2xl font-semibold mb-2">Goal Oriented</h3>
            <p className="text-[color:var(--color-muted)] text-xl">Set personalized learning goals and achieve them with structured practice</p>
          </div>
        </div>
        <button onClick={handleStart} className="mt-12 bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-700)] text-[color:var(--color-bg-2)] font-bold py-4 px-8 rounded-full text-lg cursor-pointer">
          Start Learning Now
        </button>
      </div>
    </section>
  );
}