import { Link } from "wouter";
import { motion } from "framer-motion";
import { Github, ExternalLink, Heart, ArrowRight, BookOpen, FileText, Shield, Search } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

function PortfolioLink({ name, url }: { name: string; url: string }) {
  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
        >
          {name}
        </a>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[340px] p-0 overflow-hidden rounded-xl shadow-xl"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{name}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <iframe
          src={url}
          title={`${name} — live portfolio`}
          className="block w-full h-[280px] bg-background"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </HoverCardContent>
    </HoverCard>
  );
}

function FooterLink({ href, icon: Icon, children }: { href: string; icon?: any; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
    >
      {Icon && <Icon className="w-4 h-4 group-hover:text-primary transition-colors" />}
      <span className="group-hover:translate-x-1 transition-transform duration-200">{children}</span>
    </Link>
  );
}

function ExternalFooterLink({ href, icon: Icon, children }: { href: string; icon?: any; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
    >
      {Icon && <Icon className="w-4 h-4 group-hover:text-primary transition-colors" />}
      <span className="group-hover:translate-x-1 transition-transform duration-200">{children}</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="w-full mt-auto bg-gradient-to-b from-muted/50 to-background border-t border-border/50 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-primary/3 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-blue-400/3 rounded-full blur-[60px] -z-10 pointer-events-none" />

      {/* Animated gradient line at top */}
      <div className="h-[2px] w-full bg-gradient-to-r from-primary via-cyan-500 to-blue-500 animate-gradient-x shadow-lg shadow-primary/20" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex-1 space-y-3"
          >
            <div className="flex items-center gap-2 group cursor-pointer">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-8 h-8 bg-gradient-to-br from-primary to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <Search className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">QueryFlow</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Empowering intelligent search through transparency and data flow visualization.
            </p>
          </motion.div>

          {/* Navigation & Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-8"
          >
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Navigation</h3>
              <div className="space-y-1.5">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/results">Search</FooterLink>
                <FooterLink href="/journey">Pipeline</FooterLink>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Resources</h3>
              <div className="space-y-1.5">
                <ExternalFooterLink href="https://github.com/Mostafa-Zhran/QueryFlow" icon={Github}>
                  GitHub
                </ExternalFooterLink>
                <ExternalFooterLink href="#" icon={BookOpen}>
                  API Docs
                </ExternalFooterLink>
                <ExternalFooterLink href="#" icon={Shield}>
                  Privacy
                </ExternalFooterLink>
              </div>
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-2"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Team</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              <span>Built by</span>
            </div>
            <div className="space-y-2">
              <motion.a
                href="https://mostafa-zahran.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                  MZ
                </div>
                <span className="group-hover:text-primary transition-colors">Mostafa Zahran</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/yousif-salah/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                  YS
                </div>
                <span className="group-hover:text-primary transition-colors">Yousif Salah</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </motion.a>
              <motion.a
                href="https://sae8d.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                  SM
                </div>
                <span className="group-hover:text-primary transition-colors">Saeed Mohamed</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-6 mt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QueryFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Mostafa-Zhran/QueryFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Github className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
              <span>GitHub</span>
            </a>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
