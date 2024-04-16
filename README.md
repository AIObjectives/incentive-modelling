# Incentives Modelling 

## TL;DR: 

This repo contains some prototype code and examples related to 
[Modeling Incentives At Scalre Using LLMs](https://www.lesswrong.com/posts/hYS2KGAeB44SiJnJe/modeling-incentives-at-scale-using-llms). 

The goals of this technical exploration were to figure out: 
* how LLMs might be used to analyse different types of inputs (newspaper article, substack or podcast transtript) and extract various bits of information
* how LLMS could help combine, summarize and organise these bits of informations to construct "incentive models"
* what may be the best ways to visualize and consume these incentive models. 

Key learnings and challenges:

*  LLMs are pretty smart are extracting all the bits that we technically asked them to extract (see prompts)
*  it's harder to get LLMs to extract only the interesting bits (the outputs offen include uninteresting noise)
*  with the current prompts, the LLMs also didn't do a great job at clustering and deduplicating similar points

We believe that the quality of the generated incentive models could be improved significantly by iterating on the prompts, especially by borrowing some of the prompt 
engineering techniques that we developped for other summarization projects (see [Talk to the City](https://ai.objectives.institute/talk-to-the-city)). 

## Screenshots 


This section provide some examples from the "Altam" dataset, which is a collection of articles covering the firing and unfiring of Sam Altman at OpenAI. 

Running the code on this dataset generates multiple tables reprensenting concisely the answers to the following questions: 

```
bad_scenarios     ->  what are some scenarios that each entity would consider bad?
good_scenarios    ->  what are some scenarios that each entity would consider good?
main_fears        ->  what is the entity afraid of?
main_motivations  ->  what are the entity's main motivations?
possible_actions  ->  what actions could the entity take?  
resources         ->  what resources does the entity control?
stated_goals      ->  what are the stated goals of each entity? 
```

For instance, for "good scenarios": 

<img width="1032" alt="image" src="https://github.com/AIObjectives/incentive-modelling/assets/3934784/2fa06437-a8df-4f42-9110-cb666134e63d">

In this example, the different columns correspond to key entities which have been identify as important/powerful in the original corpus. 
The different lines correspond to different subtopics and the dots show how many potential "incentives" have been indentified for the corresponging 
entity and subtopic. 

Clicking on each cell will then reveal more details: 

<img width="1012" alt="image" src="https://github.com/AIObjectives/incentive-modelling/assets/3934784/217c3257-e43a-454c-be9e-4e54daf42aa6">




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


