import React from 'react'
import { Route, Routes } from 'react-router';
import { Drawer } from './Drawer';
import { Home } from '../pages/Home';
import { Server } from '../pages/Server';
import { Settings } from '../pages/Settings';
import { Tray } from '../pages/Tray';

export const Router = () => {
  return (
    <Routes>
      <Route path="/tray" element={<Tray />} />
      <Route path="/" element={<Drawer />}>
        <Route index element={<Home />} />
        <Route path="settings" element={<Settings />} />
        <Route path="server" element={<Server />} />
      </Route>
    </Routes>

  )
}
