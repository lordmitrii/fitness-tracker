import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/users/profile")
      .then((response) => {
        setProfile(response.data);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        setProfile({});
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-gray-100 py-12">
      <div className="w-full max-w-md bg-white rounded shadow p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Your profile:</h2>
        {profile ? (
          profile.age ? (
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-semibold">Age:</span> {profile.age}
              </p>
              <p>
                <span className="font-semibold">Weight:</span> {profile.weight_kg}
              </p>
              <p>
                <span className="font-semibold">Height:</span> {profile.height_cm}
              </p>
              <p>
                <span className="font-semibold">Gender:</span> {profile.gender}
              </p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                onClick={() => {
                  navigate("/update-profile");
                }}
              >
                Update
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start space-y-4">
              <p className="text-gray-700">Profile not found. Try creating it:</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                onClick={() => {
                  navigate("/create-profile");
                }}
              >
                Create
              </button>
            </div>
          )
        ) : (
          <p className="text-gray-500">Loading profile...</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
