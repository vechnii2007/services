import React, { useRef } from "react";
import {
  LoadScript,
  Autocomplete as GoogleMapsAutocomplete,
} from "@react-google-maps/api";
import TextField from "@mui/material/TextField";

const AddressAutocomplete = ({
  value,
  onChange,
  label = "Адрес",
  name = "address",
  required = false,
  fullWidth = true,
  ...props
}) => {
  const autocompleteRef = useRef(null);

  const onLoad = (autoC) => {
    autocompleteRef.current = autoC;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current && window.google) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        // Создаём event-совместимый объект для универсального handleChange
        onChange({
          target: {
            name,
            value: place.formatted_address,
          },
        });
      }
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
    >
      <GoogleMapsAutocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <TextField
          label={label}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          fullWidth={fullWidth}
          autoComplete="off"
          {...props}
        />
      </GoogleMapsAutocomplete>
    </LoadScript>
  );
};

export default AddressAutocomplete;
