import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Loader2, Users, MessageSquare, ShieldAlert, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Admin() {
    const [agents, setAgents] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('agents');
    const [loading, setLoading] = useState(false);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [agentsData, logsData, usersData] = await Promise.all([
                api.admin.getAgents(),
                api.admin.getConversations(),
                api.admin.getUsers()
            ]);
            setAgents(agentsData);
            setLogs(logsData);
            setUsers(usersData);
        } catch (err) {
            console.error('Failed to load admin data:', err);
            toast({
                title: 'Data Load Failed',
                description: 'Could not retrieve data from the backend database.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingRole(userId);
        try {
            await api.admin.updateUserRole(userId, newRole);
            toast({
                title: 'Role Updated',
                description: `Successfully updated user role to ${newRole}.`,
            });
            // Reload users list
            const updatedUsers = await api.admin.getUsers();
            setUsers(updatedUsers);
        } catch (err) {
            console.error('Role update failed:', err);
            toast({
                title: 'Update Failed',
                description: 'Failed to update user role in Supabase.',
                variant: 'destructive'
            });
        } finally {
            setUpdatingRole(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-4">
                <h1 className="text-4xl font-extralight text-white tracking-tight flex items-center gap-3">
                    <span className="text-purple-400 text-[10px] font-medium tracking-[0.8em] block mb-3 uppercase">RESEARCH SYSTEM</span>
                    Administrator Portal
                </h1>
                <p className="text-white/30 font-light text-sm tracking-wide mt-2">Manage agents, users, and conversational history logs.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-8 border-b border-white/5 gap-6">
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`pb-4 text-xs font-light uppercase tracking-widest transition-all ${
                        activeTab === 'agents' ? 'border-b-2 border-purple-500 text-purple-400 font-normal' : 'text-white/40 hover:text-white/60'
                    }`}
                >
                    Agents
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`pb-4 text-xs font-light uppercase tracking-widest transition-all ${
                        activeTab === 'logs' ? 'border-b-2 border-purple-500 text-purple-400 font-normal' : 'text-white/40 hover:text-white/60'
                    }`}
                >
                    Conversations
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 text-xs font-light uppercase tracking-widest transition-all ${
                        activeTab === 'users' ? 'border-b-2 border-purple-500 text-purple-400 font-normal' : 'text-white/40 hover:text-white/60'
                    }`}
                >
                    User Management
                </button>
            </div>

            {/* Main Content Area */}
            <div className="p-8 flex-1 overflow-y-auto pb-32 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-400 opacity-60" />
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 animate-pulse">Loading database records</p>
                    </div>
                ) : (
                    <>
                        {/* Agents Tab */}
                        {activeTab === 'agents' && (
                            <div className="space-y-4">
                                {agents.map((agent, i) => (
                                    <div key={i} className="glass-card p-6 flex flex-col justify-between group hover:border-purple-500/20 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-light text-lg text-white">{agent.name}</div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <Check className="w-3 h-3" /> {agent.status}
                                            </div>
                                        </div>
                                        <div className="text-sm font-light text-white/50 leading-relaxed">{agent.description}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Conversations Tab */}
                        {activeTab === 'logs' && (
                            <div className="space-y-4">
                                {logs.length === 0 ? (
                                    <div className="text-center py-12 text-sm text-white/20">No conversational state matches found in patients table.</div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="glass-card p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                                            <div className="space-y-1">
                                                <div className="font-light text-white text-base">User nickname: {log.user_id}</div>
                                                <div className="text-xs text-white/40">Last Action: {new Date(log.last_active).toLocaleString()}</div>
                                            </div>
                                            <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-300 text-xs">
                                                <MessageSquare className="w-4 h-4" />
                                                <span>{log.message_count} messages</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Users Management Tab */}
                        {activeTab === 'users' && (
                            <div className="space-y-4">
                                {users.length === 0 ? (
                                    <div className="text-center py-12 text-sm text-white/20">No profiles found in the registry.</div>
                                ) : (
                                    users.map((user, i) => (
                                        <div key={i} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="font-light text-white text-base flex items-center gap-2">
                                                    {user.display_name || 'Guest'}
                                                    <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                        user.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        user.role === 'health_coach' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-white/5 text-white/40 border border-white/10'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-white/40">Email: {user.email}</div>
                                                {user.prevent_id && (
                                                    <div className="text-[10px] font-mono text-white/20">Clinical Assignment ID: {user.prevent_id}</div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <label className="text-[10px] uppercase tracking-wider text-white/30">Set Role:</label>
                                                <select
                                                    disabled={updatingRole === user.id}
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-purple-500/40 focus:bg-white/10 transition-all cursor-pointer"
                                                >
                                                    <option value="patient" className="bg-gray-800 text-white">Patient</option>
                                                    <option value="health_coach" className="bg-gray-800 text-white">Health Coach</option>
                                                    <option value="admin" className="bg-gray-800 text-white">Administrator</option>
                                                </select>
                                                {updatingRole === user.id && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

