import Link from "next/link";

export async function getStaticPaths() {
  const fs = require('fs');
  const datasets = fs.readdirSync('../datasets/')
  return { paths: datasets.map((dataset: string) => ({ params: { dataset } })), fallback: false }
};

export async function getStaticProps({ params }: any) {
  const fs = require('fs');
  const folder = `../datasets/${params.dataset}/outputs`
  const tables: string[] = []
  fs.readdirSync(folder)
    .filter((file: any) => file.startsWith(`table_`))
    .forEach((file: any) => {
      tables.push(file.replace('table_', '').replace('.json', ''))
    })
  return { props: { dataset: params.dataset, tables } };
}


export default function Page({ dataset, tables }: any) {
  return <div className="p-4">
    <h1 className="text-lg"> {dataset}</h1>
    <ul className="ml-4 list-disc list-inside">
      {['matrix', ...tables].map((x: string) => (
        <li key={x}>
          <Link href={`/${dataset}/${x}`}>{x}</Link>
        </li>
      ))}
    </ul>
    <br />
    <Link href="/">back list of datasets</Link>
  </div>
}
