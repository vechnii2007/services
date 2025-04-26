import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
} from "@mui/material";

const GenericTable = ({
  headers,
  rows,
  renderRow,
  page = 0,
  rowsPerPage = 10,
  count = 0,
  onPageChange = null,
  onRowsPerPageChange = null,
  isPaginationEnabled = false,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header, index) => (
              <TableCell key={index}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{rows.map((row, index) => renderRow(row, index))}</TableBody>
      </Table>

      {isPaginationEnabled && (
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}
    </TableContainer>
  );
};

export default GenericTable;
