import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
        // Clear error when user types
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!credentials.username || !credentials.password) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/auth/login`, {
                userName: credentials.username,
                password: credentials.password
            });

            if (response.data.success) {
                // Store token in localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                console.log('Login successful:', response.data.user);
                
                // Call the success callback
                if (onLoginSuccess) {
                    onLoginSuccess(response.data.token, response.data.user);
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>🔐 OnlyOffice Login</h1>
                    <p>Please enter your credentials to access the document manager</p>
                </div>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            disabled={loading}
                            autoComplete="username"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>
                    
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <p>📄 OnlyOffice Document Manager</p>
                </div>
            </div>
        </div>
    );
};

export default Login; 