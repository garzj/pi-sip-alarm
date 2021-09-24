import { useLocation } from 'react-router-dom';
import './NotFound.css';

export const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div className='not-found big-tab'>
      <h1>404</h1>
      <span>{location.pathname}</span>
      <p>Could not find the resouce you are looking for.</p>
    </div>
  );
};
