
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
    <section id="home" className="min-h-screen flex flex-col items-center justify-center text-white px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Flashcard Memory Trainer
        </h1>
        <p className="text-2xl mb-8 text-gray-300 leading-relaxed">
          Master any subject with our intelligent flashcard system. 
          Boost your memory, track your progress, and achieve your learning goals.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
            <h3 className="text-2xl font-semibold mb-2">Progress Tracking</h3>
            <p className="text-gray-300 text-xl">Detailed analytics to monitor your learning journey and improvements</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
            <h3 className="text-2xl font-semibold mb-2">Goal Oriented</h3>
            <p className="text-gray-300 text-xl">Set personalized learning goals and achieve them with structured practice</p>
          </div>
        </div>
        <button onClick={handleStart} className="mt-12 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-8 rounded-full text-lg cursor-pointer">
          Start Learning Now
        </button>
      </div>
    </section>
  );
}