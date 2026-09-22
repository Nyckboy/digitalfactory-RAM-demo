import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { supervisorService } from "../../lib/supervisorApi";
import type { TaskDTO, TaskStatus, ProjectDTO } from "../../types/api";
import { TaskCommentsModal } from "../../components/shared/TaskCommentsModal";
import { EditTaskModal } from "./EditTaskModal";
// Make sure to import CreateTaskModal if you are using it in this file
import { CreateTaskModal } from "./CreateTaskModal";

export const ProjectTaskBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the project from the router state, or fallback to a basic object if directly accessed
  const [project, setProject] = useState<ProjectDTO | null>(
    (location.state?.project as ProjectDTO) || null,
  );

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTask, setChatTask] = useState<TaskDTO | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const openChat = (task: TaskDTO) => {
    setChatTask(task);
    setChatModalOpen(true);
  };

  const openEdit = (taskId: string) => {
    setEditTaskId(taskId);
    setEditModalOpen(true);
  };

  const fetchBoardData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [response, fetchedProject] = await Promise.all([
        supervisorService.getProjectTasks(projectId, 0, 100),
        supervisorService.getProject(projectId),
      ]);
      setTasks(response.content);
      setProject(fetchedProject);
    } catch {
      setError("Failed to load project board data.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;

    // Optimistically update the UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await supervisorService.updateTask(taskId, {
        ...taskToUpdate,
        status: newStatus,
      });
    } catch (err: unknown) {
      console.error("Failed to update task status", err);
      // Revert on failure
      fetchBoardData();
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await supervisorService.deleteTask(taskId);
    } catch {
      fetchBoardData();
    }
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string,
  ) => {
    e.dataTransfer.setData("taskId", taskId);
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    status: TaskStatus,
  ) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      handleStatusChange(taskId, status);
    }
  };
  // ---------------------------

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No Deadline";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const columns: {
    title: string;
    status: TaskStatus;
    headerBg: string;
    dotColor: string;
  }[] = [
    {
      title: "To Do",
      status: "TODO",
      headerBg: "border-surface-container-highest",
      dotColor: "bg-secondary",
    },
    {
      title: "In Progress",
      status: "IN_PROGRESS",
      headerBg: "border-tertiary-fixed/50",
      dotColor: "bg-tertiary",
    },
    {
      title: "In Review",
      status: "IN_REVIEW",
      headerBg: "border-primary-fixed",
      dotColor: "bg-primary-container",
    },
    {
      title: "Completed",
      status: "COMPLETED",
      headerBg: "border-on-secondary-container/20",
      dotColor: "bg-on-secondary-container",
    },
  ];

  if (isLoading)
    return (
      <div className="py-10 text-center text-secondary">Loading board...</div>
    );
  if (error) return <div className="py-10 text-center text-error">{error}</div>;

  if (!project) return <div className="py-10 text-center text-error">Project details are unavailable.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          fetchBoardData(); // Refresh the board after closing!
        }}
        project={project}
      />

      <EditTaskModal
        isOpen={editModalOpen}
        taskId={editTaskId}
        project={project}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchBoardData}
      />

      <TaskCommentsModal
        isOpen={chatModalOpen}
        task={chatTask}
        onClose={() => setChatModalOpen(false)}
        fetchComments={supervisorService.getTaskComments}
        postComment={supervisorService.addTaskComment}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/supervisor/projects")}
            className="px-4 py-2 text-sm font-medium text-secondary bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low transition-colors duration-200 rounded-lg flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
          </button>
          <div>
            <h2 className="text-3xl font-bold text-on-background tracking-tight">
              {project.title}
            </h2>
            <p className="text-sm text-secondary mt-1">
              Oversee tasks and review intern deliverables.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 opacity-40 pointer-events-none select-none">
          <button className="bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 rounded-lg py-2 px-4 flex items-center gap-2 text-sm font-medium shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              filter_list
            </span>{" "}
            Filter
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-w-0 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full items-start w-max px-1">
          {columns.map((col) => (
            <div
              key={col.status}
              className={`shrink-0 w-80 rounded-xl p-3 flex flex-col max-h-full border border-surface-container-highest ${col.status === "IN_PROGRESS" ? "bg-tertiary-fixed/20" : "bg-surface-container-low/50"}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div
                className={`flex items-center justify-between px-2 py-2 mb-3 border-b ${col.headerBg}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${col.dotColor}`}
                  ></span>
                  <h3 className="text-xs font-bold text-on-background uppercase tracking-wider">
                    {col.title}
                  </h3>
                </div>
                <span className="bg-surface-container-lowest text-secondary px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                  {getTasksByStatus(col.status).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {getTasksByStatus(col.status).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-surface-container-lowest rounded-lg p-4 shadow-[0px_30px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0px_40px_50px_rgba(0,0,0,0.06)] transition-all duration-200 border border-transparent hover:border-surface-container-highest cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-surface-container text-secondary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                          Task
                        </span>
                      </div>

                      {/* Edit and Delete Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(task.id)}
                          className="text-secondary hover:text-primary-container"
                          title="Edit Task"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-secondary hover:text-error"
                          title="Delete Task"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            close
                          </span>
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-on-background mb-2 leading-tight">
                      {task.title}
                    </h4>
                    <p className="text-xs text-secondary line-clamp-2 mb-4">
                      {task.description}
                    </p>

                    <div className="mb-4">
                      {task.submissionUrl ? (
                        <div className="flex items-center justify-between bg-[#F1F3F5] px-3 py-2 rounded-lg border border-outline-variant/30">
                          <a
                            href={task.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-primary hover:underline truncate max-w-full"
                          >
                            View Deliverable ↗
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center bg-surface-container-low/50 px-3 py-2 rounded-lg border border-dashed border-outline-variant/50">
                          <span className="text-[11px] text-secondary font-medium italic">
                            No deliverable attached
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant/40">
                      <div className="flex items-center gap-1.5 text-secondary text-xs font-medium">
                        <span className="material-symbols-outlined text-[14px]">
                          calendar_today
                        </span>
                        <span
                          className={
                            new Date(task.deadline) < new Date()
                              ? "text-error"
                              : ""
                          }
                        >
                          {formatDate(task.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.assignedTo ? (
                          <div
                            className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-[10px] font-bold text-tertiary border border-surface-container-lowest shadow-sm cursor-help"
                            title={`Assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                          >
                            {task.assignedTo.firstName[0]?.toUpperCase()}
                          </div>
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full border border-dashed border-secondary flex items-center justify-center text-secondary cursor-help"
                            title="Unassigned (Backlog)"
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              person_off
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => openChat(task)}
                          className="text-secondary hover:text-primary-container transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-surface-container-low"
                          title="Comments"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            chat_bubble
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {getTasksByStatus(col.status).length === 0 && (
                  <div className="text-center text-xs font-medium text-secondary py-6 border-2 border-dashed border-surface-variant/50 rounded-lg">
                    Drop tasks here
                  </div>
                )}
              </div>

              {/* Add Task Button (Pinned to bottom of To Do column) */}
              {col.status === "TODO" && (
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="mt-3 py-2 text-secondary hover:text-primary-container hover:bg-surface-container-highest/50 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-bold w-full"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    add
                  </span>
                  Add Task
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
