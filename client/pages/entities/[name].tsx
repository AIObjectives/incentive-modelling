
const outputs = '../outputs'
import EntitiesTable from "@/components/EntitiesTable";

export async function getStaticPaths() {
  const fs = require('fs');
  console.log('outputs', fs.readdirSync(outputs));
  const files = fs.readdirSync(outputs)
    .filter((x: string) => x.endsWith('_entities.json'))
    .map((x: string) => x.replace('_entities.json', ''));

  return { paths: files.map((name: string) => ({ params: { name } })), fallback: false }
};

export async function getStaticProps({ params }: any) {
  const fs = require('fs');
  const data = fs.readFileSync(`${outputs}/${params.name}_entities.json`, 'utf8');
  return { props: { name: params.name, data: JSON.parse(data) } };
}

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function Page({ name, data }: { name: string, data: JSON }) {
  return <div>
    <EntitiesTable data={data} />
    {/* <pre>
      {JSON.stringify(data, null, 2)}
    </pre> */}
  </div>
}