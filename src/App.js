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
})

const candidates = [];

function App(props) {
    const [loading, setLoading] = React.useState(false);
    const [candidates, setCandidates] = React.useState([]);
    const addCandidates = (newCandidates) => setCandidates([...candidates, ...newCandidates]);
    const clearCandidates = () => setCandidates([]);
    return (
        <div>
            <Form
                addCandidates={addCandidates}
                clearCandidates={clearCandidates}
                setLoading={setLoading}
                {...props}
            />
            <Loading id="loading" loading={loading}/>
            <ResultsTable candidates={candidates}/>
        </div>
  );
}

function Loading(props) {
    return <div id={props.id}>{props.loading ? '✈' : ''}</div>;
}

export default App;
