import React, { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient.js";
// import { callGeminiApi } from '../utils/geminiApi.js'; // Import the new utility
import { fetchWithRetry } from "../utils/api.js";
import {
  User,
  Camera,
  Loader2,
  Plus,
  X,
  Save,
  Edit,
  Ban,
  Target,
  BookOpen,
  Star,
  Sparkles,
} from "lucide-react";

const initialProfileState = {
  profile_picture_url: "",
  full_name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  career_goals: "",
  current_role: "",
  experience_level: "entry",
  industry: "",
  skills: [],
  certifications: [],
  education_degree: "",
  education_field: "",
  education_university: "",
  education_graduation_year: null,
  preferred_learning_style: "visual",
  availability_hours_per_week: null,
};

const Badge = ({ label, color, onRemove, isEditing = false }) => {
  const colorClasses = {
    emerald: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    blue: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${colorClasses[color]}`}
    >
      {label}
      {isEditing && (
        <button
          onClick={onRemove}
          className="ml-2 text-emerald-300 hover:text-white"
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// --- VIEW MODE COMPONENT ---
const ProfileView = ({ formData, onEdit, completeness }) => {
  const InfoCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg h-full">
      <h3 className="font-bold text-lg mb-4 border-b border-white/10 pb-2 flex items-center gap-2 text-white">
        <Icon className="w-5 h-5 text-emerald-400" /> {title}
      </h3>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  );
  const InfoItem = ({ label, value }) =>
    value ? (
      <p className="text-gray-300">
        <span className="font-semibold text-white">{label}:</span> {value}
      </p>
    ) : null;

  return (
    <div className="space-y-8">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-gray-700"
              strokeWidth="3"
              fill="none"
              stroke="currentColor"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-500"
              strokeWidth="3"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${completeness.percentage}, 100`}
              strokeLinecap="round"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-400">
              {completeness.percentage}%
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">Profile Completeness</h2>
          <p className="text-gray-400 text-sm mt-1">
            A complete profile helps our AI give you the best recommendations.
          </p>
        </div>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          <Edit className="w-4 h-4" />{" "}
          {completeness.percentage < 100
            ? "Complete Your Profile"
            : "Edit Profile"}
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col items-center gap-4 text-center">
        <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-white/10 shadow-lg">
          {formData.profile_picture_url ? (
            <img
              src={formData.profile_picture_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-gray-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-white">
          {formData.full_name || "Your Name"}
        </h2>
        <p className="text-gray-400">{formData.current_role || "Your Role"}</p>
      </div>

      <InfoCard title="Career & Learning Goals" icon={Target}>
        <InfoItem label="Career Goal" value={formData.career_goals} />
        <InfoItem label="Target Industry" value={formData.industry} />
        <InfoItem label="Experience Level" value={formData.experience_level} />
        <InfoItem
          label="Weekly Learning Hours"
          value={formData.availability_hours_per_week}
        />
        <InfoItem
          label="Preferred Learning Style"
          value={formData.preferred_learning_style}
        />
      </InfoCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InfoCard title="Education" icon={BookOpen}>
          <InfoItem
            label="Degree"
            value={`${formData.education_degree || ""} in ${
              formData.education_field || ""
            }`}
          />
          <InfoItem
            label="University"
            value={`${formData.education_university || ""} (${
              formData.education_graduation_year || ""
            })`}
          />
        </InfoCard>
        <InfoCard title="Skills & Certifications" icon={Star}>
          <div>
            <h4 className="font-semibold text-white mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.length > 0 ? (
                formData.skills.map((skill) => (
                  <Badge key={skill} label={skill} color="emerald" />
                ))
              ) : (
                <p className="text-gray-500 text-xs">No skills added yet.</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold text-white mb-2">Certifications</h4>
            <div className="flex flex-wrap gap-2">
              {formData.certifications?.length > 0 ? (
                formData.certifications.map((cert) => (
                  <Badge key={cert} label={cert} color="blue" />
                ))
              ) : (
                <p className="text-gray-500 text-xs">
                  No certifications added yet.
                </p>
              )}
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
};

// --- EDIT MODE COMPONENT ---
const ProfileEditForm = ({
  formData,
  setFormData,
  handleSave,
  saving,
  uploading,
  handlePictureUpload,
  onCancel,
  newSkill,
  setNewSkill,
  newCert,
  setNewCert,
  handleAISuggestion,
  isSuggesting,
}) => {
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { id, value, type } = e.target;
    const finalValue = type === "number" ? parseInt(value, 10) || null : value;
    setFormData((prev) => ({ ...prev, [id]: finalValue }));
  };

  const addTag = (type, value, setValue) => {
    const list = formData[type] || [];
    if (value.trim() && !list.includes(value.trim())) {
      setFormData((prev) => ({ ...prev, [type]: [...list, value.trim()] }));
      setValue("");
    }
  };

  const removeTag = (type, tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((tag) => tag !== tagToRemove),
    }));
  };

  const FormCard = ({ title, children }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );

  const FormItem = ({ label, id, children }) => (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium block mb-2 text-gray-300"
      >
        {label}
      </label>
      {children}
    </div>
  );

  const FormInput = ({ id, ...props }) => (
    <input
      id={id}
      {...props}
      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    />
  );

  const FormSelect = ({ id, value, onChange, children }) => (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    >
      {children}
    </select>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <FormCard title="Profile Picture">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-white/10 shadow-lg">
                {formData.profile_picture_url ? (
                  <img
                    src={formData.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-600" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePictureUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="w-full inline-flex items-center justify-center rounded-lg font-semibold text-sm px-4 py-2 border border-gray-600 bg-gray-700/50 hover:bg-gray-700 text-white"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" /> Change Picture
                  </>
                )}
              </button>
            </div>
          </FormCard>
        </div>
        <div className="md:col-span-2">
          <FormCard title="Personal & Contact Info">
            <FormItem label="Full Name" id="full_name">
              <FormInput
                id="full_name"
                value={formData.full_name || ""}
                onChange={handleInputChange}
              />
            </FormItem>
            <FormItem label="Email" id="email">
              <FormInput
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange}
              />
            </FormItem>
            <FormItem label="Phone" id="phone">
              <FormInput
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={handleInputChange}
              />
            </FormItem>
            <FormItem label="Location" id="location">
              <FormInput
                id="location"
                value={formData.location || ""}
                onChange={handleInputChange}
              />
            </FormItem>
            <FormItem label="LinkedIn Profile URL" id="linkedin">
              <FormInput
                id="linkedin"
                value={formData.linkedin || ""}
                onChange={handleInputChange}
              />
            </FormItem>
          </FormCard>
        </div>
      </div>

      <FormCard title="Career & Learning Goals">
        <FormItem label="Current Role" id="current_role">
          <FormInput
            id="current_role"
            value={formData.current_role || ""}
            onChange={handleInputChange}
          />
        </FormItem>
        <FormItem label="Target Industry" id="industry">
          <FormInput
            id="industry"
            value={formData.industry || ""}
            onChange={handleInputChange}
          />
        </FormItem>
        <FormItem label="Experience Level" id="experience_level">
          <FormSelect
            id="experience_level"
            value={formData.experience_level || "entry"}
            onChange={handleInputChange}
          >
            <option value="entry">Entry</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid-Level</option>
            <option value="senior">Senior</option>
            <option value="executive">Executive</option>
          </FormSelect>
        </FormItem>
        <FormItem label="Career Goals" id="career_goals">
          <div className="relative">
            <textarea
              id="career_goals"
              value={formData.career_goals || ""}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-28"
              rows="4"
            ></textarea>
            <button
              onClick={handleAISuggestion}
              disabled={isSuggesting}
              className="absolute top-2 right-2 inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full hover:bg-purple-500/30"
            >
              {isSuggesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}{" "}
              AI Suggest
            </button>
          </div>
        </FormItem>
        <FormItem
          label="Weekly Hours for Learning"
          id="availability_hours_per_week"
        >
          <FormInput
            id="availability_hours_per_week"
            type="number"
            value={formData.availability_hours_per_week || ""}
            onChange={handleInputChange}
          />
        </FormItem>
        <FormItem
          label="Preferred Learning Style"
          id="preferred_learning_style"
        >
          <FormSelect
            id="preferred_learning_style"
            value={formData.preferred_learning_style || "visual"}
            onChange={handleInputChange}
          >
            <option value="visual">Visual</option>
            <option value="auditory">Auditory</option>
            <option value="reading">Reading</option>
            <option value="kinesthetic">Kinesthetic</option>
          </FormSelect>
        </FormItem>
      </FormCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormCard title="Education">
          <FormItem label="Degree" id="education_degree">
            <FormInput
              id="education_degree"
              value={formData.education_degree || ""}
              onChange={handleInputChange}
            />
          </FormItem>
          <FormItem label="Field of Study" id="education_field">
            <FormInput
              id="education_field"
              value={formData.education_field || ""}
              onChange={handleInputChange}
            />
          </FormItem>
          <FormItem label="University" id="education_university">
            <FormInput
              id="education_university"
              value={formData.education_university || ""}
              onChange={handleInputChange}
            />
          </FormItem>
          <FormItem label="Graduation Year" id="education_graduation_year">
            <FormInput
              id="education_graduation_year"
              type="number"
              value={formData.education_graduation_year || ""}
              onChange={handleInputChange}
            />
          </FormItem>
        </FormCard>
        <FormCard title="Skills & Certifications">
          <FormItem label="Skills" id="skills">
            <div className="flex gap-2">
              <FormInput
                id="new-skill-input"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && addTag("skills", newSkill, setNewSkill)
                }
                placeholder="Add a skill..."
              />
              <button
                onClick={() => addTag("skills", newSkill, setNewSkill)}
                className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 min-h-[2.5rem]">
              {formData.skills &&
                formData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    label={skill}
                    color="emerald"
                    onRemove={() => removeTag("skills", skill)}
                    isEditing={true}
                  />
                ))}
            </div>
          </FormItem>
          <FormItem label="Certifications" id="certs">
            <div className="flex gap-2">
              <FormInput
                id="new-cert-input"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  addTag("certifications", newCert, setNewCert)
                }
                placeholder="Add a certification..."
              />
              <button
                onClick={() => addTag("certifications", newCert, setNewCert)}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 min-h-[2.5rem]">
              {formData.certifications &&
                formData.certifications.map((cert) => (
                  <Badge
                    key={cert}
                    label={cert}
                    color="blue"
                    onRemove={() => removeTag("certifications", cert)}
                    isEditing={true}
                  />
                ))}
            </div>
          </FormItem>
        </FormCard>
      </div>

      <div className="flex justify-end pt-6 gap-4">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold inline-flex items-center justify-center rounded-lg text-base px-6 py-3"
        >
          <Ban className="w-5 h-5 mr-2" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center justify-center rounded-lg text-base px-6 py-3 disabled:bg-gray-600"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// --- MAIN PROFILE COMPONENT ---
