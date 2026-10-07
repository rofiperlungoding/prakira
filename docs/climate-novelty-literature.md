# AI + Climate: Literature Review, Novelty, and Design Requirements

Version: 0.2 (2026-10-07). Replaces v0.1.
Status: working review for a hackathon project. Not a systematic review.

## 1. What this document is for

It answers three questions for Climate Brief:

1. Is the problem real? (section 3)
2. What already exists, and what is left to contribute? (sections 4 and 6)
3. What does the literature say the product must do? (section 5, design requirements R1 to R8)

## 2. Method and its limits

- Source: Scopus Search API (Elsevier), 2026-10-07. 36 queries in total (24 in the first pass, 12 in the second). Query strings are in section 7.
- Abstracts were read for the 15 papers marked **[A]** (retrieved through OpenAlex by DOI). For every other paper only title, first author, year, venue and DOI were read, and statements about them are inferred from the title. **Check the paper before quoting any finding in the submission.**
- Two abstracts could not be retrieved: HIAPLLM (Ray 2026) and Pursnani 2025. These are close neighbours of this project and are an open risk to the novelty claim.
- Scopus does not index arXiv preprints. No Google Scholar or arXiv search was done. "Not found" is weak evidence.
- No full text was read.

## 3. The problem, in four steps

### 3.1 Heat, air pollution and heavy rain already harm health, and vulnerability is unequal

- Jay O. et al. (2021). Reducing the health effects of hot weather and heat extremes: from personal cooling strategies to green cities. *The Lancet*. DOI 10.1016/S0140-6736(21)01209-5.
- Benmarhnia T. et al. (2015). Vulnerability to heat-related mortality: a systematic review, meta-analysis, and meta-regression analysis. *Epidemiology*. DOI 10.1097/EDE.0000000000000375.
- Romanello M. et al. (2022). The 2022 report of the Lancet Countdown on health and climate change. *The Lancet*. DOI 10.1016/S0140-6736(22)01540-9.
- Abrahamson V. et al. (2009). Perceptions of heatwave risks to health: interview-based study of older people in London and Norwich. *J. Public Health*. DOI 10.1093/pubmed/fdn102.

### 3.2 Hazards arrive together, and the combination matters

- Du H. et al. (2024). Exposure to concurrent heatwaves and ozone pollution and associations with mortality risk: a nationwide study in China. *Environmental Health Perspectives*. DOI 10.1289/EHP13790. (Abstract retrieved but garbled; rely on the title only.)
- Schnell J.L. et al. (2017). Co-occurrence of extremes in surface ozone, particulate matter, and temperature over eastern North America. *PNAS*. DOI 10.1073/pnas.1614453114.

### 3.3 Warnings work only when people understand them and act, and generic warnings lose people

- **[A]** Lindell M.K. et al. (2012). The Protective Action Decision Model: theoretical modifications and additional evidence. *Risk Analysis*. DOI 10.1111/j.1539-6924.2011.01647.x. A warning must be received, attended to and understood; people then judge the threat, the protective action, and the source before acting.
- **[A]** LeClerc J. et al. (2015). The cry wolf effect and weather-related decision making. *Risk Analysis*. DOI 10.1111/risa.12336. Experiment: very high and very low false-alarm rates gave worse decisions; adding a probabilistic uncertainty estimate improved both compliance and decision quality.
- Toloo G. et al. (2013). Evaluating the effectiveness of heat warning systems: systematic review of epidemiological evidence. *Int. J. Public Health*. DOI 10.1007/s00038-013-0465-2.
- Haer T. et al. (2016). The effectiveness of flood risk communication strategies and the influence of social networks. *Environmental Science & Policy*. DOI 10.1016/j.envsci.2016.03.006.
- Wen X. et al. (2009). Association between media alerts of air quality index and change of outdoor activity among adult asthma in six states. *J. Community Health*. DOI 10.1007/s10900-008-9126-4.
- **[A]** Ou T.H. et al. (2025). Combination of large language models and portable flood sensors for community flood response. *Water* 17(7). DOI 10.3390/w17071055. States the gap directly: public warning systems issue standard messages; users ask "How does this affect me right now?" and "What can I do to mitigate the impact?"

### 3.4 The field is asking for personalised, digital, impact-focused warnings

