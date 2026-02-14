import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import axios from 'axios';

// Get API URL correctly
const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

const Login = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/login`, { password });
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                onLogin();
            }
        } catch (err) {
            setError('Incorrect password. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#F9FAFB', fontFamily: 'Segoe UI, sans-serif'
        }}>
            <div style={{
                background: 'white', padding: '50px', borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px', width: '90%'
            }}>
                <div style={{
                    background: '#E6F0EA', width: '60px', height: '60px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto'
                }}>
                    <Lock size={30} color="#7C9A86" />
                </div>

                <h2 style={{ color: '#2d3748', marginBottom: '10px' }}>Digital Garden</h2>
                <p style={{ color: '#718096', marginBottom: '30px', fontSize: '15px' }}>
                    This space is private. Please enter your password to unlock.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        autoFocus
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0',
                            marginBottom: '20px', fontSize: '16px', outline: 'none', textAlign: 'center',
                            transition: 'border-color 0.2s',
                            borderColor: error ? '#fc8181' : '#e2e8f0'
                        }}
                    />
                    {error && <div style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '20px' }}>{error}</div>}

                    <button type="submit" disabled={isLoading}
                        style={{
                            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
                            background: '#7C9A86', color: 'white', fontSize: '16px', fontWeight: 'bold',
                            cursor: 'pointer', transition: 'transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}>
                        {isLoading ? 'Unlocking...' : <>Unlock <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>

            <div style={{ marginTop: '30px', color: '#cbd5e0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={14} /> End-to-End Encrypted (Local)
            </div>
        </div>
    );
};

export default Login;
