import { motion } from "framer-motion";

export const PlatformCard = ({
  name,
  icon,
  description,
  loginUrl,
  btnVariant,
  index,
}) => {
  const buttonClasses = {
    youtube: "btn-youtube",
    linkedin: "btn-linkedin",
    twitter: "btn-twitter",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
      whileHover={{
        y: -12,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      className="group relative"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-3xl blur-xl transition-all duration-500" />

      <div className="glass-card rounded-3xl p-8 h-full flex flex-col relative overflow-hidden group-hover:border-primary/30 transition-all duration-500">
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />

        {/* Icon container */}
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-glass rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glass">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4 flex-1 z-10">
          <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {description}
          </p>
        </div>

        {/* CTA Button */}
        <motion.a
          href={loginUrl}
          className={`mt-8 w-full py-4 px-6 rounded-2xl font-semibold text-center transition-all duration-300 ${buttonClasses[btnVariant]} transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Connect {name}
        </motion.a>
      </div>
    </motion.div>
  );
};
