import { useState, useEffect } from "react";
import { adminService } from "../../lib/adminApi";
import type { UserDTO } from "../../types/api";

// New interfaces for the draft state
interface AIDraftTask {
  title: string;
  description: string;
}

interface AIDraftProject {
  title: string;
  description: string;
  tasks: AIDraftTask[];
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) => {
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDraft, setAiDraft] = useState<AIDraftProject | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    supervisorId: "",
    internIds: [] as string[],
  });

  const [supervisors, setSupervisors] = useState<UserDTO[]>([]);
  const [interns, setInterns] = useState<UserDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchAvailableUsers = async () => {
        setIsFetchingUsers(true);
        try {
          const response = await adminService.getUsers(0, 100);
          const allUsers = response.content;
          setSupervisors(
            allUsers.filter((u) => u.role === "SUPERVISOR" && u.isActive),
          );
          setInterns(allUsers.filter((u) => u.role === "INTERN" && u.isActive));
      } catch {
          setError("Could not load users. Please close and try again.");
        } finally {
          setIsFetchingUsers(false);
        }
      };
      fetchAvailableUsers();
    }
  }, [isOpen]);

  // Clean up state when modal closes
  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      supervisorId: "",
      internIds: [],
    });
    setAiPrompt("");
    setAiDraft(null);
    setIsAiMode(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleInternToggle = (internId: string) => {
    setFormData((prev) => ({
      ...prev,
      internIds: prev.internIds.includes(internId)
        ? prev.internIds.filter((id) => id !== internId)
        : [...prev.internIds, internId],
    }));
  };

  const handleDraftTaskChange = (
    index: number,
    field: keyof AIDraftTask,
    value: string,
  ) => {
    if (!aiDraft) return;
    const updatedTasks = [...aiDraft.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setAiDraft({ ...aiDraft, tasks: updatedTasks });
  };

  const handleRemoveDraftTask = (index: number) => {
    if (!aiDraft) return;
    const updatedTasks = aiDraft.tasks.filter((_, i) => i !== index);
    setAiDraft({ ...aiDraft, tasks: updatedTasks });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If in AI Mode and we haven't generated a draft yet, generate it
    if (isAiMode && !aiDraft) {
      if (!aiPrompt.trim()) {
        setError("Please provide a prompt for the AI to generate the project.");
        return;
      }
      setIsLoading(true);
      try {
        const draft = await adminService.generateProjectDraft(aiPrompt);
        setAiDraft(draft);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to generate AI draft.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If we reach here, we are either submitting a manual form or confirming an AI draft
    if (!formData.supervisorId || formData.internIds.length === 0) {
      setError("Please select a supervisor and at least one intern.");
      return;
    }

    setIsLoading(true);
    try {
      if (isAiMode && aiDraft) {
        // Step 2: Confirm and Save AI Draft
        await adminService.confirmAIProject({
          draft: aiDraft,
          supervisorId: formData.supervisorId,
          internIds: formData.internIds,
        });
      } else {
        // Standard Manual Call
        await adminService.createProject(formData);
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save project.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl p-6 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto font-sans relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
            {isAiMode && !aiDraft ? (
              <>
                <span
                  className="material-symbols-outlined text-primary-container text-4xl animate-pulse mb-3"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
                <p className="text-on-surface font-bold text-lg animate-pulse">
                  Structuring your project...
                </p>
                <p className="text-secondary text-sm mt-1">
                  Generating tasks and deadlines.
                </p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined animate-spin text-primary-container text-4xl mb-3">
                  sync
                </span>
                <p className="text-on-surface font-bold text-lg">
                  Saving Project...
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-on-surface">New Project</h2>
          <button
            onClick={handleClose}
            className="text-secondary hover:text-on-surface transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Mode Toggle Tabs (Disabled if reviewing draft) */}
        <div className="flex gap-6 mb-6 border-b border-surface-container-highest pb-0">
          <button
            type="button"
            onClick={() => {
              setIsAiMode(false);
              setAiDraft(null);
            }}
            disabled={!!aiDraft}
            className={`pb-2 text-sm font-semibold transition-colors disabled:opacity-50 ${!isAiMode ? "text-primary-container border-b-2 border-primary-container" : "text-secondary hover:text-on-surface"}`}
          >
            Manual Creation
          </button>
          <button
            type="button"
            onClick={() => setIsAiMode(true)}
            disabled={!!aiDraft}
            className={`pb-2 text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${isAiMode ? "text-tertiary border-b-2 border-tertiary" : "text-secondary hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[16px]">
              auto_awesome
            </span>
            AI Generate
          </button>
        </div>

        {isFetchingUsers ? (
          <div className="py-10 text-center text-sm text-secondary">
            Loading available users...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative">
            {error && (
              <div className="p-3 text-sm text-error bg-error-container rounded-md border border-outline-variant">
                {error}
              </div>
            )}

            {/* AI Prompt Input (Step 1) */}
            {isAiMode && !aiDraft && (
              <div className="bg-tertiary-fixed/30 p-4 rounded-lg border border-tertiary-fixed/50">
                <label className="text-xs font-bold text-tertiary mb-2 flex items-center gap-1">
                  Project Prompt
                </label>
                <textarea
                  required={isAiMode}
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-3 py-3 border border-tertiary-fixed rounded-lg bg-surface-container-lowest text-on-surface focus:ring-1 focus:ring-tertiary focus:border-tertiary outline-none resize-none transition-colors text-sm shadow-inner"
                  placeholder="e.g., We need a SaaS dashboard for a gym. It should include member management, subscription billing via Stripe, and a daily class schedule view."
                />
              </div>
            )}

            {/* AI Draft Review UI (Step 2) */}
            {isAiMode && aiDraft && (
              <div className="bg-tertiary-fixed/10 p-4 rounded-lg border border-tertiary-fixed/30 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-tertiary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      edit_note
                    </span>{" "}
                    Review Generated Draft
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAiDraft(null)}
                    className="text-xs text-tertiary hover:underline"
                  >
                    Discard & Start Over
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Generated Title
                  </label>
                  <input
                    type="text"
                    required
                    value={aiDraft.title}
                    onChange={(e) =>
                      setAiDraft({ ...aiDraft, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:ring-1 focus:ring-tertiary focus:border-tertiary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Generated Description
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={aiDraft.description}
                    onChange={(e) =>
                      setAiDraft({ ...aiDraft, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:ring-1 focus:ring-tertiary focus:border-tertiary outline-none text-sm resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-tertiary-fixed/40">
                  <label className="block text-xs font-semibold text-on-surface mb-3">
                    Generated Tasks ({aiDraft.tasks.length})
                  </label>
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                    {aiDraft.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftTask(idx)}
                          className="absolute top-2 right-2 text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            delete
                          </span>
                        </button>
                        <input
                          type="text"
                          required
                          value={task.title}
                          onChange={(e) =>
                            handleDraftTaskChange(idx, "title", e.target.value)
                          }
                          className="w-full px-2 py-1 mb-2 border border-transparent hover:border-outline-variant focus:border-tertiary rounded text-sm font-semibold text-on-surface outline-none transition-colors"
                        />
                        <textarea
                          required
                          rows={2}
                          value={task.description}
                          onChange={(e) =>
                            handleDraftTaskChange(
                              idx,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-transparent hover:border-outline-variant focus:border-tertiary rounded text-xs text-secondary outline-none resize-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Entry Form */}
            {!isAiMode && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Project Title
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
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-3 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none transition-colors text-sm"
                  />
                </div>
              </>
            )}

            {/* User Assignments (Required for both modes before final save) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Assign Supervisor
                </label>
                <select
                  required
                  value={formData.supervisorId}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisorId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-[#F1F3F5] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-sm"
                >
                  <option value="" disabled>
                    Select Supervisor
                  </option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.firstName} {sup.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-2">
                  Assign Interns
                </label>
                <div className="max-h-32 overflow-y-auto border border-outline-variant rounded-lg p-2 space-y-1 bg-[#F1F3F5]">
                  {interns.length === 0 ? (
                    <p className="text-sm text-secondary p-2">
                      No interns found.
                    </p>
                  ) : (
                    interns.map((intern) => (
                      <label
                        key={intern.id}
                        className="flex items-center space-x-3 p-1.5 hover:bg-surface-container-highest rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.internIds.includes(intern.id)}
                          onChange={() => handleInternToggle(intern.id)}
                          className={`w-4 h-4 rounded ${isAiMode ? "text-tertiary focus:ring-tertiary" : "text-primary focus:ring-primary"} bg-surface-container-lowest border-outline-variant`}
                        />
                        <span className="text-xs text-on-surface font-medium">
                          {intern.firstName} {intern.lastName}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-surface-container-highest">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  (isAiMode && aiDraft
                    ? supervisors.length === 0 || interns.length === 0
                    : false)
                }
                className={`px-6 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
                  isAiMode
                    ? "bg-tertiary text-on-tertiary hover:bg-tertiary-container hover:text-on-tertiary-container disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-primary-container text-on-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isAiMode ? (
                  aiDraft ? (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        check_circle
                      </span>
                      Confirm & Create
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        auto_awesome
                      </span>
                      Generate Draft
                    </>
                  )
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
