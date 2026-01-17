import { motion } from "framer-motion";

export default function MBtn({ className="", children, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
