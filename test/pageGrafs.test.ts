import {
    describe,
    expect,
    beforeEach,
    test
} from "@jest/globals";
import {PageGraph} from "../src/models/pageGrafs";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {Page} from "../src/models/page";
import {ConditionType, OperatorType, PageRoute, StatusType, TransitionType} from "../src/models/pageRoute";


describe('pageGrafs', () => {
    let graph: PageGraph = new PageGraph([]);

    const defaultQuestions = (position: number, followUp: boolean): NativeQuestion => {
        return <NativeQuestion>{
            id: position.toString(),
            title: `Question ${position}`,
            type: 'TEXT',
            questionType: {conf: {}},
            ref: position.toString(),
            require: true,
            external_id: position.toString(),
            value: [''],
            defaultValue: '',
            appId: '1',
            followup: followUp,
            position: position,
            assets: {}
        }
    }

    const setGraph = (questions: NativeQuestion[]) => {
        const pages: Page[] = [
            ...questions.map((q, index) =>
                new Page(index.toString(), index, 'integration', [q], questions[index + 1] ? [
                    new PageRoute(index.toString(), q.ref, OperatorType.NOEQUAL, [''], TransitionType.PAGE, (index + 1).toString(), 'test'),
                ] : []))
        ];

        graph = new PageGraph(pages);
    }

    const setGraphWithRoutes = (pages: Page[]) => {
        graph = new PageGraph(pages);
    }

    beforeEach(() => {

    });

    describe('findMaxDepth', () => {
        test('No follow up => total: 5', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(5);
        });

        test('Followup only (F) => total: 2', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, true)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(2);
        });

        test('Followup start (F^3) => total: 6', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, true),
                defaultQuestions(2, true),
                defaultQuestions(3, true)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(6);
        });

        test('Followup start (F-N) => total: 3', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, true),
                defaultQuestions(2, false)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Followup end (N-F) => total: 3', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, true)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Followup middle (N-F-N^3) => total: 6', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, true),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(6);
        });

        test('Followup middle (N-F-N-F-N) => total: 7', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, true),
                defaultQuestions(3, false),
                defaultQuestions(4, true),
                defaultQuestions(5, false)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(7);
        });

        test('Followup start (F-N-F-N) => total: 6', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, true),
                defaultQuestions(2, false),
                defaultQuestions(3, true),
                defaultQuestions(4, false)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(6);
        });

        test('Followup end (N-F-N-F) => total: 6', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, true),
                defaultQuestions(3, false),
                defaultQuestions(4, true)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(6);
        });

        test('Followup start (F-N-F-N-F) => total: 8', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, true),
                defaultQuestions(2, false),
                defaultQuestions(3, true),
                defaultQuestions(4, false),
                defaultQuestions(5, true)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(8);
        });

        test('Followup middle (N-F-N-F-N-F) => total: 9', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, true),
                defaultQuestions(3, false),
                defaultQuestions(4, true),
                defaultQuestions(5, false),
                defaultQuestions(6, true)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(9);
        });
    });

    describe('findMaxDeepWithConditions', () => {
        test('Test a simple tree with conditions', async () => {
            const questions: NativeQuestion[] = [
                {
                    "id": "e2c8fa70-8f81-11ef-ac6c-69b43cd19236",
                    "title": "Seleciona una opción :",
                    "ref": "selecionaunaopcin",
                    "refMetric": "select option",
                    "require": true,
                    "external_id": "",
                    "value": ["Magic", "Pokemon", "Digimon"],
                    "defaultValue": "",
                    "position": 1,
                    "followup": false,
                    "assets": {
                        "extraOption": false,
                        "extraOptionText": "I don't know",
                        "extraOptionPlaceholder": "Custom option",
                        "general": ""
                    },
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "type": FEEDBACKAPPANSWERTYPE.RADIO,
                    "integrationPageId": "e2c243b0-8f81-11ef-ac6c-69b43cd19236",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "e4935a30-8f81-11ef-ac6c-69b43cd19236",
                    "title": "Conoces Magic?",
                    "ref": "conocesmagic",
                    "refMetric": "Magic",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 2,
                    "followup": false,
                    "assets": {
                        "addIcon": false
                    },
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "type": FEEDBACKAPPANSWERTYPE.BOOLEAN,
                    "integrationPageId": "e48cca80-8f81-11ef-ac6c-69b43cd19236",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "e668b670-8f81-11ef-ac6c-69b43cd19236",
                    "title": "Conoces Pokemon?",
                    "ref": "conocespokemon",
                    "refMetric": "Pokemon",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 3,
                    "followup": false,
                    "assets": {
                        "addIcon": false
                    },
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "type": FEEDBACKAPPANSWERTYPE.BOOLEAN,
                    "integrationPageId": "e661ffb0-8f81-11ef-ac6c-69b43cd19236",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "e8316880-8f81-11ef-ac6c-69b43cd19236",
                    "title": "Conoces Digimon?",
                    "ref": "conocesdigimon",
                    "refMetric": "Digimon",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 4,
                    "followup": false,
                    "assets": {
                        "addIcon": false
                    },
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "type": FEEDBACKAPPANSWERTYPE.BOOLEAN,
                    "integrationPageId": "e82ad8d0-8f81-11ef-ac6c-69b43cd19236",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "e9fba130-8f81-11ef-ac6c-69b43cd19236",
                    "title": "Como valoras la industria detras de la franquicia ?",
                    "ref": "comovaloraslaindustriadetrasdelafranquicia",
                    "refMetric": "industry franchise",
                    "require": false,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 5,
                    "followup": false,
                    "assets": {
                        "minPlaceholder": "",
                        "maxPlaceholder": ""
                    },
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "type": FEEDBACKAPPANSWERTYPE.RATING_STAR,
                    "integrationPageId": "e9f4ea70-8f81-11ef-ac6c-69b43cd19236",
                    "questionType": {
                        "conf": null
                    }
                }
            ];

            const pages: Page[] = [
                {
                    "id": "e2c243b0-8f81-11ef-ac6c-69b43cd19236",
                    "position": 1,
                    "generatedAt": "2024-10-21T07:55:48.970Z",
                    "updatedAt": "2024-10-21T07:55:48.970Z",
                    "status": "ACTIVE",
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "integrationQuestions": [questions[0]],
                    "integrationPageRoutes": [
                        {
                            "id": "b8be0190-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "selecionaunaopcin",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["Magic"],
                            "transition": TransitionType.PAGE,
                            "transitionDestiny": "e48cca80-8f81-11ef-ac6c-69b43cd19236",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e2c243b0-8f81-11ef-ac6c-69b43cd19236"
                        },
                        {
                            "id": "c16d3630-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "selecionaunaopcin",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["Pokemon"],
                            "transition": TransitionType.PAGE,
                            "transitionDestiny": "e661ffb0-8f81-11ef-ac6c-69b43cd19236",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e2c243b0-8f81-11ef-ac6c-69b43cd19236"
                        },
                        {
                            "id": "c8ec4f40-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "selecionaunaopcin",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["Digimon"],
                            "transition": TransitionType.PAGE,
                            "transitionDestiny": "e82ad8d0-8f81-11ef-ac6c-69b43cd19236",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e2c243b0-8f81-11ef-ac6c-69b43cd19236"
                        }
                    ]
                },
                {
                    "id": "e48cca80-8f81-11ef-ac6c-69b43cd19236",
                    "position": 2,
                    "generatedAt": "2024-10-21T07:55:51.975Z",
                    "updatedAt": "2024-10-21T07:55:51.975Z",
                    "status": "ACTIVE",
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "integrationQuestions": [questions[1]],
                    "integrationPageRoutes": [
                        {
                            "id": "09cc3d50-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "conocesmagic",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["No"],
                            "transition": TransitionType.FINISH,
                            "transitionDestiny": "https://magic.wizards.com/en",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e48cca80-8f81-11ef-ac6c-69b43cd19236"
                        },
                        {
                            "id": "a73023e0-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "conocesmagic",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["Yes"]",
                            "transition": TransitionType.PAGE,
                            "transitionDestiny": "e9f4ea70-8f81-11ef-ac6c-69b43cd19236",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e48cca80-8f81-11ef-ac6c-69b43cd19236"
                        }
                    ]
                },
                {
                    "id": "e661ffb0-8f81-11ef-ac6c-69b43cd19236",
                    "position": 3,
                    "generatedAt": "2024-10-21T07:55:55.051Z",
                    "updatedAt": "2024-10-21T07:55:55.051Z",
                    "status": "ACTIVE",
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "integrationQuestions": [questions[2]],
                    "integrationPageRoutes": [
                        {
                            "id": "6f1b2540-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "conocespokemon",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["No"],
                            "transition": TransitionType.FINISH,
                            "transitionDestiny": "https://www.pokemon.com/es",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e661ffb0-8f81-11ef-ac6c-69b43cd19236"
                        },
                        {
                            "id": "7f795c90-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "conocespokemon",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["Yes"]",
                            "transition": TransitionType.PAGE,
                            "transitionDestiny": "e9f4ea70-8f81-11ef-ac6c-69b43cd19236",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e661ffb0-8f81-11ef-ac6c-69b43cd19236"
                        }
                    ]
                },
                {
                    "id": "e82ad8d0-8f81-11ef-ac6c-69b43cd19236",
                    "position": 4,
                    "generatedAt": "2024-10-21T07:55:58.045Z",
                    "updatedAt": "2024-10-21T07:55:58.045Z",
                    "status": "ACTIVE",
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "integrationQuestions": [questions[3]],
                    "integrationPageRoutes": [
                        {
                            "id": "88503d70-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "conocesdigimon",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["Yes"]",
                            "transition": TransitionType.PAGE,
                            "transitionDestiny": "e9f4ea70-8f81-11ef-ac6c-69b43cd19236",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e82ad8d0-8f81-11ef-ac6c-69b43cd19236"
                        },
                        {
                            "id": "9337fcf0-8f8f-11ef-889c-8762100ea0c6",
                            "questionRef": "conocesdigimon",
                            "typeCondition": ConditionType.LOGICAL,
                            "typeOperator": OperatorType.EQUAL,
                            "value": ["No"],
                            "transition": TransitionType.REDIRECT,
                            "transitionDestiny": "https://digimon.fandom.com/wiki/Digimon",
                            "status": StatusType.ACTIVE,
                            "generatedAt": new Date(),
                            "updatedAt": new Date(),
                            "integrationPageId": "e82ad8d0-8f81-11ef-ac6c-69b43cd19236"
                        }
                    ]
                },
                {
                    "id": "e9f4ea70-8f81-11ef-ac6c-69b43cd19236",
                    "position": 5,
                    "generatedAt": "2024-10-21T07:56:01.047Z",
                    "updatedAt": "2024-10-21T07:56:01.047Z",
                    "status": "ACTIVE",
                    "integrationId": "dd97c900-8f81-11ef-ac6c-69b43cd19236",
                    "integrationQuestions": [questions[4]],
                    "integrationPageRoutes": []
                }
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Test a simple tree without followups and conditions', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, '2', '1', ConditionType.LOGICAL),
                    new PageRoute('2', '1', OperatorType.EQUAL, ['B'], TransitionType.PAGE, '3', '1', ConditionType.LOGICAL),
                    new PageRoute('3', '1', OperatorType.EQUAL, ['C'], TransitionType.PAGE, '4', '1', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], [
                    // Finish
                    new PageRoute('1', '2', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '2', ConditionType.DIRECT),
                ]),
                new Page('3', 3, 'integration', [questions[2]], [
                    // Go to 5
                    new PageRoute('1', '3', OperatorType.DEFAULT, [''], TransitionType.PAGE, '5', '3'),
                ]),
                new Page('4', 4, 'integration', [questions[3]], []),
                new Page('5', 5, 'integration', [questions[4]], []),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Test a simple tree with followups and conditions', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, true),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, '2', '1', ConditionType.LOGICAL),
                    new PageRoute('2', '1', OperatorType.EQUAL, ['B'], TransitionType.PAGE, '3', '1', ConditionType.LOGICAL),
                    new PageRoute('3', '1', OperatorType.EQUAL, ['C'], TransitionType.PAGE, '4', '1', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], [
                    // Finish
                    new PageRoute('1', '2', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '2', ConditionType.DIRECT),
                ]),
                new Page('3', 3, 'integration', [questions[2]], [
                    // Finish
                    new PageRoute('1', '3', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '3', ConditionType.DIRECT),
                ]),
                new Page('4', 4, 'integration', [questions[3]], [
                    // Finish
                    new PageRoute('1', '4', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '4', ConditionType.DIRECT),
                ]),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Test a simple tree with end route and conditions', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false)
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, '2', '1', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], [
                    new PageRoute('1', '2', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, '3', '2'),
                    new PageRoute('2', '2', OperatorType.EQUAL, ['No'], TransitionType.FINISH, '', '2'),
                ]),
                new Page('3', 3, 'integration', [questions[2]], []),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Test a simple tree with end route and conditions', async () => {
            const questions: NativeQuestion[] = [
                {
                    "id": "a223e5d0-7b26-11ef-aeb6-b58621afb324",
                    "title": "Hvor tilfreds er du overordnet med Club Matas?",
                    "ref": "1hvortilfredserduoverordnetmedclubmatas",
                    "refMetric": "Club Matas satisfaction",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 1,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "a220b180-7b26-11ef-aeb6-b58621afb324",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "4adddfe0-7fce-11ef-9d44-296ad8bb32b2",
                    "title": "Hvad er de vigtigste grunde til, at du er med i Club Matas?",
                    "ref": "hvaderdevigtigstegrundetilatduermediclubmatas",
                    "refMetric": "Club Matas",
                    "require": true,
                    "external_id": "",
                    "value": [
                        "Jeg kan optjene point med Club Matas",
                        "Jeg kan konvertere mine point til kontantrabatter i Matas, på matas.dk og i Club Matas app'en",
                        "Jeg kan deltage i spændende konkurrencer",
                        "Jeg kan komme til events i min Matas",
                        "Jeg får en tættere tilknytning til min lokale Matas",
                        "Jeg kan komme til eksklusive events som koncerter, biografture, skønhedsevents mm.",
                        "Jeg får gode og målrettede tilbud",
                        "Jeg får gode tips og råd, der er relevante for mig",
                        "Jeg hører om alle de vigtigste produktnyheder"
                    ],
                    "defaultValue": "",
                    "position": 2,
                    "followup": false,
                    "assets": {
                        "extraOption": false,
                        "extraOptionText": "Andet,noter her",
                        "maxOptions": 3,
                        "general": ""
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "MULTIPLECHOICE" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "4adaab90-7fce-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "4c8c7a40-7fce-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor sandsynligt er det, at du vil anbefale Club Matas til en ven, kollega eller et familiemedlem?",
                    "ref": "hvorsandsynligterdetatduvilanbefaleclubmatastilenvenkollegaelleretfamiliemedlem",
                    "refMetric": "recommend friend",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 3,
                    "followup": false,
                    "assets": {
                        "min": "0",
                        "max": "10",
                        "minPlaceholder": "Vil helt sikkert ikke anbefale",
                        "maxPlaceholder": "Vil helt sikkert anbefale",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "4c896d00-7fce-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "4e36f5f0-7fce-11ef-9d44-296ad8bb32b2",
                    "title": "Hvad synes du, vi kan forbedre?",
                    "ref": "hvadsynesduvikanforbedre",
                    "refMetric": "improve",
                    "require": false,
                    "external_id": "",
                    "value": [
                        "Club Matas appen",
                        "Bedre tilbud",
                        "Vareprøver i forbindelse med køb på Club Matas medlemskortet",
                        "Club Matas events i Matas butikkerne",
                        "Muligheden for at deltage i særlige events som koncerter, biografture og skønhedsevents",
                        "Muligheden for at deltage i relevante konkurrencer",
                        "Vilkår for optjening og brug af point",
                        "Flere og mere relevante fordele",
                        "Frekvensen af Club Matas e-mails og push -beskeder",
                        "Relevansen af indhold i Club Matas e-mails og push-beskeder",
                        "Relevansen af indhold på Facebook og Instagram",
                        "Hurtigere svar fra kundeservice"
                    ],
                    "defaultValue": "",
                    "position": 4,
                    "followup": false,
                    "assets": {
                        "extraOption": true,
                        "extraOptionText": "Andet,noter her",
                        "maxOptions": 3,
                        "general": ""
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "MULTIPLECHOICE" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "4e33c1a0-7fce-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "4f7ae7a0-7fce-11ef-9d44-296ad8bb32b2",
                    "title": "Hvad synes du, vi kan forbedre?",
                    "ref": "hvadsynesduvikanforbedre1",
                    "refMetric": "improve",
                    "require": false,
                    "external_id": "",
                    "value": [
                        "Club Matas appen",
                        "Bedre tilbud",
                        "Vareprøver i forbindelse med køb på Club Matas medlemskortet",
                        "Club Matas events i Matas butikkerne",
                        "Muligheden for at deltage i særlige events som koncerter, biografture og skønhedsevents",
                        "Muligheden for at deltage i relevante konkurrencer",
                        "Vilkår for optjening og brug af point",
                        "Flere og mere relevante fordele",
                        "Frekvensen af Club Matas e-mails og push -beskeder",
                        "Relevansen af indhold i Club Matas e-mails og push-beskeder",
                        "Relevansen af indhold på Facebook og Instagram",
                        " Hurtigere svar fra kundeservice"
                    ],
                    "defaultValue": "",
                    "position": 5,
                    "followup": false,
                    "assets": {
                        "extraOption": true,
                        "extraOptionText": "Andet,noter her",
                        "maxOptions": 3,
                        "general": ""
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "MULTIPLECHOICE" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "4f77b350-7fce-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "51009d40-7fce-11ef-9d44-296ad8bb32b2",
                    "title": "Hvad synes du, vi kan forbedre?",
                    "ref": "hvadsynesduvikanforbedre2",
                    "refMetric": "improve",
                    "require": false,
                    "external_id": "",
                    "value": [
                        "Club Matas appen",
                        "Bedre tilbud",
                        "Vareprøver i forbindelse med køb på Club Matas medlemskortet",
                        "Club Matas events i Matas butikkerne",
                        "Muligheden for at deltage i særlige events som koncerter, biografture og skønhedsevents",
                        "Muligheden for at deltage i relevante konkurrencer",
                        "Vilkår for optjening og brug af point",
                        "Flere og mere relevante fordele",
                        "Frekvensen af Club Matas e-mails og push -beskeder",
                        "Relevansen af indhold i Club Matas e-mails og push-beskeder",
                        "Relevansen af indhold på Facebook og Instagram",
                        "Hurtigere svar fra kundeservice"
                    ],
                    "defaultValue": "",
                    "position": 6,
                    "followup": false,
                    "assets": {
                        "extraOption": true,
                        "extraOptionText": "Andet,noter her",
                        "maxOptions": 3,
                        "general": ""
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "MULTIPLECHOICE" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "50fd68f0-7fce-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "52afacd0-7fce-11ef-9d44-296ad8bb32b2",
                    "title": "Hvordan er din tilfredshed med dit medlemskab i Club Matas sammenlignet med samme periode sidste år?",
                    "ref": "hvordanerdintilfredshedmedditmedlemskabiclubmatassammenlignetmedsammeperiodesidster",
                    "refMetric": "membership satisfaction",
                    "require": true,
                    "external_id": "",
                    "value": [
                        "Mere tilfreds end samme tidspunkt sidste år",
                        "Uændret",
                        "Mindre tilfreds end samme tidspunkt sidste år"
                    ],
                    "defaultValue": "",
                    "position": 7,
                    "followup": false,
                    "assets": {
                        "extraOption": false,
                        "extraOptionText": "I don't know",
                        "extraOptionPlaceholder": "Custom option",
                        "general": ""
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RADIO" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "52ac7880-7fce-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "54122300-7fce-11ef-9d44-296ad8bb32b2",
                    "title": "Angiv venligst, hvilken kanal du oftest anvender, når du opsøger information om tilbud, konkurrencer, events mm. fra Club Matas",
                    "ref": "angivvenligsthvilkenkanalduoftestanvendernrduopsgerinformationomtilbudkonkurrencereventsmmfraclubmatas",
                    "refMetric": "information channel",
                    "require": true,
                    "external_id": "",
                    "value": [
                        "Club Matas e-mail",
                        "Club Matas appen",
                        "matas.dk",
                        "Matas' Facebook side",
                        "Matas' Instagram profil"
                    ],
                    "defaultValue": "",
                    "position": 8,
                    "followup": false,
                    "assets": {
                        "extraOption": false,
                        "extraOptionText": "I don't know",
                        "extraOptionPlaceholder": "Custom option",
                        "general": ""
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RADIO" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "540f15c0-7fce-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "c8d4f760-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor tilfreds er du overordnet med Club Matas e-mails?",
                    "ref": "hvortilfredserduoverordnetmedclubmatasemails",
                    "refMetric": "email satisfaction",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 9,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds\"",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "c8d1c310-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "cae42850-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor relevante finder du de udsendte Club Matas e-mails?",
                    "ref": "hvorrelevantefinderdudeudsendteclubmatasemails",
                    "refMetric": "relevant Club Matas emails",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 10,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds\"",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "cae0f400-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "cc8702e0-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvad synes du om frekvensen af Club Matas e-mails?",
                    "ref": "hvadsynesduomfrekvensenafclubmatasemails",
                    "refMetric": "frequency club matas emails",
                    "require": true,
                    "external_id": "",
                    "value": [
                        "Der kommer for få e-mails",
                        "Der kommer tilpas med e-mails",
                        "Der kommer for mange e-mails"
                    ],
                    "defaultValue": "",
                    "position": 11,
                    "followup": false,
                    "assets": {
                        "extraOption": false,
                        "extraOptionText": "I don't know",
                        "extraOptionPlaceholder": "Custom option",
                        "general": ""
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RADIO" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "cc83ce90-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "ce4b4820-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor tilfreds er du med Club Matas appen?",
                    "ref": "hvortilfredserdumedclubmatasappen",
                    "refMetric": "app satisfaction",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 12,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds\"",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "ce3c2cf0-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "d062b670-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor tilfreds er du med matas.dk?",
                    "ref": "hvortilfredserdumedmatasdk",
                    "refMetric": "matas.dk satisfaction",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 13,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds\"",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "d05f5b10-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "d23098a0-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor tilfreds er du med Matas' Facebook side?",
                    "ref": "hvortilfredserdumedmatasfacebookside",
                    "refMetric": "Matas Facebook",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 14,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds\"",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "d22d6450-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "d3d9dbd0-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor tilfreds er du med Matas' Instagram profil?",
                    "ref": "hvortilfredserdumedmatasinstagramprofil",
                    "refMetric": "Matas Instagram",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 15,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds\"",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "d3d6a780-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "d5867a60-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Har du inden for det sidste år været i kontakt med kundeservice?",
                    "ref": "harduindenfordetsidstervretikontaktmedkundeservice",
                    "refMetric": "customer service",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 16,
                    "followup": false,
                    "assets": {
                        "addIcon": false
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "BOOLEAN" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                },
                {
                    "id": "d7327cb0-7fd0-11ef-9d44-296ad8bb32b2",
                    "title": "Hvor tilfreds var du med din kontakt til kundeservice?",
                    "ref": "hvortilfredsvardumeddinkontakttilkundeservice",
                    "refMetric": "customer service satisfaction",
                    "require": true,
                    "external_id": "",
                    "value": [],
                    "defaultValue": "",
                    "position": 17,
                    "followup": false,
                    "assets": {
                        "min": "1",
                        "max": "5",
                        "minPlaceholder": "Slet ikke tilfreds\"",
                        "maxPlaceholder": "Meget tilfreds",
                        "extraOption": false,
                        "extraOptionText": "?"
                    },
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "type": "RATING_NUMBER" as FEEDBACKAPPANSWERTYPE,
                    "integrationPageId": "d72f4860-7fd0-11ef-9d44-296ad8bb32b2",
                    "questionType": {
                        "conf": null
                    }
                }
            ];

            const pages: Page[] = [
                {
                    "id": "a220b180-7b26-11ef-aeb6-b58621afb324",
                    "position": 1,
                    "generatedAt": "2024-09-25T10:12:13.080Z",
                    "updatedAt": "2024-09-25T10:12:13.080Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[0]],
                    "integrationPageRoutes": [
                        {
                            "id": "a220b180-7b26-11ef-aeb6-b58621afb324-default",
                            "questionRef": "1hvortilfredserduoverordnetmedclubmatas",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "DEFAULT" as OperatorType,
                            "value": [""],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "4adaab90-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "a220b180-7b26-11ef-aeb6-b58621afb324"
                        }
                    ]
                },
                {
                    "id": "4adaab90-7fce-11ef-9d44-296ad8bb32b2",
                    "position": 2,
                    "generatedAt": "2024-10-01T08:22:26.760Z",
                    "updatedAt": "2024-10-01T08:22:26.760Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[1]],
                    "integrationPageRoutes": [
                        {
                            "id": "4adaab90-7fce-11ef-9d44-296ad8bb32b2-default",
                            "questionRef": "hvaderdevigtigstegrundetilatduermediclubmatas",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "DEFAULT" as OperatorType,
                            "value": [""],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "4c896d00-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "4adaab90-7fce-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "4c896d00-7fce-11ef-9d44-296ad8bb32b2",
                    "position": 3,
                    "generatedAt": "2024-10-01T08:22:29.584Z",
                    "updatedAt": "2024-10-01T08:22:29.584Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[2]],
                    "integrationPageRoutes": [
                        {
                            "id": "3f08ce00-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvorsandsynligterdetatduvilanbefaleclubmatastilenvenkollegaelleretfamiliemedlem",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "LESSEQUAL" as OperatorType,
                            "value": ["6"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "4e33c1a0-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "4c896d00-7fce-11ef-9d44-296ad8bb32b2"
                        },
                        {
                            "id": "4c0f9cf0-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvorsandsynligterdetatduvilanbefaleclubmatastilenvenkollegaelleretfamiliemedlem",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "LESSEQUAL" as OperatorType,
                            "value": ["8"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "4f77b350-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "4c896d00-7fce-11ef-9d44-296ad8bb32b2"
                        },
                        {
                            "id": "59594140-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvorsandsynligterdetatduvilanbefaleclubmatastilenvenkollegaelleretfamiliemedlem",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "GREATEREQUAL" as OperatorType,
                            "value": ["9"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "50fd68f0-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "4c896d00-7fce-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "4e33c1a0-7fce-11ef-9d44-296ad8bb32b2",
                    "position": 4,
                    "generatedAt": "2024-10-01T08:22:32.377Z",
                    "updatedAt": "2024-10-01T08:22:32.377Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[3]],
                    "integrationPageRoutes": [
                        {
                            "id": "c79c5610-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvadsynesduvikanforbedre",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "52ac7880-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "4e33c1a0-7fce-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "4f77b350-7fce-11ef-9d44-296ad8bb32b2",
                    "position": 5,
                    "generatedAt": "2024-10-01T08:22:34.501Z",
                    "updatedAt": "2024-10-01T08:22:34.501Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[4]],
                    "integrationPageRoutes": [
                        {
                            "id": "c34e58b0-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvadsynesduvikanforbedre1",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "52ac7880-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "4f77b350-7fce-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "50fd68f0-7fce-11ef-9d44-296ad8bb32b2",
                    "position": 6,
                    "generatedAt": "2024-10-01T08:22:37.055Z",
                    "updatedAt": "2024-10-01T08:22:37.055Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[5]],
                    "integrationPageRoutes": [
                        {
                            "id": "bcbfe130-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvadsynesduvikanforbedre2",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "52ac7880-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "50fd68f0-7fce-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "52ac7880-7fce-11ef-9d44-296ad8bb32b2",
                    "position": 7,
                    "generatedAt": "2024-10-01T08:22:39.880Z",
                    "updatedAt": "2024-10-01T08:22:39.880Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[6]],
                    "integrationPageRoutes": [
                        {
                            "id": "52ac7880-7fce-11ef-9d44-296ad8bb32b2-default",
                            "questionRef": "hvordanerdintilfredshedmedditmedlemskabiclubmatassammenlignetmedsammeperiodesidster",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "DEFAULT" as OperatorType,
                            "value": [""],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "540f15c0-7fce-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "52ac7880-7fce-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "540f15c0-7fce-11ef-9d44-296ad8bb32b2",
                    "position": 8,
                    "generatedAt": "2024-10-01T08:22:42.203Z",
                    "updatedAt": "2024-10-01T08:22:42.203Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[7]],
                    "integrationPageRoutes": [
                        {
                            "id": "2d8d9880-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "angivvenligsthvilkenkanalduoftestanvendernrduopsgerinformationomtilbudkonkurrencereventsmmfraclubmatas",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "EQUAL" as OperatorType,
                            "value": ["Club Matas e-mail"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "c8d1c310-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "540f15c0-7fce-11ef-9d44-296ad8bb32b2"
                        },
                        {
                            "id": "3bac1900-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "angivvenligsthvilkenkanalduoftestanvendernrduopsgerinformationomtilbudkonkurrencereventsmmfraclubmatas",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "EQUAL" as OperatorType,
                            "value": ["Club Matas appen"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "ce3c2cf0-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "540f15c0-7fce-11ef-9d44-296ad8bb32b2"
                        },
                        {
                            "id": "456e6b50-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "angivvenligsthvilkenkanalduoftestanvendernrduopsgerinformationomtilbudkonkurrencereventsmmfraclubmatas",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "EQUAL" as OperatorType,
                            "value": ["matas.dk"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d05f5b10-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "540f15c0-7fce-11ef-9d44-296ad8bb32b2"
                        },
                        {
                            "id": "4efa9270-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "angivvenligsthvilkenkanalduoftestanvendernrduopsgerinformationomtilbudkonkurrencereventsmmfraclubmatas",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "EQUAL" as OperatorType,
                            "value": ["Matas' Facebook side"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d22d6450-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "540f15c0-7fce-11ef-9d44-296ad8bb32b2"
                        },
                        {
                            "id": "593919a0-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "angivvenligsthvilkenkanalduoftestanvendernrduopsgerinformationomtilbudkonkurrencereventsmmfraclubmatas",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "EQUAL" as OperatorType,
                            "value": ["Matas' Instagram profil"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d3d6a780-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "540f15c0-7fce-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "c8d1c310-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 9,
                    "generatedAt": "2024-10-01T08:40:17.089Z",
                    "updatedAt": "2024-10-01T08:40:17.089Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[8]],
                    "integrationPageRoutes": [
                        {
                            "id": "76c46c90-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvortilfredserduoverordnetmedclubmatasemails",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "cae0f400-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "c8d1c310-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "cae0f400-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 10,
                    "generatedAt": "2024-10-01T08:40:20.543Z",
                    "updatedAt": "2024-10-01T08:40:20.543Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[9]],
                    "integrationPageRoutes": [
                        {
                            "id": "83b8c4f0-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvorrelevantefinderdudeudsendteclubmatasemails",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "cc83ce90-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "cae0f400-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "cc83ce90-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 11,
                    "generatedAt": "2024-10-01T08:40:23.289Z",
                    "updatedAt": "2024-10-01T08:40:23.289Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[10]],
                    "integrationPageRoutes": [
                        {
                            "id": "90cf4b50-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvadsynesduomfrekvensenafclubmatasemails",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "cc83ce90-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "ce3c2cf0-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 12,
                    "generatedAt": "2024-10-01T08:40:26.175Z",
                    "updatedAt": "2024-10-01T08:40:26.175Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[11]],
                    "integrationPageRoutes": [
                        {
                            "id": "97cfbe80-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvortilfredserdumedclubmatasappen",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "ce3c2cf0-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "d05f5b10-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 13,
                    "generatedAt": "2024-10-01T08:40:29.760Z",
                    "updatedAt": "2024-10-01T08:40:29.760Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[12]],
                    "integrationPageRoutes": [
                        {
                            "id": "9d1d9fb0-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvortilfredserdumedmatasdk",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "d05f5b10-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "d22d6450-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 14,
                    "generatedAt": "2024-10-01T08:40:32.788Z",
                    "updatedAt": "2024-10-01T08:40:32.788Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[13]],
                    "integrationPageRoutes": [
                        {
                            "id": "a0f20040-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvortilfredserdumedmatasfacebookside",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "d22d6450-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "d3d6a780-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 15,
                    "generatedAt": "2024-10-01T08:40:35.576Z",
                    "updatedAt": "2024-10-01T08:40:35.576Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[14]],
                    "integrationPageRoutes": [
                        {
                            "id": "a5282fe0-802e-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "hvortilfredserdumedmatasinstagramprofil",
                            "typeCondition": "DIRECT" as ConditionType,
                            "typeOperator": "NOEQUAL" as OperatorType,
                            "value": [" "],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "d3d6a780-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 16,
                    "generatedAt": "2024-10-01T08:40:38.385Z",
                    "updatedAt": "2024-10-01T08:40:38.385Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[15]],
                    "integrationPageRoutes": [
                        {
                            "id": "f6d20f60-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "harduindenfordetsidstervretikontaktmedkundeservice",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "EQUAL" as OperatorType,
                            "value": ["Nej"],
                            "transition": "FINISH" as TransitionType,
                            "transitionDestiny": "",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2"
                        },
                        {
                            "id": "f6d20f60-802d-11ef-8d28-ad2ad1c5fced",
                            "questionRef": "harduindenfordetsidstervretikontaktmedkundeservice",
                            "typeCondition": "LOGICAL" as ConditionType,
                            "typeOperator": "EQUAL" as OperatorType,
                            "value": ["Ja"],
                            "transition": "PAGE" as TransitionType,
                            "transitionDestiny": "d72f4860-7fd0-11ef-9d44-296ad8bb32b2",
                            "status": "ACTIVE" as StatusType,
                            "integrationPageId": "d5836d20-7fd0-11ef-9d44-296ad8bb32b2"
                        }
                    ]
                },
                {
                    "id": "d72f4860-7fd0-11ef-9d44-296ad8bb32b2",
                    "position": 17,
                    "generatedAt": "2024-10-01T08:40:41.190Z",
                    "updatedAt": "2024-10-01T08:40:41.190Z",
                    "status": "ACTIVE",
                    "integrationId": "a04a43d0-7b26-11ef-aeb6-b58621afb324",
                    "integrationQuestions": [questions[16]]
                }
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(11);
        });

        test('Danske Spil', () => {
            const pages: Page[] = [
                {
                    "id": "f8231730-5f01-11ef-80af-cf192451cfe3",
                    "position": 1,
                    "generatedAt": "2024-08-20T14:39:13.443Z",
                    "updatedAt": "2024-08-20T14:39:13.443Z",
                    "status": "ACTIVE",
                    "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                    "integrationQuestions": [
                        {
                            "id": "f8289570-5f01-11ef-80af-cf192451cfe3",
                            "title": "Hvordan vil du vurdere din oplevelse med vores nye Danske Spil Casino-app?",
                            "ref": "bedmvenligstdinoplevelseidanskespilcasinoappenidag",
                            "refMetric": "rate app experience",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 1,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Meget dårlig oplevelse",
                                "maxPlaceholder": "Meget god oplevelse",
                                "extraOption": false,
                                "extraOptionText": "?"
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                            "type": "RATING_EMOJI",
                            "integrationPageId": "f8231730-5f01-11ef-80af-cf192451cfe3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ]
                },
                {
                    "id": "f9eefd90-5f01-11ef-80af-cf192451cfe3",
                    "position": 2,
                    "generatedAt": "2024-08-20T14:39:16.456Z",
                    "updatedAt": "2024-08-20T14:39:16.456Z",
                    "status": "ACTIVE",
                    "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                    "integrationQuestions": [
                        {
                            "id": "f9f47bd0-5f01-11ef-80af-cf192451cfe3",
                            "title": "Hvad kan vi gøre for at forbedre din oplevelse i vores nye Danske Spil Casino-app?",
                            "ref": "hvadkanvigreforatforbedredinoplevelseivoresnyedanskespilcasinoapp",
                            "refMetric": "improve app",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 2,
                            "followup": true,
                            "assets": {
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                            "type": "TEXT",
                            "integrationPageId": "f9eefd90-5f01-11ef-80af-cf192451cfe3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ]
                },
                {
                    "id": "fbb369e0-5f01-11ef-80af-cf192451cfe3",
                    "position": 3,
                    "generatedAt": "2024-08-20T14:39:19.422Z",
                    "updatedAt": "2024-08-20T14:39:19.422Z",
                    "status": "ACTIVE",
                    "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                    "integrationQuestions": [
                        {
                            "id": "fbb8e820-5f01-11ef-80af-cf192451cfe3",
                            "title": "Hvad synes du bedst om ved vores nye Danske Spil Casino-app?",
                            "ref": "hvadsynesdubedstomvedvoresnyedanskespilcasinoapp",
                            "refMetric": "Danske Spil Casino app",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 3,
                            "followup": true,
                            "assets": {
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                            "type": "TEXT",
                            "integrationPageId": "fbb369e0-5f01-11ef-80af-cf192451cfe3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ]
                },
                {
                    "id": "fd934d70-5f01-11ef-80af-cf192451cfe3",
                    "position": 4,
                    "generatedAt": "2024-08-20T14:39:22.566Z",
                    "updatedAt": "2024-08-20T14:39:22.567Z",
                    "status": "ACTIVE",
                    "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                    "integrationQuestions": [
                        {
                            "id": "fd98cbb0-5f01-11ef-80af-cf192451cfe3",
                            "title": "Må vi kontakte dig, hvis vi har uddybende spørgsmål til din feedback?",
                            "ref": "mvikontaktedighvisviharuddybendesprgsmltildinfeedback",
                            "refMetric": "contact feedback",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 4,
                            "followup": false,
                            "assets": {
                                "addIcon": false
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                            "type": "BOOLEAN",
                            "integrationPageId": "fd934d70-5f01-11ef-80af-cf192451cfe3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "b2574bf0-5ff0-11ef-a22c-af4a80cbf38f",
                            "questionRef": "mvikontaktedighvisviharuddybendesprgsmltildinfeedback",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "EQUAL",
                            "value": ["Nej"],
                            "transition": "FINISH",
                            "transitionDestiny": null,
                            "status": "ACTIVE",
                            "generatedAt": "2024-08-21T19:08:06.062Z",
                            "updatedAt": "2024-08-21T19:08:06.062Z",
                            "integrationPageId": "fd934d70-5f01-11ef-80af-cf192451cfe3"
                        },
                        {
                            "id": "",
                            "questionRef": "mvikontaktedighvisviharuddybendesprgsmltildinfeedback",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "EQUAL",
                            "value": ["Ja"],
                            "transition": "PAGE",
                            "transitionDestiny": "ff621a00-5f01-11ef-80af-cf192451cfe3",
                            "status": "ACTIVE",
                            "generatedAt": "2024-08-21T19:08:06.062Z",
                            "updatedAt": "2024-08-21T19:08:06.062Z",
                            "integrationPageId": "fd934d70-5f01-11ef-80af-cf192451cfe3"
                        }
                    ]
                },
                {
                    "id": "ff621a00-5f01-11ef-80af-cf192451cfe3",
                    "position": 5,
                    "generatedAt": "2024-08-20T14:39:25.600Z",
                    "updatedAt": "2024-08-20T14:39:25.600Z",
                    "status": "ACTIVE",
                    "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                    "integrationQuestions": [
                        {
                            "id": "ff67bf50-5f01-11ef-80af-cf192451cfe3",
                            "title": "Kontaktoplysninger",
                            "ref": "kontaktoplysninger",
                            "refMetric": "contact information",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 5,
                            "followup": false,
                            "assets": {},
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "f6260eb0-5f01-11ef-80af-cf192451cfe3",
                            "type": "CONTACT",
                            "integrationPageId": "ff621a00-5f01-11ef-80af-cf192451cfe3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ]
                }
            ]

           // console.log(validatePage(pages))

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(7);
        });

        test('Matas - Instore (Blue+Life)', () => {
            const pages: Page[] = [
                {
                    "id": "603762a0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 1,
                    "generatedAt": "2024-07-18T07:14:30.413Z",
                    "updatedAt": "2024-07-18T07:14:30.413Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "d97d93d0-3974-11ef-bc8f-15d3d6c704f0",
                            "title": "Baseret på dit seneste besøg i butikken, hvor sandsynligt er det, at du vil anbefale Matas til en ven, kollega eller et familiemedlem? ",
                            "ref": "recommend_friend",
                            "refMetric": "recommend friend",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 1,
                            "followup": false,
                            "assets": {
                                "min": "0",
                                "max": "10",
                                "minPlaceholder": "Vil helt sikkert ikke anbefale",
                                "maxPlaceholder": "Vil helt sikkert anbefale",
                                "extraOption": false,
                                "extraOptionText": "?",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "603762a0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "506f66e0-4f54-11ef-94b3-c19773a907c3",
                            "questionRef": "recommend_friend",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "LESSEQUAL",
                            "value": ["6"],
                            "transition": "PAGE",
                            "transitionDestiny": "3c91fb40-4f51-11ef-94b3-c19773a907c3",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-31T15:48:21.709Z",
                            "updatedAt": "2024-07-31T15:48:21.709Z",
                            "integrationPageId": "603762a0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "5e2d50d0-4f54-11ef-94b3-c19773a907c3",
                            "questionRef": "recommend_friend",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "GREATEREQUAL",
                            "value": ["9"],
                            "transition": "PAGE",
                            "transitionDestiny": "420565d0-4f51-11ef-94b3-c19773a907c3",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-31T15:48:44.764Z",
                            "updatedAt": "2024-07-31T15:48:44.764Z",
                            "integrationPageId": "603762a0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "7b3ff150-4f54-11ef-94b3-c19773a907c3",
                            "questionRef": "recommend_friend",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "INQ",
                            "value": ['7','8'],
                            "transition": "PAGE",
                            "transitionDestiny": "406a0550-4f51-11ef-94b3-c19773a907c3",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-31T15:49:33.540Z",
                            "updatedAt": "2024-07-31T15:49:33.540Z",
                            "integrationPageId": "603762a0-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "3c91fb40-4f51-11ef-94b3-c19773a907c3",
                    "position": 2,
                    "generatedAt": "2024-07-31T15:26:19.891Z",
                    "updatedAt": "2024-07-31T15:26:19.891Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "3c952f90-4f51-11ef-94b3-c19773a907c3",
                            "title": "Hvad burde vi ændre, for at du gav en højere bedømmelse?",
                            "ref": "recommend_friend_06",
                            "refMetric": "improve rating",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 2,
                            "followup": false,
                            "assets": {
                                "maxCharacters": 0,
                                "extraOption": false,
                                "extraOptionText": "I don't know",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "LONGTEXT",
                            "integrationPageId": "3c91fb40-4f51-11ef-94b3-c19773a907c3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "062b0a10-4385-11ef-a484-0b1c3cf0c922",
                            "questionRef": "recommend_friend_06",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "NOEQUAL",
                            "value": [" "],
                            "transition": "PAGE",
                            "transitionDestiny": "9aed71f0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-31T15:49:33.540Z",
                            "updatedAt": "2024-07-31T15:49:33.540Z",
                            "integrationPageId": "3c91fb40-4f51-11ef-94b3-c19773a907c3"
                        }
                    ]
                },
                {
                    "id": "406a0550-4f51-11ef-94b3-c19773a907c3",
                    "position": 3,
                    "generatedAt": "2024-07-31T15:26:26.341Z",
                    "updatedAt": "2024-07-31T15:26:26.341Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "406d39a0-4f51-11ef-94b3-c19773a907c3",
                            "title": "Er der noget, vi kunne have gjort anderledes for at øge din tilfredshed?",
                            "ref": "recommend_friend_78",
                            "refMetric": "improve satisfaction",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 3,
                            "followup": false,
                            "assets": {
                                "maxCharacters": 0,
                                "extraOption": false,
                                "extraOptionText": "I don't know",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "LONGTEXT",
                            "integrationPageId": "406a0550-4f51-11ef-94b3-c19773a907c3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "062b0a10-4385-11ef-a484-0b1c3cf0c923",
                            "questionRef": "recommend_friend_78",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "NOEQUAL",
                            "value": [" "],
                            "transition": "PAGE",
                            "transitionDestiny": "9aed71f0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-31T15:49:33.540Z",
                            "updatedAt": "2024-07-31T15:49:33.540Z",
                            "integrationPageId": "406a0550-4f51-11ef-94b3-c19773a907c3"
                        }
                    ]
                },
                {
                    "id": "420565d0-4f51-11ef-94b3-c19773a907c3",
                    "position": 4,
                    "generatedAt": "2024-07-31T15:26:29.036Z",
                    "updatedAt": "2024-07-31T15:26:29.036Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "42087310-4f51-11ef-94b3-c19773a907c3",
                            "title": "Hvor er vi glade for, at du gerne vil anbefale os til andre. Uddyb gerne hvad vi gjorde godt, så vi kan gøre det igen næste gang.",
                            "ref": "recommend_friend_910",
                            "refMetric": "recommend",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 4,
                            "followup": false,
                            "assets": {
                                "maxCharacters": 0,
                                "extraOption": false,
                                "extraOptionText": "I don't know",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "LONGTEXT",
                            "integrationPageId": "420565d0-4f51-11ef-94b3-c19773a907c3",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "420565d0-4f51-11ef-94b3-c19773a907c3-default",
                            "questionRef": "recommend_friend_910",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "9aed71f0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "420565d0-4f51-11ef-94b3-c19773a907c3"
                        }
                    ]
                },
                {
                    "id": "9aed71f0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 5,
                    "generatedAt": "2024-07-18T07:16:08.974Z",
                    "updatedAt": "2024-07-18T07:16:08.974Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "22bb6cc0-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "I hvor høj grad følte du dig velkommen, da du kom ind i butikken?",
                            "ref": "welcome_enter_store",
                            "refMetric": "welcome shop",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 5,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": " I høj grad",
                                "extraOption": false,
                                "extraOptionText": "",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "9aed71f0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "44d700d0-44e7-11ef-aef4-21d091aeb757",
                            "questionRef": "welcome_enter_store",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "LESSEQUAL",
                            "value": ["2"],
                            "transition": "PAGE",
                            "transitionDestiny": "a14bffd0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:22:35.484Z",
                            "updatedAt": "2024-07-18T09:22:35.484Z",
                            "integrationPageId": "9aed71f0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "44d700d0-44e7-11ef-aef4-21d091aeb756",
                            "questionRef": "welcome_enter_store",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "GREATEREQUAL",
                            "value": ["3"],
                            "transition": "PAGE",
                            "transitionDestiny": "a64f1c60-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:22:35.484Z",
                            "updatedAt": "2024-07-18T09:22:35.484Z",
                            "integrationPageId": "9aed71f0-44d5-11ef-a292-8f2d6fb37963"
                        },
                    ]
                },
                {
                    "id": "a14bffd0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 6,
                    "generatedAt": "2024-07-18T07:16:19.661Z",
                    "updatedAt": "2024-07-18T07:16:19.661Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "245fcdf0-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "Hvorfor følte du dig ikke velkommen?",
                            "ref": "why_not_welcome",
                            "refMetric": "feel welcome",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 6,
                            "followup": false,
                            "assets": {
                                "placeholder": "",
                                "maxCharacters": "",
                                "extraOption": "",
                                "extraOptionText": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "LONGTEXT",
                            "integrationPageId": "a14bffd0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "a14bffd0-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "why_not_welcome",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "a64f1c60-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "a14bffd0-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "a64f1c60-44d5-11ef-a292-8f2d6fb37963",
                    "position": 7,
                    "generatedAt": "2024-07-18T07:16:28.070Z",
                    "updatedAt": "2024-07-18T07:16:28.070Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "260cbaa0-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "I hvor høj grad fik du den hjælp og rådgivning fra butikkens medarbejdere, som du havde brug for? ",
                            "ref": "help_and_advice_needed",
                            "refMetric": "help advice",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 7,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": "I høj grad",
                                "extraOption": true,
                                "extraOptionText": "Ikke relevant",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "a64f1c60-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "a64f1c60-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "help_and_advice_needed",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "abe61480-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "a64f1c60-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "abe61480-44d5-11ef-a292-8f2d6fb37963",
                    "position": 8,
                    "generatedAt": "2024-07-18T07:16:37.448Z",
                    "updatedAt": "2024-07-18T07:16:37.448Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "4f4ba890-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "I hvor høj grad blev du inspireret af butikkens medarbejdere til at købe produkter, som du ikke havde planlagt?",
                            "ref": "extent_to_buy_not_planned",
                            "refMetric": "unplanned purchase inspiration",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 8,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": " I høj grad",
                                "extraOption": false,
                                "extraOptionText": "",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "abe61480-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "abe61480-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "extent_to_buy_not_planned",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "b1547600-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "abe61480-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "b1547600-44d5-11ef-a292-8f2d6fb37963",
                    "position": 9,
                    "generatedAt": "2024-07-18T07:16:46.560Z",
                    "updatedAt": "2024-07-18T07:16:46.560Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "50e4e630-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "I hvor høj grad tog medarbejderne venligt afsked med dig? ",
                            "ref": "employess_say_goodbye_to_you",
                            "refMetric": "farewell",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 9,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": "I høj grad",
                                "extraOption": false,
                                "extraOptionText": "?"
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "b1547600-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "b1547600-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "employess_say_goodbye_to_you",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "b6d91ea0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "b1547600-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "b6d91ea0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 10,
                    "generatedAt": "2024-07-18T07:16:55.817Z",
                    "updatedAt": "2024-07-18T07:16:55.817Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "cd16e000-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "I hvor høj grad synes du, at butikken er overskuelig og det er nemt at finde det, du søger? ",
                            "ref": "clean_and_easy_to_find",
                            "refMetric": "easy find",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 10,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": " I høj grad",
                                "extraOption": false,
                                "extraOptionText": "?",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "b6d91ea0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "590d6940-44e7-11ef-aef4-21d091aeb756",
                            "questionRef": "clean_and_easy_to_find",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "GREATEREQUAL",
                            "value": ["3"],
                            "transition": "PAGE",
                            "transitionDestiny": "c23794c0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:23:09.396Z",
                            "updatedAt": "2024-07-18T09:23:09.396Z",
                            "integrationPageId": "b6d91ea0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "590d6940-44e7-11ef-aef4-21d091aeb757",
                            "questionRef": "clean_and_easy_to_find",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "LESSEQUAL",
                            "value": ["2"],
                            "transition": "PAGE",
                            "transitionDestiny": "bc876f50-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:23:09.396Z",
                            "updatedAt": "2024-07-18T09:23:09.396Z",
                            "integrationPageId": "b6d91ea0-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "bc876f50-44d5-11ef-a292-8f2d6fb37963",
                    "position": 11,
                    "generatedAt": "2024-07-18T07:17:05.349Z",
                    "updatedAt": "2024-07-18T07:17:05.349Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "ceba7de0-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "Hvorfor synes du ikke, at butikken er overskuelig? ",
                            "ref": "why_not_clean",
                            "refMetric": "overskuelig butik",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 11,
                            "followup": false,
                            "assets": {
                                "placeholder": "",
                                "maxCharacters": "",
                                "extraOption": "",
                                "extraOptionText": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "LONGTEXT",
                            "integrationPageId": "bc876f50-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "bc876f50-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "why_not_clean",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "c23794c0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "bc876f50-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "c23794c0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 12,
                    "generatedAt": "2024-07-18T07:17:14.892Z",
                    "updatedAt": "2024-07-18T07:17:14.892Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "d0501200-3975-11ef-bc8f-15d3d6c704f0",
                            "title": "Var der nogle af de varer, du ville købe, som var udsolgte? ",
                            "ref": "out_of_stock",
                            "refMetric": "sold out",
                            "require": true,
                            "external_id": "",
                            "value": [
                                "Nej",
                                "Ja, jeg købte en anden vare i stedet",
                                "Ja, men medarbejderen bestilte varen hjem til mig",
                                "Ja, og jeg købte ikke en alternativ vare i stedet"
                            ],
                            "defaultValue": "",
                            "position": 12,
                            "followup": false,
                            "assets": {
                                "extraOption": false,
                                "extraOptionText": "I don't know",
                                "extraOptionPlaceholder": "Custom option",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RADIO",
                            "integrationPageId": "c23794c0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "c23794c0-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "out_of_stock",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "c798d6e0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "c23794c0-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "c798d6e0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 13,
                    "generatedAt": "2024-07-18T07:17:23.917Z",
                    "updatedAt": "2024-07-18T07:17:23.917Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "29901f90-3976-11ef-bc8f-15d3d6c704f0",
                            "title": " I hvor høj grad synes du, at butikken har det rigtige udvalg?",
                            "ref": "right_selection_store",
                            "refMetric": "butik udvalg",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 13,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": "I høj grad",
                                "extraOption": "",
                                "extraOptionText": "",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "c798d6e0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "6db88c80-44e7-11ef-aef4-21d091aeb756",
                            "questionRef": "right_selection_store",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "EQUAL",
                            "value": ["3"],
                            "transition": "PAGE",
                            "transitionDestiny": "d18b8800-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:23:44.072Z",
                            "updatedAt": "2024-07-18T09:23:44.072Z",
                            "integrationPageId": "c798d6e0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "6f4f3210-44e7-11ef-aef4-21d091aeb756",
                            "questionRef": "right_selection_store",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "EQUAL",
                            "value": ["4"],
                            "transition": "PAGE",
                            "transitionDestiny": "d18b8800-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:23:46.737Z",
                            "updatedAt": "2024-07-18T09:23:46.737Z",
                            "integrationPageId": "c798d6e0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "710baf20-44e7-11ef-aef4-21d091aeb756",
                            "questionRef": "right_selection_store",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "EQUAL",
                            "value": ["5"],
                            "transition": "PAGE",
                            "transitionDestiny": "d18b8800-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:23:49.649Z",
                            "updatedAt": "2024-07-18T09:23:49.649Z",
                            "integrationPageId": "c798d6e0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "710baf20-44e7-11ef-aef4-21d091aeb757",
                            "questionRef": "right_selection_store",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "LESSEQUAL",
                            "value": ["2"],
                            "transition": "PAGE",
                            "transitionDestiny": "ccea1370-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:23:49.649Z",
                            "updatedAt": "2024-07-18T09:23:49.649Z",
                            "integrationPageId": "c798d6e0-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "ccea1370-44d5-11ef-a292-8f2d6fb37963",
                    "position": 14,
                    "generatedAt": "2024-07-18T07:17:32.839Z",
                    "updatedAt": "2024-07-18T07:17:32.839Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "2b33e480-3976-11ef-bc8f-15d3d6c704f0",
                            "title": "Hvad savnede du i udvalget?",
                            "ref": "miss_the_committee",
                            "refMetric": "missing selection",
                            "require": true,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 14,
                            "followup": false,
                            "assets": {
                                "placeholder": "",
                                "maxCharacters": "",
                                "extraOption": "",
                                "extraOptionText": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "LONGTEXT",
                            "integrationPageId": "ccea1370-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "ccea1370-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "miss_the_committee",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "d18b8800-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "ccea1370-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "d18b8800-44d5-11ef-a292-8f2d6fb37963",
                    "position": 15,
                    "generatedAt": "2024-07-18T07:17:40.608Z",
                    "updatedAt": "2024-07-18T07:17:40.608Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "bc611d60-3976-11ef-bc8f-15d3d6c704f0",
                            "title": "I hvor høj grad synes du, at det er nemt at se, hvad varerne koster?",
                            "ref": "easy_see_good_cost",
                            "refMetric": "price visibility",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 15,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": " I høj grad",
                                "extraOption": false,
                                "extraOptionText": "",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "d18b8800-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "d18b8800-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "easy_see_good_cost",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "d74f8390-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "d18b8800-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "d74f8390-44d5-11ef-a292-8f2d6fb37963",
                    "position": 16,
                    "generatedAt": "2024-07-18T07:17:50.281Z",
                    "updatedAt": "2024-07-18T07:17:50.281Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "bdf2b9e0-3976-11ef-bc8f-15d3d6c704f0",
                            "title": "I hvor høj grad synes du, at butikken har konkurrencedygtige priser?",
                            "ref": "competitive_prices",
                            "refMetric": "competitive prices",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 16,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Slet ikke",
                                "maxPlaceholder": " I høj grad",
                                "extraOption": false,
                                "extraOptionText": "?",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "d74f8390-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                },
                {
                    "id": "dc740ad0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 17,
                    "generatedAt": "2024-07-18T07:17:58.909Z",
                    "updatedAt": "2024-07-18T07:17:58.909Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "fb98e440-3976-11ef-bc8f-15d3d6c704f0",
                            "title": "Hvorfor synes du ikke, at butikken har attraktive og konkurrencedygtige priser?",
                            "ref": "attractive_and_competitive_price",
                            "refMetric": "price attractive",
                            "require": false,
                            "external_id": "",
                            "value": [
                                "Jeg kan ofte få varerne billigere online",
                                "Jeg kan ofte få varerne billigere i supermarkedet etc.",
                                "Butikkens opbygning gør, at den virker dyr",
                                "Butikkens opbygning gør, at man ikke kan finde evt. tilbud"
                            ],
                            "defaultValue": "",
                            "position": 17,
                            "followup": false,
                            "assets": {
                                "extraOption": true,
                                "extraOptionText": "Angiv anden",
                                "maxOptions": 0,
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "MULTIPLECHOICE",
                            "integrationPageId": "dc740ad0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "dc740ad0-44d5-11ef-a292-8f2d6fb37963-default",
                            "questionRef": "attractive_and_competitive_price",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "DEFAULT",
                            "value": [""],
                            "transition": "PAGE",
                            "transitionDestiny": "e1841fb0-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-11-28T16:14:59.350Z",
                            "updatedAt": "2024-11-28T16:14:59.350Z",
                            "integrationPageId": "dc740ad0-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "e1841fb0-44d5-11ef-a292-8f2d6fb37963",
                    "position": 18,
                    "generatedAt": "2024-07-18T07:18:07.403Z",
                    "updatedAt": "2024-07-18T07:18:07.403Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "5b8d8ef0-3977-11ef-bc8f-15d3d6c704f0",
                            "title": "Hvor tilfreds var du med dit besøg i Matas?",
                            "ref": "satisfied_visit",
                            "refMetric": "visit Matas",
                            "require": false,
                            "external_id": "",
                            "value": [],
                            "defaultValue": "",
                            "position": 18,
                            "followup": false,
                            "assets": {
                                "min": "1",
                                "max": "5",
                                "minPlaceholder": "Meget uilfreds",
                                "maxPlaceholder": "Meget tilfreds",
                                "extraOption": "",
                                "extraOptionText": "",
                                "placeholder": "",
                                "general": ""
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "RATING_NUMBER",
                            "integrationPageId": "e1841fb0-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ],
                    "integrationPageRoutes": [
                        {
                            "id": "89404740-44e7-11ef-aef4-21d091aeb756",
                            "questionRef": "satisfied_visit",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "GREATER",
                            "value": ["2"],
                            "transition": "FINISH",
                            "transitionDestiny": null,
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:24:30.260Z",
                            "updatedAt": "2024-07-18T09:24:30.260Z",
                            "integrationPageId": "e1841fb0-44d5-11ef-a292-8f2d6fb37963"
                        },
                        {
                            "id": "89404740-44e7-11ef-aef4-21d091aeb757",
                            "questionRef": "satisfied_visit",
                            "typeCondition": "LOGICAL",
                            "typeOperator": "LESSEQUAL",
                            "value": ["2"],
                            "transition": "PAGE",
                            "transitionDestiny": "e701c370-44d5-11ef-a292-8f2d6fb37963",
                            "status": "ACTIVE",
                            "generatedAt": "2024-07-18T09:24:30.260Z",
                            "updatedAt": "2024-07-18T09:24:30.260Z",
                            "integrationPageId": "e1841fb0-44d5-11ef-a292-8f2d6fb37963"
                        }
                    ]
                },
                {
                    "id": "e701c370-44d5-11ef-a292-8f2d6fb37963",
                    "position": 19,
                    "generatedAt": "2024-07-18T07:18:16.615Z",
                    "updatedAt": "2024-07-18T07:18:16.615Z",
                    "status": "ACTIVE",
                    "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                    "integrationQuestions": [
                        {
                            "id": "5d4773f0-3977-11ef-bc8f-15d3d6c704f0",
                            "title": "Hvad skulle vi have gjort bedre for at gøre dig mere tilfreds med besøget?",
                            "ref": "done_better",
                            "refMetric": "improve visit",
                            "require": true,
                            "external_id": "",
                            "value": [
                                "Butikken skulle være pænere og mere ryddet op",
                                "Varerne skulle ikke være udsolgt",
                                "Det skulle være nemmere at finde den vare jeg skulle bruge",
                                "Det skulle være nemmere at finde en der kunne betjene mig",
                                "Køen var for lang",
                                "Personalet skulle være mere søde og opmærksomme",
                                "Personalet skulle vide mere om varerne",
                                "Det skulle være lettere at se hvad varerne koster",
                                "Personalet skulle have sagt \"ha' en god dag\" eller \"tak for besøget\" da jeg gik"
                            ],
                            "defaultValue": "",
                            "position": 19,
                            "followup": false,
                            "assets": {
                                "general": "",
                                "placeholder": "",
                                "extraOption": false,
                                "extraOptionText": "I don't know",
                                "maxOptions": 0
                            },
                            "generatedAt": null,
                            "updatedAt": null,
                            "status": "ACTIVE",
                            "integrationId": "d6f8e4c0-3974-11ef-bc8f-15d3d6c704f0",
                            "type": "MULTIPLECHOICE",
                            "integrationPageId": "e701c370-44d5-11ef-a292-8f2d6fb37963",
                            "questionType": {
                                "conf": null
                            }
                        }
                    ]
                }
            ]

           // console.log(validatePage(pages))

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(17);
        });

        test('Test simple line with conditional routes', () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    // If is not 2 finsih
                    new PageRoute('1', '1', OperatorType.EQUAL, ['2'], TransitionType.FINISH, '', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], []),
                new Page('3', 3, 'integration', [questions[2]], []),
                new Page('4', 4, 'integration', [questions[3]], []),
                new Page('5', 5, 'integration', [questions[4]], []),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(5);
        })
    });
});
