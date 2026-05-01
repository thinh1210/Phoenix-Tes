import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import { LogOut, Upload, Package, Clock, Link as LinkIcon, Plus, ChevronLeft, ChevronRight, FileCode2, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 6;

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [projectHistory, setProjectHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Upload state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadProject, setUploadProject] = useState('');
    const [uploadVersion, setUploadVersion] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Create Project state
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creatingProject, setCreatingProject] = useState(false);
    const [projectError, setProjectError] = useState('');

    // Edit/Delete Project state
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [editProjectData, setEditProjectData] = useState({ id: '', name: '', description: '' });
    const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
    const [deleteProjectId, setDeleteProjectId] = useState('');

    // Edit/Delete Firmware state
    const [isEditFirmwareModalOpen, setIsEditFirmwareModalOpen] = useState(false);
    const [editFirmwareData, setEditFirmwareData] = useState({ id: '', version: '', releaseNotes: '' });
    const [editFirmwareFile, setEditFirmwareFile] = useState(null);
    const [isDeleteFirmwareModalOpen, setIsDeleteFirmwareModalOpen] = useState(false);
    const [deleteFirmwareId, setDeleteFirmwareId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const projectsRes = await axiosClient.get('/firmwares/projects');
            setProjects(projectsRes);
            if (projectsRes.length > 0 && !selectedProjectId) {
                setSelectedProjectId(projectsRes[0].id);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectHistory = async (projectId) => {
        if (!projectId) return;
        try {
            setHistoryLoading(true);
            const historyRes = await axiosClient.get(`/firmwares/${projectId}/history`);
            setProjectHistory(historyRes);
            setCurrentPage(1); // Reset page on new project
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectHistory(selectedProjectId);
        }
    }, [selectedProjectId]);

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploadError('');
        
        if (!uploadFile) {
            setUploadError('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('projectId', uploadProject);
        formData.append('version', uploadVersion);
        formData.append('firmware', uploadFile);

        try {
            setUploading(true);
            await axiosClient.post('/firmwares/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setIsUploadModalOpen(false);
            setUploadFile(null);
            setUploadVersion('');
            
            // If uploaded to currently viewed project, refresh history
            if (uploadProject === selectedProjectId) {
                fetchProjectHistory(selectedProjectId);
            }
        } catch (error) {
            setUploadError(error.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setProjectError('');
        
        if (!newProjectName.trim()) {
            setProjectError('Device Type Name is required');
            return;
        }

        try {
            setCreatingProject(true);
            const newProj = await axiosClient.post('/firmwares/projects', {
                name: newProjectName.trim(),
                description: newProjectDesc.trim()
            });
            
            setIsProjectModalOpen(false);
            setNewProjectName('');
            setNewProjectDesc('');
            
            // Refresh projects and auto-select the new one
            const projectsRes = await axiosClient.get('/firmwares/projects');
            setProjects(projectsRes);
            setSelectedProjectId(newProj.id);
            
        } catch (error) {
            setProjectError(error.response?.data?.error || 'Failed to create device type');
        } finally {
            setCreatingProject(false);
        }
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await axiosClient.put(`/firmwares/projects/${editProjectData.id}`, {
                name: editProjectData.name,
                description: editProjectData.description
            });
            setIsEditProjectModalOpen(false);
            fetchProjects();
        } catch (error) {
            alert(error.response?.data?.error || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        try {
            setActionLoading(true);
            await axiosClient.delete(`/firmwares/projects/${deleteProjectId}`);
            setIsDeleteProjectModalOpen(false);
            setSelectedProjectId('');
            fetchProjects();
            setProjectHistory([]);
        } catch (error) {
            alert('Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateFirmware = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('version', editFirmwareData.version);
        if (editFirmwareData.releaseNotes) {
            formData.append('releaseNotes', editFirmwareData.releaseNotes);
        }
        if (editFirmwareFile) {
            formData.append('firmware', editFirmwareFile);
        }
        
        try {
            setActionLoading(true);
            await axiosClient.put(`/firmwares/${editFirmwareData.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsEditFirmwareModalOpen(false);
            setEditFirmwareFile(null);
            fetchProjectHistory(selectedProjectId);
        } catch (error) {
            alert(error.response?.data?.error || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteFirmware = async () => {
        try {
            setActionLoading(true);
            await axiosClient.delete(`/firmwares/${deleteFirmwareId}`);
            setIsDeleteFirmwareModalOpen(false);
            fetchProjectHistory(selectedProjectId);
        } catch (error) {
            alert('Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(projectHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = projectHistory.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Navbar */}
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-blue-500" />
                            <span className="ml-2 text-xl font-bold text-white">OTA Dashboard</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-300">Welcome, {user?.username}</span>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-white">Firmware Management</h1>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setIsProjectModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600 shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Device Type</span>
                        </button>
                        <button
                            onClick={() => {
                                setUploadProject(selectedProjectId); // Default selected
                                setIsUploadModalOpen(true);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Upload className="h-4 w-4" />
                            <span>Upload New</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                        <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300">No device types found</h3>
                        <p className="text-gray-500 mt-1 mb-4">Create your first device type (project) to get started.</p>
                        <button
                            onClick={() => setIsProjectModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Device Type
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar: Device Types */}
                        <div className="lg:col-span-1 space-y-2">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Device Types</h2>
                            {projects.map((p) => (
                                <div key={p.id} className="group relative">
                                    <button
                                        onClick={() => setSelectedProjectId(p.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                                            selectedProjectId === p.id 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                                        }`}
                                    >
                                        <span className="font-medium truncate pr-16">{p.name}</span>
                                    </button>
                                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 transition-opacity ${selectedProjectId === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <button onClick={(e) => { e.stopPropagation(); setEditProjectData(p); setIsEditProjectModalOpen(true); }} className="p-1.5 bg-gray-900/50 hover:bg-blue-500 rounded text-gray-300 hover:text-white transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteProjectId(p.id); setIsDeleteProjectModalOpen(true); }} className="p-1.5 bg-gray-900/50 hover:bg-red-500 rounded text-gray-300 hover:text-white transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main Content: History */}
                        <div className="lg:col-span-3">
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                        <FileCode2 className="h-5 w-5 text-blue-400" />
                                        Version History
                                    </h2>
                                    <span className="px-3 py-1 bg-gray-900 text-gray-300 text-sm rounded-full border border-gray-700">
                                        Total: {projectHistory.length}
                                    </span>
                                </div>
                                
                                {historyLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : projectHistory.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No firmwares uploaded for this device yet.
                                    </div>
                                ) : (
                                    <div>
                                        {/* Table or Grid */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-gray-300">
                                                <thead className="bg-gray-900/50 text-xs uppercase text-gray-400 border-b border-gray-700">
                                                    <tr>
                                                        <th className="px-6 py-4 font-medium">Version</th>
                                                        <th className="px-6 py-4 font-medium">Uploaded At</th>
                                                        <th className="px-6 py-4 font-medium">State File</th>
                                                        <th className="px-6 py-4 font-medium text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-700">
                                                    {paginatedHistory.map((fw, index) => (
                                                        <tr key={fw.id} className="hover:bg-gray-700/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                                                                        v{fw.version}
                                                                    </span>
                                                                    {currentPage === 1 && index === 0 && (
                                                                        <span className="text-[10px] uppercase tracking-wider bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20">Latest</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center text-gray-400">
                                                                    <Clock className="h-4 w-4 mr-2" />
                                                                    {format(new Date(fw.created_at), 'MMM dd, yyyy HH:mm')}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <a href={fw.state_url} target="_blank" rel="noreferrer" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                                                                    <LinkIcon className="h-3 w-3 mr-1" /> json
                                                                </a>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <a
                                                                        href={fw.bin_url}
                                                                        className="inline-flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors border border-gray-600"
                                                                    >
                                                                        Download
                                                                    </a>
                                                                    <button onClick={() => { setEditFirmwareData({ id: fw.id, version: fw.version, releaseNotes: fw.release_notes || '' }); setIsEditFirmwareModalOpen(true); }} className="p-1.5 bg-gray-700 hover:bg-blue-500 text-gray-300 hover:text-white rounded transition-colors" title="Edit Firmware"><Edit2 className="h-4 w-4" /></button>
                                                                    <button onClick={() => { setDeleteFirmwareId(fw.id); setIsDeleteFirmwareModalOpen(true); }} className="p-1.5 bg-gray-700 hover:bg-red-500 text-gray-300 hover:text-white rounded transition-colors" title="Delete Firmware"><Trash2 className="h-4 w-4" /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/30">
                                                <div className="text-sm text-gray-400">
                                                    Showing <span className="font-medium text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * ITEMS_PER_PAGE, projectHistory.length)}</span> of <span className="font-medium text-white">{projectHistory.length}</span> results
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className="p-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="p-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Upload Firmware</h2>
                            <button 
                                onClick={() => setIsUploadModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {uploadError && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 mb-6 text-sm">
                                    {uploadError}
                                </div>
                            )}

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Device Type</label>
                                    <select
                                        required
                                        value={uploadProject}
                                        onChange={(e) => setUploadProject(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select a device type...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Version (e.g., 1.0.0)</label>
                                    <input
                                        type="text"
                                        required
                                        value={uploadVersion}
                                        onChange={(e) => setUploadVersion(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="1.0.0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Firmware File (.bin)</label>
                                    <input
                                        type="file"
                                        required
                                        accept=".bin"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center shadow-md shadow-blue-500/20"
                                    >
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            'Upload'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            {isProjectModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Add Device Type</h2>
                            <button 
                                onClick={() => setIsProjectModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {projectError && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 mb-6 text-sm">
                                    {projectError}
                                </div>
                            )}

                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Device Type Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="e.g., smartbus, smartscale"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                                    <textarea
                                        value={newProjectDesc}
                                        onChange={(e) => setNewProjectDesc(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                                        placeholder="Brief description of the device type"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsProjectModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingProject}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center shadow-md shadow-blue-500/20"
                                    >
                                        {creatingProject ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            'Create'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {isEditProjectModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Edit Device Type</h2>
                            <button onClick={() => setIsEditProjectModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUpdateProject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                    <input type="text" required value={editProjectData.name} onChange={(e) => setEditProjectData({...editProjectData, name: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                    <textarea value={editProjectData.description || ''} onChange={(e) => setEditProjectData({...editProjectData, description: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-24 resize-none focus:border-blue-500" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsEditProjectModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex justify-center items-center">{actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Save'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Project Modal */}
            {isDeleteProjectModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-gray-800 rounded-xl border border-red-500/50 w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-2">Delete Device Type?</h3>
                            <p className="text-sm text-gray-300 mb-6">Are you sure? This will permanently delete this device type and ALL its associated firmwares. This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteProjectModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
                                <button onClick={handleDeleteProject} disabled={actionLoading} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex justify-center items-center">{actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Firmware Modal */}
            {isEditFirmwareModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Edit Firmware</h2>
                            <button onClick={() => setIsEditFirmwareModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUpdateFirmware} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Version</label>
                                    <input type="text" required value={editFirmwareData.version} onChange={(e) => setEditFirmwareData({...editFirmwareData, version: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Release Notes</label>
                                    <textarea value={editFirmwareData.releaseNotes || ''} onChange={(e) => setEditFirmwareData({...editFirmwareData, releaseNotes: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-24 resize-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">New Firmware File (.bin) - Optional</label>
                                    <input type="file" accept=".bin" onChange={(e) => setEditFirmwareFile(e.target.files[0])} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20" />
                                    <p className="text-xs text-gray-400 mt-1">Leave blank to keep current file.</p>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsEditFirmwareModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex justify-center items-center">{actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Save'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Firmware Modal */}
            {isDeleteFirmwareModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-gray-800 rounded-xl border border-red-500/50 w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-2">Delete Firmware?</h3>
                            <p className="text-sm text-gray-300 mb-6">Are you sure you want to delete this firmware version? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteFirmwareModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
                                <button onClick={handleDeleteFirmware} disabled={actionLoading} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex justify-center items-center">{actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
