import React, { useState } from 'react'
import { FaHome,FaBook,FaCalendarAlt } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { AnimatePresence, motion } from "framer-motion";
import { IoIosMenu } from "react-icons/io";
import { Link } from 'react-router-dom';

const SIDEBAR_ITEMS =[
    { name:"Home", icon:FaHome ,color:"#000000",href:"/dashboard/classroom" },
    { name:"Books", icon:FaBook ,color:"#000000",href:"/dashboard/books" },
    { name:"Calender", icon:FaCalendarAlt ,color:"#000000",href:"/dashboard/calendar" },
    { name:"Settings", icon:IoIosSettings ,color:"#000000",href:"/dashboard/settings" },
];

function Sidebar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <motion.div 
    className={`relative z-10 transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? "xl:w-64 w-50":"w-20"}`}
    animate = {{width:isSidebarOpen ? (window.innerWidth < 1280 ? 200 : 256) : 80}}
    >
      <div className='h-full bg-[#ECFDF5] p-4 flex flex-col border-r border-[#BBF7D0] shadow-lg rounded-e-2xl'>
        <motion.button
          whileHover = {{scale:1.1}}
          whileTap = {{scale:0.9}}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full hover:bg-[#D1FAE5] transition-colors max-w-fit cursor-pointer"
        >
          <IoIosMenu size={24} className="text-[#065F46]"/>
        </motion.button>
        <nav className='mt-8 flex-grow'>
          {SIDEBAR_ITEMS.map(item =>(
            <Link key={item.href} to={item.href}>
              <motion.div whileHover={{ scale: 1.05 }} className='flex items-center p-4 text-sm font-medium rounded-lg hover:bg-[#D1FAE5] transition-colors mb-2'>
                <div className="text-[#4B5563] group-hover:text-[#047857]">
                  {<item.icon size={20} style={{color: item.color,minWidth: "20px"}}/>}
                </div>
                <AnimatePresence>
                  {isSidebarOpen && (
                      <motion.span
                        className='ml-4 whitespace-nowrap'
                          initial={{opacity: 0, width: 0}}
                          animate={{opacity: 1, width: "auto"}}
                          exit={{opacity: 0, width: 0}}
                          transition={{duration: 0.2, delay:0.3}}
                        >
                        {item.name}         
                      </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )) }
        </nav>
      </div>
    </motion.div>
  );
}

export default Sidebar