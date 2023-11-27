const fs = require("fs");
const OpenAI = require("openai");
const CryptoJS = require("crypto-js");

const main = async () => {
  const { default: ora } = await import("ora");
  const { default: chalk } = await import("chalk");
  console.log(chalk.red("Hello world!"));

  const hash = (obj) =>
    CryptoJS.SHA256(JSON.stringify(obj)).toString(CryptoJS.enc.Hex);

  const gpt_with_messages = async (key, messages, model, json_format) => {
    const client = new OpenAI();
    const params = { messages, model };
    if (json_format) params.response_format = { type: "json_object" };
    const h = hash(params);
    const file = `./cache/${key}_${h}.txt`;
    const separator = "\n\n=== RESULTS ===\n\n";
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, "utf8").split(separator)[1];
    }
    const spinner = ora(
      `Calling ${chalk.red(model)} for ${chalk.green(file)}`
    ).start();
    const completion = await client.chat.completions.create(params);
    spinner.stop();
    const message_content = completion.choices[0].message.content;
    const file_content =
      `model: ${params.model}\n\n` +
      messages
        .map(({ role, content }) => `//${role}:\n\n ${content}`)
        .join("\n\n") +
      `${separator}${message_content}`;
    fs.writeFileSync(file, file_content);
    return message_content;
  };

  const gpt = async (key, prompt, replacements, model, json_format) => {
    let content = prompt;
    Object.keys(replacements).forEach((key) => {
      content = content.split(`{${key}}`).join(replacements[key]);
    });
    const message = { role: "user", content };
    return gpt_with_messages(key, [message], model, json_format);
  };

  const prompts = {};
  fs.readdirSync("./prompts").forEach((file) => {
    prompts[file.split(".")[0]] = fs.readFileSync(`./prompts/${file}`, "utf8");
  });

  async function fixJson(str, retries = 2) {
    if (retries < 0) {
      console.error(chalk.red("Failed to fix JSON!"));
      return undefined;
    }
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log("Attempting to fix JSON...");
      if (str.includes("```")) {
        let [, middle] = (" " + str + " ").split("```");
        if (middle.startsWith("json")) {
          middle = middle.slice(4);
        }
        return fixJson(middle, retries - 1);
      }
      const clean = await gpt("json_fix", prompts.fix_json, { str }, "gpt-4");
      return fixJson(clean, retries - 1);
    }
  }

  async function searchWikipedia({ name, description }) {
    try {
      const h = hash({ name, description });
      const file = `./cache/wikipedia_search_${h}.json`;
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      }
      const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=10&srsearch=${name}&explaintext=true`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw Error(response.statusText);
      }
      const json = await response.json();
      const options = json.query.search.map(({ title, pageid, snippet }) => ({
        title,
        pageid,
        snippet,
      }));
      const pageId = await gpt(
        `wikipedia_select_${name}`,
        prompts.wikipedia_select,
        { name, description, options: JSON.stringify(options, null, 2) },
        "gpt-4"
      );
      if (isNaN(parseInt(pageId))) {
        throw new Error("Error extracting pageId:" + pageId);
      }
      const info = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&pageids=${pageId}&prop=extracts&exintro=true&explaintext=true`
      );
      const data = await info.json();
      const pageInfo = data.query.pages[pageId];
      const pageName = pageInfo.title;
      const pageExtract = pageInfo.extract;
      const pageURL = pageInfo.fullurl;
      const pageDescription = await gpt(
        `wikipedia_description_${pageId}`,
        prompts.wikipedia_description,
        { pageName, pageExtract },
        "gpt-4"
      );
      const result = {
        id: pageId,
        name: pageName,
        extract: pageExtract,
        description: pageDescription,
        url: pageURL,
      };
      fs.writeFileSync(file, JSON.stringify(result, null, 2));
      return result;
    } catch (e) {
      return {
        error: e.message,
      };
    }
  }

  const processFile = async (file) => {
    console.log("Processing file", file);
    const filename = file.split(".")[0];
    const document = await fs.readFileSync(`./inputs/${file}`, "utf8");
    const summary = await gpt(
      `${file}_summary`,
      prompts.summary,
      { document },
      "gpt-3.5-turbo-16k"
    );
    const entities = JSON.parse(
      await gpt(`${file}_entities`, prompts.entities, { document }, "gpt-4-32k")
    );
    for (const entity of entities) {
      entity.wikipedia = await searchWikipedia(entity);
      entity.motives = await fixJson(
        await gpt(
          `${file}_motives_${entity.wikipedia.name}`,
          prompts.motives,
          {
            document,
            entity: entity.wikipedia.name,
            description: entity.wikipedia.description,
          },
          "gpt-4-1106-preview",
          true
        )
      );
    }
    fs.writeFileSync(
      `./outputs/${filename}_entities.json`,
      JSON.stringify(entities, null, 2)
    );
  };

  processFile("Times.txt");
  // processFile("Times.txt");
  // const files = fs.readdirSync("./inputs");
  // for (const file of files) {
  //   await processFile(file);
  // }
};

main();
