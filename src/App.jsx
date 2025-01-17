import React from 'react'
import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './EventPage'
import Register from './Register'
import Login from './Login'
import EventPage from './EventPage'
import Event from './Event'
import AuthCheck from './AuthCheck';  // Import AuthCheck if you are using a custom hook for authentication

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EventPage />} />          {/* Home page, Event dashboard */}
        <Route path="/login" element={<Login />} />         {/* Login page */}
        <Route path="/register" element={<Register />} />   {/* Register page */}
        <Route path="/event/:id" element={<Event />} />
        {/* Add other routes for additional pages if needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;