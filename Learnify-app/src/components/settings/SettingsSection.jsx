import React from 'react';
import { motion } from 'framer-motion';

function SettingsSection({ icon: Icon, title, children }) {
  return (
    <motion.div
      className='bg-[#D1FAE5] backdrop-filter backdrop-blur-lg shadow-lg rounded-xl p-6 border border-[#BBF7D0] mb-8'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='flex items-center mb-4'>
        <Icon className="text-[#047857] mr-4" size={24} />
        <h2 className='text-xl font-semibold text-[#065F46]'>
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

export default SettingsSection;
