const fs = require("fs");
const { gpt, prompts, setDataset, fixJson } = require("./utils.js");

const getClusters = async (data, question) => {
  const all_items = [];
  Object.keys(data).forEach((src_id) => {
    const source = data[src_id];
    const { entities } = source;
    if (!entities) console.error(src_id);
    entities.forEach((entity) => {
      const items = (entity.motives || [])[question] || [];
      items.forEach(({ item, quote }) => {
        all_items.push({
          item,
          quote,
          src_id,
          source,
          entity,
        });
      });
    });
  });
  const _clusters = await gpt(
    `${question}_clusters`,
    prompts.clusters,
    { all_items: JSON.stringify(all_items.map((x) => x.item)) },
    // "gpt-4-32k",
    // false
    "gpt-4-1106-preview",
    true
  );
  console.log(question + " clusters:", _clusters);

  const { clusters } = await fixJson(`${question}_clusters`, _clusters);
  all_items.forEach((item) => {
    item.cluster = clusters.find((cluster) =>
      cluster.items.includes(item.item)
    );
  });
  const columns_map = {};
  all_items.forEach((item) => {
    const id = item.entity.wikipedia.id;
    if (!columns_map[id])
      columns_map[id] = {
        id,
        name: item.entity.name,
        count: 0,
      };
    columns_map[id].count++;
  });
  const columns = Object.keys(columns_map)
    .map((id) => columns_map[id])
    .sort((x, y) => y.count - x.count);
  const rows_map = {};
  all_items.forEach((item) => {
    if (!item.cluster) return;
    const id = item.cluster.clusterName;
    if (!rows_map[id])
      rows_map[id] = {
        id,
        name: item.cluster.clusterName,
        representativeItem: item.cluster.representativeItem,
        count: 0,
      };
    rows_map[id].count++;
  });
  const meta = {};
  const rows = Object.keys(rows_map)
    .map((id) => rows_map[id])
    .sort((x, y) => y.count - x.count);
  const cells = {};
  all_items.forEach((item) => {
    if (!item.cluster) return;
    const row_id = item.cluster.clusterName;
    const column_id = item.entity.wikipedia.id;
    const id = `${row_id}_${column_id}`;
    if (!cells[id]) cells[id] = [];
    const { src_id, source, quote } = item;
    meta[src_id] = source.meta;
    cells[id].push({
      item: item.item,
      src_id,
      quote,
    });
  });
  const table = {
    columns,
    rows,
    cells,
    meta,
  };
  fs.writeFileSync(
    `./datasets/${dataset}/outputs/table_${question}.json`,
    JSON.stringify(table, null, 2)
  );
  console.log(table);
};

const main = async (dataset) => {
  const data = JSON.parse(
    fs.readFileSync(`./datasets/${dataset}/outputs/data.json`, "utf8")
  );
  const questions = [
    "stated_goals",
    "main_motivations",
    "possible_actions",
    "good_scenarios",
    "bad_scenarios",
    "main_fears",
    "resources",
  ];
  for (question of questions) {
    const clusters = await getClusters(data, question);
  }
};

const dataset = process.argv.slice(2)[0];
if (!dataset && dataset.length) {
  console.error("Please specify a dataset!");
  process.exit(1);
}
setDataset(dataset);
main(dataset);
