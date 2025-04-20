import React, { memo } from 'react';
import { Typography, Box, Tooltip } from '@mui/material';
import { formatDate, formatPrice } from '../../utils/formatters';
import PropTypes from 'prop-types';

const OfferInfo = memo(({ title, description, price, location, createdAt }) => (
  <Box>
    <Tooltip title={title} enterDelay={700}>
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.2,
          mb: 0.5,
          cursor: 'default',
        }}
      >
        {title}
      </Typography>
    </Tooltip>
    <Tooltip title={description} enterDelay={700}>
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          mb: 1,
          minHeight: '32px',
          lineHeight: 1.2,
          cursor: 'default',
        }}
      >
        {description}
      </Typography>
    </Tooltip>
    <Typography 
      variant="h6" 
      color="primary" 
      sx={{ 
        mb: 1,
        fontSize: '1.1rem',
        fontWeight: 'bold'
      }}
    >
      {formatPrice(price)}
    </Typography>
    {location && (
      <Tooltip title={location} enterDelay={700}>
        <Typography 
          variant="body2" 
          color="textSecondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'default',
          }}
        >
          {location}
        </Typography>
      </Tooltip>
    )}
    <Typography 
      variant="body2" 
      color="textSecondary" 
      sx={{ 
        mt: 0.5,
        fontSize: '0.75rem'
      }}
    >
      {formatDate(createdAt)}
    </Typography>
  </Box>
));

OfferInfo.displayName = 'OfferInfo';

OfferInfo.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  location: PropTypes.string,
  createdAt: PropTypes.string.isRequired,
};

export default OfferInfo; 