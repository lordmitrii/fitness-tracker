import { useEffect, useState } from "react";
import api from "../api";


const Profile = () => {
  const [profile, setProfile] = useState(null);
  console.log(localStorage.getItem("token"));

  useEffect(() => {
    api.get("/users/profile")
      .then(response => {
        setProfile(response.data);
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
      });
  }, []);

  return (
    <div>
        <h2>Your profile:</h2>
        {profile ? (
          <div>
            <p>Age: {profile.age}</p>
            <p>Weight: {profile.weight_kg}</p>
            <p>Height: {profile.height_cm}</p>
            <p>Gender: {profile.gender}</p>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      
      </div>
  );
};

export default Profile;