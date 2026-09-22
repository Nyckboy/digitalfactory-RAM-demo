import { useState, useEffect } from "react";
import { supervisorService } from "../../lib/supervisorApi";
import { getErrorMessage } from "../../lib/errors";
import type { UserDTO, TaskStatus, TaskDTO, ProjectDTO } from "../../types/api";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskId: string | null;
  project: ProjectDTO | null;
}

export const EditTaskModal = ({
  isOpen,
  onClose,
  onSuccess,
  taskId,
  project,
}: EditTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskStatus,
    deadline: "",
    assignedToId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !taskId || !project) return;

    const fetchTask = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const taskData = await supervisorService.getTask(taskId);

        setFormData({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          deadline: taskData.deadline ? taskData.deadline.slice(0, 16) : "",
          assignedToId: taskData.assignedTo?.id || "",
        });
      } catch (err: unknown) {
        console.error("Task fetch error:", err);
        setError(
          "Failed to load task details. Please ensure you have access to this project.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [isOpen, taskId, project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Find the full UserDTO object from the passed project prop
      const selectedIntern = project.interns.find(
        (i) => i.id === formData.assignedToId,
      );

      const payload: Partial<TaskDTO> & { assignedToId?: string | null } = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        deadline: formData.deadline,
        assignedTo: selectedIntern as UserDTO,
        assignedToId: formData.assignedToId || null,
      };

      await supervisorService.updateTask(taskId, payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update task."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg p-6 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface transition-colors disabled:opacity-50"
            disabled={isSaving}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-secondary flex flex-col items-center">
            <span className="material-symbols-outlined animate-spin mb-2 text-primary-container">
              sync
            </span>
            Loading task details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-error bg-error-container rounded-md border border-outline-variant">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Task Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none transition-colors text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Status
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as TaskStatus,
                    })
                  }
                  className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Assign Intern
              </label>
              <select
                value={formData.assignedToId}
                onChange={(e) =>
                  setFormData({ ...formData, assignedToId: e.target.value })
                }
                className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm"
              >
                <option value="">Unassigned (Backlog)</option>
                {project.interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>
                    {intern.firstName} {intern.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-surface-container-highest">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-on-primary rounded-lg shadow-sm bg-primary-container hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
