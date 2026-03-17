import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
   Heart
} from "lucide-react";

import {CATEGORIES} from '../../utils/Categories'


const HFIndex = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-screen text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            {/* <Heart className="w-6 h-6 text-primary" />
            <span className="label-instrument text-primary">Vitals Lab</span> */}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Fitness & Health
            
            Calculators
          </h1>
          <p className="mt-2 text-muted-foreground  max-w-[50ch]">
            Precision instruments for your health metrics. No ads, no clutter —
            just accurate results.
          </p>
        </motion.div>

        {CATEGORIES.map((category, catIdx) => (
          <motion.section
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.1 + catIdx * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mb-12"
          >
            <h2 className="label-instrument text-muted-foreground mb-4">
              {category.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.calculators.map((calc, i) => (
                <motion.div
                  key={calc.path}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.15 + catIdx * 0.08 + i * 0.03,
                  }}
                >
                  <Link
                    to={calc.path}
                    className="group surface p-6 rounded-xl block transition-all duration-200 hover:border-primary border-2"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <calc.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                          {calc.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {calc.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
};

export default HFIndex;
