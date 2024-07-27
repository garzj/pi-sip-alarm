import { unstable_usePrompt } from 'react-router-dom';

interface Props {
  dirtyFlag: boolean;
  path: string;
}

export const DirtyFlagWarning: React.FC<Props> = ({ dirtyFlag }) => {
  unstable_usePrompt({
    message: 'You have unsaved changes, are you sure you want to leave?',
    when: ({ currentLocation, nextLocation }) => {
      return nextLocation.pathname !== currentLocation.pathname && dirtyFlag;
    },
  });

  return null;
};
