import { useState } from "react";

export async function getStaticPaths() {
  const fs = require('fs');
  const datasets = fs.readdirSync('../datasets/')
  return { paths: datasets.map((dataset: string) => ({ params: { dataset } })), fallback: false }
};

export async function getStaticProps({ params }: any) {
  const fs = require('fs');
  const folder = `../datasets/${params.dataset}/outputs`
  const entities = fs.readdirSync(folder)
    .filter((file: any) => file.endsWith(`_entities.json`))
    .map((file: string) => ({
      source: file.replace('_entities.json', ''),
      entities: JSON.parse(fs.readFileSync(`../datasets/${params.dataset}/outputs/${file}`, 'utf8'))
    }))
  return { props: { dataset: params.dataset, data: entities } };
}


const Table = ({ columnNames, rawNames, getContent }: any) => {
  return (
    <table>
      <thead>
        <tr>
          {columnNames.map((colName: string, colIndex: number) => (
            <th key={colIndex} className="text-sm bg-slate-100 sticky top-0 border p-2 z-10">
              {colName}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rawNames.map((rawName: string, rawIndex: number) => (
          <tr key={rawIndex}>
            {columnNames.map((colName: string, colIndex: number) => (
              <td key={colIndex} className="odd:bg-slate-50 border p-2 align-top min-w-[300px]">
                {getContent(colName, rawName)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};


export default function Page({ dataset, data }: { dataset: string, data: any }) {

  const numberOfSources = ((entity: string) => data.filter((x: any) => x.entities.find((y: any) => y.name === entity)).length)
  // @ts-ignore
  const entities = [...new Set(data.flatMap((x: any) => x.entities.map(x => x.name)))]
    .sort((x, y) => numberOfSources(y) - numberOfSources(x))

  const raws = [
    // ["name", (x: any) => x.name],
    // ["Wikipedia", (x: any) => x.wikipedia?.description],
    ["Description", (x: any) => ([{ item: x.description }])],
    ["Stated Goals", (x: any) => x.motives?.stated_goals || []],
    ["Main Motivations", (x: any) => x.motives?.main_motivations || []],
    ["Possible Actions", (x: any) => x.motives?.possible_actions || []],
    ["Good Scenario", (x: any) => x.motives?.good_scenarios || []],
    ["Bad Scenario", (x: any) => x.motives?.bad_scenarios || []],
    ["Main Fears", (x: any) => x.motives?.main_fears || []],
    ["Resources", (x: any) => x.motives?.resources || []],
  ]

  const cells: any = {}
  data.forEach(({ source, entities }: any) => {
    entities.forEach((entity: any) => {
      raws.forEach(([rawName, fn]: any) => {
        const key = `${entity.name}-${rawName}`
        if (!cells[key]) cells[key] = []
        const values = fn(entity)
        values.forEach(({ item, quote }: any) => {
          if (typeof (item) !== 'string' || item.trim() === '') return
          cells[key].push({ source, item, quote })
        })
      })
    })
  })

  return <div >
    <Table
      columnNames={entities}
      rawNames={raws.map(x => x[0])}
      getContent={(c: string, r: string) =>
        <div className="">
          <div className="bg-slate-800 text-white text-center py-1 text-xs text-gray-600">{r}</div>
          {cells[`${c}-${r}`].map(({ source, item, quote }: any) =>
            <CellItem key={`${c}-${r}-${source}-${item}`} {...{ row: r, source, item, quote }} />
          )}
        </div>
      }
    />
  </div >
}


const CellItem = ({ row, source, item, quote }: any) => {
  const [showQuote, setShowQuote] = useState(false)
  return <div
    className="mt-3 p-2 leading-4 text-sm bg-slate-200 rounded text-gray-700"
    key={row + source}>{item}
    {showQuote && <div className="my-2 text-xs text-gray-400 italic ">"{quote}"</div>}
    <span className="text-xs text-gray-400 cursor-pointer"
      onClick={() => { setShowQuote(x => !x) }}> ({source})</span>
  </div>
}
