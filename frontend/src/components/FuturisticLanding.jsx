import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function FuturisticLanding({ onSelect, onSignup }) {
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>

      {/* Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/30 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-2xl font-bold"
          >
            <span className="text-2xl">✨</span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              AI Code Mentor
            </span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <motion.button
              whileHover={{ scale: 1.1, color: "#fff" }}
              className="text-gray-300 transition-colors"
              onClick={() => scrollTo(featuresRef)}
            >
              Features
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, color: "#fff" }}
              className="text-gray-300 transition-colors"
              onClick={() => scrollTo(aboutRef)}
            >
              About
            </motion.button>
          </nav>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSignup?.()}
              className="hidden sm:inline-block px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all text-sm font-medium"
            >
              Sign Up
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect?.("editor")}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 font-semibold text-sm shadow-lg shadow-purple-500/50"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <motion.section
        style={{ opacity, scale }}
        className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20"
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
          >
            <span className="text-lg">✨</span>
            <span className="text-sm text-gray-300">Powered by Advanced AI</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl font-black mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Master Coding
            </span>
            <br />
            <span className="text-white">With AI Mentor</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-gray-400 mb-4 max-w-3xl mx-auto leading-relaxed"
          >
            Your all-in-one intelligent platform for mastering coding and technical skills
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base md:text-lg text-gray-500 mb-12 max-w-2xl mx-auto"
          >
            AI-powered guidance • Interactive quizzes • Real-time coding challenges
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(168, 85, 247, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect?.("editor")}
              className="group px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 font-bold text-lg shadow-2xl shadow-purple-500/50 flex items-center gap-2"
            >
              Start Learning Now
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo(featuresRef)}
              className="px-8 py-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 font-semibold text-lg flex items-center gap-2"
            >
              Explore Features
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20"
          >
            {[
              { icon: "💻", label: "Code Reviews", value: "AI-Powered" },
              { icon: "🧠", label: "Smart Quizzes", value: "Adaptive" },
              { icon: "⚡", label: "Live Execution", value: "Real-time" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="text-3xl mx-auto mb-2 text-center">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* FEATURES SECTION */}
      <section ref={featuresRef} className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to become a coding master, all in one place
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "AI Code Mentor",
                icon: "🤖",
                description: "Get instant code reviews with AI-powered insights and suggestions",
                gradient: "from-purple-600 to-pink-600",
                action: "editor"
              },
              {
                title: "Aptitude Panel",
                icon: "📝",
                description: "Practice with intelligent questions and instant explanations",
                gradient: "from-pink-600 to-orange-600",
                action: "quiz"
              },
              {
                title: "Learning Mode",
                icon: "🎮",
                description: "Solve LeetCode-style challenges with real-time execution",
                gradient: "from-blue-600 to-purple-600",
                action: "learning"
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => onSelect?.(feature.action)}
                className="group cursor-pointer relative p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <motion.div
                    className="flex items-center gap-2 text-purple-400 font-semibold"
                    whileHover={{ x: 5 }}
                  >
                    Try it now →
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section ref={aboutRef} className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Why Choose Us
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {[
                { icon: "🚀", title: "Accelerated Learning", desc: "Master coding faster with AI-driven guidance" },
                { icon: "🎯", title: "Interview Ready", desc: "Practice real problems used by top tech companies" },
                { icon: "🏆", title: "Instant Feedback", desc: "Get immediate insights on your code and solutions" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 10 }}
                  className="flex gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-white/10"
            >
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Our platform is built to accelerate coding mastery through an interactive, AI-driven environment. From reviewing code with <strong className="text-white">AI Code Mentor</strong>, practicing theory with <strong className="text-white">Aptitude Panel</strong>, to solving hands-on challenges in <strong className="text-white">Learning Mode</strong>.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                With intelligent insights, adaptive difficulty, and a seamless interface, this unified ecosystem helps you <strong className="text-white">learn faster, practice smarter, and build like a pro</strong>.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative z-10 py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-white/10"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Level Up Your Skills?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers mastering coding with AI
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(168, 85, 247, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect?.("editor")}
            className="px-10 py-5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 font-bold text-xl shadow-2xl shadow-purple-500/50"
          >
            Start Your Journey Today
          </motion.button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-12 border-t border-white/10 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">✨</span>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Code Mentor
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AI Code Mentor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}