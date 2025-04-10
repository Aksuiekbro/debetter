import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';

// Import the view components
import ScheduleView from './ScheduleView';
import MapView from './MapView';
import AnnouncementsFeedView from './AnnouncementsFeedView'; // The refactored component

// Helper component for TabPanel
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`announcements-tabpanel-${index}`}
      aria-labelledby={`announcements-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}> {/* Add padding top to content panels */}
          {children}
        </Box>
      )}
    </div>
  );
}

// Helper function for accessibility props
function a11yProps(index) {
  return {
    id: `announcements-tab-${index}`,
    'aria-controls': `announcements-tabpanel-${index}`,
  };
}

const AnnouncementsTab = ({ currentUser, tournamentCreatorId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0); // 0: Schedule, 1: Map, 2: Feed

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h5" gutterBottom>{t('announcementsTab.mainTitle')}</Typography>
      <Paper elevation={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label={t('announcementsTab.tabsLabel')}
            variant="fullWidth" // Make tabs take full width
            indicatorColor="primary"
            textColor="primary"
          >
            {/* Use translation keys for labels */}
            <Tab label={t('announcementsTab.scheduleTabLabel')} {...a11yProps(0)} />
            <Tab label={t('announcementsTab.mapTabLabel')} {...a11yProps(1)} />
            <Tab label={t('announcementsTab.feedTabLabel')} {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={activeTab} index={0}>
          <ScheduleView currentUser={currentUser} tournamentCreatorId={tournamentCreatorId} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <MapView currentUser={currentUser} tournamentCreatorId={tournamentCreatorId} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <AnnouncementsFeedView currentUser={currentUser} tournamentCreatorId={tournamentCreatorId} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AnnouncementsTab;