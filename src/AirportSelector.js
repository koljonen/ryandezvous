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

async function locationSearch(searchString) {
    const locationJson = await fetch('https://kiwiproxy.herokuapp.com//locations/query?term=' + searchString);
    const locations = await locationJson.json();
    return locations.locations.map(location => Object.assign(location, {'input': searchString}))
}

export default function AirportSelector(props) {
    const classes = useStyles();
    const [inputValue, setInputValue] = React.useState('');
    const [value, setValue] = React.useState('');
    const [options, setOptions] = React.useState([]);
    const [fetchedDefault, setFetchedDefault] = React.useState(false);

    const handleSearch = (event, value) => {
        setInputValue(event.target.value);
    };

    const handleChange = (event, value) => {
        setValue(value);
        props.onChange({
            target:{
                name: props.name,
                value: value
            }
        });
    }

    const ourFetch = React.useMemo(
        () => throttle(
            async function(input, callback) {
                const locations = await locationSearch(input);
                callback(locations);
            },
            200
        ),
        [],
    );

    React.useEffect(
        () => {
            let active = true;
            if(!fetchedDefault) {
                setFetchedDefault(true);
                if(props.value && props.value.id) {
                    const mjau = async() => {
                        const locations = await locationSearch(props.value.name);
                        setOptions(locations);
                        const selectedLocation = locations.filter(x => x.id === props.value.id)[0];
                        setValue(selectedLocation);
                    };
                    mjau();
                    return;
                }
                else if(!props.required) {
                    setValue({name:"Anywhere"});
                }
            }

            else if (inputValue === '') {
                setOptions([]);
                return undefined;
            }
            ourFetch(
                inputValue,
                results => {
                    if (active) {
                        setOptions(results || []);
                    }
                }
            );

            return () => {
                active = false;
            };
        },
        [inputValue, ourFetch]
    );

    return (
        <Autocomplete
            style={{ width: "240px" }}
            getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
            filterOptions={x => x}
            options={options}
            onChange={handleChange}
            value={value}
            renderInput={params => (
                <TextField
                    required={props.required}
                    {...params}
                    label={props.label}
                    variant="outlined"
                    fullWidth
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
