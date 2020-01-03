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

    return (
        <div>
            <Form candidates={candidates} setLoading={setLoading} {...props}/>
            <Loading id="loading" loading={loading}/>
            <ResultsTable candidates={candidates}/>
        </div>
  );
}

function Loading(props) {
    return <div id={props.id}>{props.loading ? '✈' : ''}</div>;
}

export default App;
