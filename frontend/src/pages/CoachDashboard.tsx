import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Users, Search, UserCheck, MessageSquare, Activity, Clipboard, Loader2, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

export default function CoachDashboard() {
    const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
    const [allPatients, setAllPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'roster' | 'registry'>('roster');

    const loadData = async () => {
        setLoading(true);
        try {
            // Register coach record first on backend
            await api.coach.getMe();
            
            const [assignedData, allData] = await Promise.all([
                api.coach.getPatients(),
                api.coach.getAllPatients()
            ]);
            setAssignedPatients(assignedData);
            setAllPatients(allData);
        } catch (err) {
            console.error('Failed to load coach data:', err);
            toast({
                title: 'Data Load Failed',
                description: 'Failed to retrieve patient logs from the database.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleClaimPatient = async (patientId: string) => {
        try {
            await api.coach.assignPatient(patientId);
            toast({
                title: 'Patient Assigned',
                description: 'Patient successfully added to your active roster.',
            });
            // Reload data
            const assignedData = await api.coach.getPatients();
            setAssignedPatients(assignedData);
        } catch (err) {
            console.error('Failed to assign patient:', err);
            toast({
                title: 'Assignment Failed',
                description: 'Could not assign patient in the database.',
                variant: 'destructive'
            });
        }
    };

    const handleSelectPatient = async (patient: any) => {
        setSelectedPatient(patient);
        setDetailLoading(true);
        try {
            const [history, vitals] = await Promise.all([
                api.coach.getPatientHistory(patient.prevent_id),
                api.coach.getPatientVitals(patient.prevent_id)
            ]);
            setChatHistory(history);
            setVitalsHistory(vitals);
        } catch (err) {
            console.error('Failed to load patient detail records:', err);
            toast({
                title: 'Detail Load Failed',
                description: 'Could not load clinical history.',
                variant: 'destructive'
            });
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredRoster = assignedPatients.filter(p =>
        p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRegistry = allPatients.filter(p =>
        !assignedPatients.some(ap => ap.prevent_id === p.prevent_id) && (
            p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="flex h-full bg-transparent overflow-hidden gap-6 relative">
            {/* Roster & Registry Panel */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-8 pb-4">
                    <h1 className="text-4xl font-extralight text-white tracking-tight flex items-center gap-3">
                        <span className="text-primary text-[10px] font-medium tracking-[0.8em] block mb-3 uppercase">CARE ROSTER</span>
                        Health Coach Hub
                    </h1>
                    <p className="text-white/30 font-light text-sm tracking-wide mt-2">Manage patient diagnostics and review motivational conversations.</p>
                </div>

                {/* Sub Navigation */}
                <div className="flex px-8 border-b border-white/5 gap-6 mb-6">
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`pb-4 text-xs font-light uppercase tracking-widest transition-all ${
                            activeTab === 'roster' ? 'border-b-2 border-primary text-primary font-normal' : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        My Patients ({assignedPatients.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('registry')}
                        className={`pb-4 text-xs font-light uppercase tracking-widest transition-all ${
                            activeTab === 'registry' ? 'border-b-2 border-primary text-primary font-normal' : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        Unassigned Patients ({filteredRegistry.length})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-8 mb-6 relative group">
                    <input
                        type="text"
                        placeholder="Search patient name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-5 py-3.5 bg-white/[0.04] border border-white/10 rounded-2xl text-sm font-light text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
                    />
                    <Search className="absolute left-12 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                </div>

                {/* Patient List */}
                <div className="flex-1 overflow-y-auto px-8 pb-32 custom-scrollbar space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-60" />
                            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">Loading patient rosters</p>
                        </div>
                    ) : activeTab === 'roster' ? (
                        filteredRoster.length === 0 ? (
                            <div className="text-center py-16 text-sm font-light text-white/20">No patients assigned to you. Claim some from the registry!</div>
                        ) : (
                            filteredRoster.map((patient) => (
                                <div
                                    key={patient.prevent_id}
                                    onClick={() => handleSelectPatient(patient)}
                                    className={`glass-card p-6 flex items-center justify-between hover:border-primary/20 hover:bg-white/[0.01] transition-all cursor-pointer ${
                                        selectedPatient?.prevent_id === patient.prevent_id ? 'border-primary/30 bg-white/[0.02]' : ''
                                    }`}
                                >
                                    <div className="space-y-1 flex-1">
                                        <div className="font-light text-white text-lg flex items-center gap-2">
                                            {patient.nickname}
                                            <span className={`text-[8px] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                                patient.health_status?.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                patient.health_status?.risk_level === 'Medium' ? 'bg-primary/10 text-primary border border-primary/20' :
                                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                                {patient.health_status?.risk_level || 'Moderate'} Risk
                                            </span>
                                        </div>
                                        <div className="text-xs text-white/40">Email: {patient.email}</div>
                                        {patient.health_status?.readiness_stage && (
                                            <div className="text-[9px] uppercase tracking-[0.1em] text-primary/70">Stage: {patient.health_status.readiness_stage}</div>
                                        )}
                                    </div>
                                    
                                    {/* Biomarkers preview */}
                                    <div className="flex gap-4 items-center">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] uppercase tracking-widest text-white/30">HbA1c</p>
                                            <p className="text-sm font-light text-white/80">{patient.latest_biomarkers?.a1c ? `${patient.latest_biomarkers.a1c}%` : '--'}</p>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] uppercase tracking-widest text-white/30">FBS</p>
                                            <p className="text-sm font-light text-white/80">{patient.latest_biomarkers?.fbs ? `${patient.latest_biomarkers.fbs} mmol/L` : '--'}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/20" />
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        filteredRegistry.length === 0 ? (
                            <div className="text-center py-16 text-sm font-light text-white/20">No new patients available to claim in the system registry.</div>
                        ) : (
                            filteredRegistry.map((patient) => (
                                <div key={patient.prevent_id} className="glass-card p-6 flex items-center justify-between hover:bg-white/[0.005] transition-all">
                                    <div className="space-y-1">
                                        <div className="font-light text-white text-lg">{patient.nickname}</div>
                                        <div className="text-xs text-white/40">Email: {patient.email}</div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleClaimPatient(patient.prevent_id)}
                                        className="px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs uppercase tracking-widest hover:bg-primary hover:text-gray-900 transition-all"
                                    >
                                        Claim Patient
                                    </button>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Selected Patient Drawer / Inspection Panel */}
            <AnimatePresence>
                {selectedPatient && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[45%] h-full glass-card border-l border-white/5 flex flex-col overflow-hidden bg-gray-950/40 backdrop-blur-3xl absolute right-0 top-0 z-50 shadow-2xl"
                    >
                        {/* Drawer Header */}
                        <div className="p-8 pb-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-extralight text-white leading-tight">{selectedPatient.nickname}</h3>
                                <p className="text-[10px] uppercase tracking-widest text-primary mt-1 font-medium">Diagnostic Insights</p>
                            </div>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="p-2.5 rounded-full hover:bg-white/5 text-white/30 hover:text-white/70 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-60" />
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">Syncing Patient Records</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                    {/* Biomarkers / Vital Signs */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Activity className="w-4 h-4 text-primary" />
                                            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">Biomarker Log History</h4>
                                        </div>
                                        
                                        {vitalsHistory.length === 0 ? (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/30 text-center">
                                                No vital readings logged yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {vitalsHistory.map((vital, i) => (
                                                    <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-white/40">{new Date(vital.recorded_at).toLocaleDateString()}</p>
                                                            <div className="flex gap-4">
                                                                <span className="text-sm font-light text-white">HbA1c: <strong className="text-primary font-normal">{vital.a1c ? `${vital.a1c}%` : '--'}</strong></span>
                                                                <span className="text-sm font-light text-white">FBS: <strong className="text-primary font-normal">{vital.fbs ? `${vital.fbs} mmol/L` : '--'}</strong></span>
                                                                <span className="text-sm font-light text-white">BMI: <strong className="text-primary font-normal">{vital.bmi || '--'}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Transcript / Conversation Logs */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <MessageSquare className="w-4 h-4 text-primary" />
                                            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">Dialogue Logs (Dawn AI)</h4>
                                        </div>
                                        
                                        {chatHistory.length === 0 ? (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/30 text-center">
                                                No conversations recorded.
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                                                {chatHistory.map((msg, i) => (
                                                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <span className="text-[8px] uppercase tracking-wider text-white/30 mb-1">
                                                            {msg.role === 'user' ? 'Patient' : 'Dawn AI'}
                                                        </span>
                                                        <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed font-light ${
                                                            msg.role === 'user'
                                                                ? 'bg-primary/10 text-primary border border-primary/20 rounded-tr-none'
                                                                : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'
                                                        }`}>
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
