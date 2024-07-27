import * as express from 'express';
import { existsSync } from 'fs';
import { exists, reactBuildPath, reactIndexPath } from '../config/paths';

export const reactRouter = express.Router();

// Check react app existance
if (process.env.NODE_ENV !== 'development' && !existsSync(reactBuildPath)) {
  console.log(`The path to the react app could not be resolved:
    ${reactBuildPath}

    Did you run "yarn build" on the client?`);
}

// Serve react app
reactRouter.use(express.static(reactBuildPath));
reactRouter.use(async (req, res, next) => {
  if (!(await exists(reactIndexPath))) return next();
  res.sendFile(reactIndexPath);
});

// 404
reactRouter.use((req, res) => {
  res.status(404).send(`
    <h1>404</h1>
    <p>Couldn't load the react application.</p>
    <p>Did you run <code style="background: whitesmoke">yarn build</code> on the client?</p>
  `);
});
