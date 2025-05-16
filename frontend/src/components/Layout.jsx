import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { token, logout } = useAuth();
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/">Home</Link>
        {token ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
};

export default Layout;