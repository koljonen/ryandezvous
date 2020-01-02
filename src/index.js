import React from 'react';
import ReactDOM from 'react-dom'
import './index.css'
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom'
import App from './App'

const routing = (
  <Router>
    <div>
        <Switch>
            <Route exact path="/:myAirport/:herAirport/:departureDate/:returnDate" component={App} />
            <Route exact path="/:myAirport/:herAirport/:departureDate/:returnDate/:destinationAirport" component={App} />
            <Route exact path="/" component={App} />
        </Switch>
    </div>
  </Router>
)

ReactDOM.render(routing, document.getElementById('root'))
