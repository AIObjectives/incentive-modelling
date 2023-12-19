const fs = require("fs");
const {
  setDataset,
  prompts,
  fixJson,
  searchWikipedia,
  gpt,
} = require("./utils");

const main = async (dataset) => {
  const data_result = {};
  setDataset(dataset);
  const processFile = async (file, goals) => {
    console.log("Processing file", file);
    const filename = file.split(".")[0];
    const document = await fs.readFileSync(
      `./datasets/${dataset}/inputs/${file}`,
      "utf8"
    );
    const meta = await fixJson(
      `${file}_meta`,
      await gpt(
        `${file}_meta`,
        prompts.meta,
        { document, goals },
        "gpt-4-1106-preview",
        true
      )
    );
    data_result[filename] = { meta };
    fs.writeFileSync(
      `./datasets/${dataset}/outputs/${filename}_meta.json`,
      JSON.stringify(meta, null, 2)
    );
    const entities = await fixJson(
      `${file}_entities`,
      await gpt(`${file}_entities`, prompts.entities, { document }, "gpt-4-32k")
    );
    for (const entity of entities) {
      entity.wikipedia = await searchWikipedia(entity);
      const job_key = `${file}_motives_${entity.wikipedia.name}`;
      entity.motives = await fixJson(
        job_key,
        await gpt(
          job_key,
          prompts.motives,
          {
            document,
            entity: entity.wikipedia.name,
            description: entity.wikipedia.description,
          },
          "gpt-4-32k",
          false
          // "gpt-4-1106-preview",
          // true
        )
      );
    }
    fs.writeFileSync(
      `./datasets/${dataset}/outputs/${filename}_entities.json`,
      JSON.stringify(entities, null, 2)
    );
    data_result[filename].entities = entities;
  };
  const files = fs.readdirSync(`./datasets/${dataset}/inputs`);
  const goals = fs.readFileSync(`./datasets/${dataset}/goals.txt`, "utf8");
  for (const file of files) {
    await processFile(file, goals);
  }
  fs.writeFileSync(
    `./datasets/${dataset}/outputs/data.json`,
    JSON.stringify(data_result, null, 2)
  );
};

const dataset = process.argv.slice(2)[0];
if (!dataset && dataset.length) {
  console.error("Please specify a dataset!");
  process.exit(1);
}
main(dataset);
