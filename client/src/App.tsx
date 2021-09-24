import './App.css';
import { BrowserRouter, NavLink, Route, Switch } from 'react-router-dom';
import { Sip } from './tabs/Sip';
import { Alarms } from './tabs/Alarms';
import { Logs } from './tabs/Logs';
import { NotFound } from './tabs/NotFound';

export const App: React.FC = () => {
  return (
    <div className='app'>
      <BrowserRouter>
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
                    exact={e[0] !== '/alarms'}
                    activeClassName='nav-link-active'
                    to={e[0]}
                  >
                    {e[1]}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <Switch>
            <Route exact={true} path='/' component={Sip} />
            <Route path='/alarms' component={Alarms} />
            <Route exact={true} path='/logs' component={Logs} />
            <Route path='*' component={NotFound} />
          </Switch>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;
