import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const ProfileForm = ({ initialData = {}, onSubmit, submitLabel }) => {
  const [formData, setFormData] = useState({
    age: "",
    weight_kg: "",
    height_cm: "",
    sex: "",
    ...initialData,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.age) newErrors.age = "Age is required.";
    else if (isNaN(parseInt(formData.age, 10)))
      newErrors.age = "Age must be a number.";
    if (!formData.weight_kg) newErrors.weight_kg = "Weight is required.";
    else if (isNaN(parseFloat(formData.weight_kg)))
      newErrors.weight_kg = "Weight must be a number.";
    if (!formData.height_cm) newErrors.height_cm = "Height is required.";
    else if (isNaN(parseFloat(formData.height_cm)))
      newErrors.height_cm = "Height must be a number.";
    if (!formData.sex) newErrors.sex = "Please select a sex.";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      age: parseInt(formData.age, 10),
      weight_kg: parseFloat(formData.weight_kg),
      height_cm: parseFloat(formData.height_cm),
      sex: formData.sex,
    };

    onSubmit(payload);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {submitLabel}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Age
            </label>
            <input
              type="number"
              name="age"
              id="age"
              placeholder="Your age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="weight_kg"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight_kg"
              id="weight_kg"
              placeholder="Weight in kg"
              value={formData.weight_kg}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.weight_kg && (
              <p className="text-red-500 text-sm mt-1">{errors.weight_kg}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="height_cm"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Height (cm)
            </label>
            <input
              type="number"
              name="height_cm"
              id="height_cm"
              placeholder="Height in cm"
              value={formData.height_cm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.height_cm && (
              <p className="text-red-500 text-sm mt-1">{errors.height_cm}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sex
            </label>
            <div className="flex items-center space-x-4">
              {["Male", "Female"].map((s) => (
                <label key={s} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="sex"
                    value={s}
                    checked={formData.sex === s}
                    onChange={handleChange}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">{s}</span>
                </label>
              ))}
            </div>
            {errors.sex && (
              <p className="text-red-500 text-sm mt-1">{errors.sex}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

// Create profile page
export const CreateProfileForm = () => {
  const navigate = useNavigate();
  const handleCreate = (payload) => {
    api
      .post("/users/profile", payload)
      .then(() => {
        navigate("/profile");
      })
      .catch((error) => {
        console.error("Error creating profile:", error);
      });
  };

  return <ProfileForm onSubmit={handleCreate} submitLabel="Create Profile" />;
};

// Update profile page
export const UpdateProfileForm = () => {
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    api
      .get("/users/profile")
      .then((response) => {
        const data = response.data;
        setInitialData({
          age: data.age?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          height_cm: data.height_cm?.toString() || "",
          sex: data.sex || "",
        });
      })
      .catch((error) => console.error("Error fetching profile:", error));
  }, []);

  const handleUpdate = (payload) => {
    api
      .put("/users/profile", payload)
      .then(() => {
        navigate("/profile");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
      });
  };

  if (!initialData) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <ProfileForm
      initialData={initialData}
      onSubmit={handleUpdate}
      submitLabel="Update Profile"
    />
  );
};

