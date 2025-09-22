import Link from "next/link"
import { Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#253253] text-white">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* About Us */}
          <div>
            <h4 className="text-teal-300 text-lg font-semibold mb-4">About Us</h4>
            <p className="text-slate-200/90 leading-relaxed mb-6 text-sm">
              BizBranches.pk is Pakistan’s top business directory, helping you find and connect with local businesses,
              services, and products quickly and easily. Your trusted platform for business discovery!
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-200/90">
                <Mail className="h-4 w-4 text-teal-300" />
                <a href="mailto:support@bizbranches.pk" className="hover:underline">support@bizbranches.pk</a>
              </div>
              <div className="flex items-center gap-3 text-slate-200/90">
                <MapPin className="h-4 w-4 text-teal-300" />
                <span>Pracha Street BCG Chowk Multan</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-teal-300 text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-200/90 text-sm">
              <li><Link href="/about" className="hover:underline">About Us</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/add" className="hover:underline">Add a Business</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 mt-10 border-t border-white/10 text-center">
          <p className="text-slate-300/80 text-xs">  Copyright 2025. All Rights Reserved BizBranches.pk</p>
        </div>
      </div>
    </footer>
  )
}
