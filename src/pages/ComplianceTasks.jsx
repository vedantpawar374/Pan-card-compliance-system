import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "./Pages.css";

const ComplianceTasks = () => {
  const navigate = useNavigate();
  const { complianceTasks, taxAnalysis, updateTaskStatus } =
    useContext(AppContext);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [pageError, setPageError] = useState("");

  const completedCount = useMemo(
    () => complianceTasks.filter((task) => task.status === "Completed").length,
    [complianceTasks],
  );

  if (!taxAnalysis || complianceTasks.length === 0) {
    return (
      <div className="page-container">
        <div className="error-message" style={{ marginTop: "50px" }}>
          ⚠️ Please complete the tax analysis first to view compliance tasks.
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard")}
          style={{ marginTop: "20px" }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleMarkAsComplete = async (taskId) => {
    try {
      setPageError("");
      setUpdatingTaskId(taskId);
      await updateTaskStatus(taskId);
    } catch (err) {
      setPageError(
        err?.response?.data?.message || "Failed to update task status.",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return { text: "⏳ Pending", color: "#f39c12" };
      case "Notified":
        return { text: "🔔 Notified", color: "#3498db" };
      case "Completed":
        return { text: "✅ Completed", color: "#27ae60" };
      case "Overdue":
        return { text: "❌ Overdue", color: "#e74c3c" };
      default:
        return { text: status, color: "#95a5a6" };
    }
  };

  const getPriorityBadge = (daysUntilDue) => {
    if (daysUntilDue <= 0) return { text: "Overdue", color: "#e74c3c" };
    if (daysUntilDue <= 30) return { text: "Urgent", color: "#e67e22" };
    if (daysUntilDue <= 60) return { text: "High", color: "#f39c12" };
    return { text: "Normal", color: "#27ae60" };
  };

  const daysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>Compliance Tasks</h1>
      </div>

      <div className="compliance-container">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-stat">
            <h3>Total Tasks</h3>
            <p className="stat-number">{complianceTasks.length}</p>
          </div>
          <div className="summary-stat">
            <h3>Completed</h3>
            <p className="stat-number">{completedCount}</p>
          </div>
          <div className="summary-stat">
            <h3>Pending</h3>
            <p className="stat-number">
              {complianceTasks.length - completedCount}
            </p>
          </div>
        </div>

        {pageError && <div className="error-message">{pageError}</div>}

        {/* Tasks List */}
        <div className="tasks-section">
          <h2>Your Compliance Tasks</h2>

          {complianceTasks.map((task, index) => {
            const statusBadge = getStatusBadge(task.status);
            const priorityBadge = getPriorityBadge(daysUntilDue(task.due_date));
            const isCompleted = task.status === "Completed";

            return (
              <div
                key={task.id}
                className={`task-card ${isCompleted ? "completed" : ""}`}
              >
                <div className="task-header">
                  <div className="task-title-section">
                    <h3>
                      Task {index + 1}: {task.title}
                    </h3>
                    <div className="task-badges">
                      <span
                        className="badge"
                        style={{ backgroundColor: statusBadge.color }}
                      >
                        {statusBadge.text}
                      </span>
                      <span
                        className="badge"
                        style={{ backgroundColor: priorityBadge.color }}
                      >
                        {priorityBadge.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="task-details">
                  <div className="detail-row">
                    <span>Task Type:</span>
                    <strong>{task.task_type}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Due Date:</span>
                    <strong>
                      {new Date(task.due_date).toLocaleDateString("en-IN")}
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Days Remaining:</span>
                    <strong
                      style={{
                        color:
                          daysUntilDue(task.due_date) <= 0
                            ? "#e74c3c"
                            : "#27ae60",
                      }}
                    >
                      {daysUntilDue(task.due_date)} days
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Current Status:</span>
                    <strong>{task.status}</strong>
                  </div>
                </div>

                {/* Task Description */}
                <div className="task-description">
                  <h4>What you need to do:</h4>
                  {task.task_type === "ITR_FILING" && (
                    <ul>
                      <li>
                        Visit the Income Tax e-filing portal
                        (www.incometax.gov.in)
                      </li>
                      <li>Login with your PAN and password</li>
                      <li>
                        Download the appropriate ITR form (usually ITR-1 for
                        salaried individuals)
                      </li>
                      <li>
                        Fill in all required fields with accurate information
                      </li>
                      <li>
                        Attach supporting documents:
                        <ul>
                          <li>Form 16 from employer</li>
                          <li>Proof of investments (if any)</li>
                          <li>Bank statements (if required)</li>
                        </ul>
                      </li>
                      <li>Submit the ITR before July 31st</li>
                      <li>Keep the ITR-V acknowledgement for records</li>
                    </ul>
                  )}
                </div>

                {/* Action Button */}
                {!isCompleted && task.status !== "Completed" && (
                  <button
                    className="btn btn-success"
                    disabled={updatingTaskId === task.id}
                    onClick={() => handleMarkAsComplete(task.id)}
                  >
                    {updatingTaskId === task.id
                      ? "Updating..."
                      : "✓ Mark as Filed"}
                  </button>
                )}
                {isCompleted && (
                  <div className="completed-message">
                    ✅ Task marked as completed on{" "}
                    {task.completed_at
                      ? new Date(task.completed_at).toLocaleDateString("en-IN")
                      : new Date().toLocaleDateString("en-IN")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Resources */}
        <div className="resources-section">
          <h2>📚 Helpful Resources</h2>
          <div className="resources-grid">
            <div className="resource-card">
              <h4>Income Tax e-filing Portal</h4>
              <p>www.incometax.gov.in</p>
            </div>
            <div className="resource-card">
              <h4>ITR Forms</h4>
              <p>Choose appropriate ITR form based on income type</p>
            </div>
            <div className="resource-card">
              <h4>Filing Due Date</h4>
              <p>July 31st for regular assesses</p>
            </div>
            <div className="resource-card">
              <h4>Late Filing</h4>
              <p>File by December 31st with penalty</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceTasks;
