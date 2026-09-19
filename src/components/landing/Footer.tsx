import { ArrowRight, Send, Sparkles, Twitter, Linkedin, Instagram, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="relative px-4 md:px-6 lg:px-8 xl:px-20 mb-3 md:mb-6 overflow-hidden">
      <div className="text-[var(--cl-body)] rounded-[var(--cl-r-xl)] md:rounded-[var(--cl-r-xl)] lg:rounded-[3rem] relative overflow-hidden max-w-8xl mx-auto bg-[var(--cl-canvas-soft)]">
        <div className="absolute top-0 left-0 w-[40rem] md:w-[60rem] h-[40rem] md:h-[60rem] rounded-full blur-[80px] md:blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 motion-safe:animate-landing-pulse" />
        <div className="absolute bottom-0 right-0 w-[35rem] md:w-[50rem] h-[35rem] md:h-[50rem] rounded-full blur-[80px] md:blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="max-w-7xl mx-auto relative z-10 py-10 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-[var(--cl-surface-card)] border border-[var(--cl-primary)] text-[var(--cl-primary)] text-xs md:text-sm font-semibold mb-4 md:mb-6 lg:mb-8 animate-fade-in-up">
              <Sparkles className="w-3 md:w-4 h-3 md:h-4" />
              <span className="hidden sm:inline">Join 10,000+ educators</span>
              <span className="sm:hidden">10,000+ educators</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.1] mb-4 md:mb-6 px-2">
              <span className="inline-block animate-fade-in-up stagger-1">Ready to transform</span>
              <br />
              <span className="text-[var(--cl-primary)] inline-block animate-fade-in-up stagger-2">your classroom?</span>
            </h2>

            <div className="flex flex-col gap-3 md:gap-4 justify-center items-center mb-8 md:mb-12 lg:mb-16 animate-fade-in-up stagger-3 px-2">
              <a
                href="/signin"
                className="group w-full md:w-auto px-6 md:px-8 py-3 md:py-4 lg:py-5 bg-[var(--cl-primary)] text-[var(--cl-on-primary)] rounded-full text-base md:text-lg font-semibold hover:bg-[var(--cl-primary)] transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center gap-2 md:gap-3"
              >
                Get Started
                <ArrowRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/contact"
                className="group w-full md:w-auto px-6 md:px-8 py-3 md:py-4 lg:py-5 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline-strong)] text-[var(--cl-ink)] rounded-full text-base md:text-lg font-semibold hover:bg-[var(--cl-surface-card)] hover:border-[var(--cl-hairline)] hover:scale-105 transition-all duration-300 ease-out flex items-center justify-center gap-2 md:gap-3"
              >
                Get in Touch
                <Send className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>

          <div className="border-t border-[var(--cl-hairline)] my-8 md:my-10 lg:my-12" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-10 mb-8 md:mb-10 lg:mb-12">
            <div className="lg:col-span-2 sm:col-span-2">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 md:w-10 h-8 md:h-10 bg-[var(--cl-primary)] rounded-[var(--cl-r-lg)] md:rounded-[var(--cl-r-xl)] flex items-center justify-center text-[var(--cl-on-primary)] text-lg md:text-xl font-bold flex-shrink-0">
                  C
                </div>
                <span className="text-xl md:text-2xl font-bold">Classera</span>
              </div>
              <p className="text-[var(--cl-muted)] mb-4 md:mb-6 leading-relaxed max-w-sm text-sm md:text-base">
                Live classes and an LMS built for educators who want engagement, not just enrollment.
              </p>
              <a
                href="mailto:hello@classera.io"
                className="inline-flex items-center gap-2 text-[var(--cl-primary)] hover:text-[var(--cl-primary)] transition-colors font-medium group text-sm md:text-base"
              >
                hello@classera.io
                <Send className="w-3 md:w-4 h-3 md:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>

            <div>
              <h3 className="text-[var(--cl-ink)] font-semibold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-1.5 md:space-y-2.5">
                {['Features', 'Pricing', 'Case Studies', 'Integrations', 'API'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[var(--cl-muted)] hover:text-[var(--cl-ink)] transition-colors text-xs md:text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[var(--cl-ink)] font-semibold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-1.5 md:space-y-2.5">
                {['About Us', 'Careers', 'Blog', 'Press Kit', 'Partners'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[var(--cl-muted)] hover:text-[var(--cl-ink)] transition-colors text-xs md:text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[var(--cl-ink)] font-semibold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wider">Resources</h3>
              <ul className="space-y-1.5 md:space-y-2.5">
                {['Documentation', 'Tutorials', 'Community', 'Support', 'Status'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[var(--cl-muted)] hover:text-[var(--cl-ink)] transition-colors text-xs md:text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 md:pt-8 border-t border-[var(--cl-hairline)]">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1 text-xs md:text-sm text-[var(--cl-muted)]">
                <span>© 2026 Classera. All rights reserved.</span>
                <a href="#" className="hover:text-[var(--cl-ink)] transition-colors">Privacy</a>
                <a href="#" className="hover:text-[var(--cl-ink)] transition-colors">Terms</a>
              </div>

              <div className="flex gap-2 md:gap-3">
                {[
                  { name: 'Twitter', icon: Twitter },
                  { name: 'LinkedIn', icon: Linkedin },
                  { name: 'Instagram', icon: Instagram },
                  { name: 'GitHub', icon: Github },
                ].map((social) => (
                  <a
                    key={social.name}
                    href="#"
                    className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] flex items-center justify-center hover:bg-[var(--cl-primary)] hover:border-[var(--cl-primary)] hover:scale-110 transition-all"
                    aria-label={social.name}
                  >
                    <social.icon className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
