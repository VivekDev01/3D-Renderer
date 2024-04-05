import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PropTypes from 'prop-types';
import DataTable from './DataTable';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height:"75%",
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};


function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
  

export default function TableModal(props) {
  const [TableModalOpen, setTableModalOpen] = React.useState(false);
  const handleOpen = () => setTableModalOpen(true);
  const handleClose = () => setTableModalOpen(false);

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };



  return (
    <div>
      <Button style={{
        color:"white",
        backgroundColor:"red",
        fontWeight:"bold"
      }} onClick={handleOpen}>Analysis</Button>
      <Modal
        open={TableModalOpen}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="General Volumes and Regions" {...a11yProps(0)} />
                    <Tab label="Tumor Data" {...a11yProps(1)} />
                    <Tab label="Segmentated Liver Data" {...a11yProps(2)} />
                    </Tabs>
                </Box>
                    <CustomTabPanel value={value} index={0}>
                    {props?.jsonFiles && <DataTable data={props.jsonFiles[0]} />}
                    </CustomTabPanel>

                    <CustomTabPanel value={value} index={1}>
                    {props?.jsonFiles && <DataTable data={props.jsonFiles[1]} />}
                    </CustomTabPanel>

                    <CustomTabPanel value={value} index={2}>
                    {props?.jsonFiles && <DataTable data={props.jsonFiles[2]} />}
                    </CustomTabPanel>
            </Box>
        </Box>
      </Modal>
    </div>
  );
}
