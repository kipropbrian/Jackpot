"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  BarChart3,
  Award,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CountUp from "react-countup";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-gray-900/95 backdrop-blur-sm shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <BarChart3 className="h-8 w-8 text-emerald-400 mr-2" />
                <span className="font-bold text-xl text-white">
                  BeatTheOdds
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link
                href="#how-it-works"
                className="text-gray-300 hover:text-white transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#insights"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Insights
              </Link>
              <Link
                href="#faq"
                className="text-gray-300 hover:text-white transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </nav>

            <div className="hidden md:flex">
              <Link href="/dashboard">
                <Button
                  variant="default"
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Start Free
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 shadow-xl">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="#how-it-works"
                className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#insights"
                className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Insights
              </Link>
              <Link
                href="#faq"
                className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <div className="px-3 py-2">
                <Link href="/dashboard">
                  <Button
                    variant="default"
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Hero Section */}
        <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0,rgba(16,185,129,0)_70%)] bg-center"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          </div>

          <motion.div
            className="max-w-7xl mx-auto relative z-10"
            initial="hidden"
            animate="show"
            variants={container}
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={item} className="text-center md:text-left">
                <div className="inline-block px-3 py-1 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                  Data-Driven Gambling Insights
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
                    You can&apos;t beat the odds
                  </span>
                </h1>
                <p className="text-2xl md:text-3xl font-bold mb-6 text-gray-200">
                  Discover the{" "}
                  <span className="text-emerald-400">real chances</span> of
                  winning the jackpot
                </p>
                <p className="text-xl max-w-2xl mx-auto md:mx-0 text-gray-300 mb-8">
                  Our advanced simulation engine runs thousands of virtual bets
                  to show you what gambling companies don&apos;t want you to
                  see.
                </p>
                <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 mb-8">
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Start Your Simulation{" "}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-gray-500 hover:bg-gray-700 text-white"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg inline-block">
                  <p className="text-amber-400 font-semibold flex items-center">
                    <Award className="mr-2 h-5 w-5" /> Over 10,000 simulations
                    run by users like you
                  </p>
                </div>
              </motion.div>

              <motion.div variants={item} className="hidden md:block relative">
                <div className="relative h-[450px] w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-2xl">
                      <div className="mb-4 pb-4 border-b border-gray-700">
                        <h3 className="text-lg font-medium text-gray-200">
                          Simulation Results
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Spent:</span>
                          <span className="text-white font-bold">
                            Ksh 5,000
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Won:</span>
                          <span className="text-white font-bold">Ksh 120</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Net Loss:</span>
                          <span className="text-red-400 font-bold">
                            -Ksh 4,880
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Win Rate:</span>
                          <span className="text-white font-bold">2.4%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                          <div
                            className="bg-emerald-500 h-2.5 rounded-full"
                            style={{ width: "2.4%" }}
                          ></div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-gray-700">
                          <p className="text-amber-400 text-sm">
                            You would need to play for approximately 270 years
                            to have a 50% chance of winning the jackpot.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section
          id="insights"
          className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-gray-800/60 border-gray-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-4xl font-bold text-emerald-400 mb-2">
                    <CountUp
                      end={14000000}
                      prefix="1 in "
                      duration={2.5}
                      separator=","
                    />
                  </h3>
                  <p className="text-gray-300">
                    Average odds of winning a typical lottery jackpot
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/60 border-gray-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-4xl font-bold text-emerald-400 mb-2">
                    <CountUp end={99.99} suffix="%" decimals={2} duration={2} />
                  </h3>
                  <p className="text-gray-300">
                    Chance of losing money on jackpot bets over time
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/60 border-gray-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-4xl font-bold text-emerald-400 mb-2">
                    <CountUp end={100} suffix="%" duration={1.5} />
                  </h3>
                  <p className="text-gray-300">
                    Data-driven insights to make informed decisions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30"
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold mb-16 text-center">
              How Our Simulation Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Set Your Parameters</h3>
                <p className="text-gray-300">
                  Choose your bet amount, number of tickets, and jackpot type to
                  customize your simulation.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Run The Simulation</h3>
                <p className="text-gray-300">
                  Our engine simulates thousands of bets using the same odds as
                  real jackpot games.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-4">See The Results</h3>
                <p className="text-gray-300">
                  Get detailed analytics showing your expected returns, losses,
                  and probability of winning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-16 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold mb-3">
                  How accurate are the simulations?
                </h3>
                <p className="text-gray-300">
                  Our simulations use the exact same odds and payout structures
                  as real jackpot games. The results are statistically accurate
                  representations of what you can expect in real-world gambling
                  scenarios.
                </p>
              </div>

              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold mb-3">
                  Is this service free to use?
                </h3>
                <p className="text-gray-300">
                  Yes! Our basic simulation features are completely free. We
                  believe everyone should have access to this information before
                  spending money on gambling.
                </p>
              </div>

              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold mb-3">
                  Can I simulate specific jackpot games?
                </h3>
                <p className="text-gray-300">
                  Absolutely. Our platform supports simulations for most popular
                  lottery and jackpot games with their specific rules and odds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-900/40 to-blue-900/40">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">
              Ready to Face the Real Odds?
            </h2>
            <p className="text-xl mb-10">
              Start your simulation today and get data-driven insights about
              your gambling habits.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Create Your First Simulation{" "}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-800">
          <div className="max-w-7xl mx-auto text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} Jackpot Awareness. All rights
              reserved.
            </p>
            <p className="mt-2">
              This tool is for educational purposes only. Gambling involves risk
              and can be addictive.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