- **[A]** Chandra S.V.S.N. et al. (2025). A systematic review of heat health warning systems. *Current Environmental Health Reports*. DOI 10.1007/s40572-025-00496-5. Most systems rely on temperature and mortality only; the review recommends adding humidity-aware heat-stress indices, local and built-environment factors, personalisation, and digital tools for targeted warnings.
- Casanueva A. et al. (2019). Overview of existing heat-health warning systems in Europe. *IJERPH*. DOI 10.3390/ijerph16152657.
- Knowlton K. et al. (2014). Development and implementation of South Asia's first heat-health action plan in Ahmedabad. *IJERPH*. DOI 10.3390/ijerph110403473.
- Rözer V. et al. (2021). Impact-based forecasting for pluvial floods. *Earth's Future*. DOI 10.1029/2020EF001851.
- Kiptum A. et al. (2025). Advancing operational flood forecasting, early warning and risk management with new emerging science. *J. Flood Risk Management*. DOI 10.1111/jfr3.12884.
- **[A]** Kox T. et al. (2025). Perceptions, hopes, and concerns regarding the possibilities of artificial intelligence in weather warning contexts. *Int. J. Disaster Risk Reduction*. DOI 10.1016/j.ijdrr.2025.105817. Delphi study with weather-warning experts (WMO HIWeather 2024): tailored warnings and multilingual communication are the promising uses of AI; the concerns are over-reliance, loss of human oversight, accountability, and keeping a single authoritative voice.

## 4. Prior work, closest first

### 4.1 Personalised forecast-based warnings without an LLM (most important prior art)

- **[A]** Kingma B.R.M. et al. (2021). ClimApp: integrating personal factors with weather forecasts for individualised warning and guidance on thermal stress. *IJERPH*. DOI 10.3390/ijerph182111317. A free app that combines forecast with activity, clothing, acclimatisation and body data, using ISO thermal models, in 10 languages.
- **[A]** Eggeling J. et al. (2022). The usability of ClimApp: a personalized thermal stress warning tool. *Climate Services*. DOI 10.1016/j.cliser.2022.100310. Usability problems with navigation and information complexity.
- Folkerts M.A. et al. (2021). Predicted and user perceived heat strain using the ClimApp mobile tool. *Climate Risk Management*. DOI 10.1016/j.crm.2021.100381.
- **[A]** Morabito M. et al. (2019). An occupational heat-health warning system for Europe: the HEAT-SHIELD platform. *IJERPH*. DOI 10.3390/ijerph16162890. Personalised worker heat-risk forecasts with behavioural suggestions.

**Consequence:** "personalised warnings from forecast data" is not new. These systems are heat-only, rule-based, and physiologically stronger than this project. Do not claim better heat science than them.

### 4.2 LLMs for hazard and climate communication

- **[A]** Zhao X. et al. (2025). Tailoring generative AI chatbots for multiethnic communities in disaster preparedness communication. *J. Computer-Mediated Communication*. DOI 10.1093/jcmc/zmae022. Experiment, 441 Florida residents, GPT-4 hurricane-preparedness chatbots: tone and cultural tailoring changed perceived friendliness and credibility, which related to preparedness outcomes.
- **[A]** MacKay M. et al. (2026). Extreme heat in the age of generative AI: assessing the accuracy, accessibility, equity, and inclusion of theory for public health communication. *J. Health Communication*. DOI 10.1080/10810730.2026.2709807. Evaluated 31 ChatGPT-4o heat messages: mostly accurate, **none met a grade 8 reading level**, and few framed heat within climate change.
- **[A]** Zajac M. et al. (2025). Unifying flood-risk communication: empowering community leaders through AI-enhanced, contextualized storytelling (FLAI). *Hydrology* 12(8). DOI 10.3390/hydrology12080204. Knowledge graph plus RAG for community leaders. A proposal, flood only.
- **[A]** Karimanzira D. (first author; co-authors not checked) (2025). Improved flood management and risk communication through large language models. *Algorithms* 18(11). DOI 10.3390/a18110713. RAG over a flood knowledge graph; reports factual inconsistency reduced by more than 75% versus text-only LLMs; names hallucination as a key risk.
- **[A]** Ou T.H. et al. (2025), cited above. IoT flood sensors plus LLM-generated customised warnings.
- Pursnani V. et al. (2025). A conversational intelligent assistant for enhanced operational support in floodplain management with multimodal data. *IJDRR*. DOI 10.1016/j.ijdrr.2025.105422. (No abstract retrieved.)
- Ray P.P. et al. (2026). HIAPLLM: IoT-enabled hybrid edge-cloud LLM for real-time, privacy-preserving air quality advisories in India. *MAPAN*. DOI 10.1007/s12647-026-00908-3. (No abstract retrieved. Closest neighbour for air quality.)
- **[A]** Ray P.P. et al. (2025). AgroMetLLM: an evapotranspiration and agro-advisory system using localized large language models. *J. Agrometeorology*. DOI 10.54386/jam.v27i3.3081. Same data source as this project (Open-Meteo) feeding an LLM that writes structured advisories; for irrigation.
- **[A]** Song J. et al. (2025). AirGPT: pioneering the convergence of conversational AI with atmospheric science. *npj Climate and Atmospheric Science*. DOI 10.1038/s41612-025-01070-4. LLM plus literature corpus plus analysis tools for air-quality assessment; aimed at analysts and management.
- **[A]** Vaghefi S.A. et al. (2023). ChatClimate: grounding conversational AI in climate science. *Communications Earth & Environment*. DOI 10.1038/s43247-023-01084-x. GPT-4 grounded in IPCC AR6; expert-rated accuracy improved.

