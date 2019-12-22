import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import throttle from 'lodash/throttle';

const useStyles = makeStyles(theme => ({
    icon: {
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(2),
    },
}));

export default function AirportSelector(props) {
    const classes = useStyles();
    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState([]);
    const loaded = React.useRef(false);
    const label = props.label;
    loaded.current = true;

    const handleSearch = (event, value) => {
        setInputValue(event.target.value);
    };

    const handleChange = (event, value) => {
        props.onChange({
            target:{
                name: props.name,
                value: value
            }
        });
    }

    const ourFetch = React.useMemo(
        () =>
            throttle(
                async function(input, callback) {
                    const locationJson = await fetch('https://kiwiproxy.herokuapp.com//locations/query?term=' + input.input);
                    const locations = await locationJson.json();
                    callback(locations.locations.map(location => Object.assign(location, {'input': input.input})));
                },
                200
            ),
        [],
    );

    React.useEffect(() => {
        let active = true;

        if (inputValue === '') {
            setOptions([]); 
            return undefined;
        }

        ourFetch({ input: inputValue }, results => {
            if (active) {
                setOptions(results || []);
            }
        });

        return () => {
            active = false;
        };
    }, [inputValue, ourFetch]);

    return (
        <Autocomplete
            style={{ width: "240px" }}
            getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
            filterOptions={x => x}
            options={options}
            defaultvalue={options.value}
            onChange={handleChange}
            renderInput={params => (
                <TextField
                    {...params}
                    label={label}
                    variant="outlined"
                    fullWidth
                    autoHighlight={true}
                    onChange={handleSearch}
                />
            )}
            renderOption={option => {
                const parts = parse(
                    option.name,
                    match(option.name, option.input)
                );

                return (
                    <Grid container alignItems="center">
                        <Grid item>
                            <LocationOnIcon className={classes.icon} />
                        </Grid>
                        <Grid item xs>
                            {parts.map((part, index) => (
                                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                                    {part.text}
                                </span>
                            ))}

                            <Typography variant="body2" color="textSecondary">
                                {option.name}
                            </Typography>
                        </Grid>
                    </Grid>
                );
            }}
        />
    );
}