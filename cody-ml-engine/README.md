# Cody ML Engine

A machine learning component for Cody Academy.

Its first task is to classify students' questions into categories before they are sent to the appropriate response system.

## Categories

- programming
- math
- science
- general_knowledge
- lesson_help
- code_debugging

## Project Structure

```text
cody-ml-engine/
├── data/
│   └── training_data.json
├── models/
├── src/
│   ├── question_classifier.py
│   └── train.py
├── requirements.txt
└── README.md