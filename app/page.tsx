import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { ArrowRight, Zap, Brain, Target, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
              ⚡
            </div>
            <span className="text-xl font-bold neon-glow-purple">Heael</span>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            Your <span className="neon-glow-purple">AI-Powered</span> Health Companion
          </h1>
          <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto text-balance">
            Track your wellness journey with real-time AI insights. Monitor mood, sleep, and activity while competing with friends.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all transform hover:scale-105"
          >
            Start Your Journey <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: 'AI Insights',
                description: 'Get personalized recommendations based on your health patterns',
              },
              {
                icon: Zap,
                title: 'Real-Time Tracking',
                description: 'Log mood, sleep, and activity instantly with our smart interface',
              },
              {
                icon: Target,
                title: 'Weekly Challenges',
                description: 'Achieve wellness goals and earn rewards',
              },
              {
                icon: TrendingUp,
                title: 'Progress Analytics',
                description: 'Visualize your health trends with beautiful charts',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <GlassCard key={idx} className="flex flex-col items-start hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-foreground/60 text-sm">{feature.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Join the Wellness Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { stat: '10K+', label: 'Active Users' },
              { stat: '2.5M', label: 'Health Metrics Tracked' },
              { stat: '98%', label: 'User Satisfaction' },
            ].map((item, idx) => (
              <GlassCard key={idx} className="text-center py-8">
                <div className="text-4xl font-bold neon-glow-purple mb-2">{item.stat}</div>
                <p className="text-foreground/60">{item.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="text-center py-12 border-l-4 border-primary neon-border-purple">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Health?</h2>
            <p className="text-foreground/70 mb-8 text-lg">
              Start tracking your wellness today and discover insights that help you live better.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                  ⚡
                </div>
                <span className="font-bold neon-glow-purple">Heael</span>
              </div>
              <p className="text-foreground/60 text-sm">Your AI-powered health companion</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground transition">About</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8">
            <p className="text-center text-foreground/50 text-sm">
              © 2024 Heael. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
