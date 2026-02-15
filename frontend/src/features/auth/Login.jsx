import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const Login = ({ onLogin }) => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/auth/google`, {
                credential: credentialResponse.credential
            });

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                onLogin();
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google Sign-In failed. Please try again.');
        setIsLoading(false);
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'var(--bg-primary)', fontFamily: 'var(--font-sans)'
        }}>
            <div style={{
                background: 'var(--bg-secondary)', padding: '50px', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--card-shadow)', textAlign: 'center', maxWidth: '420px', width: '90%',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{
                    background: 'var(--accent-secondary)', width: '60px', height: '60px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto'
                }}>
                    <Lock size={30} color="var(--accent-primary)" />
                </div>

                <h2 style={{ color: 'var(--contrast-text)', marginBottom: '10px', fontFamily: 'var(--font-display)' }}>
                    Life OS
                </h2>
                <p style={{ color: 'var(--muted-text)', marginBottom: '30px', fontSize: '15px' }}>
                    Your personal digital garden awaits
                </p>

                {error && (
                    <div style={{
                        color: '#e53e3e', fontSize: '13px', marginBottom: '20px',
                        padding: '10px', background: 'rgba(229, 62, 62, 0.1)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{
                    display: 'flex', justifyContent: 'center',
                    opacity: isLoading ? 0.6 : 1,
                    pointerEvents: isLoading ? 'none' : 'auto'
                }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap
                        text="signin_with"
                        size="large"
                        theme="outline"
                    />
                </div>

                {isLoading && (
                    <p style={{ marginTop: '15px', color: 'var(--muted-text)', fontSize: '13px' }}>
                        Signing in...
                    </p>
                )}
            </div>

            <div style={{
                marginTop: '30px', color: 'var(--muted-text)', fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '5px'
            }}>
                <ShieldCheck size={14} /> Secure & Private
            </div>
        </div>
    );
};

export default Login;
