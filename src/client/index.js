// @flow
// Essential for React
import * as React from 'react';
import ReactDOM from 'react-dom';
// API from redux createStore(<reducer>)
import { createStore, applyMiddleware } from 'redux';
// Component from react-redux help share store to all container components
import { Provider } from 'react-redux';
// Import the reducer function with arbitrary name
import rootReducer from './reducers';
// Import thunk
import thunk from 'redux-thunk';
// Import redux logger
import { createLogger } from 'redux-logger';
// Shopify POLARIS UI provider
import { AppProvider } from '@shopify/polaris';
import { Provider as ProviderBridge} from '@shopify/app-bridge-react';
// Router for App deep links
import { BrowserRouter as Router, Route } from 'react-router-dom';
// App root COMPONENT
import App from './components/App';

const middlewares = [ thunk ];
//const middlewares = [ thunk, createLogger() ]; 

const root = document.getElementById("root");

// Root State for App
import { initState } from './initState';

const appStore = createStore(rootReducer, initState, applyMiddleware(...middlewares));

if (root !== null) {

  ReactDOM.render(
    
    <Provider store={ appStore }>
      
      <AppProvider>
        <ProviderBridge config={{
          shopOrigin: window.shopOrigin,
          apiKey: window.apiKey,
          forceRedirect: true,
        }}>
          <Router>
            
            <App />
            
          </Router>
        </ProviderBridge>
        

      </AppProvider>
      
    </Provider> 
    
  , root)
}



