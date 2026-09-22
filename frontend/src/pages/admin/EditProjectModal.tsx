import { useState, useEffect } from 'react';
import { adminService } from '../../lib/adminApi';
import type { ProjectDTO, ProjectStatus, UserDTO } from '../../types/api';

interface EditProjectModalProps {
  isOpen: boolean;
  project: ProjectDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProjectModal = ({ isOpen, project, onClose, onSuccess }: EditProjectModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    status: 'DRAFT' as ProjectStatus,
    supervisorId: '',
    internIds: [] as string[],
  });

  const [supervisors, setSupervisors] = useState<UserDTO[]>([]);
  const [interns, setInterns] = useState<UserDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      adminService.getUsers(0, 100).then(res => {
        setSupervisors(res.content.filter(u => u.role === 'SUPERVISOR' && u.isActive));
        setInterns(res.content.filter(u => u.role === 'INTERN' && u.isActive));
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        title: project.title,
        status: project.status,
        supervisorId: project.supervisor.id,
        internIds: project.interns.map(i => i.id),
      });
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleInternToggle = (internId: string) => {
    setFormData(prev => ({
      ...prev,
      internIds: prev.internIds.includes(internId)
        ? prev.internIds.filter(id => id !== internId)
        : [...prev.internIds, internId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await adminService.updateProject(project.id, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update project.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg p-6 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">Edit Project</h2>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 text-sm text-error bg-error-container rounded-md border border-outline-variant">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Project Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })} className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm">
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Supervisor</label>
            <select value={formData.supervisorId} onChange={e => setFormData({ ...formData, supervisorId: e.target.value })} className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm">
              <option value="" disabled>Select Supervisor</option>
              {supervisors.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.firstName} {sup.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Assign Interns</label>
            <div className="max-h-40 overflow-y-auto border border-outline-variant rounded-lg p-2 space-y-1 bg-[#F1F3F5]">
              {interns.length === 0 ? (
                <p className="text-sm text-secondary p-2">No active interns found.</p>
              ) : (
                interns.map(intern => (
                  <label key={intern.id} className="flex items-center space-x-3 p-2 hover:bg-surface-container-highest rounded cursor-pointer transition-colors">
                    <input type="checkbox" checked={formData.internIds.includes(intern.id)} onChange={() => handleInternToggle(intern.id)} className="w-4 h-4 text-primary bg-surface-container-lowest border-outline-variant rounded" />
                    <span className="text-sm text-on-surface font-medium">{intern.firstName} {intern.lastName}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-surface-container-highest">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface transition">Cancel</button>
            <button type="submit" disabled={isLoading} className={`px-6 py-2 text-sm font-medium text-on-primary rounded-lg shadow-sm transition-colors ${isLoading ? 'bg-primary-container/70 cursor-not-allowed' : 'bg-primary-container hover:bg-primary'}`}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
