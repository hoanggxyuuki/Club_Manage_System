import React, { useState, useEffect } from "react";
import Modal from "../../../../components/common/Modal";
import { useSpring, animated } from "react-spring";
import "./TaskProgress.css";

const TaskProgress = ({ task, onClose, onUpdate }) => {
  const [progress, setProgress] = useState(task.progress || 0);
  const [note, setNote] = useState(task.note || "");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const progressAnimation = useSpring({
    width: `${progress}%`,
    from: { width: "0%" },
    config: { tension: 120, friction: 14 },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onUpdate(task._id, { progress, note });
      setSuccessMessage("Tiến độ đã được cập nhật!");

      
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error updating task progress:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressColor = () => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-orange-500";
    if (progress < 75) return "bg-yellow-500";
    if (progress < 100) return "bg-blue-500";
    return "bg-green-500";
  };

  const getProgressEmoji = () => {
    if (progress < 25) return "😓";
    if (progress < 50) return "🙂";
    if (progress < 75) return "😊";
    if (progress < 100) return "👍";
    return "🎉";
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Cập nhật tiến độ công việc">
      <div className="task-progress-container">
        <div className="progress-header">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-meta">
            <span
              className={`priority-badge priority-${task.priority || "medium"}`}
            >
              {task.priority === "high"
                ? "Ưu tiên cao"
                : task.priority === "low"
                  ? "Ưu tiên thấp"
                  : "Ưu tiên trung bình"}
            </span>

            {task.dueDate && (
              <span className="due-date">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                {new Date(task.dueDate).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>

          <p className="task-description">{task.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="progress-form">
          <div className="progress-section">
            <div className="progress-header">
              <label className="progress-label">Tiến độ công việc</label>
              <div className="progress-value-wrapper">
                <span className="progress-emoji">{getProgressEmoji()}</span>
                <span className="progress-value">{progress}%</span>
              </div>
            </div>

            <div className="progress-bar-container">
              <div className="progress-bar-bg">
                <animated.div
                  className={`progress-bar ${getProgressColor()}`}
                  style={progressAnimation}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="progress-slider"
              />
            </div>

            <div className="progress-markers">
              <span className="progress-marker">0%</span>
              <span className="progress-marker">25%</span>
              <span className="progress-marker">50%</span>
              <span className="progress-marker">75%</span>
              <span className="progress-marker">100%</span>
            </div>
          </div>

          <div className="note-section">
            <label htmlFor="note" className="note-label">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm thông tin chi tiết về tiến độ công việc của bạn..."
              className="note-input"
              rows="3"
            />
          </div>

          {successMessage && (
            <div className="success-message">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          )}

          <div className="button-group">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="save-button" disabled={submitting}>
              {submitting ? (
                <>
                  <svg
                    className="loading-spinner"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="spinner-circle"
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      strokeWidth="4"
                    />
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span>Lưu tiến độ</span>
                  <svg
                    className="icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TaskProgress;
