import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

const FilterControls = ({
                            searchLabel,
                            searchValue,
                            onSearchChange,
                            selectLabel,
                            selectValue,
                            onSelectChange,
                            selectOptions,
                        }) => {
    const { t } = useTranslation();

    return (
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
            {searchLabel && (
                <TextField
                    label={t(searchLabel)}
                    value={searchValue}
                    onChange={onSearchChange}
                    variant="outlined"
                    sx={{ width: 300 }}
                />
            )}
            {selectLabel && (
                <FormControl sx={{ width: 200 }}>
                    <InputLabel>{t(selectLabel)}</InputLabel>
                    <Select
                        value={selectValue}
                        onChange={onSelectChange}
                        label={t(selectLabel)}
                    >
                        <MenuItem value="">{t('all')}</MenuItem>
                        {selectOptions.map((option, index) => (
                            <MenuItem key={index} value={option.value}>
                                {t(option.label)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
};

export default FilterControls;