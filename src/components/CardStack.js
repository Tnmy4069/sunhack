'use client';
import { motion } from 'framer-motion';

const cards = [
  { 
    id: 1, 
    color: 'from-purple-600 via-fuchsia-600 to-pink-500', 
    shadow: 'shadow-[0_15px_30px_rgba(138,43,226,0.6)]', 
    balance: '₹45,231.00', 
    number: '**** 4219', 
    type: 'Credit' 
  },
  { 
    id: 2, 
    color: 'from-emerald-400 via-teal-500 to-teal-700', 
    shadow: 'shadow-[0_15px_30px_rgba(16,185,129,0.5)]', 
    balance: '₹12,400.50', 
    number: '**** 8821', 
    type: 'Debit' 
  },
  { 
    id: 3, 
    color: 'from-cyan-600 via-blue-700 to-indigo-800', 
    shadow: 'shadow-[0_15px_30px_rgba(6,182,212,0.5)]', 
    balance: '₹8,902.00', 
    number: '**** 1102', 
    type: 'Savings' 
  }
];

export default function CardStack() {
  return (
    <div className="relative h-56 w-full flex justify-center items-center perspective-[1000px] mt-8 mb-4">
      {cards.map((card, index) => {
        const isTop = index === 0;
        
        return (
          <motion.div
            key={card.id}
            className={`absolute w-72 sm:w-80 h-48 rounded-2xl p-6 flex flex-col justify-between bg-gradient-to-br ${card.color} ${card.shadow} border-t border-white/30 border-l border-white/20 backdrop-blur-lg cursor-pointer overflow-hidden group`}
            initial={{ 
              y: index * -25, 
              scale: 1 - index * 0.06, 
              zIndex: 10 - index,
              rotateX: 12
            }}
            animate={{ 
              y: index * -25, 
              scale: 1 - index * 0.06,
              zIndex: 10 - index,
              rotateX: 12
            }}
            whileHover={{ 
              y: (index * -25) - 30, 
              scale: isTop ? 1.05 : 1 - index * 0.02,
              rotateX: 0,
              zIndex: 20
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Glass reflection effect */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none"></div>

            <div className="flex justify-between items-center text-white relative z-10">
              <span className="font-semibold tracking-wider text-sm opacity-90 drop-shadow-md">{card.type}</span>
              <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="12" r="5" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="17" cy="12" r="5" fill="currentColor" fillOpacity="0.8"/>
              </svg>
            </div>
            
            <div className="text-white relative z-10">
              <p className="text-xs opacity-80 mb-1 uppercase tracking-widest font-medium">Available Balance</p>
              <p className="text-3xl font-extrabold tracking-wide drop-shadow-lg">{card.balance}</p>
            </div>
            
            <div className="flex justify-between items-end text-white/80 text-sm font-medium tracking-widest relative z-10">
              <span className="drop-shadow-sm">{card.number}</span>
              <span className="drop-shadow-sm">12/28</span>
            </div>
            
            {/* Ambient inner glow */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-300 pointer-events-none"></div>
          </motion.div>
        );
      })}
    </div>
  );
}
