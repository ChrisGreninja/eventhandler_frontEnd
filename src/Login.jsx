import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [values, setValues] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  const handleSubmit = (event) => {
    event.preventDefault();
    axios.post('http://localhost:8081/login', values).then(res => {
      if (res.data.Status === "Success") {
        navigate('/');
      } else {
        alert(res.data.Error);
      }
    }).catch(err => console.log(err));
  };

  // Handle guest login
  const handleGuestLogin = () => {
    const guestCredentials = {
      email: 'guest@example.com',
      password: 'guest'
    };
    
    axios.post('http://localhost:8081/login', guestCredentials).then(res => {
      if (res.data.Status === "Success") {
        navigate('/');
      } else {
        alert(res.data.Error);
      }
    }).catch(err => console.log(err));
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="row w-100 justify-content-center">
        {/* Login form section */}
        <div className="col-lg-4 col-md-6 col-sm-8 bg-white p-5 rounded-lg shadow-lg">
          <h2 className="text-center text-dark mb-4">Welcome Back!</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label text-muted"><strong>Email</strong></label>
              <input
                type="email"
                placeholder="Enter Email"
                name="email"
                onChange={e => setValues({ ...values, email: e.target.value })}
                className="form-control rounded-pill shadow-sm"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label text-muted"><strong>Password</strong></label>
              <input
                type="password"
                placeholder="Enter Password"
                name="password"
                onChange={e => setValues({ ...values, password: e.target.value })}
                className="form-control rounded-pill shadow-sm"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 mt-4">Sign In</button>
            {/* Guest Login Button */}
          <div className="mt-4">
            <button 
              type="button" 
              className="btn btn-outline-secondary w-100 rounded-pill py-2" 
              onClick={handleGuestLogin}>
              Continue as Guest
            </button>
          </div>
            <p className="text-center text-muted mt-3">By signing in, you agree to our terms and policies.</p>
            <Link to="/register" className="btn btn-light w-100 rounded-pill text-decoration-none text-center mt-2 py-2">Create Account</Link>
          </form>

          
        </div>
      </div>
    </div>
  );
}

export default Login;
