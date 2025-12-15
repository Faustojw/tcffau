import React, { useEffect, useState } from 'react';
import { MOCK_USERS, getPendingRequests, approveStationRequest, rejectStationRequest, getStations, updateStationStatus, updateStationDetails, generateReports, createStation, getEmailLogs, deleteStation } from '../services/mockData';
import { StationRequest, Station, AvailabilityReportItem, OperatorActivityReportItem, PopularityReportItem, EmailLog } from '../types';
import { Users, Building2, TrendingUp, Plus, Check, X, Clock, AlertCircle, Edit2, FileText, Download, BarChart, Calendar, Loader2, Upload, Image as ImageIcon, Save, AlertTriangle, Activity, Eye, Mail, RefreshCw, Search, ArrowUpDown, FileSpreadsheet, MapPin, Phone, User as UserIcon, Wifi, WifiOff, Filter, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export const DashboardAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'reports' | 'logs'>('manage');
  
  // Management State
  const [requests, setRequests] = useState<StationRequest[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processedMessage, setProcessedMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Table Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Approval Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StationRequest | null>(null);
  const [approvalImage, setApprovalImage] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);

  // Rejection Modal State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<StationRequest | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Delete Station Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Create State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingStation, setCreatingStation] = useState(false);
  const [newStationData, setNewStationData] = useState({
    name: '',
    address: '',
    phone: '',
    openHours: '08:00 - 18:00',
    imageUrl: ''
  });

  // Edit Station State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [editFormData, setEditFormData] = useState({
      name: '',
      address: '',
      phone: '',
      openHours: '',
      imageUrl: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Report State
  const [reportType, setReportType] = useState<'availability' | 'activity' | 'popularity'>('activity'); // Default to activity for productivity view
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<{
    availability: AvailabilityReportItem[];
    activity: OperatorActivityReportItem[];
    popularity: PopularityReportItem[];
  } | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadData = async () => {
    setLoadingRequests(true);
    const [reqData, stationsData] = await Promise.all([
        getPendingRequests(),
        getStations()
    ]);
    setRequests(reqData);
    setStations(stationsData);
    setLoadingRequests(false);
  };

  const loadReports = async () => {
    setLoadingReports(true);
    const data = await generateReports(startDate, endDate);
    setReportData(data);
    setLoadingReports(false);
  };

  const loadEmailLogs = async () => {
    setLoadingLogs(true);
    const logs = await getEmailLogs();
    setEmailLogs(logs);
    setLoadingLogs(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
        loadReports();
    } else if (activeTab === 'logs') {
        loadEmailLogs();
    }
  }, [activeTab, startDate, endDate]);

  // --- Helper: Dynamic Sort ---
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  };

  // --- Helper: Filtered & Sorted Stations ---
  const getFilteredStations = () => {
      let filtered = stations.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.manager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.stationCode.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filtered.sort((a: any, b: any) => {
          const aValue = a[sortConfig.key] || '';
          const bValue = b[sortConfig.key] || '';
          
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  };

  // --- Helper: Connection Status ---
  const getConnectionStatus = (lastUpdated: string) => {
      const diff = new Date().getTime() - new Date(lastUpdated).getTime();
      const hours = diff / (1000 * 60 * 60);
      return hours < 2 ? 'Online' : 'Offline';
  };

  // --- Helper: Export to Excel (CSV) ---
  const exportStationsToCSV = () => {
      const headers = "Nome do Posto,Código,Responsável,Endereço,Telefone,Status Conexão,Gasolina,Gasóleo";
      const rows = stations.map(s => {
          const conn = getConnectionStatus(s.status.lastUpdated);
          const gas = s.status.gasoline ? 'Disponível' : 'Esgotado';
          const die = s.status.diesel ? 'Disponível' : 'Esgotado';
          return `"${s.name}","${s.stationCode}","${s.manager || 'N/A'}","${s.address}","${s.phone}","${conn}","${gas}","${die}"`;
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "lista_postos_soyo.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openApprovalModal = (request: StationRequest) => {
      setSelectedRequest(request);
      setApprovalImage('');
      setApprovalModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedRequest) return;
    
    setIsApproving(true);
    
    // Pass approvalImage (if empty, mock service handles default)
    const newStation = await approveStationRequest(selectedRequest.id, approvalImage);
    
    setIsApproving(false);
    setApprovalModalOpen(false);
    setSelectedRequest(null);

    if (newStation) {
        setProcessedMessage({
            type: 'success', 
            text: `Posto "${newStation.name}" aprovado e notificação enviada aos usuários!`
        });
        loadData();
    } else {
        setProcessedMessage({
            type: 'error', 
            text: `Erro ao aprovar o posto.`
        });
    }
  };

  const openRejectModal = (request: StationRequest) => {
      setRequestToReject(request);
      setRejectionModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!requestToReject) return;
    
    setIsRejecting(true);
    await rejectStationRequest(requestToReject.id);
    setIsRejecting(false);
    setRejectionModalOpen(false);
    
    setProcessedMessage({
        type: 'success',
        text: `Solicitação de "${requestToReject.stationName}" rejeitada.`
    });
    setRequestToReject(null);
    loadData();
  };

  const openDeleteModal = (station: Station) => {
    setStationToDelete(station);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!stationToDelete) return;
    setIsDeleting(true);
    const success = await deleteStation(stationToDelete.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setStationToDelete(null);

    if (success) {
        setProcessedMessage({
            type: 'success',
            text: 'Posto removido com sucesso.'
        });
        loadData();
    } else {
        setProcessedMessage({
            type: 'error',
            text: 'Erro ao remover o posto.'
        });
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingStation(true);
    
    try {
        const newStation = await createStation(newStationData);
        setCreatingStation(false);
        setIsCreateModalOpen(false);
        setNewStationData({ name: '', address: '', phone: '', openHours: '08:00 - 18:00', imageUrl: '' }); // Reset form
        
        setProcessedMessage({
            type: 'success',
            text: `Posto "${newStation.name}" criado com sucesso! Código: ${newStation.stationCode}`
        });
        loadData(); // Refresh list
    } catch (error) {
        setCreatingStation(false);
        setProcessedMessage({
            type: 'error',
            text: 'Erro ao criar posto.'
        });
    }
  };

  const openEditModal = (station: Station) => {
      setEditingStation(station);
      setEditFormData({
          name: station.name,
          address: station.address,
          phone: station.phone,
          openHours: station.openHours,
          imageUrl: station.imageUrl
      });
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingStation) return;

      setIsSavingEdit(true);
      const updatedStation = await updateStationDetails(editingStation.id, editFormData);
      setIsSavingEdit(false);
      
      if (updatedStation) {
          setIsEditModalOpen(false);
          setEditingStation(null);
          setProcessedMessage({
              type: 'success',
              text: 'Dados do posto atualizados com sucesso.'
          });
          loadData();
      } else {
          setProcessedMessage({
              type: 'error',
              text: 'Falha ao atualizar dados.'
          });
      }
  };

  const handleToggleStatus = async (stationId: string, type: 'gasoline' | 'diesel') => {
    const updatedStations = stations.map(s => {
        if (s.id === stationId) {
            return { ...s, status: { ...s.status, [type]: !s.status[type] } };
        }
        return s;
    });
    setStations(updatedStations);

    const station = stations.find(s => s.id === stationId);
    if (station) {
        const result = await updateStationStatus(stationId, { [type]: !station.status[type] });
        if (!result.success) {
            loadData();
            setProcessedMessage({ type: 'error', text: 'Falha ao atualizar status. Tente novamente.' });
        } else {
            if (result.notifiedCount > 0) {
                 setProcessedMessage({ type: 'success', text: `Status atualizado. ${result.notifiedCount} usuários notificados por e-mail.` });
            }
        }
    }
  };

  // CSV Export Logic for Reports
  const downloadReportCSV = () => {
    if (!reportData) return;
    
    let headers = '';
    let rows: string[] = [];
    let filename = '';

    if (reportType === 'availability') {
        headers = 'Posto,Disponibilidade Gasolina (%),Disponibilidade Gasóleo (%),Horas Totais,Horas Indisponível';
        rows = reportData.availability.map(r => 
            `"${r.stationName}",${r.gasolineAvailability},${r.dieselAvailability},${r.totalHoursTracked},${r.downtimeHours}`
        );
        filename = 'relatorio_disponibilidade.csv';
    } else if (reportType === 'activity') {
        headers = 'Operador,Posto,Total Atualizações,Tempo Médio Resposta (min),Última Atividade';
        rows = reportData.activity.map(r => 
            `"${r.operatorName}","${r.stationName}",${r.totalUpdates},${r.averageResponseTime},${r.lastActive}`
        );
        filename = 'relatorio_operadores.csv';
    } else {
        headers = 'Posto,Visualizações,Favoritos,Aparições em Busca';
        rows = reportData.popularity.map(r => 
            `"${r.stationName}",${r.views},${r.favorites},${r.searchAppearances}`
        );
        filename = 'relatorio_popularidade.csv';
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">Painel Administrativo</h1>
            <p className="text-slate-400 text-sm">Gerencie postos, visualize relatórios e audite envios de e-mail.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'manage' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                Gerenciamento
            </button>
            <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'reports' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <FileText className="w-4 h-4" /> Relatórios
            </button>
            <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'logs' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <Mail className="w-4 h-4" /> Logs de E-mail
            </button>
        </div>
      </div>

      {processedMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            processedMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-500' : 'bg-red-500/10 border border-red-500/50 text-red-500'
        }`}>
            {processedMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{processedMessage.text}</span>
            <button onClick={() => setProcessedMessage(null)} className="ml-auto hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ======================= MANAGEMENT TAB ======================= */}
      {activeTab === 'manage' && (
          <div className="animate-fade-in">
              <div className="flex justify-end mb-6">
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-600 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Novo Posto Manual
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Total de Postos</h3>
                        <Building2 className="text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stations.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Usuários Ativos</h3>
                        <Users className="text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{MOCK_USERS.length + 152}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Solicitações Pendentes</h3>
                        <Clock className="text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{requests.length}</p>
                </div>
              </div>

              {/* Operator Approvals */}
              {requests.length > 0 && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Solicitações de Cadastro de Postos</h2>
                        {loadingRequests && <span className="text-sm text-slate-400">Atualizando...</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs uppercase bg-slate-900 text-slate-300">
                                <tr>
                                    <th className="px-6 py-3">Solicitante</th>
                                    <th className="px-6 py-3">Posto / Endereço</th>
                                    <th className="px-6 py-3">Contato</th>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{req.managerName}</div>
                                            <div className="text-xs text-slate-500">{req.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{req.stationName}</div>
                                            <div className="text-xs text-slate-500">{req.address}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono">{req.phone}</td>
                                        <td className="px-6 py-4">
                                            {formatDistanceToNow(new Date(req.date), { addSuffix: true, locale: ptBR } as any)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => openRejectModal(req)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                                    title="Rejeitar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openApprovalModal(req)}
                                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2 text-xs font-bold transition-colors shadow-lg shadow-green-900/20"
                                                >
                                                    <Check className="w-3 h-3" /> Analisar e Aprovar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}

              {/* FIGURE 9: Advanced Grid View */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Gerenciar Postos de Combustível</h2>
                        <p className="text-sm text-slate-400">Visualização em grade dos estabelecimentos credenciados.</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-orange-500 focus:border-orange-500 w-full md:w-64"
                            />
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        </div>
                        
                        <div className="relative">
                            <select
                                className="bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                                onChange={(e) => {
                                    const [key, dir] = e.target.value.split('-');
                                    handleSort(key, dir as 'asc' | 'desc');
                                }}
                            >
                                <option value="name-asc">Nome (A-Z)</option>
                                <option value="name-desc">Nome (Z-A)</option>
                                <option value="manager-asc">Responsável (A-Z)</option>
                                <option value="status.lastUpdated-desc">Recentes</option>
                            </select>
                            <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                            <ArrowUpDown className="w-3 h-3 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                        </div>

                        <button 
                            onClick={exportStationsToCSV}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            CSV
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getFilteredStations().map(station => {
                        const connStatus = getConnectionStatus(station.status.lastUpdated);
                        const isOnline = connStatus === 'Online';
                        
                        return (
                            <div key={station.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all shadow-lg group flex flex-col h-full">
                                {/* Header Image */}
                                <div className="h-32 relative overflow-hidden bg-slate-900">
                                    <img 
                                        src={station.imageUrl} 
                                        alt={station.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent"></div>
                                    <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700 backdrop-blur text-white text-xs font-mono px-2 py-1 rounded shadow-sm">
                                        {station.stationCode}
                                    </div>
                                    <div className="absolute bottom-2 left-4 right-4">
                                        <h3 className="text-white font-bold text-lg leading-tight truncate" title={station.name}>
                                            {station.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-4 flex-grow space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-400" title="Responsável">
                                            <UserIcon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            <span className="truncate">{station.manager || 'Não atribuído'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400" title="Localização">
                                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            <span className="truncate">{station.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400" title="Telefone">
                                            <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            <span className="truncate">{station.phone}</span>
                                        </div>
                                    </div>

                                    {/* Status Controls */}
                                    <div className="pt-3 border-t border-slate-700/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Disponibilidade</span>
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${isOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                                {connStatus}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => handleToggleStatus(station.id, 'gasoline')}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                                    station.status.gasoline 
                                                    ? 'bg-green-500 text-white border-green-600 shadow-sm' 
                                                    : 'bg-slate-700/50 text-slate-500 border-slate-600 hover:bg-slate-700'
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${station.status.gasoline ? 'bg-white' : 'bg-slate-500'}`}></div>
                                                Gasolina
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(station.id, 'diesel')}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                                    station.status.diesel
                                                    ? 'bg-yellow-500 text-slate-900 border-yellow-600 shadow-sm' 
                                                    : 'bg-slate-700/50 text-slate-500 border-slate-600 hover:bg-slate-700'
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${station.status.diesel ? 'bg-slate-900' : 'bg-slate-500'}`}></div>
                                                Gasóleo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="bg-slate-900/50 p-3 border-t border-slate-700 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500">
                                        Atualizado {formatDistanceToNow(new Date(station.status.lastUpdated), { addSuffix: true, locale: ptBR } as any)}
                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openEditModal(station)}
                                            className="text-orange-500 hover:text-white p-1.5 hover:bg-orange-600 rounded transition-colors"
                                            title="Editar Dados"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(station)}
                                            className="text-red-500 hover:text-white p-1.5 hover:bg-red-600 rounded transition-colors"
                                            title="Remover Posto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {getFilteredStations().length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-700 rounded-xl">
                            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 text-lg">Nenhum posto encontrado.</p>
                            <p className="text-sm text-slate-600">Tente ajustar seus filtros de busca.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 flex justify-between items-center text-xs text-slate-500 border-t border-slate-800 pt-4">
                   <span>Mostrando {getFilteredStations().length} de {stations.length} postos</span>
                   <div className="flex gap-4">
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Online (&lt;2h)</span>
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Offline</span>
                   </div>
                </div>
              </div>
          </div>
      )}

      {/* ======================= EMAIL LOGS TAB ======================= */}
      {activeTab === 'logs' && (
          <div className="animate-fade-in">
             <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8 shadow-xl">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <Mail className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Auditoria de Disparos de E-mail</h2>
                            <p className="text-sm text-slate-400">Registro completo de todos os e-mails enviados pelo sistema.</p>
                        </div>
                    </div>
                    <button 
                        onClick={loadEmailLogs}
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                        title="Atualizar Logs"
                    >
                        <RefreshCw className={`w-5 h-5 ${loadingLogs ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loadingLogs ? (
                    <div className="p-12 text-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Carregando histórico...
                    </div>
                ) : emailLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum e-mail foi enviado ainda.</p>
                        <p className="text-sm mt-2">Os e-mails aparecerão aqui quando a disponibilidade dos postos for alterada.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs uppercase bg-slate-900 text-slate-300">
                                <tr>
                                    <th className="px-6 py-4">Data/Hora</th>
                                    <th className="px-6 py-4">Destinatário</th>
                                    <th className="px-6 py-4">Assunto</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {emailLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-white font-mono text-xs">
                                                    {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR } as any)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {log.to}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                                log.subject.includes('Disponível') || log.subject.includes('Novo')
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                                {log.subject}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.status === 'sent' ? (
                                                <span className="flex items-center gap-1.5 text-green-500 text-xs font-bold uppercase">
                                                    <Check className="w-3 h-3" /> Enviado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-red-500 text-xs font-bold uppercase">
                                                    <X className="w-3 h-3" /> Falha
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => alert(log.message)}
                                                className="text-slate-400 hover:text-white underline decoration-dotted underline-offset-4 text-xs"
                                            >
                                                Ver Corpo
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
             </div>
          </div>
      )}

      {/* EDIT STATION MODAL */}
      {isEditModalOpen && editingStation && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 transition-opacity bg-slate-900/80" onClick={() => setIsEditModalOpen(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                  <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-slate-800 border border-slate-700 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                      <div className="absolute top-0 right-0 pt-4 pr-4">
                          <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 bg-slate-800 rounded-md hover:text-white focus:outline-none">
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                      <div className="sm:flex sm:items-start">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-500/10 rounded-full flex-shrink-0 sm:mx-0 sm:h-10 sm:w-10">
                              <Edit2 className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                              <h3 className="text-lg font-medium leading-6 text-white">Editar Posto: {editingStation.name}</h3>
                              <p className="mt-2 text-sm text-slate-400">
                                  Atualize as informações do estabelecimento.
                              </p>
                          </div>
                      </div>
                      <form onSubmit={handleSaveEdit} className="mt-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-300">Nome do Posto</label>
                              <input 
                                  type="text" required 
                                  value={editFormData.name}
                                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                  className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-300">Endereço</label>
                              <input 
                                  type="text" required 
                                  value={editFormData.address}
                                  onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                                  className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-300">Telefone</label>
                                  <input 
                                      type="text" required 
                                      value={editFormData.phone}
                                      onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                                      className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-300">Horário</label>
                                  <input 
                                      type="text" required 
                                      value={editFormData.openHours}
                                      onChange={e => setEditFormData({...editFormData, openHours: e.target.value})}
                                      className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1">Imagem do Posto</label>
                              <div className="flex items-center space-x-4">
                                  {editFormData.imageUrl ? (
                                      <div className="relative w-24 h-16 rounded-md overflow-hidden border border-slate-600 group">
                                          <img src={editFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                          <button 
                                            type="button" 
                                            onClick={() => setEditFormData({...editFormData, imageUrl: ''})}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <X className="w-5 h-5 text-white" />
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="w-24 h-16 rounded-md border border-slate-600 border-dashed flex items-center justify-center bg-slate-900 text-slate-500">
                                          <ImageIcon className="w-6 h-6" />
                                      </div>
                                  )}
                                  <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md border border-slate-600 shadow-sm flex items-center gap-2 transition-colors text-sm font-medium">
                                      <Upload className="w-4 h-4" />
                                      Alterar Imagem
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setEditFormData({...editFormData, imageUrl: val}))} />
                                  </label>
                              </div>
                          </div>

                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                              <button
                                  type="submit"
                                  disabled={isSavingEdit}
                                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                              >
                                  {isSavingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Alterações'}
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setIsEditModalOpen(false)}
                                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-white transition-colors bg-slate-700 border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                              >
                                  Cancelar
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* APPROVAL MODAL WITH IMAGE UPLOAD */}
      {approvalModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 transition-opacity bg-slate-900/80" onClick={() => setApprovalModalOpen(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                  <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-slate-800 border border-slate-700 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                      <div className="absolute top-0 right-0 pt-4 pr-4">
                          <button onClick={() => setApprovalModalOpen(false)} className="text-slate-400 bg-slate-800 rounded-md hover:text-white focus:outline-none">
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                      <div className="sm:flex sm:items-start">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-500/10 rounded-full flex-shrink-0 sm:mx-0 sm:h-10 sm:w-10">
                              <Check className="w-6 h-6 text-green-500" />
                          </div>
                          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                              <h3 className="text-lg font-medium leading-6 text-white">Aprovar Cadastro: {selectedRequest.stationName}</h3>
                              <div className="mt-2 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-md border border-slate-700">
                                  <p><strong>Solicitante:</strong> {selectedRequest.managerName}</p>
                                  <p><strong>Endereço:</strong> {selectedRequest.address}</p>
                                  <p><strong>Contato:</strong> {selectedRequest.phone}</p>
                              </div>
                              
                              <div className="mt-4">
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                      Upload da Foto do Posto (Obrigatório)
                                  </label>
                                  <div className="flex flex-col items-center justify-center w-full">
                                      {approvalImage ? (
                                          <div className="relative w-full h-40 rounded-md overflow-hidden border border-slate-600 group mb-2">
                                              <img src={approvalImage} alt="Preview" className="w-full h-full object-cover" />
                                              <button 
                                                type="button" 
                                                onClick={() => setApprovalImage('')}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                  <X className="w-6 h-6 text-white" />
                                                  <span className="ml-2 text-white font-medium">Remover</span>
                                              </button>
                                          </div>
                                      ) : (
                                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors">
                                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                  <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                                  <p className="text-sm text-slate-500">Clique para enviar a foto</p>
                                                  <p className="text-xs text-slate-600">SVG, PNG, JPG (MAX. 800x400px)</p>
                                              </div>
                                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setApprovalImage)} />
                                          </label>
                                      )}
                                      <p className="text-xs text-slate-500 mt-1 text-center w-full">
                                        Ao aprovar, todos os usuários serão notificados sobre o novo posto disponível.
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                              type="button"
                              onClick={handleConfirmApproval}
                              disabled={isApproving}
                              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white transition-colors bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                          >
                              {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar e Notificar Usuários'}
                          </button>
                          <button
                              type="button"
                              onClick={() => setApprovalModalOpen(false)}
                              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-white transition-colors bg-slate-700 border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          >
                              Cancelar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* REJECTION CONFIRMATION MODAL */}
      {rejectionModalOpen && requestToReject && (
          <div className="fixed inset-0 z-[70] overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 transition-opacity bg-slate-900/80" onClick={() => setRejectionModalOpen(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                  <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-slate-800 border border-red-500/50 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                      <div className="sm:flex sm:items-start">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/10 rounded-full flex-shrink-0 sm:mx-0 sm:h-10 sm:w-10">
                              <AlertTriangle className="w-6 h-6 text-red-500" />
                          </div>
                          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                              <h3 className="text-lg font-medium leading-6 text-white">Rejeitar Solicitação</h3>
                              <div className="mt-2">
                                  <p className="text-sm text-slate-300">
                                      Tem certeza que deseja rejeitar o cadastro do posto <strong>{requestToReject.stationName}</strong>?
                                  </p>
                                  <p className="text-sm text-slate-400 mt-2">
                                      Esta ação não pode ser desfeita. O solicitante não poderá usar este pedido para criar uma conta de operador.
                                  </p>
                              </div>
                          </div>
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                              type="button"
                              onClick={handleConfirmReject}
                              disabled={isRejecting}
                              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white transition-colors bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                          >
                              {isRejecting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sim, Rejeitar'}
                          </button>
                          <button
                              type="button"
                              onClick={() => setRejectionModalOpen(false)}
                              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-white transition-colors bg-slate-700 border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          >
                              Cancelar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* DELETE STATION CONFIRMATION MODAL */}
      {isDeleteModalOpen && stationToDelete && (
          <div className="fixed inset-0 z-[70] overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 transition-opacity bg-slate-900/80" onClick={() => setIsDeleteModalOpen(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                  <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-slate-800 border border-red-500/50 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                      <div className="sm:flex sm:items-start">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/10 rounded-full flex-shrink-0 sm:mx-0 sm:h-10 sm:w-10">
                              <Trash2 className="w-6 h-6 text-red-500" />
                          </div>
                          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                              <h3 className="text-lg font-medium leading-6 text-white">Eliminar Posto</h3>
                              <div className="mt-2">
                                  <p className="text-sm text-slate-300">
                                      Tem certeza que deseja remover o posto <strong>{stationToDelete.name}</strong> do sistema?
                                  </p>
                                  <p className="text-sm text-slate-400 mt-2 font-bold">
                                      Esta ação é permanente e não pode ser desfeita.
                                  </p>
                              </div>
                          </div>
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                              type="button"
                              onClick={handleConfirmDelete}
                              disabled={isDeleting}
                              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white transition-colors bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                          >
                              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sim, Eliminar'}
                          </button>
                          <button
                              type="button"
                              onClick={() => setIsDeleteModalOpen(false)}
                              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-white transition-colors bg-slate-700 border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          >
                              Cancelar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Manual Create Modal (Existing) */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 transition-opacity bg-slate-900/80" onClick={() => setIsCreateModalOpen(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                  <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-slate-800 border border-slate-700 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                      <div className="absolute top-0 right-0 pt-4 pr-4">
                          <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 bg-slate-800 rounded-md hover:text-white focus:outline-none">
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                      <div className="sm:flex sm:items-start">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-500/10 rounded-full flex-shrink-0 sm:mx-0 sm:h-10 sm:w-10">
                              <Building2 className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                              <h3 className="text-lg font-medium leading-6 text-white">Criar Posto Manualmente</h3>
                              <p className="mt-2 text-sm text-slate-400">
                                  Preencha os detalhes para cadastrar um novo posto no sistema. Um código único será gerado.
                              </p>
                          </div>
                      </div>
                      <form onSubmit={handleCreateManual} className="mt-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-300">Nome do Posto</label>
                              <input 
                                  type="text" required 
                                  value={newStationData.name}
                                  onChange={e => setNewStationData({...newStationData, name: e.target.value})}
                                  className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-300">Endereço</label>
                              <input 
                                  type="text" required 
                                  value={newStationData.address}
                                  onChange={e => setNewStationData({...newStationData, address: e.target.value})}
                                  className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-300">Telefone</label>
                                  <input 
                                      type="text" required 
                                      value={newStationData.phone}
                                      onChange={e => setNewStationData({...newStationData, phone: e.target.value})}
                                      className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-300">Horário</label>
                                  <input 
                                      type="text" required 
                                      value={newStationData.openHours}
                                      onChange={e => setNewStationData({...newStationData, openHours: e.target.value})}
                                      className="block w-full px-3 py-2 mt-1 text-white placeholder-slate-500 bg-slate-900 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                  />
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1">Imagem do Posto</label>
                              <div className="flex items-center space-x-4">
                                  {newStationData.imageUrl ? (
                                      <div className="relative w-24 h-16 rounded-md overflow-hidden border border-slate-600 group">
                                          <img src={newStationData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                          <button 
                                            type="button" 
                                            onClick={() => setNewStationData({...newStationData, imageUrl: ''})}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <X className="w-5 h-5 text-white" />
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="w-24 h-16 rounded-md border border-slate-600 border-dashed flex items-center justify-center bg-slate-900 text-slate-500">
                                          <ImageIcon className="w-6 h-6" />
                                      </div>
                                  )}
                                  <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md border border-slate-600 shadow-sm flex items-center gap-2 transition-colors text-sm font-medium">
                                      <Upload className="w-4 h-4" />
                                      Escolher Imagem
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setNewStationData({...newStationData, imageUrl: val}))} />
                                  </label>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">Recomendado: 800x400px</p>
                          </div>

                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                              <button
                                  type="submit"
                                  disabled={creatingStation}
                                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white transition-colors bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                              >
                                  {creatingStation ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Posto'}
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setIsCreateModalOpen(false)}
                                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-white transition-colors bg-slate-700 border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                              >
                                  Cancelar
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};