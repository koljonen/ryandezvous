import React from 'react';
import ReactDOM from 'react-dom'
import './index.css'
import { Route, HashRouter as Router } from 'react-router-dom'
import { QueryParamProvider } from 'use-query-params';
import App from './App'

const routing = (
<Router>
    <QueryParamProvider ReactRouterRoute={Route}>
        <App />
    </QueryParamProvider>
</Router>
)

ReactDOM.render(routing, document.getElementById('root'))
