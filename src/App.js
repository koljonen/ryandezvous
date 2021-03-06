import React from 'react';
import './App.css';
import Form from './Form.js';
import ResultsTabs from './ResultsTabs.js';
import {
  useQueryParams,
  StringParam,
  DateParam,
  NumberParam,
  BooleanParam,
} from 'use-query-params';


function App(props) {
    const [query, setQuery] = useQueryParams({
        destination: StringParam,
        theirOrigin: StringParam,
        yourOrigin: StringParam,
        departureDate: DateParam,
        returnDate: DateParam,
        departureDateFlexibility: NumberParam,
        returnDateFlexibility: NumberParam,
        max_stopovers: NumberParam,
        expand: StringParam,
        yourFlight: StringParam,
        theirFlight: StringParam,
        sortBy: StringParam,
        yourMaxPrice: NumberParam,
        theirMaxPrice: NumberParam,
        max_fly_duration: NumberParam,
        showAdvancedSettings: BooleanParam,
    });
    const [loading, setLoading] = React.useState(0);
    const [flights, setFlights] = React.useState({});
    const startLoading = () => setLoading(loading + 1);
    const finishLoading = () => setLoading(loading - 1);
    const addFlights = (newFlights) => setFlights({...flights, ...newFlights});
    const clearFlights = () => setFlights([]);
    return (
        <div>
            <Form
                addFlights={addFlights}
                clearFlights={clearFlights}
                startLoading={startLoading}
                finishLoading={finishLoading}
                loading={loading > 0}
                query={query}
                setQuery={setQuery}
            />
            <Loading id="loading" loading={loading > 0}/>
            <ResultsTabs flights={flights} setQuery={setQuery} query={query}/>
        </div>
  );
}

function Loading(props) {
    return <div id={props.id}>{props.loading ? '✈' : ''}</div>;
}

export default App;
