import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FormControl, Select, MenuItem } from '@mui/material';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Update local state if i18n language changes elsewhere
  useEffect(() => {
    setCurrentLanguage(i18n.language.split('-')[0]); // Handle cases like 'en-US'
  }, [i18n.language]);

  const handleChange = (event) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
    setCurrentLanguage(newLang); // Update local state immediately
  };

  // Define language options
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'kz', name: 'Қазақша' },
  ];

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={currentLanguage}
        onChange={handleChange}
        displayEmpty
        inputProps={{ 'aria-label': 'Select language' }}
        sx={{
          color: 'inherit', // Inherit color from parent (e.g., Navbar)
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.23)', // Adjust border color for visibility if needed
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)', // Adjust hover border color
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.8)', // Adjust focused border color
          },
          '& .MuiSelect-icon': {
            color: 'inherit', // Inherit icon color
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;