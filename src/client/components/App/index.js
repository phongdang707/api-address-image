// @flow
import * as React from 'react';
// Main container for Redux map root STATE/DISPATCH to App PROPS
import MainContainer from '../../containers/MainContainer';
import { hot } from 'react-hot-loader';

type Props = {}; 

type State = {};

class App extends React.Component<Props, State> { 
  
  componentDidMount() {
  }

  render() {
    return (
      <div className='app-container'>
        <MainContainer />    
      </div>
    );
  }
}

export default hot(module)(App)
