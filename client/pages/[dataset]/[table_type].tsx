import { useState } from "react";

export async function getStaticPaths() {
  const fs = require('fs');
  const datasets = fs.readdirSync('../datasets/')
  const paths: any = []
  datasets.forEach((name: string) => {
    const folder = `../datasets/${name}/outputs`
    fs.readdirSync(folder)
      .filter((file: any) => file.startsWith(`table_`))
      .forEach((file: any) => {
        paths.push({
          params: {
            dataset: name,
            table_type: file.replace('table_', '').replace('.json', '')
          }
        })
      })
  })
  return {
    paths, fallback: false
  }
};

export async function getStaticProps({ params }: any) {
  const fs = require('fs');
  const file = `../datasets/${params.dataset}/outputs/table_${params.table_type}.json`
  const table_data = JSON.parse(fs.readFileSync(file, 'utf8'))
  return { props: { ...params, table_data } };
}

const Table = ({ table_type, table_data }: any) => {
  const { columns, rows, cells } = table_data
  const [openCell, setOpenCell] = useState(null)
  return (
    <table>
      <thead>
        <tr>
          <th key={0} className="text-sm bg-slate-100 sticky left-0 top-0 border p-2 z-20 ">
            {table_type}</th>
          {columns.map(({ id, name }: any) => (
            <th key={id} className="text-sm bg-slate-100 sticky top-0 border p-2 z-10">
              {name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ id, name, representativeItem }: any) => (
          <tr key={id}>
            <td className="odd:bg-slate-50 border p-2 align-top min-w-[400px] left-0 sticky">
              {name}
              {representativeItem &&
                <div className="text-xs text-gray-500 italic">e.g. {representativeItem}</div>}
            </td>
            {columns.map((col: any) => (
              <td key={col.id} className="odd:bg-slate-50 border p-2 align-top">
                <Cell row={name} id={id + '_' + col.id} cell_data={cells[id + '_' + col.id]} openCell={openCell} setOpenCell={setOpenCell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const deduplicateItems = (arr: any) => {
  const seen: any = {}
  const result: any = []
  arr.forEach((x: any) => {
    const { item, src_id, quote } = x
    const key = item + src_id + quote
    if (!seen[key]) {
      seen[key] = true
      result.push(x)
    }
  })
  return result
}

const Cell = ({ id, row, cell_data, openCell, setOpenCell }: any) => {
  const expand = openCell === id
  const items = deduplicateItems(cell_data || [])
  if (items.length === 0) return <div className="w-min-[100px]" />
  return <div style={expand ? { minWidth: '400px' } : {}}>
    {!expand && <button onClick={() => setOpenCell(expand ? null : id)}
      className="w-full text-center hover:bg-slate-300">
      {Array(items.length).fill('\u2022').map((bullet, index) => (
        <span className="text-xl" key={index}>{bullet}</span>
      ))}
    </button>}
    {expand &&
      <>
        {/* <div className="bg-slate-800 text-white text-center py-1 text-xs text-gray-600">{row}</div> */}
        {items.map((item: any, i: number) => <CellItem {...{ ...item, index: i }} />)}
        <button className="mt-0 w-full text-center text-gray-200 hover:text-gray-500 italic text-sm "
          onClick={() => setOpenCell(null)}>collapse</button>
      </>
    }
  </div>
}

const CellItem = ({ index, src_id, item, quote }: any) => {
  const [showQuote, setShowQuote] = useState(false)
  return <div
    className="mb-3 p-2 leading-4 text-sm bg-slate-200 rounded text-gray-700"
    key={index + src_id}>{item}
    {showQuote && <div className="my-2 text-xs text-gray-400 italic ">"{quote}"</div>}
    <span className="text-xs text-gray-400 cursor-pointer"
      onClick={() => { setShowQuote(x => !x) }}> ({src_id})</span>
  </div>
}



export default function Page({ dataset, table_type, table_data }: { dataset: string, table_type: string, table_data: any }) {
  return (
    <Table {...{ table_type, table_data }} />
  );
}


