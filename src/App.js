import moment from "moment";
import React from 'react';
import './App.css';
import Form from './Form.js';
import ResultsTable from './ResultsTable.js';
import {
  useQueryParams,
  StringParam,
  DateParam,
  NumberParam,
} from 'use-query-params';

// for tabulator
window.moment = moment;
moment.updateLocale('en', {
    week: {
      dow: 1,
    },
});

function App(props) {
    const [query, setQuery] = useQueryParams({
        destination: StringParam,
        theirOrigin: StringParam,
        yourOrigin: StringParam,
        departureDate: DateParam,
        returnDate: DateParam,
        dateFlexibility: NumberParam,
        max_stopovers: NumberParam,
        expand: StringParam,
        yourFlight: StringParam,
        theirFlight: StringParam,
    });
    const [loading, setLoading] = React.useState(0);
    const [candidates, setCandidates] = React.useState({});
    const startLoading = () => setLoading(loading + 1);
    const finishLoading = () => setLoading(loading - 1);
    const addCandidates = (newCandidates) => setCandidates({...candidates, ...newCandidates});
    const clearCandidates = () => setCandidates([]);
    return (
        <div>
            <Form
                addCandidates={addCandidates}
                clearCandidates={clearCandidates}
                startLoading={startLoading}
                finishLoading={finishLoading}
                loading={loading > 0}
                query={query}
                setQuery={setQuery}
            />
            <Loading id="loading" loading={loading > 0}/>
            <ResultsTable candidates={candidates} setQuery={setQuery} query={query}/>
        </div>
  );
}

function Loading(props) {
    return <div id={props.id}>{props.loading ? '✈' : ''}</div>;
}

export default App;
