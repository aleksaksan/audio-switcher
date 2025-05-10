import React from 'react'
import { Route, Routes } from 'react-router'
import { Drawer } from './Drawer'
import { Home } from './Home'
import { Settings } from './Settings'
import { Server } from './Server'

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Drawer />}>
        <Route index element={<Home />} />
        <Route path="settings" element={<Settings />} />
        <Route path="server" element={<Server />} />
      </Route>
    </Routes>

  )
}
