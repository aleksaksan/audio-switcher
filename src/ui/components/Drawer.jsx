import React, { useRef } from 'react';
import { NavLink, Outlet } from 'react-router';

export const Drawer = () => {
  const drawerCheckboxRef = useRef(null);

  const closeDrawer = () => {
    if (drawerCheckboxRef.current) {
      drawerCheckboxRef.current.checked = false;
    }
  };

  return (
    <div className="drawer">
      <input 
        id="my-drawer" 
        type="checkbox" 
        className="drawer-toggle" 
        ref={drawerCheckboxRef}
      />
      <div className="drawer-content">
        <div className="relative min-h-[100vh] min-w-[100vw]">
          <label
            htmlFor="my-drawer"
            className="btn btn-ghost drawer-button absolute left-4 top-4 p-2"
            style={{ transition: 'transform 0.3s ease' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
          <Outlet />
        </div>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
          <li>
            <NavLink
              to={'/'}
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeDrawer}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink 
              to={'/settings'} 
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeDrawer}
            >
              Settings
            </NavLink>
          </li>
          <li>
            <NavLink
              to={'/server'}
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeDrawer}
            >
              Server
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
};