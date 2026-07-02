import { motion } from "framer-motion";

export const FloatingElement = ({
  children,
  delay = 0,
  duration = 6,
  className = "",
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-10, 10, -10],
        rotate: [-1, 1, -1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};
