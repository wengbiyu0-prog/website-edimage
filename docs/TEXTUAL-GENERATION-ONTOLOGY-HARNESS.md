# EDIMAGE Textual Generation Ontology Harness

This document condenses `文本生成本体库_最新版.docx` into the runtime harness used by EDIMAGE WORLD.

## Purpose

The ontology is not a genre list. It is a ten-dimensional reasoning framework for stylized interactive fiction. Every model call should first infer a `text_generation_unit`, then generate text, choices, and state updates from that unit.

## Six-Part Runtime Stack

1. Ontology Parser

Parses user idea, current path, prior paragraphs, and recalled knowledge into the ten dimensions.

2. Narrative Planner

Uses dimensions 1-6 as the text skeleton, dimensions 7-8 as contextual texture, and dimensions 9-10 as interaction and QA constraints.

3. Builder

Writes text according to form, structure, technique, and style. It must not convert every mode into generic second-person prose.

4. Choice Generator

Generates branches that change future state or interpretation. Choices should mix action, information, emotion, explanation, viewpoint, text feedback, silence, and rewrite mechanisms.

5. Anti-AI Style Gate

Removes generic uplift, abstract explanation, repeated choices, fake choices, path summaries, and template phrasing. Adds objects, friction, sensory anchors, information gaps, and material trace.

6. Memory Manager

Carries forward character state, relationship state, space state, object state, known information, hidden information, prior choices, knowledge-base motifs, unresolved gaps, and changed generation parameters.

## Ten Dimensions

1. `text_category`: literary category, such as fiction, poetry, prose, nonfiction, applied writing, digital interactive text, or compound text.
2. `genre`: expectation and conflict mechanism, such as romance, horror, crime, urban, dreamcore, absurd, surreal, cyberpunk, fantasy, or liminal horror.
3. `form`: textual container, such as diary, letter, memo, investigation report, police transcript, experiment log, chat log, forum post, system notice, AI conversation, search history, GPS trail, surveillance transcript, or database export.
4. `structure`: time, causality, plot, information, and spatial organization.
5. `technique`: narrator, viewpoint, psychological rendering, information control, montage, juxtaposition, annotation.
6. `style`: aesthetics, sentence length, register, abstraction level, emotional exposure, sensory density, explanation level, rhetoric, rhythm, and intensity.
7. `cultural_modifier`: region, period, social environment, cultural concepts, and retrieval needs.
8. `media_texture`: source feeling, format marks, and degradation marks.
9. `interaction_mechanism`: what user choices change.
10. `generation_constraints`: length, viewpoint, option count, information rhythm, specificity, continuity, anti-AI-style rules, and safety boundaries.

## Runtime Contract

```json
{
  "text_generation_unit": {
    "user_idea": "",
    "text_category": { "primary": "", "secondary": "" },
    "genre": { "primary": "", "secondary": "", "core_desire": "", "core_conflict": "", "core_emotion": "" },
    "form": { "primary": "", "secondary": "" },
    "structure": { "temporal": "", "causal": "", "plot": "", "informational": "", "spatial": "" },
    "technique": [],
    "style": { "aesthetic": [], "language": {}, "rhythm": "", "intensity": "" },
    "cultural_modifier": { "region": "", "period": "", "social_context": [], "retrieval_need": false },
    "media_texture": { "source_texture": "", "format_markers": [], "degradation_markers": [] },
    "interaction_mechanism": { "choice_types": [], "state_effects": [] },
    "generation_constraints": { "length": "", "options": "", "must_include": [], "must_avoid": [] }
  },
  "text": "",
  "choices": [],
  "state_update": {}
}
```

## QA Checklist

- The text visibly obeys its form.
- The genre creates a real conflict mechanism.
- Choices change future state or interpretation.
- Each turn includes a concrete object, scene, action, or sensory anchor.
- Each turn adds an information gap or emotional change.
- Repeated options are removed.
- Generic AI-like summary, uplift, and vague abstraction are removed.
- Memory carries forward instead of resetting the world.
