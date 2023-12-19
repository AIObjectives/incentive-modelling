import Link from "next/link";

export async function getStaticProps({ params }: any) {
  const fs = require('fs');
  const datasets = fs.readdirSync('../datasets/')
  return { props: { datasets } };
}

export default function Page({ datasets }: any) {
  return <div>
    <h1 className="text-lg m-4"> List of datasets</h1>
    <ul className="ml-10 list-disc list-inside">
      {datasets.map((x: string) => (
        <li key={x}>
          <Link href={`/${x}`}>{x}</Link>
        </li>
      ))}
    </ul>
  </div>
}
