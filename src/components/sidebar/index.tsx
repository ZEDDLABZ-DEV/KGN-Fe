/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { LiaHardHatSolid } from 'react-icons/lia';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { GrSettingsOption, GrUserWorker } from 'react-icons/gr';
import { GoProjectRoadmap, GoTasklist } from 'react-icons/go';
import { GiRobotLeg, GiTeamIdea } from 'react-icons/gi';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { FiFileText, FiUserCheck } from 'react-icons/fi';
import { MdOutlineRequestPage } from 'react-icons/md';
import { HiOutlineFolderOpen } from 'react-icons/hi';
import { LuClipboardList } from 'react-icons/lu';
import { CgLogOut, CgUser } from 'react-icons/cg';
import { TbDashboard } from 'react-icons/tb';
// import { FaInstagram } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { isAdminRole } from '../../utils/projects';
import './index.css';

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const { activeMenuKey, setActiveMenuKey, logout, permissions = [], user } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [allowedMenuItems, setAllowedMenuItems] = useState<any[]>([]);
  const isAdmin = isAdminRole(user);

  const menuItems: Array<{
    name: string
    icon: React.ReactElement
    path: string
    permission?: string | string[]
    adminOnly?: boolean
    onClick?: () => void
  }> = [
    { name: 'Dashboard', icon: <TbDashboard size={20} />, path: '/' },
    { name: 'Projects', icon: <GoProjectRoadmap size={20} />, path: '/projects', permission: 'view_projects' },
    { name: 'Team', icon: <GiTeamIdea size={20} />, path: '/teams', permission: 'view_teams' },
    { name: 'Tasks', icon: <GoTasklist size={20} />, path: '/tasks', permission: 'view_tasks' },
    { name: 'Daily Reports', icon: <FiFileText size={20} />, path: '/daily-reports', adminOnly: true },
    { name: 'Attendance', icon: <FiUserCheck size={20} />, path: '/attendance', permission: ['mark_attendance', 'view_attendance'] },
    { name: 'Users', icon: <CgUser size={20} />, path: '/users', permission: 'view_users' },
    { name: 'Workers', icon: <GrUserWorker size={20} />, path: '/workers', permission: 'view_users' },
    { name: 'Vendors', icon: <GrUserWorker size={20} />, path: '/vendors', permission: 'view_users' },
    { name: 'BOQ Upload', icon: <HiOutlineDocumentText size={20} />, path: '/boq', permission: 'view_projects' },
    { name: 'Material Requests', icon: <MdOutlineRequestPage size={20} />, path: '/material-requests', permission: 'view_projects' },
    { name: 'File Manager', icon: <HiOutlineFolderOpen size={20} />, path: '/file-manager', permission: 'view_projects' },
    { name: 'Purchase Orders', icon: <LuClipboardList size={20} />, path: '/purchase-orders', permission: 'view_projects' },
    { name: "GRN", icon: <HiOutlineDocumentText size={20} />, path: '/grn', permission: ['view_projects', 'view_purchase_orders'] },
    { name: 'Inventory', icon: <LuClipboardList size={20} />, path: '/inventory', permission: 'view_projects' },
    { name: 'Roles & Permissions', icon: <GiRobotLeg size={20} />, path: '/roles-permissions', permission: 'manage_roles' },
    { name: 'Settings', icon: <GrSettingsOption size={20} />, path: '/settings' },
    { name: 'Logout', icon: <CgLogOut size={20} />, onClick: logout, path: '/logout' },
  ];

  useEffect(() => {
    console.log(permissions, 'permissions');
    const allowedMenuItemsData = menuItems.filter(({ permission, adminOnly }) => {
      if (adminOnly && !isAdmin) return false
      if (!permission) return true
      const required = Array.isArray(permission) ? permission : [permission]
      return required.some((perm) => permissions.find((p: any) => p.name === perm))
    });
    console.log(allowedMenuItemsData, 'allowedMenuItemsData');
    setAllowedMenuItems(allowedMenuItemsData);
  }, [permissions, isAdmin])

  const handleClick = (path: string, name: string) => {
    navigate(path);
    setActiveMenuKey(name);
  }

  return (
    <aside
      className={`${sidebarOpen ? 'w-64' : 'w-16'
        } fixed md:static top-0 left-0 h-[95vh] bg-white border-r rounded-xl border-[#E5E7EB] shadow-[0px_0px_10px_0px_#E5E7EB] transform translate-x-0 transition-all! duration-600 z-30 flex flex-col`}
      style={{ WebkitTransition: 'width 1s ease-in-out' } as React.CSSProperties}
    >
      <div
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`w-[22px] cursor-pointer border-r border-[#E5E7EB] flex shadow-[1px_0px_0px_0px_#E5E7EB] items-center justify-center h-20 bg-white absolute -right-5 bottom-1/2 rounded-tr-[70px] rounded-br-[80px] accessiblity`}
      >
        {sidebarOpen ? (
          <BiChevronLeft color="#1F2937" size={40} />
        ) : (
          <BiChevronRight color="#1F2937" size={40} />
        )}
      </div>
      <div className="border-b border-[#E5E7EB] flex items-center justify-between px-4">
        <div className="py-4">
          <LiaHardHatSolid color="#1F2937" size={sidebarOpen ? 40 : 30} />
          {sidebarOpen && (
            <h1 className="text-md font-bold tracking-wide bg-linear-to-r text-[#1F2937] uppercase">
              KGN
            </h1>
          )}
        </div>

      </div>
      <nav className={`flex-1 mt-4 space-y-2 overflow-y-auto ${sidebarOpen ? 'px-6' : 'px-2 flex flex-col items-center'}`}>
        {allowedMenuItems.map(({ name, icon, path, onClick }) => {
          const button = (
            <button
              key={name}
              onClick={name === 'Logout' ? onClick : () => handleClick(path, name)}
              className={`flex items-center text-sm! w-full py-3 rounded-lg transition-all duration-200 font-medium text-left hover:bg-[#F3F4F6] hover:text-[#F3F4F6]shadow-sm ${activeMenuKey === name
                ? 'bg-[#F3F4F6] text-black  scale-[1.02]'
                : 'text-[#1F2937]'
                } ${sidebarOpen ? 'gap-2 px-2 justify-start' : 'justify-center px-0'}`}
            >
              {icon}
              {sidebarOpen && <span>{name}</span>}
            </button>
          );

          return sidebarOpen ? (
            button
          ) : (
            <Tooltip key={name} title={name} placement="right">
              <div className="w-full">{button}</div>
            </Tooltip>
          );
        })}
      </nav>

      {sidebarOpen && (
        <div className="flex p-4 border-t border-gray-200 text-sm text-[#1F2937]">
          © 2025 KGN
        </div>
      )}
    </aside>
  );
};

export { Sidebar };
