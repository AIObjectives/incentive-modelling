# Incentives Modelling Prototype

## Add new datasets under `/datasets`

See `./datasets/altman` folder for an example.

Add an `./input` folder with text files to be processed, possibly with some metadata in the header.
Describe some high-level goals in `./goals.txt`.
Create an empty `./cache` folder and `./outputs` folder.

## Run the main scripts

Install a modern version of node and then run the following, substituting `altman` with the name of your dataset folder.

```
npm i
export OPENAI_API_KEY=...
node main_step1_matrix.js altman
node main_step2_tables.js altman
```

The first script will produce files in `./outputs` of the form `[...]_entities.json`. These contain the data used by the client to display the large matrix view.

The second script will produce files in `./outputs/` of the form `table_[...].json`. These contain the
data used by the front-end to display the individual tables with clusters of incentives.

## Development

To run the front-end locally:

```
cd client
npm i
npm run dev
```
