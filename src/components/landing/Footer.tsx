import { ArrowRight, Send, Sparkles, Twitter, Linkedin, Instagram, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="relative px-20 mb-6 overflow-hidden">
      {/* Floating Footer Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white rounded-[3rem] relative overflow-hidden shadow-2xl max-w-8xl mx-auto">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-[60rem] h-[60rem] bg-fuchsia-500/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="max-w-7xl mx-auto relative z-10 py-20 px-6 md:px-12">
          {/* Main CTA Section with Text Animation */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-semibold mb-8 hover:bg-fuchsia-500/20 transition-all animate-bounce">
              <Sparkles className="w-4 h-4" />
              Join 10,000+ Educators
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="inline-block animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                Ready to Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 text-transparent bg-clip-text inline-block animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                Your Classroom?
              </span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
              <a
                href="/signin"
                className="group px-8 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-full text-lg font-bold hover:shadow-2xl hover:shadow-fuchsia-500/50 transition-all duration-500 ease-out hover:scale-110 flex items-center gap-3"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/contact"
                className="group px-8 py-5 bg-white/5 backdrop-blur-sm border-2 border-white/10 text-white rounded-full text-lg font-bold hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-500 ease-out flex items-center gap-3"
              >
                Get in Touch
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-12"></div>

          {/* Footer Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  C
                </div>
                <span className="text-2xl font-bold">Classera</span>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed max-w-sm">
                Empowering educators with innovative tools to create engaging, data-driven learning experiences that inspire and transform.
              </p>
              <a
                href="mailto:hello@classera.io"
                className="inline-flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-medium group"
              >
                hello@classera.io
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Pricing', 'Case Studies', 'Integrations', 'API'].map((link) => (
                  <li key={link}>
                    <a href="#" className="group text-slate-400 hover:text-white transition-all hover:translate-x-2 inline-flex items-center gap-2 text-sm">
                      <span className="w-0 h-1 rounded-full bg-fuchsia-400 group-hover:w-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5">
                {['About Us', 'Careers', 'Blog', 'Press Kit', 'Partners'].map((link) => (
                  <li key={link}>
                    <a href="#" className="group text-slate-400 hover:text-white transition-all hover:translate-x-2 inline-flex items-center gap-2 text-sm">
                      <span className="w-0 h-1 rounded-full bg-purple-400 group-hover:w-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2.5">
                {['Documentation', 'Tutorials', 'Community', 'Support', 'Status'].map((link) => (
                  <li key={link}>
                    <a href="#" className="group text-slate-400 hover:text-white transition-all hover:translate-x-2 inline-flex items-center gap-2 text-sm">
                      <span className="w-0 h-1 rounded-full bg-pink-400 group-hover:w-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-slate-500">
                <span>© 2024 Classera. All rights reserved.</span>
                <span className="hidden md:block">•</span>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <span className="hidden md:block">•</span>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-3">
                {[
                  { name: 'Twitter', icon: Twitter },
                  { name: 'LinkedIn', icon: Linkedin },
                  { name: 'Instagram', icon: Instagram },
                  { name: 'GitHub', icon: Github }
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href="#"
                      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-fuchsia-500 hover:border-fuchsia-500 hover:scale-110 transition-all group"
                      aria-label={social.name}
                    >
                      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
