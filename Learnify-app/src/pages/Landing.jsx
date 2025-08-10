import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiCloud, FiHome, FiCalendar, FiUsers, FiSettings, FiLogIn } from 'react-icons/fi';
import { HiOutlineLibrary } from 'react-icons/hi';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import WebsiteLogo from '/WebsiteLogo.png';

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="text-center p-4 rounded-lg bg-white border border-emerald-100 hover:-translate-y-2 hover:shadow-md transition-all duration-300 group">
    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform text-emerald-500 flex items-center justify-center">
      <Icon />
    </div>
    <h3 className="text-emerald-600 font-semibold text-lg mb-1">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
  </div>
);

const PrimaryButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-full text-base font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-emerald-500/30"
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white px-8 py-2 rounded-full text-base font-semibold transition-all duration-300 hover:-translate-y-1"
  >
    {children}
  </button>
);

const Landing = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const btn = e.target;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
      window.location.href = '/login';
    }, 100);
  };

  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800 font-sans flex flex-col items-center text-sm">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 animate-fadeInDown">
        <nav className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={WebsiteLogo} alt="Learnify Logo" className="w-6 h-6" />
            <span className="text-xl font-bold text-gray-800">Learnify</span>
          </div>
          <PrimaryButton onClick={handleLogin}>Sign In</PrimaryButton>
        </nav>
      </header>

      {/* Hero Section */}
      <main
        className="pt-32 pb-12 px-6 text-center max-w-5xl mx-auto transition-transform duration-300"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent animate-fadeInUp">
          Welcome to Learnify
        </h1>
        <p className="text-base text-gray-600 mb-8 max-w-xl mx-auto animate-fadeInUp delay-200">
          Your all-in-one LMS. Create or join classes, manage tasks, and track your progress.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fadeInUp delay-300">
          <PrimaryButton onClick={handleLogin}>Get Started</PrimaryButton>
          <SecondaryButton onClick={scrollToFeatures}>Learn More</SecondaryButton>
        </div>
      </main>

      {/* Preview Cards */}
      <section className="mx-4 mb-12 p-10 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg max-w-5xl animate-fadeInUp delay-500">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Experience Modern Learning</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: FiBookOpen,
              title: 'Create & Join Classrooms',
              desc: 'Create or join courses, manage your subjects with beautiful class cards.',
            },
            {
              icon: FiCloud,
              title: 'Google Drive Integration',
              desc: 'Directly access your educational files via built-in Drive connectivity.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-md min-h-64 flex flex-col justify-center text-center hover:scale-[1.02] transition-transform"
            >
              <div className="text-4xl mb-4 flex items-center justify-center">
                <feature.icon />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="opacity-90 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mb-12 p-10 bg-white rounded-2xl shadow-lg max-w-5xl mx-auto animate-fadeInUp delay-700">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Everything You Need to Learn
        </h2>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FiHome, title: 'Dashboard Overview', desc: 'Track all your learning from a central hub.' },
            { icon: HiOutlineLibrary, title: 'Book Management', desc: 'Integrated file library powered by Google Drive.' },
            { icon: FiCalendar, title: 'Smart Calendar', desc: 'Stay on top of tasks, deadlines, and class events.' },
            { icon: FiUsers, title: 'Classroom Collaboration', desc: 'Team up with peers and instructors seamlessly.' },
            { icon: FiSettings, title: 'Personalized Settings', desc: 'Configure your experience and manage sync.' },
            { icon: FiLogIn, title: 'Social Login', desc: 'Fast login with Google, GitHub, or email.' },
          ].map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12 text-center py-4 text-xs text-gray-600 dark:text-gray-400 w-full">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-2">
          <span className="font-bold text-gray-800 dark:text-gray-100">Learnify</span>
          <a href="#features" className="hover:underline text-emerald-600 dark:text-emerald-400">Features</a>
          <a href="/login" className="hover:underline text-emerald-600 dark:text-emerald-400">Sign In</a>
          <div className="flex gap-2 text-lg">
            <a href="https://github.com/username" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
              <FaGithub />
            </a>
            <a href="https://linkedin.com/in/username" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
              <FaLinkedin />
            </a>
          </div>
        </div>
        <p>&copy; {new Date().getFullYear()} Learnify. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
