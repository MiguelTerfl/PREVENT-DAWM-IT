import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-full p-6">
            <h2 className="text-lg font-extralight tracking-widest uppercase text-white/70 mb-8">Settings</h2>

            {user && (
                <div className="glass-card p-4 rounded-2xl mb-6">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm text-white/80 font-light">{user.email}</p>
                </div>
            )}

            <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-5 py-3 glass-card rounded-2xl text-sm font-light text-red-400/80 hover:text-red-400 hover:border-red-400/20 transition-all border border-white/5 w-fit"
            >
                <LogOut className="w-4 h-4" />
                Sign out
            </button>
        </div>
    );
}