### 4.3 Generating text from weather data, and keeping generated text faithful

- Sripada S.G. et al. (2004). Lessons from deploying NLG technology for marine weather forecast text generation. *Frontiers in AI and Applications*.
- Ramos-Soto A. et al. (2015). Linguistic descriptions for automatic generation of textual short-term weather forecasts on real prediction data. *IEEE Trans. Fuzzy Systems*. DOI 10.1109/TFUZZ.2014.2328011.
- Murakami S. et al. (2021). Generating weather comments from meteorological simulations. *EACL 2021*. DOI 10.18653/v1/2021.eacl-main.125.
- Huang L. et al. (2025). A survey on hallucination in large language models. *ACM TOIS*. DOI 10.1145/3703155.
- Gao T. et al. (2023). Enabling large language models to generate text with citations. *EMNLP 2023*. DOI 10.18653/v1/2023.emnlp-main.398.
- Chen J. et al. (2024). Benchmarking large language models in retrieval-augmented generation. *AAAI 2024*. DOI 10.1609/aaai.v38i16.29728.
- Tamber M.S. et al. (2025). Benchmarking LLM faithfulness in RAG with evolving leaderboards. *EMNLP 2025 Industry*. DOI 10.18653/v1/2025.emnlp-industry.54.

**Consequence:** turning forecast data into text is a 20-year-old field. Checking generated text against its source is established practice. The project applies both; it does not invent either.

## 5. Design requirements derived from the literature

| ID | Requirement | Source | How to check it |
|---|---|---|---|
| R1 | Every briefing item states the threat, why it matters to this household, and one protective action. | Lindell 2012; Ou 2025 | Schema has `evidence` and `advice`; profile is passed; manual review. |
| R2 | Numbers and hazard levels shown to the user must match the data. | Karimanzira 2025; Huang 2025; Gao 2023 | Deterministic verifier; eval reports raw pass rate and verifier catch rate. |
| R3 | Text must be readable at about grade 8 or below. | MacKay 2026 (0 of 31 ChatGPT heat messages met grade 8) | Compute Flesch-Kincaid grade for English output in the eval; report the share at or below 8. |
| R4 | Frame the forecast in climate terms, not only weather. | MacKay 2026 (few messages framed heat within climate change); track prompt | Show the anomaly against the 1991 to 2020 local normal for the same week (Open-Meteo archive, ERA5-based). |
| R5 | Show forecast uncertainty where it exists. | LeClerc 2015 | Show rain probability with rain amount. Do not turn a probability into a certainty. |
| R6 | Treat hazards together and flag days where they coincide. | Du 2024; Schnell 2017 | Deterministic "compound day" fact when heat and air quality are both elevated. |
| R7 | Support more than one language, and tailor to the audience. | Kox 2025; Zhao 2025 | English and Bahasa Indonesia; verification must pass in both. |
| R8 | Do not replace the official warning voice; keep the system accountable. | Kox 2025 | Link to the national meteorological service; label the tool as a companion; keep rejected claims visible; no automated emergency instructions. |

## 6. Novelty assessment

