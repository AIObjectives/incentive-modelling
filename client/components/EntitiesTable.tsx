import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";




function transpose(key: string, data: any) {
  const cols = data.map((x: any) => x[key]);
  const raws = Object.keys(data[0]);
  return raws.slice(1).map((raw: any) => {
    const res: any = { label: raw }
    cols.forEach((col: string, i: number) => {
      res[col] = data[i][raw]
    })
    return res
  })
}



const EntitiesTable = (props: any) => {
  const rows = useMemo(() => {
    return transpose('name', props.data.map((x: any) => ({
      "name": x.name,
      "Description": x.description,
      "Wikipedia": x.wikipedia?.description,
      "Stated Goals": x.motives?.stated_goals?.map((x: any) => x.item).join(', '),
      "Main Motivations": x.motives?.main_motivations?.map((x: any) => x.item).join(', '),
      "Possible Actions": x.motives?.possible_actions?.map((x: any) => x.item).join(', '),
      "Good Scenario": x.motives?.good_scenarios?.map((x: any) => x.item).join(', '),
      "Bad Scenario": x.motives?.bad_scenarios?.map((x: any) => x.item).join(', '),
      "Main Fears": x.motives?.main_fears?.map((x: any) => x.item).join(', '),
      "Resources": x.motives?.resources?.map((x: any) => x.item).join(', '),
    })))
  }, [])

  console.log({ rows })

  const [rowData] = useState(rows);

  const [columnDefs] = useState(
    [{
      field: 'label',
      pinned: 'left',
      headerName: '',
      // width: 60,

    },
    ...props.data.map((x: any) => ({
      field: x.name,
      minWidth: 300,
      cellStyle: {
        wordBreak: 'normal',
        whiteSpace: 'normal',
        overflow: 'hidden'
      },
    }))]
  );

  const gridOptions = {
    rowHeight: 20,
    columnDefs: columnDefs,
    rowData: rowData,
    domLayout: 'autoHeight',
    floatingFilters: true,
    autoHeight: true,
    suppressHorizontalScroll: true,
    defaultColDef: {
      flex: 1,
      resizable: true,
      fontSize: 5,
      sortable: true,
      wrapText: true,
      autoHeight: true,
      autoHeaderHeight: true,
      wrapHeaderText: true,
    },
    rowDragManaged: true, // Enable row dragging
  };

  return (
    <div className="ag-theme-alpine text-2xs" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        gridOptions={gridOptions as any}
        rowData={rowData} columnDefs={columnDefs as any} />
    </div>
  );
};


export default EntitiesTable;