export default function Profile() {
  const [formData, setFormData] = useState(initialProfileState);
  const [originalData, setOriginalData] = useState(initialProfileState);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);

  const completeness = useMemo(() => {
    const fields = [
      "full_name",
      "email",
      "phone",
      "location",
      "linkedin",
      "career_goals",
      "current_role",
      "experience_level",
      "industry",
      "education_degree",
      "education_field",
      "education_university",
      "education_graduation_year",
    ];
    let filledFields = fields.filter((field) => !!formData[field]).length;
    if (formData.skills?.length > 0) filledFields++;
    if (formData.certifications?.length > 0) filledFields++;
    const totalFields = fields.length + 2;
    const percentage = Math.round((filledFields / totalFields) * 100);
    return { percentage };
  }, [formData]);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
        } else if (data) {
          const profileData = {
            ...initialProfileState,
            ...data,
            skills: data.skills || [],
            certifications: data.certifications || [],
          };
          setFormData(profileData);
          setOriginalData(profileData);
          setIsEditing(false);
        } else {
          const newUserData = {
            ...initialProfileState,
            full_name: user.user_metadata?.full_name || "",
            email: user.email,
            profile_picture_url: user.user_metadata?.avatar_url || "",
          };
          setFormData(newUserData);
          setOriginalData(newUserData);
          setIsEditing(true);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in.");

    const { error } = await supabase
      .from("profiles")
      .upsert({ ...formData, id: user.id, updated_at: new Date() });
    if (error) {
      alert("Failed to save profile.");
    } else {
      alert("Profile saved successfully!");
      setOriginalData(formData);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}`;
    try {
      await supabase.storage.from("profile-pictures").upload(filePath, file);
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          profile_picture_url: publicUrl,
          avatar_url: publicUrl,
        });

      window.location.reload();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload image. Check storage policies.");
    } finally {
      setUploading(false);
    }
  };

  const handleAISuggestion = async () => {
    setIsSuggesting(true);
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const prompt = `Based on a user with the role "${
      formData.current_role || "student"
    }" and skills like "${formData.skills?.join(
      ", "
    )}", write one or two concise, impactful career goal statements. The tone should be ambitious but professional.`;
    try {
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const suggestion = data.candidates[0].content.parts[0].text;
      setFormData((prev) => ({ ...prev, career_goals: suggestion.trim() }));
    } catch (error) {
      console.error("AI Suggestion error:", error);
      alert(
        "Failed to get AI suggestion. Please ensure your API key is set up correctly."
      );
    } finally {
      setIsSuggesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Your Career Profile</h1>
          <p className="text-gray-400">
            This data powers your personalized AI experience.
          </p>
        </div>
      </div>

      {isEditing ? (
        <ProfileEditForm
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSave}
          saving={saving}
          uploading={uploading}
          handlePictureUpload={handlePictureUpload}
          onCancel={handleCancel}
          newSkill={newSkill}
          setNewSkill={setNewSkill}
          newCert={newCert}
          setNewCert={setNewCert}
          handleAISuggestion={handleAISuggestion}
          isSuggesting={isSuggesting}
        />
      ) : (
        <ProfileView
          formData={formData}
          onEdit={() => setIsEditing(true)}
          completeness={completeness}
        />
      )}
    </div>
  );
}
