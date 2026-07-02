import { Brain, Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">EqWell</h3>
            </div>
            <p className=" text-sm leading-relaxed">
              Enhance your emotional intelligence through AI-powered coaching,
              comprehensive assessments, and personalized exercises designed to
              help you understand and master your emotions.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-foreground hover:text-primary transition-colors duration-200"
                aria-label="Facebook"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-foreground hover:text-primary transition-colors duration-200"
                aria-label="Twitter"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-foreground hover:text-primary transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Features</h3>
            <ul className="space-y-2">
              {[
                "EQ Assessment Test",
                "AI Emotional Coach",
                "Daily EQ Exercises",
                "Progress Tracking",
                "Emotion Recognition",
                "Personalized Insights",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-foreground hover:text-primary transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2">
              {[
                "EQ Learning Hub",
                "Emotion Guides",
                "Success Stories",
                "Research & Science",
                "Community Forum",
                "Help & Support",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-foreground hover:text-primary transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Contact Us
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm ">Support Line</p>
                  <a
                    href="tel:+15551234567"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
                  >
                    +91-1234567890
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <a
                    href="mailto:support@EqWell.com"
                    className="text-sm text-foreground hover:text-primary transition-colors duration-200"
                  >
                    support@EqWell.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm ">
                    Bhakti Vedant Marg,
                    <br />
                    Vile Parle West,
                    <br />
                    Mumbai, Maharashtra 400056
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm ">
                    Mon-Fri: 9AM-6PM IST
                    <br />
                    AI Coach: 24/7 Available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-sm ">© 2025 EqWell. All rights reserved.</p>
              <div className="flex space-x-4">
                {["Privacy Policy", "Terms of Service", "Data Security"].map(
                  (item) => (
                    <a
                      key={item}
                      href="#"
                      className="text-sm text-foreground hover:text-primary transition-colors duration-200"
                    >
                      {item}
                    </a>
                  )
                )}
              </div>
            </div>
            <div className="text-sm ">
              <p className="text-balance">Powered by AI • Backed by Science</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
