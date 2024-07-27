import './App.css';
import {
  createBrowserRouter,
  NavLink,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { Sip } from './tabs/Sip';
import { Alarms } from './tabs/Alarms';
import { Logs } from './tabs/Logs';
import { NotFound } from './tabs/NotFound';

const BaseLayout: React.FC = () => {
  return (
    <>
      <header>
        <h1>PI SIP Alarm</h1>
      </header>

      <main>
        <nav>
          <ul>
            {Object.entries({
              '/': 'SIP',
              '/alarms': 'Alarms',
              '/logs': 'Logs',
            }).map((e) => (
              <li key={e[0]}>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? 'nav-link-active' : ''
                  }
                  to={e[0]}
                >
                  {e[1]}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <Outlet />
      </main>
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        element: <Sip />,
      },
      {
        path: '/alarms/*',
        element: <Alarms />,
      },
      {
        path: '/logs',
        element: <Logs />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export const App: React.FC = () => {
  return (
    <div className='app'>
      <RouterProvider router={router} />
    </div>
  );
};

export default App;
