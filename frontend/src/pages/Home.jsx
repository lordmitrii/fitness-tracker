import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { token } = useAuth();
  return (
    <div>
      <h1>Welcome {token ? 'Back!' : 'to our App'}</h1>
      {token ? <p>Your token: {token}</p> : <p>Please login or register.</p>}
    </div>
  );
};

export default Home;
