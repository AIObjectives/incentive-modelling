const fs = require("fs");
const OpenAI = require("openai");
const CryptoJS = require("crypto-js");

const prompts = {};
fs.readdirSync("./prompts").forEach((file) => {
  prompts[file.split(".")[0]] = fs.readFileSync(`./prompts/${file}`, "utf8");
});

let dataset = null;
const setDataset = (d) => {
  dataset = d;
};

const gpt_with_messages = async (key, messages, model, json_format) => {
  const client = new OpenAI();
  const params = { messages, model };
  if (json_format) params.response_format = { type: "json_object" };
  const h = hash(params);
  const file = `./datasets/${dataset}/cache/${key}_${h}.txt`;
  const separator = "\n\n=== RESULTS ===\n\n";
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8").split(separator)[1];
  }
  console.log(`Calling ${model} for ${file}`);
  const completion = await client.chat.completions.create(params);
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

const hash = (obj) =>
  CryptoJS.SHA256(JSON.stringify(obj)).toString(CryptoJS.enc.Hex);

function removeBeforeFirstAndAfterLastBraceOrBracket(inputString) {
  const startIndex = inputString.search(/[\[{]/); // Find the first "{" or "["
  const endIndex = inputString.lastIndexOf(/[}\]]/); // Find the last "}" or "]"

  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    return inputString.slice(startIndex, endIndex + 1);
  } else {
    return inputString; // No "{" or "[" or "}" or "]" found, return the original string
  }
}

async function fixJson(job_key, str, retries = 3) {
  console.log("Fixing JSON for ..." + job_key, str);
  if (str.trim().split("\n")[0].toLowerCase().includes("sorry")) {
    console.error("OpenAI said Sorry, so not trying to fix JSON " + job_key);
    return undefined;
  }
  const clean = removeBeforeFirstAndAfterLastBraceOrBracket(str);
  console.log("Cleaned JSON for ..." + job_key, clean);
  if (clean !== str) {
    return fixJson(job_key, clean, retries - 1);
  }
  if (retries < 0) {
    console.error("Failed to fix JSON! " + job_key);
    return undefined;
  }
  try {
    const parsed = JSON.parse(str);
    console.log("Successfully parsed JSON!");
    return parsed;
  } catch (e) {
    console.log("Attempting to fix JSON..." + job_key);
    if (str.includes("```")) {
      let [, middle] = (" " + str + " ").split("```");
      if (middle.startsWith("json")) {
        middle = middle.slice(4);
      }
      return fixJson(job_key, middle, retries - 1);
    }
    const clean = await gpt("json_fix", prompts.fix_json, { str }, "gpt-4");
    return fixJson(job_key, clean, retries - 1);
  }
}

async function searchWikipedia({ name, description }) {
  try {
    const h = hash({ name, description });
    const file = `./datasets/${dataset}/cache/wikipedia_search_${h}.json`;
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

module.exports = {
  setDataset,
  prompts,
  gpt,
  searchWikipedia,
  fixJson,
};
