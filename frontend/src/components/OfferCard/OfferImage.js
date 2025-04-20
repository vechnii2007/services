import React, { useState } from 'react';
import { CardMedia } from '@mui/material';
import PropTypes from 'prop-types';

const PLACEHOLDER_IMAGE = 'https://placehold.co/150x150?text=offer';

const OfferImage = ({ image, title }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  return (
    <CardMedia
      component="img"
      height="200"
      image={hasError || !image ? PLACEHOLDER_IMAGE : image}
      alt={title}
      onError={handleError}
      sx={{ 
        objectFit: 'cover',
        backgroundColor: 'grey.100',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
      }}
    />
  );
};

OfferImage.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default OfferImage; 