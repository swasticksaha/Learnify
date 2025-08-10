import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';

function Dashboard() {

  return (
    <div className='flex h-screen bg-white text-black overflow-hidden'>
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-t from-[#E0FFF0] via-white to-[#E0FFF0] opacity-30'/>
        <div className='absolute inset-0 backdrop-blur-sm'/>
      </div>
      
      <Sidebar/>

      <div className="flex-grow p-6 overflow-auto">
        <Outlet/>
      </div>
    </div>
  );
}

export default Dashboard;
