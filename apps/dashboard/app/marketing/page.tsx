'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-teal-400">🧠</span>
                Retail Brain
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-400 hover:text-teal-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-teal-400 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-400 hover:text-teal-400 transition-colors">Pricing</a>
              <a href="#docs" className="text-gray-400 hover:text-teal-400 transition-colors">Docs</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-400 hover:text-white px-4 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?signup=true"
                className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-purple-500/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-full text-xs font-semibold text-teal-400 shadow-lg shadow-teal-500/20 mb-6"
              >
                <span className="text-yellow-400">★</span>
                NO PHD REQUIRED
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-6xl font-bold text-white mb-6 leading-tight"
              >
                <span className="block">Lightning-Fast</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                  Customer Intelligence
                </span>
                <span className="block">Platform</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl text-gray-300 mb-8 leading-relaxed"
              >
                Unify customer data, predict behavior, and drive growth with AI-powered insights. 
                Get a complete 360° view of every customer in milliseconds.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mb-8"
              >
                <Link
                  href="/login?signup=true"
                  className="bg-teal-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-teal-600 transition-all hover:shadow-lg hover:shadow-teal-500/50 inline-flex items-center justify-center"
                >
                  Quick Start →
                </Link>
                <Link
                  href="/login"
                  className="bg-gray-800 text-white border-2 border-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-all inline-flex items-center justify-center"
                >
                  View Demo →
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex gap-8 text-sm"
              >
                <div>
                  <div className="text-2xl font-bold text-white">2M+</div>
                  <div className="text-gray-400">Customers Tracked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">&lt;4ms</div>
                  <div className="text-gray-400">Query Speed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-gray-400">Uptime SLA</div>
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-auto text-sm text-gray-400">Customer Search</div>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="sarah johnson"
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    🔍
                  </div>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-teal-400 flex items-center gap-1">
                    ⚡ Found 3 results in 2ms
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Sarah Johnson', email: 'sarah.j@company.com', status: 'Active', amount: '$2,450' },
                    { name: 'Michael Chen', email: 'm.chen@business.org', status: 'Active', amount: '$1,890' },
                    { name: 'Emma Williams', email: 'emma.w@startup.io', status: 'New', amount: '$320' },
                  ].map((customer, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                      className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{customer.name}</div>
                          <div className="text-sm text-gray-400">{customer.email}</div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${customer.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {customer.status}
                          </span>
                          <div className="text-sm font-semibold text-white mt-1">{customer.amount}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need for <span className="text-teal-400">Customer Intelligence</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful tools to understand, engage, and grow your customer base.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: 'Instant Customer Search', desc: 'Find customers instantly by name, email, phone, or any identifier. Fuzzy matching and typeahead suggestions included.' },
              { icon: '⚡', title: 'Real-Time Event Tracking', desc: 'Simple JavaScript SDK to track events from your website. Automatic customer capture, page views, purchases, and more.' },
              { icon: '🧠', title: 'AI-Powered Predictions', desc: 'Predict customer lifetime value, churn probability, and purchase intent. Monitor model performance in real-time.' },
              { icon: '📊', title: 'Advanced Analytics', desc: 'Deep insights into customer behavior, cohort analysis, and funnel visualization. Export reports with one click.' },
              { icon: '🛡️', title: 'Enterprise Security', desc: 'SOC 2 compliant, GDPR ready, and built with privacy-first architecture. Your customer data is always protected.' },
              { icon: '🔗', title: 'Identity Resolution', desc: 'Automatically merge duplicate profiles across channels. Create unified customer views with ML-powered matching.' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 hover:border-teal-500/50 transition-all cursor-pointer"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple, powerful, and fast. Get started in minutes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: 1, bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/50', textColor: 'text-blue-400', title: 'Connect Your Data', desc: 'Import CSV files, integrate via API, or use our JavaScript SDK. Connect Shopify, POS systems, or any data source.' },
              { num: 2, bgColor: 'bg-green-500/20', borderColor: 'border-green-500/50', textColor: 'text-green-400', title: 'Automatic Processing', desc: 'Our Identity Engine automatically merges duplicate profiles, creates unified customer views, and enriches data with ML predictions.' },
              { num: 3, bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/50', textColor: 'text-purple-400', title: 'Get Insights', desc: 'Access your Customer 360 dashboard, ask AI questions, run analytics, and make data-driven decisions.' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.6 }}
                className="text-center"
              >
                <div className={`${step.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${step.borderColor}`}>
                  <span className={`text-2xl font-bold ${step.textColor}`}>{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-6"
          >
            Ready to Transform Your <span className="text-teal-400">Customer Insights?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-gray-400 mb-8"
          >
            Join thousands of businesses using Retail Brain to understand their customers better and drive growth.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Link
              href="/login?signup=true"
              className="bg-teal-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-teal-600 transition-all hover:shadow-lg hover:shadow-teal-500/50"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/login"
              className="bg-gray-800 text-white border-2 border-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-all"
            >
              Schedule Demo
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Free 14-day trial
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span> No credit card required
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Cancel anytime
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-teal-400">🧠</span> Retail Brain
              </div>
              <p className="text-sm text-gray-400">
                Customer Intelligence Platform. Blazing Fast. Developer Friendly. With a Dash of AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Pages</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-teal-400 transition-colors">Home</a></li>
                <li><a href="#how-it-works" className="hover:text-teal-400 transition-colors">About</a></li>
                <li><a href="#pricing" className="hover:text-teal-400 transition-colors">Downloads</a></li>
                <li><Link href="/login" className="hover:text-teal-400 transition-colors">Documentation</Link></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Libraries</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-teal-400 transition-colors">JavaScript SDK</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">PHP Client</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Ruby Client</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Go Client</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Python Client</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Dart Client</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Priority Support</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Archive</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">GitHub Issues</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © 2025 Retail Brain. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
