import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuth } = useAuth();
  return (
    <div>
      <h1>Welcome {isAuth ? "Back!" : "to our App"}</h1>
      {isAuth ? <p className="break-all">You are logged in!</p> : <p>Please login or register.</p>}
    </div>
  );
};

export default Home;
