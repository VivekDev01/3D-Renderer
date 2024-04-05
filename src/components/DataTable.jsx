import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';    
import "../Uploads.css"

const DataTable = ({ data }) => {
    data = JSON.parse(data);
    return (
      <TableContainer className='table-container' component={Paper}>
        <Table>
          <TableHead className='table-head'>
            <TableRow>
              {Object.keys(data[0]).map((key, index) => (
                <TableCell key={index}>{key}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {Object.values(row).map((value, colIndex) => (
                  <TableCell key={colIndex}>{value}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  export default DataTable;