**Not novel:** personalised forecast-based heat warnings (ClimApp, HEAT-SHIELD); LLM preparedness chatbots (Zhao); LLM-written advisories from sensor or forecast data for one hazard (Ou, HIAPLLM, AgroMetLLM); grounding LLM answers in climate sources (ChatClimate, AirGPT); RAG to reduce hallucination in hazard communication (Karimanzira, Zajac).

**Possibly a contribution** (not found in this review, limits in section 2):

1. A **household-facing, multi-hazard** briefing (heat, rain, air quality, UV, plus a compound-day flag) from open forecast data.
2. **Per-claim deterministic verification** of the generated text against forecast numbers and rule-based levels, with rejected claims shown to the user. The LLM papers above reduce hallucination through retrieval; none of the abstracts read describes rejecting individual sentences by a numeric check.
3. A **public, repeatable evaluation**: raw model pass rate, hazard coverage, verifier catch rate on corrupted claims, and readability against the grade 8 target that MacKay 2026 found unmet.
4. **Climate framing built in**: each briefing compares the forecast with the local 30-year normal.

**Wording to use:** "an auditable, multi-hazard climate briefing". **Wording to avoid:** "first", "novel", "state of the art", "more accurate than". Say "we did not find" rather than "none exists".

**Risks to the claim:** HIAPLLM and Pursnani abstracts unread; no arXiv search; verification covers numbers and levels, not the advice sentence.

## 7. Queries (Scopus, TITLE-ABS-KEY, 2026-10-07)

Second pass (12):

1. `("data-to-text" OR "natural language generation") AND (weather OR forecast) AND (faithful* OR hallucinat* OR accuracy OR "numerical")`
2. `"large language model" AND ("numerical" OR "table-to-text" OR "data-to-text") AND (hallucinat* OR faithful* OR "factual consistency") AND (verification OR "fact-check*" OR detect*)`
3. `(personali* OR individuali* OR tailored) AND ("heat warning" OR "heat-health warning" OR "heat alert")`
4. `("mobile app*" OR smartphone OR "mHealth") AND (heat OR heatwave) AND (warning OR advice OR "early warning") AND (personal* OR vulnerable OR elderly)`
5. `("warning fatigue" OR "cry wolf" OR "alert fatigue") AND (weather OR flood OR heat OR hazard)`
6. `"protective action decision model" AND (warning OR hazard)`
7. `("ChatGPT" OR "generative AI" OR "large language model") AND (heat OR "air pollution" OR "air quality" OR wildfire OR flood) AND "health" AND (accuracy OR quality OR readab*) AND (advice OR information OR guidance)`
8. `("large language model" OR "generative AI") AND ("warning message*" OR "alert message*" OR "early warning") AND (generat* OR personali* OR tailor*)`
9. `("compound" OR "co-occurring" OR "concurrent") AND heat AND ("air pollution" OR "air quality") AND (mortality OR health) AND (synerg* OR interaction OR joint)`
10. `(Jakarta OR Indonesia) AND ("air pollution" OR PM2.5 OR "heat stress" OR "extreme heat") AND (mortality OR "burden" OR health)`
11. `("large language model" OR "generative AI") AND (multilingual OR "low-resource language*" OR Indonesian) AND (health OR disaster OR risk) AND (communication OR information)`
12. `(trust OR credibility) AND ("AI-generated" OR chatbot OR "generative AI") AND (warning OR "risk communication" OR disaster OR "public health message*")`

First pass (24): LLM with flood, heat, climate adaptation, disaster preparedness, air quality, weather grounding, citizen climate action; heat warning effectiveness; AQI communication; RAG and hallucination surveys; LLM climate accuracy and benchmarks; climate risk communication; climate services usability; multi-hazard early warning; impact-based forecasting; Open-Meteo or ERA5 with LLM; Indonesia and Southeast Asia early warning; vulnerable groups and protective behaviour; LLM decision support and trust. Exact strings are in v0.1 of this file in git history.

## 8. Open checks

- Read the HIAPLLM and Pursnani papers (abstracts not retrievable by API).
- One arXiv and one Google Scholar search for "LLM weather advisory verification" and "personalized climate risk LLM".
- Find a quantified Indonesia or Jakarta health-burden figure from a primary source for the pitch. Query 10 returned only global reports; nothing specific was confirmed.
- Confirm the Du 2024 finding from the paper itself before quoting it.
