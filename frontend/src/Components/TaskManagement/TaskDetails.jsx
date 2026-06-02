import { useRef, useState } from "react";
import "./TaskDetails.css";
import axios from "axios";
import { formatDate, getRelativeOrExactTime, notify } from "../../utils/helper";
import { MdOutlineConfirmationNumber } from "react-icons/md";
import GoogleDrivePicker from "./GoogleDrivePicker";
import { Paperclip } from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const TaskDetails = ({
  setIsTaskDetailPopupOpen,
  fetchTasksAndSubtasks,
  comments,
}) => {
  //console.log("commentssss", comments);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [googleDriveLinks, setGoogleDriveLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [commentText, setCommentText] = useState("");

  const handleClosePopUp = () => {
    setIsTaskDetailPopupOpen(false);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    const maxFileSize = 5 * 1024 * 1024;
    if (files[0].size > maxFileSize) {
      notify("", "File size should be less than 5 MB");
      //console.log("File size exceeds 5 MB");
      return;
    }
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  // Add this function to remove a file
  const removeFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  //console.log("selected files", selectedFiles);

  const addComment = async () => {
    const token = localStorage.getItem("token");
    //console.log("comment text: ", commentText);
    setIsLoading(true);

    if (!token) {
      //console.log("No token found, please login again");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("content", commentText);
      formData.append("driveLinks", JSON.stringify(googleDriveLinks));

      // Append each file to formData
      selectedFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await axios.post(
        `/api/comment/add/${comments._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", "comment added successfully");
      setCommentText("");
      setIsLoading(false);
      fetchTasksAndSubtasks();
      setIsTaskDetailPopupOpen(false);
      setSelectedFiles([]);
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error uploading comment"
      );
      setIsLoading(false);
      //console.log(error.response?.data?.message || "Error uploading comment");
    }
  };

  // Handler for Google Drive Picker
  const handleDriveFilesPicked = (files) => {
    setGoogleDriveLinks((prev) => [...prev, ...files]);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
    //console.log("files", files);
  };

  return (
    <div className="task-details-container">
      <div className="task-details-wrapper">
        <div className="task-header">
          <div className="back-button" onClick={handleClosePopUp}>
            <span className="back-icon">←</span>
            <span>Back</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="task-title">Task Details</h1>

        {/* Task Information */}
        <div className="task-info">
          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">👤</span>
              <span>Status</span>
            </div>
            <div className="info-value">
              <span className="status-dot"></span>
              <span> {comments?.teamStatus} </span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">📄</span>
              <span>Task Name</span>
            </div>
            {/* <div className="info-value">{comments?.taskId}</div> */}
            <div className="info-value">{comments?.taskName}</div>
          </div>

          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">🆔</span>
              <span>Task Id</span>
            </div>
            <div className="info-value"> {comments?.taskId} </div>
          </div>

          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">👤</span>
              <span>Assignees</span>
            </div>
            <div className="info-value">{comments?.assignee?.name}</div>
          </div>

          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">👥</span>
              <span>Assigner</span>
            </div>
            <div className="info-value">{comments?.assigner?.name}</div>
          </div>

          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">👤</span>
              <span>Due Date</span>
            </div>
            <div className="info-value"> {formatDate(comments?.dueDate)} </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${comments?.progress}%` }}
            ></div>
          </div>
          <div className="progress-text"> {comments?.progress}% complete</div>
        </div>

        {/* Submissions */}
        {/* <div className="submissions-section">
          <h2 className="section-title">Submissions</h2>
          <div className="files-container">
            <div className="file-item">
              <div className="file-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#e74c3c">
                  <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5 L18.5,9H13z" />
                </svg>
              </div>
              <div className="file-name">file name.pdf</div>
            </div>

            <div className="file-item">
              <div className="file-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#e74c3c">
                  <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5 L18.5,9H13z" />
                </svg>
              </div>
              <div className="file-name">file name.pdf</div>
            </div>

            <div className="file-item">
              <div className="file-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#e74c3c">
                  <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5 L18.5,9H13z" />
                </svg>
              </div>
              <div className="file-name">file name.pdf</div>
            </div>
          </div>
        </div> */}

        <div className="comments-section">
          <h2 className="section-title">Comments</h2>

          {comments?.comments?.map((comment) => {
            return (
              <div key={comment._id} className="comment">
                <div className="comment-header">
                  <div className="comment-user">
                    <div className="user-avatar">
                      {comment.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="user-name">{comment.user.name}</div>
                    <div className="comment-time">
                      {getRelativeOrExactTime(comment.createdAt)}
                    </div>
                  </div>
                  {/* <div className="comment-actions">
                  <button className="action-button">↩</button>
                  <button className="action-button">↗</button>
                </div> */}
                </div>
                <div className="comment-body">
                  <p
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {comment.content}
                  </p>
                </div>
                {comment.attachments && (
                  <div className="comment-attachment-container">
                    {comment.attachments.map((attachment, index) => (
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        key={index}
                        className="comment-attachment"
                      >
                        <div className="attachment-icon">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="#e74c3c"
                          >
                            <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5 L18.5,9H13z" />
                          </svg>
                        </div>
                        <div className="attachment-name">
                          {attachment.fileName}
                        </div>
                      </a>
                    ))}

                    {comment.driveLinks.map((attachment, index) => (
                      <a
                        href={attachment.url}
                        target="_blank"
                        key={index}
                        className="comment-attachment"
                      >
                        <div className="attachment-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            color="#99C3FF"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-link-icon lucide-link"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          &nbsp;
                        </div>
                        <div className="attachment-name">
                          {attachment?.name}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="add-comment">
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-preview">
                    <span className="file-name">{file.name}</span>
                    {file.isDrive && file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        (Drive Link)
                      </a>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="remove-file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="comment-input-container">
              {/* <div className="user-avatar small">+</div> */}
              <textarea
                className="comment-input"
                placeholder={`${
                  isLoading ? "Uploading..." : "Add a comment..."
                }`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                // onKeyPress={(e) => {
                //   if (e.key === "Enter") {
                //     addComment();
                //   }
                // }}
              />

              <div className="comment-section">
                <div className="comment-input-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    style={{ display: "none" }}
                  />
                  <button
                    className="input-action-button"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <span className="attachment-icon">
                      {/* 📎 */}
                      <Paperclip size={22} />
                    </span>
                  </button>

                  <GoogleDrivePicker onFilesPicked={handleDriveFilesPicked} />

                  {/* <button className="input-action-button">
                    <span className="mention-icon">@</span>
                  </button> */}

                  {isLoading ? (
                    <button
                      className="send-button"
                      onClick={addComment}
                      disabled={true}
                    >
                      <span className="send-icon">➤</span>
                    </button>
                  ) : (
                    <button
                      className="send-button"
                      onClick={addComment}
                      disabled={
                        !commentText.trim() && selectedFiles.length === 0
                      }
                    >
                      <span className="send-icon">➤</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
