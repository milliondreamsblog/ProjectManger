import { useEffect, useState } from "react";
import "./CreateProject.css";
import axios from "axios";
import { notify } from "../../utils/helper";
import { MdDeleteOutline } from "react-icons/md";

const projectTypeDurations = {
  ISIN: 75,
  "PAN Application Individual": 20,
  "PAN Application Body Corporate": 20,
  "PAN Change": 20,
  TAN: 20,
  DSC: 10,
  "DSC Organisation Base": 10,
  DIN: 7,
  "IEC (Import export Code)": 20,
  "Shops & Establishment": 20,
  "GST registration": 30,
  FRRO: 15,
  "Proffesional Tax Registartion": 30,
  "Change of Fianancial Year": 75,
  Demat: 90,
  "Change in Capital": 45,
  "Change in MOA/AOA": 45,
  "Change in Address": 10,
  "Appointment of MD": 10,
  "Appointment of CS": 10,
  "Appointment of Auditor": 10,
  Incorporation: 100,
  "Preparation of Employess Offer Letter": 10,
  "Working Regulation": 10,
  "ICE GATE REGISTRATION": 10,
  DPT_3: 10,
  "Director KYC": 10,
  FC_2: 10,
  "DIR-6": 5,
  ECB: 30,
  "Authorised Signatory Change": 15,
  "Pan Surrender": 90,
  LEI: 15,
  "Transfer ofshars from Non resident to Non resident": 15,
  Other: 1,
};

