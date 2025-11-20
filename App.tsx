
import React, { useState, useEffect } from 'react';
import { Screen, UserInfo, Song, SongRequest } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { KARAOKE_ADMIN_WHATSAPP, POPULAR_SONGS } from './constants';
import { HomeIcon, ListMusicIcon, MicrophoneIcon, CheckCircleIcon, InfoIcon, LogOutIcon, TrashIcon, LockIcon, PlayIcon, CheckSquareIcon, PowerIcon } from './components/icons';

// Firebase Imports
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';

// --- App Structure Components ---

const AnimatedBackground: React.FC = () => (
    <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#0D0B1F]"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
);

const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-white min-h-screen w-full max-w-md mx-auto flex flex-col relative overflow-hidden font-poppins shadow-2xl">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col flex-grow h-full">
             {children}
        </div>
         <style>{`
            @keyframes blob {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob {
                animation: blob 7s infinite;
            }
            .animation-delay-2000 {
                animation-delay: 2s;
            }
            .animation-delay-4000 {
                animation-delay: 4s;
            }
        `}</style>
    </div>
);

const BottomNav: React.FC<{ activeScreen: Screen; navigate: (screen: Screen) => void }> = ({ activeScreen, navigate }) => {
    const navItems = [
        { screen: Screen.HOME, icon: HomeIcon, label: 'Início' },
        { screen: Screen.IDENTIFICATION, icon: MicrophoneIcon, label: 'Pedir' },
        { screen: Screen.MY_REQUESTS, icon: ListMusicIcon, label: 'Pedidos' },
    ];

    const isActive = (screen: Screen) => {
        const requestFlowScreens = [Screen.IDENTIFICATION, Screen.REQUEST_FORM, Screen.CONFIRMATION];
        if (screen === Screen.IDENTIFICATION) {
            return requestFlowScreens.includes(activeScreen);
        }
        return activeScreen === screen;
    };

    return (
        <div className="w-full bg-[#120f29]/80 backdrop-blur-md border-t border-t-pink-500/20 mt-auto sticky bottom-0 z-50 pb-safe">
            <div className="flex justify-around items-center h-20">
                {navItems.map(item => (
                    <button key={item.label} onClick={() => navigate(item.screen)} className="flex flex-col items-center gap-1 text-gray-400 transition-colors duration-300">
                        <item.icon className={`w-7 h-7 ${isActive(item.screen) ? 'text-pink-400' : ''}`} />
                        <span className={`text-xs ${isActive(item.screen) ? 'text-pink-400 font-semibold' : 'text-gray-500'}`}>{item.label}</span>
                        {isActive(item.screen) && <div className="w-2 h-2 bg-pink-400 rounded-full mt-1 shadow-[0_0_8px_2px_#ec4899]"></div>}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Header: React.FC<{ title: string; glow?: boolean }> = ({ title, glow }) => (
    <h1 className={`font-rajdhani text-4xl uppercase tracking-widest text-center py-8 font-bold text-cyan-300 relative ${glow ? 'text-shadow-[0_0_15px_#22d3ee]' : ''}`}>
        {title}
    </h1>
);

const Modal: React.FC<{ 
    isOpen: boolean; 
    title: string; 
    children: React.ReactNode; 
    onClose: () => void; 
    onConfirm?: () => void; 
    confirmText?: string; 
    cancelText?: string;
    singleButton?: boolean;
    isDestructive?: boolean;
}> = ({ isOpen, title, children, onClose, onConfirm, confirmText, cancelText, singleButton, isDestructive }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-[#1a162e] border border-pink-500/40 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(236,72,153,0.25)] transform transition-all scale-100">
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-cyan-400 rounded-full blur-md"></div>
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-pink-500 rounded-full blur-md"></div>
                
                <h3 className="text-2xl font-bold text-white mb-3 font-rajdhani uppercase tracking-wide text-center">{title}</h3>
                <div className="text-gray-300 mb-8 text-center leading-relaxed text-sm opacity-90">{children}</div>
                
                <div className="flex gap-4">
                    {!singleButton && (
                        <button 
                            onClick={onClose} 
                            className="flex-1 py-3.5 rounded-xl border border-slate-600 text-gray-400 font-semibold hover:bg-slate-800 hover:text-white transition-all"
                        >
                            {cancelText || 'Cancelar'}
                        </button>
                    )}
                    <button 
                        onClick={onConfirm || onClose} 
                        className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-all
                            ${isDestructive 
                                ? 'bg-gradient-to-r from-red-600 to-red-800 shadow-red-500/20' 
                                : 'bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/20'}`
                        }
                    >
                        {confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Screen Components ---

const SplashScreen: React.FC = () => (
    <div className="flex-grow flex flex-col justify-center items-center">
        <div className="relative animate-pulse">
            <MicrophoneIcon className="w-24 h-24 text-pink-500 drop-shadow-[0_0_10px_#ec4899]" />
            <div className="absolute inset-0 blur-xl bg-pink-500 opacity-50"></div>
        </div>
        <h1 className="font-rajdhani text-5xl uppercase tracking-widest text-center mt-6 font-bold text-cyan-300 text-shadow-[0_0_15px_#22d3ee]">
            COSI LUTIMA
        </h1>
    </div>
);

const HomeScreen: React.FC<{ navigate: (screen: Screen) => void; user: UserInfo | null; onLogout: () => void; isKaraokeActive: boolean }> = ({ navigate, user, onLogout, isKaraokeActive }) => (
    <div className="flex-grow flex flex-col justify-center items-center px-8 space-y-6">
         <div className="relative mb-4">
            <MicrophoneIcon className={`w-20 h-20 drop-shadow-[0_0_20px_#ec4899] ${isKaraokeActive ? 'text-pink-500 animate-pulse' : 'text-gray-600'}`} />
        </div>
        <h1 className="font-rajdhani text-center font-bold text-cyan-300 text-shadow-[0_0_15px_#22d3ee]">
            <span className="block text-5xl uppercase tracking-wider leading-none">Karaokê Night</span>
            <span className="block text-xs tracking-[0.3em] text-pink-400 mt-3 font-semibold">by COSI LUTIMA</span>
        </h1>

        {/* Karaoke Status Badge */}
        <div className={`px-4 py-1.5 rounded-full border ${isKaraokeActive ? 'bg-green-500/20 border-green-400 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'bg-red-500/20 border-red-400 text-red-400'} flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${isKaraokeActive ? 'bg-green-400 animate-ping' : 'bg-red-400'}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest">{isKaraokeActive ? 'Aberto Agora' : 'Encerrado'}</span>
        </div>
        
        {user && (
            <div className="w-full bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30 flex justify-between items-center group hover:border-cyan-500/60 transition-colors">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Logado como</p>
                    <p className="font-bold text-white text-lg">{user.name} <span className="text-pink-400 text-sm ml-1">• Mesa {user.table}</span></p>
                </div>
                <button onClick={onLogout} className="text-gray-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all p-2" title="Sair / Trocar Mesa">
                    <LogOutIcon className="w-6 h-6"/>
                </button>
            </div>
        )}

        <div className="w-full space-y-4 pt-4">
            <button 
                onClick={() => navigate(Screen.IDENTIFICATION)} 
                className={`w-full text-lg font-bold relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium transition duration-300 ease-out border-2 rounded-full shadow-md group ${isKaraokeActive ? 'text-cyan-300 border-cyan-400 hover:shadow-[0_0_20px_#22d3ee]' : 'text-gray-500 border-gray-600 opacity-80'}`}
            >
                {isKaraokeActive && (
                    <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-cyan-500 group-hover:translate-x-0 ease">
                        <MicrophoneIcon className="w-6 h-6"/>
                    </span>
                )}
                <span className={`absolute flex items-center justify-center w-full h-full transition-all duration-300 transform ${isKaraokeActive ? 'group-hover:translate-x-full' : ''} ease`}>
                    {isKaraokeActive ? 'Fazer Pedido de Música' : 'Fazer Pedido (Fechado)'}
                </span>
                <span className="relative invisible">Fazer Pedido de Música</span>
            </button>

            <button onClick={() => navigate(Screen.MY_REQUESTS)} className="w-full text-lg font-bold relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium text-pink-400 transition duration-300 ease-out border-2 border-pink-500 rounded-full shadow-md group hover:shadow-[0_0_20px_#ec4899]">
                 <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-pink-500 group-hover:translate-x-0 ease">
                    <ListMusicIcon className="w-6 h-6"/>
                </span>
                <span className="absolute flex items-center justify-center w-full h-full text-pink-400 transition-all duration-300 transform group-hover:translate-x-full ease">Minhas Solicitações</span>
                <span className="relative invisible">Minhas Solicitações</span>
            </button>
            <button onClick={() => navigate(Screen.INFO)} className="w-full text-lg font-bold relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium text-gray-400 transition duration-300 ease-out border-2 border-gray-500 rounded-full shadow-md group hover:bg-gray-800/50">
                <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-gray-600 group-hover:translate-x-0 ease">
                    <InfoIcon className="w-6 h-6"/>
                </span>
                <span className="absolute flex items-center justify-center w-full h-full text-gray-400 transition-all duration-300 transform group-hover:translate-x-full ease">Informações</span>
                <span className="relative invisible">Informações</span>
            </button>
        </div>
    </div>
);

const IdentificationScreen: React.FC<{ onIdentify: (user: UserInfo) => void }> = ({ onIdentify }) => {
    const [name, setName] = useState('');
    const [table, setTable] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!name.trim() || !table.trim()) {
            setError('Nome e mesa são obrigatórios.');
            return;
        }
        onIdentify({ name, table });
    };

    return (
        <div className="flex-grow flex flex-col px-8">
            <Header title="Identificação" glow />
            <div className="flex-grow flex flex-col justify-center space-y-6">
                <div className="space-y-1">
                    <label className="text-sm text-cyan-300 ml-4">Seu Nome</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full bg-slate-800/50 border-2 border-cyan-400/50 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent shadow-[0_0_15px_1px_rgba(34,211,238,0.1)] transition-all"
                    />
                </div>
                <div className="space-y-1">
                     <label className="text-sm text-cyan-300 ml-4">Sua Mesa</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={table}
                        onChange={(e) => setTable(e.target.value)}
                        placeholder="Ex: 05"
                        className="w-full bg-slate-800/50 border-2 border-cyan-400/50 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent shadow-[0_0_15px_1px_rgba(34,211,238,0.1)] transition-all"
                    />
                </div>
                {error && <p className="text-red-400 text-center animate-pulse">{error}</p>}
                <button onClick={handleSubmit} className="w-full text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 rounded-full py-4 text-white shadow-lg shadow-pink-500/30 transform hover:scale-105 active:scale-95 transition-all">
                    CONTINUAR
                </button>
            </div>
        </div>
    );
};

const RequestFormScreen: React.FC<{ onSubmit: (song: Song, dedication: string) => void }> = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [dedication, setDedication] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!title.trim() || !artist.trim()) {
            setError('Música e artista são obrigatórios.');
            return;
        }
        onSubmit({ title, artist }, dedication);
    };

    return (
        <div className="flex-grow flex flex-col px-6 pb-6">
            <Header title="Pedir Música" glow />
            <div className="flex-grow flex flex-col space-y-4">
                <div className="space-y-3">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nome da Música"
                        className="w-full bg-slate-800/50 border-2 border-cyan-400/60 rounded-2xl px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-all"
                    />
                    <input
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="Artista"
                        className="w-full bg-slate-800/50 border-2 border-cyan-400/60 rounded-2xl px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-all"
                    />
                </div>

                <div className="py-2">
                    <p className="text-xs text-gray-400 mb-2 ml-2 uppercase tracking-wider">Sugestões Populares</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {POPULAR_SONGS.map((song) => (
                            <button
                                key={`${song.title}-${song.artist}`}
                                onClick={() => {
                                    setTitle(song.title);
                                    setArtist(song.artist);
                                }}
                                className="flex-shrink-0 px-4 py-2 text-xs text-left bg-slate-800/50 text-pink-300 border border-pink-500/30 rounded-xl hover:bg-pink-500/20 hover:border-pink-500 transition-all whitespace-nowrap"
                            >
                                <span className="font-bold">{song.title}</span> <span className="opacity-70">- {song.artist}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <textarea
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    placeholder="Dedicatória especial? (Opcional)"
                    rows={2}
                    className="w-full bg-slate-800/50 border-2 border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm"
                />
                {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                <button onClick={handleSubmit} className="w-full mt-auto text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 rounded-full py-4 text-white shadow-lg shadow-pink-500/30 transform hover:scale-105 active:scale-95 transition-all">
                    CONTINUAR
                </button>
            </div>
        </div>
    );
};

const ConfirmationScreen: React.FC<{ request: Omit<SongRequest, 'timestamp'>; onConfirm: () => void; onBack: () => void }> = ({ request, onConfirm, onBack }) => {
    return (
        <div className="flex-grow flex flex-col p-6 text-center">
            <Header title="Confirmar" glow/>
            <div className="flex-grow flex flex-col justify-center items-center bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <div className="flex justify-between w-full px-4 mb-4 border-b border-gray-700 pb-4">
                     <div><p className="text-xs text-gray-400">Nome</p><p className="font-bold text-white">{request.name}</p></div>
                     <div><p className="text-xs text-gray-400">Mesa</p><p className="font-bold text-white text-right">{request.table}</p></div>
                </div>
                
                <div className="my-2 p-6 bg-gradient-to-b from-slate-900 to-slate-800 rounded-full shadow-inner">
                    <MicrophoneIcon className="w-12 h-12 text-pink-400 drop-shadow-[0_0_10px_#ec4899]" />
                </div>

                <h3 className="text-2xl font-bold text-white mt-4 leading-tight">{request.song.title}</h3>
                <p className="text-md text-cyan-300 mb-6">{request.song.artist}</p>

                {request.dedication && (
                    <div className="w-full bg-purple-900/20 p-4 rounded-xl border border-purple-500/20">
                        <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Dedicatória</p>
                        <p className="text-white italic text-sm">"{request.dedication}"</p>
                    </div>
                )}
            </div>
            <button onClick={onConfirm} className="w-full text-lg mt-8 font-bold bg-gradient-to-r from-green-500 to-emerald-600 rounded-full py-4 text-white shadow-lg shadow-green-500/30 transform hover:scale-105 transition-transform">
                ENVIAR VIA WHATSAPP
            </button>
            <button onClick={onBack} className="mt-4 text-gray-400 hover:text-white transition-colors">Voltar e Editar</button>
        </div>
    );
};

const SuccessScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    return (
        <div className="flex-grow flex flex-col justify-center items-center p-6 text-center">
             <div className="relative animate-bounce">
                <CheckCircleIcon className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_15px_#22d3ee]"/>
                <div className="absolute inset-0 blur-xl bg-cyan-400 opacity-30"></div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-8">Pedido Enviado!</h2>
            <p className="text-lg text-gray-300 mt-2">Sua solicitação foi gerada.</p>
            <p className="text-sm text-gray-400 mt-4 bg-slate-800/50 px-4 py-2 rounded-lg">Não esqueça de clicar em "Enviar" no WhatsApp para confirmar.</p>
            <button onClick={onFinish} className="w-full text-lg mt-12 font-bold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full py-4 text-white shadow-lg shadow-cyan-500/30 transform hover:scale-105 transition-transform">
                VOLTAR AO INÍCIO
            </button>
        </div>
    );
};

const MyRequestsScreen: React.FC<{ requests: SongRequest[]; onDelete: (id: string) => void }> = ({ requests, onDelete }) => {
    return (
        <div className="flex-grow flex flex-col px-4">
            <Header title="Meus Pedidos" glow/>
            <div className="flex-grow overflow-y-auto space-y-3 pb-4">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <ListMusicIcon className="w-12 h-12 mb-2 opacity-20"/>
                        <p>Você ainda não fez nenhum pedido.</p>
                    </div>
                ) : (
                    [...requests].map(req => (
                        <div key={req.id || req.timestamp} className="relative group flex items-start bg-slate-800/40 backdrop-blur-sm p-4 rounded-2xl border border-purple-500/20 hover:border-pink-500/40 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <MicrophoneIcon className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div className="flex-grow ml-4 mr-2">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-white leading-tight">{req.song.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        req.status === 'playing' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                        req.status === 'completed' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    }`}>
                                        {req.status === 'playing' ? 'Tocando' : req.status === 'completed' ? 'Concluído' : 'Na Fila'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400">{req.song.artist}</p>
                                <div className="flex items-center mt-2 gap-3">
                                    <p className="text-xs text-slate-500">{new Date(req.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                {req.dedication && <p className="text-xs text-purple-300 italic mt-1 border-l-2 border-purple-500/30 pl-2">"{req.dedication}"</p>}
                            </div>
                             <button 
                                onClick={() => req.id && onDelete(req.id)}
                                className="absolute bottom-3 right-3 text-gray-600 hover:text-red-400 transition-colors p-1"
                                aria-label="Remover pedido"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const InfoScreen: React.FC<{ onAdminClick: () => void }> = ({ onAdminClick }) => {
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage('');
        try {
            // Tenta escrever um documento de teste
            const docRef = await addDoc(collection(db, "connection_test"), {
                timestamp: Date.now(),
                status: "test"
            });
            // Tenta deletar para limpar
            await deleteDoc(docRef);
            setTestStatus('success');
            setTestMessage('Conexão OK! Leitura e Escrita funcionam.');
            setTimeout(() => setTestStatus('idle'), 5000);
        } catch (error: any) {
            console.error(error);
            setTestStatus('error');
            if (error.code === 'permission-denied') {
                setTestMessage('Erro: Permissão negada. Verifique as regras do Firestore.');
            } else if (error.code === 'unavailable') {
                setTestMessage('Erro: Sem internet ou Firebase indisponível.');
            } else {
                 setTestMessage(`Erro: ${error.message}`);
            }
        }
    };

    return (
        <div className="flex-grow flex flex-col px-8">
            <Header title="Informações" glow />
            <div className="flex-grow flex flex-col justify-center items-center text-center space-y-6 bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.15)] mb-20">
                 <div className="flex flex-col items-center relative">
                    <div className="absolute -top-16 bg-slate-900 p-3 rounded-full border border-cyan-500/50 shadow-lg">
                         <MicrophoneIcon className="w-10 h-10 text-pink-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 leading-tight mt-6">Karaokê Night</h2>
                    <span className="text-white text-xl font-light mt-1">com NY SILVA</span>
                    <p className="text-xs font-bold text-cyan-400 font-rajdhani tracking-[0.2em] mt-3 border-t border-b border-cyan-400/30 py-1 px-6 uppercase">by COSI LUTIMA</p>
                </div>
                <div className="space-y-1">
                    <p className="text-gray-300 text-lg font-semibold">Aberto das 18h às 0h</p>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Quartas e Sextas</p>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed px-2">
                    Escolha sua música, envie o pedido e aguarde sua vez de brilhar no palco!
                </p>
                <div className="pt-4 w-full space-y-3">
                     <p className="text-cyan-300 text-sm opacity-80 hover:opacity-100 cursor-pointer transition-opacity mb-4">Siga-nos: @cosilutima</p>
                     
                     <button onClick={onAdminClick} className="text-xs text-gray-600 border border-gray-700 rounded-full px-4 py-2 hover:bg-gray-800 hover:text-gray-400 transition-all w-full">
                        Área Restrita (DJ)
                     </button>
                </div>
            </div>
        </div>
    );
};

const AdminLoginScreen: React.FC<{ onLoginSuccess: () => void; onBack: () => void }> = ({ onLoginSuccess, onBack }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (pin === '112011') {
            onLoginSuccess();
        } else {
            setError('PIN Incorreto. Tente novamente.');
            setPin('');
        }
    };

    return (
        <div className="flex-grow flex flex-col px-8 justify-center items-center">
            <div className="bg-slate-800/80 p-8 rounded-3xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] w-full max-w-sm text-center">
                <LockIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2 font-rajdhani">Acesso DJ</h2>
                <p className="text-gray-400 text-xs mb-6">Digite o PIN de segurança.</p>
                
                <div className="mb-6">
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => {
                            setError('');
                            setPin(e.target.value);
                        }}
                        placeholder="PIN (6 dígitos)"
                        className="w-full bg-slate-900 border border-gray-600 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-white focus:border-red-500 focus:outline-none placeholder:text-sm placeholder:tracking-normal"
                    />
                </div>
                
                {error && <p className="text-red-400 text-sm mb-4 animate-pulse">{error}</p>}
                
                <button 
                    onClick={handleLogin} 
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors mb-3 flex items-center justify-center"
                >
                    ENTRAR
                </button>
                <button onClick={onBack} className="text-gray-500 text-sm hover:text-white">
                    Voltar
                </button>
            </div>
        </div>
    );
};

const AdminDashboardScreen: React.FC<{ 
    requests: SongRequest[]; 
    onLogout: () => void; 
    isKaraokeActive: boolean; 
    onToggleKaraoke: (active: boolean) => void;
    onUpdateStatus: (id: string, status: 'pending' | 'playing' | 'completed') => void;
    onDelete: (id: string) => void;
}> = ({ requests, onLogout, isKaraokeActive, onToggleKaraoke, onUpdateStatus, onDelete }) => {

    const [showEndSessionModal, setShowEndSessionModal] = useState(false);

    const handleSignOut = () => {
        onLogout();
    }

    const toggleStatus = (id: string, currentStatus: string | undefined) => {
        if (currentStatus === 'pending') onUpdateStatus(id, 'playing');
        else if (currentStatus === 'playing') onUpdateStatus(id, 'completed');
        else if (currentStatus === 'completed') onUpdateStatus(id, 'pending');
    };

    const handleToggleClick = () => {
        if (isKaraokeActive) {
            // If active, we are turning it off (ending session)
            setShowEndSessionModal(true);
        } else {
            // If inactive, just turn it on
            onToggleKaraoke(true);
        }
    };

    const confirmEndSession = () => {
        onToggleKaraoke(false);
        setShowEndSessionModal(false);
    };

    return (
        <div className="flex-grow flex flex-col h-full">
            <div className="bg-slate-900/90 p-4 border-b border-gray-700 flex flex-col gap-4 sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white font-rajdhani uppercase">Painel do DJ</h2>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Modo Administrador
                        </p>
                    </div>
                    <button onClick={handleSignOut} className="bg-slate-800 p-2 rounded-lg text-gray-400 hover:text-white" title="Sair do Painel">
                        <LogOutIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Karaoke Toggle Control */}
                <div className={`rounded-xl p-3 flex items-center justify-between border ${isKaraokeActive ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
                    <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isKaraokeActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            <PowerIcon className="w-6 h-6" />
                         </div>
                         <div>
                             <p className="text-sm font-bold text-gray-200">Sessão {isKaraokeActive ? 'ABERTA' : 'FECHADA'}</p>
                             <p className="text-[10px] text-gray-400">{isKaraokeActive ? 'Clientes podem pedir músicas' : 'Pedidos bloqueados'}</p>
                         </div>
                    </div>
                    <button 
                        onClick={handleToggleClick}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${isKaraokeActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    >
                        {isKaraokeActive ? 'ENCERRAR' : 'INICIAR'}
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {requests.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">Fila vazia!</div>
                )}
                {requests.map(req => (
                    <div key={req.id} className={`relative p-4 rounded-xl border ${req.status === 'playing' ? 'bg-green-900/20 border-green-500/50' : req.status === 'completed' ? 'bg-slate-800/30 border-gray-700 opacity-50' : 'bg-slate-800 border-gray-600'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-white text-lg leading-none">{req.song.title}</h4>
                                <p className="text-cyan-400 text-sm">{req.song.artist}</p>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-white bg-slate-700 px-2 py-0.5 rounded text-xs mb-1">Mesa {req.table}</span>
                                <span className="text-gray-400 text-xs">{req.name}</span>
                            </div>
                        </div>
                        
                        {req.dedication && (
                            <div className="bg-black/30 p-2 rounded text-xs text-purple-300 italic mb-3">
                                " {req.dedication} "
                            </div>
                        )}

                        <div className="flex gap-2 mt-2 border-t border-white/10 pt-3">
                            {req.status !== 'completed' && req.id && (
                                <button 
                                    onClick={() => toggleStatus(req.id!, req.status)}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm ${req.status === 'playing' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
                                >
                                    {req.status === 'pending' ? <><PlayIcon className="w-4 h-4" /> TOCAR</> : <><CheckSquareIcon className="w-4 h-4" /> CONCLUIR</>}
                                </button>
                            )}
                            {req.id && (
                                <button 
                                    onClick={() => onDelete(req.id!)}
                                    className="px-3 py-2 bg-slate-700 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal 
                isOpen={showEndSessionModal}
                title="Encerrar Sessão?"
                onClose={() => setShowEndSessionModal(false)}
                onConfirm={confirmEndSession}
                confirmText="Sim, Encerrar e Limpar"
                isDestructive={true}
            >
                Isso fechará o karaokê para novos pedidos e <strong className="text-red-400">apagará todos os pedidos da fila atual</strong>. Tem certeza?
            </Modal>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [configError, setConfigError] = useState<string | null>(null);
    const [screen, setScreen] = useState(Screen.HOME);
    const [user, setUser] = useLocalStorage<UserInfo | null>('cosilutima-user', null);
    // Local storage for active state, could also be moved to firebase 'settings' collection
    const [isKaraokeActive, setIsKaraokeActive] = useLocalStorage<boolean>('karaoke-active', true); 
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    
    // Firebase State
    const [allRequests, setAllRequests] = useState<SongRequest[]>([]);

    const [pendingRequest, setPendingRequest] = useState<{ song: Song; dedication: string } | null>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [requestToDeleteId, setRequestToDeleteId] = useState<string | null>(null);
    const [showClosedModal, setShowClosedModal] = useState(false);

    // --- Firebase Listeners ---
    useEffect(() => {
        if (!db) {
             setConfigError("Firebase não inicializado. Verifique firebaseConfig.ts");
             setIsLoading(false);
             return;
        }

        // Listen for requests
        const q = query(collection(db, "requests"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SongRequest[];
            setAllRequests(reqs);
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setIsLoading(false);
            // Handle permission errors gracefully to show UI instructions instead of crashing
            if (error.code === 'permission-denied' || error.code === 'unavailable') {
                 setConfigError("Erro de conexão: Permissão negada ou projeto não encontrado. Verifique se você configurou o 'firebaseConfig.ts' com suas chaves reais do Firebase Console.");
            } else {
                 setConfigError(`Erro de conexão com o banco de dados: ${error.message}`);
            }
        });

        return () => {
            unsubscribe();
        }
    }, []);


    const navigate = (newScreen: Screen) => {
        if (newScreen === Screen.IDENTIFICATION) {
            if (!isKaraokeActive) {
                setShowClosedModal(true);
                return;
            }
            if (user) {
                setScreen(Screen.REQUEST_FORM);
                return;
            }
        }
        setScreen(newScreen);
    };
    
    const handleIdentification = (userInfo: UserInfo) => {
        setUser(userInfo);
        setScreen(Screen.REQUEST_FORM);
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setUser(null);
        setShowLogoutModal(false);
        setScreen(Screen.HOME);
    };

    const handleDeleteRequestClick = (id: string) => {
        setRequestToDeleteId(id);
    };

    const confirmDeleteRequest = async () => {
        if (requestToDeleteId) {
            try {
                await deleteDoc(doc(db, "requests", requestToDeleteId));
                setRequestToDeleteId(null);
            } catch (error) {
                console.error("Error deleting document: ", error);
                alert("Erro de permissão: Apenas o Admin pode deletar.");
            }
        }
    };

    // Admin Functions
    const handleAdminStatusUpdate = async (id: string, status: 'pending' | 'playing' | 'completed') => {
        try {
            const reqRef = doc(db, "requests", id);
            await updateDoc(reqRef, { status: status });
        } catch (e) {
            console.error("Error updating status: ", e);
             alert("Erro de permissão: Apenas o Admin pode alterar status.");
        }
    };

    const clearAllRequests = async () => {
        try {
            const batch = writeBatch(db);
            const q = query(collection(db, "requests"));
            const snapshot = await getDocs(q);
            
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log("Database cleared successfully.");
        } catch (error) {
            console.error("Error clearing database:", error);
            alert("Erro ao limpar o banco de dados. Verifique se você é Admin.");
        }
    };
    
    const handleAdminToggleKaraoke = async (active: boolean) => {
        if (!active) {
            // Se está desativando (encerrando sessão), limpar o banco
            await clearAllRequests();
        }
        setIsKaraokeActive(active);
    }


    const handleRequestSubmit = (song: Song, dedication: string) => {
        setPendingRequest({ song, dedication });
        setScreen(Screen.CONFIRMATION);
    };

    const handleSendRequest = async () => {
        if (!user || !pendingRequest) return;
        
        const newRequestData = {
            name: user.name,
            table: user.table,
            song: pendingRequest.song,
            dedication: pendingRequest.dedication,
            timestamp: Date.now(),
            status: 'pending'
        };

        try {
            // 1. Save to Firebase
            await addDoc(collection(db, "requests"), newRequestData);

            // 2. Send WhatsApp (Client requirement)
            const message = `🎤 Novo Pedido de Karaokê! 🎤\n\n*Nome:* ${user.name}\n*Mesa:* ${user.table}\n\n*Música:* ${pendingRequest.song.title}\n*Artista:* ${pendingRequest.song.artist}${pendingRequest.dedication ? `\n\n*Dedicatória:* ${pendingRequest.dedication}` : ''}`;
            const whatsappUrl = `https://wa.me/${KARAOKE_ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            
            setScreen(Screen.SUCCESS);
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Erro ao enviar pedido. Verifique sua conexão.");
        }
    };
    
    const handleFinish = () => {
        setPendingRequest(null);
        setScreen(Screen.HOME);
    };

    // Filter requests for current user
    const myRequests = allRequests.filter(req => user && req.name === user.name && req.table === user.table);

    const renderScreen = () => {
        switch (screen) {
            case Screen.SPLASH: return <SplashScreen />;
            case Screen.HOME: return <HomeScreen navigate={navigate} user={user} onLogout={handleLogoutClick} isKaraokeActive={isKaraokeActive} />;
            case Screen.IDENTIFICATION: return <IdentificationScreen onIdentify={handleIdentification} />;
            case Screen.REQUEST_FORM: return <RequestFormScreen onSubmit={handleRequestSubmit} />;
            case Screen.MY_REQUESTS: return <MyRequestsScreen requests={myRequests} onDelete={handleDeleteRequestClick} />;
            case Screen.INFO: return <InfoScreen onAdminClick={() => {
                // Check if admin is already logged in (local state)
                if (isAdminLoggedIn) setScreen(Screen.ADMIN_DASHBOARD);
                else setScreen(Screen.ADMIN_LOGIN);
            }} />;
            case Screen.ADMIN_LOGIN: return <AdminLoginScreen onLoginSuccess={() => {
                setIsAdminLoggedIn(true);
                setScreen(Screen.ADMIN_DASHBOARD);
            }} onBack={() => setScreen(Screen.INFO)} />;
            case Screen.ADMIN_DASHBOARD: 
                return <AdminDashboardScreen 
                    requests={allRequests} 
                    onLogout={() => {
                        setIsAdminLoggedIn(false);
                        setScreen(Screen.HOME);
                    }} 
                    isKaraokeActive={isKaraokeActive} 
                    onToggleKaraoke={handleAdminToggleKaraoke}
                    onUpdateStatus={handleAdminStatusUpdate}
                    onDelete={handleDeleteRequestClick}
                />;
            case Screen.CONFIRMATION:
                return user && pendingRequest ? <ConfirmationScreen request={{...user, song: pendingRequest.song, dedication: pendingRequest.dedication}} onConfirm={handleSendRequest} onBack={() => setScreen(Screen.REQUEST_FORM)} /> : <HomeScreen navigate={navigate} user={user} onLogout={handleLogoutClick} isKaraokeActive={isKaraokeActive} />;
            case Screen.SUCCESS: return <SuccessScreen onFinish={handleFinish} />;
            default: return <HomeScreen navigate={navigate} user={user} onLogout={handleLogoutClick} isKaraokeActive={isKaraokeActive} />;
        }
    };
    
    if (configError) {
        return (
            <AppContainer>
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="bg-red-500/20 p-6 rounded-2xl border border-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                        <InfoIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Configuração Necessária</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">{configError}</p>
                    </div>
                    <div className="text-left bg-slate-900 p-5 rounded-xl border border-gray-700 text-sm text-gray-400 w-full shadow-lg">
                        <p className="font-bold mb-3 text-white border-b border-gray-700 pb-2">Como resolver:</p>
                        <ol className="list-decimal pl-4 space-y-2">
                            <li>Acesse <a href="https://console.firebase.google.com" target="_blank" className="text-cyan-400 underline">console.firebase.google.com</a></li>
                            <li>Crie um projeto ou selecione o existente</li>
                            <li>Vá em <strong>Configurações do Projeto</strong> (ícone de engrenagem)</li>
                            <li>Role até "Seus aplicativos" e selecione Web (&lt;/&gt;)</li>
                            <li>Copie o objeto <code>const firebaseConfig = ...</code></li>
                            <li>Cole no arquivo <code>firebaseConfig.ts</code> deste projeto</li>
                        </ol>
                    </div>
                </div>
            </AppContainer>
        )
    }

    if (isLoading) {
        return <AppContainer><SplashScreen /></AppContainer>;
    }

    const showNav = [Screen.HOME, Screen.IDENTIFICATION, Screen.REQUEST_FORM, Screen.MY_REQUESTS, Screen.INFO].includes(screen);

    return (
        <AppContainer>
            <main className="flex-grow flex flex-col overflow-y-auto z-10">
                {renderScreen()}
            </main>
            {showNav && <BottomNav activeScreen={screen} navigate={navigate} />}
            
            {/* Logout Modal */}
            <Modal 
                isOpen={showLogoutModal}
                title="Sair da Mesa"
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                confirmText="Sair"
                cancelText="Cancelar"
            >
                Tem certeza que deseja sair? Isso desconectará seu nome da mesa atual.
            </Modal>

            {/* Delete Request Modal */}
            <Modal 
                isOpen={!!requestToDeleteId}
                title="Remover Pedido"
                onClose={() => setRequestToDeleteId(null)}
                onConfirm={confirmDeleteRequest}
                confirmText="Remover"
                cancelText="Manter"
                isDestructive={true}
            >
                Deseja remover este pedido? {isAdminLoggedIn ? '(Admin Action)' : ''}
            </Modal>

            {/* Karaoke Closed Modal */}
             <Modal 
                isOpen={showClosedModal}
                title="Karaokê Fechado"
                onClose={() => setShowClosedModal(false)}
                confirmText="Entendi"
                singleButton={true}
            >
                No momento, a sessão de karaokê está encerrada. Aguarde o início da próxima rodada para fazer seu pedido!
            </Modal>
        </AppContainer>
    );
}
