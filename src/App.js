import moment from "moment";
import React from 'react';
import './App.css';
import Form from './Form.js';
import ResultsTable from './ResultsTable.js';

// for tabulator
window.moment = moment;
moment.updateLocale('en', {
    week: {
      dow: 1,
    },
});

function App(props) {
    const [loading, setLoading] = React.useState(0);
    const [candidates, setCandidates] = React.useState([]);
    const startLoading = () => setLoading(loading + 1);
    const finishLoading = () => setLoading(loading - 1);
    const addCandidates = (newCandidates) => setCandidates([...candidates, ...newCandidates]);
    const clearCandidates = () => setCandidates([]);
    return (
        <div>
            <Form
                addCandidates={addCandidates}
                clearCandidates={clearCandidates}
                startLoading={startLoading}
                finishLoading={finishLoading}
                loading={loading > 0}
            />
            <Loading id="loading" loading={loading > 0}/>
            <ResultsTable candidates={candidates}/>
        </div>
  );
}

function Loading(props) {
    return <div id={props.id}>{props.loading ? '✈' : ''}</div>;
}

export default App;
