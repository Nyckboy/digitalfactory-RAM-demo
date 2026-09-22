import { useState } from "react";
import { supervisorService, type CreateTaskPayload } from "../../lib/supervisorApi";
import { getErrorMessage } from "../../lib/errors";
import type { ProjectDTO } from "../../types/api";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDTO | null;
}

export const CreateTaskModal = ({ isOpen, onClose, project }: CreateTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: "",
    deadline: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.assignedToId) {
      setError("Please assign this task to an intern.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateTaskPayload = {
        ...formData,
        projectId: project.id,
        deadline: new Date(formData.deadline).toISOString(),
      };

      await supervisorService.createTask(payload);
      setSuccessMsg("Task created successfully!");

      setTimeout(() => {
        setFormData({ title: "", description: "", assignedToId: "", deadline: "" });
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create task."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg p-6 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-2xl font-sans">
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-on-surface">Assign Task</h2>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <p className="text-sm text-secondary mb-6">
          Project: <span className="font-bold text-primary-container">{project.title}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 text-sm text-error bg-error-container rounded-md border border-outline-variant">{error}</div>}
          {successMsg && <div className="p-3 text-sm text-tertiary bg-tertiary-fixed/50 rounded-md border border-tertiary-fixed">{successMsg}</div>}

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Task Title</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm" placeholder="e.g., Design Login Screen" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Description</label>
            <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none transition-colors text-sm" placeholder="What needs to be done?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Assign To</label>
              <select required value={formData.assignedToId} onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })} className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm">
                <option value="" disabled>Select Intern</option>
                {project.interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>{intern.firstName} {intern.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Deadline</label>
              <input type="datetime-local" required value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-surface-container-highest">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface transition">Cancel</button>
            <button type="submit" disabled={isLoading || successMsg !== null} className={`px-6 py-2 text-sm font-medium text-on-primary rounded-lg shadow-sm transition-colors ${isLoading || successMsg ? "bg-primary-container/70 cursor-not-allowed" : "bg-primary-container hover:bg-primary"}`}>
              {isLoading ? "Processing..." : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
