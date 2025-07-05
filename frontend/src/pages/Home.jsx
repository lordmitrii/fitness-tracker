import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuth } = useAuth();
  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-gray-100 py-12">
      <h1>Welcome {isAuth ? "Back!" : "to our App"}</h1>
      {isAuth ? <p className="break-all">You are logged in!</p> : <p>Please login or register.</p>}
    </div>
  );
};

export default Home;
