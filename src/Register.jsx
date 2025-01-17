import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(values);  // Log the values to check if they are being correctly populated
    try {
      const res = await axios.post('https://eventhandler-backend-sts7.onrender.com/register', values);
      if (res.data.Status === "Success") {
        navigate('/login');
      } else {
        alert("Error status: " + res.data.Error); // Show error message from server
      }
    } catch (err) {
      console.error(err);  // Log any errors in the client
      alert("An error occurred");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="row w-100 justify-content-center">
        {/* Registration form section */}
        <div className="col-lg-4 col-md-6 col-sm-8 bg-white p-5 rounded-lg shadow-lg">
          <h2 className="text-center text-dark mb-4">Create an Account</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label text-muted"><strong>Name</strong></label>
              <input
                type="text"
                placeholder="Enter Name"
                name="name"
                onChange={e => setValues({ ...values, name: e.target.value })}
                className="form-control rounded-pill shadow-sm"
                required
              />
            </div>

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

            <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 mt-4">Sign Up</button>
            <p className="text-center text-muted mt-3">By signing up, you agree to our terms and policies.</p>
            <Link to="/login" className="btn btn-light w-100 rounded-pill text-decoration-none text-center mt-2 py-2">Already have an account? Log In</Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;