const CreateProject = ({ setIsCreateProjectVisible, fetchProject }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);

  const [formData, setFormData] = useState({
    projectId: "",
    projectName: "",
    projectType: "",
    startDate: "",
    endDate: "",
    projectDescription: "",
    status: "Pending",
    assignedTo: [],
    team: "Business Advisory",
    expectedDuration: 0,
    clientName: "",
    projectBudget: "",
  });

  // ✅ Milestone State
  const [milestones, setMilestones] = useState([]);

  const fetchTemplate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "No token found, please login again");
      return;
    }
    try {
      const resp = await axios.get(
        "/api/templates/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTemplates(resp.data);
    } catch (error) {}
  };

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "No token found, please login again");
      return;
    }
    try {
      const resp = await axios.get(
        "/api/clientName/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClients(resp.data.clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchTemplate();
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevState) => {
      const newState = {
        ...prevState,
        [name]: value,
      };

      if (name === "projectType") {
        const selectedTemplate = templates.find(
          (template) => template.projectName === value
        );
        if (selectedTemplate) {
          newState.expectedDuration = selectedTemplate.expectedDuration;
          if (newState.startDate) {
            const startDate = new Date(newState.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(
              startDate.getDate() + selectedTemplate.expectedDuration
            );
            newState.endDate = endDate.toISOString().split("T")[0];
          }
        }
      }

      if (name === "startDate" || name === "expectedDuration") {
        if (newState.startDate && newState.expectedDuration) {
          const startDate = new Date(newState.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(
            startDate.getDate() + parseInt(newState.expectedDuration)
          );
          newState.endDate = endDate.toISOString().split("T")[0];
        }
      }

      return newState;
    });
  };

  // ✅ Milestone Handlers
  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      { id: Date.now(), milestoneName: "", budget: "", dueDate: "" },
    ]);
  };

  const handleMilestoneChange = (id, field, value) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveMilestone = (id) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "No token found, please login again");
      setLoading(false);
      return;
    }

    try {
      const clientName = formData.clientName?.trim();
      if (!clientName) {
        notify("error", "Client name is required.");
        setLoading(false);
        return;
      }

      const normalizedClientName = clientName.toLowerCase();
      const clientExists = clients.some((client) => {
        const existingName = (client.name || client.clientName || "")
          .toLowerCase()
          .trim();
        return existingName === normalizedClientName;
      });

      if (!clientExists) {
        try {
          await axios.post(
            "/api/clientName/create",
            { name: clientName },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          await fetchClients();
        } catch (clientErr) {
          notify(
            "error",
            clientErr.response?.data?.message ||
              "Error creating client. Project not created."
          );
          setLoading(false);
          return;
        }
      }

      // ✅ Prepare payload
      const projectData = {
        ...formData,
        totalBudget: Number(formData.projectBudget),
        milestones: milestones.map((m, index) => ({
          milestoneName: m.milestoneName,
          budget: Number(m.budget),
          dueDate: m.dueDate,
        })),
      };
      projectData.startDate = new Date(projectData.startDate);
      projectData.endDate = new Date(projectData.endDate);

      // ✅ Single API call including milestones
      const response = await axios.post(
        "/api/project/create",
        projectData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      notify("success", response.data.message);
      if (typeof fetchProject === "function") {
        fetchProject();
      }
      setIsCreateProjectVisible(false);
    } catch (error) {
      console.error("❌ Error in create project:", error);
      notify(
        "error",
        error?.response?.data?.message ||
          "Something went wrong while creating the project."
      );
    }

    setLoading(false);
  };

  const handleCloseCreateProjectVisible = () => {
    setIsCreateProjectVisible(false);
  };

  return (
    <div className="create-project-container">
      <div className="create-project-wrapper">
        <h1 className="form-title">Create new project</h1>
        <form onSubmit={handleSubmit} className="project-form">
          {/* ✅ Existing Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="projectName">
                Project name<span className="require">*</span>
              </label>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="team">
                Select a team<span className="require">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  id="team"
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Business Advisory">Business Advisory</option>
                  <option value="Japandesk">Japandesk</option>
                  <option value="Tax Advisory">Tax Advisory</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="projectType">
                Project type<span className="require">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  id="projectType"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Project Type</option>
                  {templates
                    ?.sort((a, b) => a.projectName.localeCompare(b.projectName))
                    ?.map((template, index) => (
                      <option key={index} value={template.projectName}>
                        {template.projectName}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="expectedDuration">Expected Duration (days)</label>
              <input
                type="number"
                id="expectedDuration"
                name="expectedDuration"
                value={formData.expectedDuration}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">
                Start Date<span className="require">*</span>
              </label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  placeholder="DD/MM/YYYY"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  placeholder="DD/MM/YYYY"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Client name combo box */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientName">
                Client Name<span className="require">*</span>
              </label>
              <div className="select-wrappers">
                <input
                  list="client-options"
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Type or select client"
                  required
                />
                <datalist id="client-options">
                  {clients
                    ?.sort((a, b) => a.name.localeCompare(b.name))
                    .map((client) => (
                      <option key={client._id} value={client.name} />
                    ))}
                </datalist>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="projectBudget">
                Total Budget<span className="require">*</span>
              </label>
              <div className="project-budget-input">
                <input
                  type="number"
                  id="projectBudget"
                  name="projectBudget"
                  value={formData.projectBudget}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter budget amount"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="projectDescription">Project Description</label>
            <textarea
              id="projectDescription"
              name="projectDescription"
              placeholder="Please share your main reason..."
              value={formData.projectDescription}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>

          {/* ✅ Milestone Section */}
          <div>
            <div className="milestone-slide-panel">
              {milestones.map((milestone, index) => (
                <div className="milestone-container" key={milestone.id}>
                  <div className="milestone-header">
                    <span className="milestone-badge">
                      Milestone {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(milestone.id)}
                      className="delete-btn"
                    >
                      <MdDeleteOutline size={22} />
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Milestone Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestone.milestoneName}
                        onChange={(e) =>
                          handleMilestoneChange(
                            milestone.id,
                            "milestoneName",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Budget Allocation</label>
                      <input
                        type="number"
                        className="form-input"
                        value={milestone.budget}
                        onChange={(e) =>
                          handleMilestoneChange(
                            milestone.id,
                            "budget",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group due-date">
                    <label>Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={milestone.dueDate}
                      onChange={(e) =>
                        handleMilestoneChange(
                          milestone.id,
                          "dueDate",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="add-milestone-button">
              <button
                type="button"
                onClick={handleAddMilestone}
                className="btn-link"
              >
                + Add Milestone
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              Create project
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCloseCreateProjectVisible}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
