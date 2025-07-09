import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Profile = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/users/profile")
      .then((response) => {
        setProfile(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          setProfile({});
          return;
        }
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
          Your Profile
        </h1>

        {profile && profile.age ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-gray-700 mb-8">
              <div className="font-semibold">Age:</div>
              <div>{profile.age}</div>

              <div className="font-semibold">Weight:</div>
              <div>{profile.weight_kg} kg</div>

              <div className="font-semibold">Height:</div>
              <div>{profile.height_cm} cm</div>

              <div className="font-semibold">Sex:</div>
              <div className="capitalize">{profile.sex}</div>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={() => navigate("/update-profile")}
            >
              Update
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-700 text-center">
              No profile found. Get started:
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={() => navigate("/create-profile")}
            >
              Create Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
