import {beforeEach, describe, expect, test} from "@jest/globals";
import {PageGraph} from "../src/models/pageGraphs";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {Page} from "../src/models/page";
import {ConditionType, OperatorType, PageRoute, TransitionType} from "../src/models/pageRoute";


describe('pageGraphs', () => {
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

            expect(graph.findMaxDepth()).toBe(1);
        });

        test('Empty graph => 0', () => {
            graph = new PageGraph([]);
            expect(graph.findMaxDepth()).toBe(0);
        });

        test('Single page => 1', () => {
            const pages = [new Page('1', 1, 'int', [defaultQuestions(1, false)], [])];
            setGraphWithRoutes(pages);
            expect(graph.findMaxDepth()).toBe(1);
        });
    });

    describe('findMaxDeepWithConditions', () => {

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
                    new PageRoute('1', '3', OperatorType.DEFAULT, [''], TransitionType.PAGE, '5', '3', ConditionType.DIRECT),
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
                    // Finish
                    new PageRoute('1', '3', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '3', ConditionType.DIRECT),
                ]),
                new Page('4', 4, 'integration', [questions[3]], [
                    // Finish
                    new PageRoute('1', '4', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '4', ConditionType.DIRECT),
                ]),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(2);
        });

        test('Test a simple tree with end route and conditions', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false)
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('1', '1', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, '2', '1', ConditionType.LOGICAL),
                    new PageRoute('2', '1', OperatorType.EQUAL, ['No'], TransitionType.FINISH, '', '1'),
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

        test('PRECONDITIONAL edges are excluded from DFS depth calculation', () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], []),
                new Page('2', 2, 'integration', [questions[1]], [
                    // Preconditional should NOT add branches to DFS
                    new PageRoute('p1', '1', OperatorType.EQUAL, ['X'], TransitionType.ALLOW, '', '2', ConditionType.PRECONDITIONAL),
                ]),
                new Page('3', 3, 'integration', [questions[2]], []),
            ];

            setGraphWithRoutes(pages);
            // Linear: 1 → 2 → 3, preconditional doesn't add branches
            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Mixed LOGICAL and PRECONDITIONAL edges', () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('r1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, '3', '1', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], []),
                new Page('3', 3, 'integration', [questions[2]], [
                    // Preconditional should be ignored in DFS
                    new PageRoute('rp', 'ext-q', OperatorType.EQUAL, ['Y'], TransitionType.ALLOW, '', '3', ConditionType.PRECONDITIONAL),
                ]),
                new Page('4', 4, 'integration', [questions[3]], []),
            ];

            setGraphWithRoutes(pages);
            // Paths: 1→A→3→4 (3) or 1→2→3→4 (4). Max = 4
            expect(graph.findMaxDepth()).toBe(4);
        });

        test('Dawn CPO AI summit feedback form depth => 11', () => {
            const integrationId = 'a6931b70-b646-11f0-b9c6-0becd5ece65f';
            const qName: NativeQuestion = {
                id: '3e1f71d0-be73-11f0-a130-4b60f8068e07',
                title: 'Your name (optional)',
                ref: 'q--6jyci',
                refMetric: '',
                require: false,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 1,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: '3dc59200-be73-11f0-a130-4b60f8068e07',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qRecommend: NativeQuestion = {
                id: 'cbd64ab0-b646-11f0-b9c6-0becd5ece65f',
                title: 'How likely are you to recommend one of our summits to a friend or colleague?',
                ref: 'howlikelyareyoutorecommendoneofoursummitstoafriendorcolleague',
                refMetric: 'recommend friend',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 2,
                followup: false,
                assets: {min: 1, max: 10},
                integrationId,
                integrationPageId: 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f',
                type: FEEDBACKAPPANSWERTYPE.RATING_NUMBER,
                questionType: {conf: null}
            };
            const qLowFollowup: NativeQuestion = {
                id: 'cc6a5a00-be6d-11f0-b7ae-abe773b9b486',
                title: 'What should we change for you to give a higher rating?',
                ref: 'q--qm3l1s',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 3,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: 'cbf35540-be6d-11f0-b7ae-abe773b9b486',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qMidFollowup: NativeQuestion = {
                id: 'db50e570-be6d-11f0-b7ae-abe773b9b486',
                title: 'Is there anything we could have done differently to increase your satisfaction?',
                ref: 'q--b8v8tm',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 4,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: 'db412e00-be6d-11f0-b7ae-abe773b9b486',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qHighFollowup: NativeQuestion = {
                id: 'e30b32c0-be6d-11f0-b7ae-abe773b9b486',
                title: 'We\u2019re glad to hear you were satisfied with our summit. Please tell us what we did well so we can do it again next time.',
                ref: 'q--5u7347',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 5,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: 'e2fbf080-be6d-11f0-b7ae-abe773b9b486',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qUsefulContent: NativeQuestion = {
                id: 'fc70f7e0-be6d-11f0-b877-294bea1dbc24',
                title: 'Overall, how useful was the content for your day-to-day work?',
                ref: 'q--r2o0o',
                refMetric: 'useful content work',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 6,
                followup: false,
                assets: {min: 1, max: 5},
                integrationId,
                integrationPageId: 'fc4d6a50-be6d-11f0-b877-294bea1dbc24',
                type: FEEDBACKAPPANSWERTYPE.RATING_NUMBER,
                questionType: {conf: null}
            };
            const qLowUsefulFollowup: NativeQuestion = {
                id: '291f1bf0-be6e-11f0-b877-294bea1dbc24',
                title: 'What should we change for you to give a higher rating?',
                ref: 'q--t4hs89',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 7,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: '290eef50-be6e-11f0-b877-294bea1dbc24',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qMatrix: NativeQuestion = {
                id: 'd09da6a0-be71-11f0-9909-39e20e5f12bb',
                title: 'Please rate our sessions, based on how interesting / useful you found them.',
                ref: 'q--42jmzb',
                refMetric: 'rate sessions useful',
                require: true,
                external_id: '',
                value: ['Poor','Fair','Good','Excellent'],
                defaultValue: '',
                position: 8,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: 'd06e5940-be71-11f0-9909-39e20e5f12bb',
                type: FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX,
                questionType: {conf: null}
            };
            const qImproveEvent: NativeQuestion = {
                id: '3c476fc0-be6e-11f0-b877-294bea1dbc24',
                title: 'How can we improve the event for next time?',
                ref: 'q--dt4cn',
                refMetric: 'improve event',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 9,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: '3c38c9c0-be6e-11f0-b877-294bea1dbc24',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qTopics: NativeQuestion = {
                id: 'ab336ec0-be6d-11f0-8413-437807e9972b',
                title: 'Which other topics would you like us to cover in future events?',
                ref: 'q--ugzvj9',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 10,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: 'ab1167d0-be6d-11f0-8413-437807e9972b',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qFormats: NativeQuestion = {
                id: 'c6dd7e90-be6d-11f0-8413-437807e9972b',
                title: 'Which of the following formats would you like to see more of at future events?',
                ref: 'q--a7b16g',
                refMetric: 'event formats',
                require: true,
                external_id: '',
                value: [
                    'Panel discussions',
                    'Interactive workshops/Demos',
                    'Dedicated networking sessions',
                    "Case studies/Deep dives from CPO's",
                    'Fireside chats'
                ],
                defaultValue: '',
                position: 11,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: 'c6c78590-be6e-11f0-8413-437807e9972b',
                type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE,
                questionType: {conf: null}
            };

            const pages: Page[] = [
                new Page('3dc59200-be73-11f0-a130-4b60f8068e07', 1, integrationId, [qName], []),
                new Page('cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', 2, integrationId, [qRecommend], [
                    new PageRoute('r-low', qRecommend.ref, OperatorType.INQ, ['1','2','3','4','5','6'], TransitionType.PAGE, 'cbf35540-be6d-11f0-b7ae-abe773b9b486', 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', ConditionType.LOGICAL),
                    new PageRoute('r-mid', qRecommend.ref, OperatorType.INQ, ['7','8'], TransitionType.PAGE, 'db412e00-be6d-11f0-b7ae-abe773b9b486', 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', ConditionType.LOGICAL),
                    new PageRoute('r-high', qRecommend.ref, OperatorType.INQ, ['9','10'], TransitionType.PAGE, 'e2fbf080-be6d-11f0-b7ae-abe773b9b486', 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', ConditionType.LOGICAL),
                ]),
                new Page('cbf35540-be6d-11f0-b7ae-abe773b9b486', 3, integrationId, [qLowFollowup], [
                    new PageRoute('r-to-main-1', qLowFollowup.ref, OperatorType.EQUAL, [], TransitionType.PAGE, 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', 'cbf35540-be6d-11f0-b7ae-abe773b9b486', ConditionType.DIRECT),
                ]),
                new Page('db412e00-be6d-11f0-b7ae-abe773b9b486', 4, integrationId, [qMidFollowup], [
                    new PageRoute('r-to-main-2', qMidFollowup.ref, OperatorType.EQUAL, [], TransitionType.PAGE, 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', 'db412e00-be6d-11f0-b7ae-abe773b9b486', ConditionType.DIRECT),
                ]),
                new Page('e2fbf080-be6d-11f0-b7ae-abe773b9b486', 5, integrationId, [qHighFollowup], []),
                new Page('fc4d6a50-be6d-11f0-b877-294bea1dbc24', 6, integrationId, [qUsefulContent], [
                    new PageRoute('r-useful-high', qUsefulContent.ref, OperatorType.INQ, ['4','5'], TransitionType.PAGE, 'd06e5940-be71-11f0-9909-39e20e5f12bb', 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', ConditionType.LOGICAL),
                    new PageRoute('r-useful-low', qUsefulContent.ref, OperatorType.INQ, ['1','2','3'], TransitionType.PAGE, '290eef50-be6e-11f0-b877-294bea1dbc24', 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', ConditionType.LOGICAL),
                ]),
                new Page('290eef50-be6e-11f0-b877-294bea1dbc24', 7, integrationId, [qLowUsefulFollowup], []),
                new Page('d06e5940-be71-11f0-9909-39e20e5f12bb', 8, integrationId, [qMatrix], []),
                new Page('3c38c9c0-be6e-11f0-b877-294bea1dbc24', 9, integrationId, [qImproveEvent], []),
                new Page('ab1167d0-be6e-11f0-8413-437807e9972b', 10, integrationId, [qTopics], []),
                new Page('c6c78590-be6d-11f0-8413-437807e9972b', 11, integrationId, [qFormats], []),
            ];

            setGraphWithRoutes(pages);
            expect(graph.findMaxDepth()).toBe(9);
        });
    });

    // ═══════════════════════════════════════════════
    // NEW TEST SUITES
    // ═══════════════════════════════════════════════

    describe('getFirstPage', () => {
        test('returns the page with the smallest position', () => {
            const pages = [
                new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                new Page('a', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
            ];
            setGraphWithRoutes(pages);
            const first = graph.getFirstPage();
            expect(first).toBeDefined();
            expect(first!.id).toBe('a');
            expect(first!.position).toBe(1);
        });

        test('returns undefined for empty graph', () => {
            graph = new PageGraph([]);
            expect(graph.getFirstPage()).toBeUndefined();
        });
    });

    describe('getNodeById', () => {
        test('returns the correct node', () => {
            const pages = [
                new Page('alpha', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('beta', 2, 'int', [defaultQuestions(2, false)], []),
            ];
            setGraphWithRoutes(pages);
            expect(graph.getNodeById('alpha')).toBeDefined();
            expect(graph.getNodeById('alpha')!.position).toBe(1);
            expect(graph.getNodeById('beta')!.position).toBe(2);
        });

        test('returns undefined for non-existent id', () => {
            const pages = [new Page('a', 1, 'int', [defaultQuestions(1, false)], [])];
            setGraphWithRoutes(pages);
            expect(graph.getNodeById('zzz')).toBeUndefined();
        });
    });

    describe('getNextEdgeByDefault', () => {
        test('returns next page by position when no edges', () => {
            const pages = [
                new Page('a', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
            ];
            setGraphWithRoutes(pages);
            const nodeA = graph.getNodeById('a')!;
            expect(graph.getNextEdgeByDefault(nodeA)).toBe('b');
        });

        test('returns DIRECT transitionDestiny when present', () => {
            const pages = [
                new Page('a', 1, 'int', [defaultQuestions(1, false)], [
                    new PageRoute('r1', '1', OperatorType.DEFAULT, [], TransitionType.PAGE, 'c', 'a', ConditionType.DIRECT),
                ]),
                new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
            ];
            setGraphWithRoutes(pages);
            const nodeA = graph.getNodeById('a')!;
            expect(graph.getNextEdgeByDefault(nodeA)).toBe('c');
        });

        test('returns undefined when DIRECT is FINISH', () => {
            const pages = [
                new Page('a', 1, 'int', [defaultQuestions(1, false)], [
                    new PageRoute('r1', '1', OperatorType.DEFAULT, [], TransitionType.FINISH, '', 'a', ConditionType.DIRECT),
                ]),
                new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
            ];
            setGraphWithRoutes(pages);
            const nodeA = graph.getNodeById('a')!;
            expect(graph.getNextEdgeByDefault(nodeA)).toBeUndefined();
        });

        test('returns undefined when last page', () => {
            const pages = [
                new Page('a', 1, 'int', [defaultQuestions(1, false)], []),
            ];
            setGraphWithRoutes(pages);
            const nodeA = graph.getNodeById('a')!;
            expect(graph.getNextEdgeByDefault(nodeA)).toBeUndefined();
        });
    });

    describe('getNextPage', () => {

        describe('fallback to next position', () => {
            test('goes to next position when no edges match', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], []),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                const next = graph.getNextPage(nodeA, []);
                expect(next).toBeDefined();
                expect(next!.id).toBe('b');
            });

            test('returns undefined when no edges and no next position', () => {
                const q = defaultQuestions(1, false);
                const pages = [new Page('a', 1, 'int', [q], [])];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                expect(graph.getNextPage(nodeA, [])).toBeUndefined();
            });

            test('returns undefined for undefined node', () => {
                graph = new PageGraph([]);
                expect(graph.getNextPage(undefined as any, [])).toBeUndefined();
            });
        });

        describe('DIRECT routes', () => {
            test('DIRECT route takes priority', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.DEFAULT, [], TransitionType.PAGE, 'c', 'a', ConditionType.DIRECT),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                const next = graph.getNextPage(nodeA, [{key: '1', value: ['anything']}]);
                expect(next).toBeDefined();
                expect(next!.id).toBe('c');
            });

            test('DIRECT FINISH returns undefined', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.DEFAULT, [], TransitionType.FINISH, '', 'a', ConditionType.DIRECT),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                expect(graph.getNextPage(nodeA, [{key: '1', value: ['x']}])).toBeUndefined();
            });
        });

        describe('EQUAL operator', () => {
            test('matches when answer equals route value', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                const next = graph.getNextPage(nodeA, [{key: '1', value: ['Yes']}]);
                expect(next!.id).toBe('c');
            });

            test('does not match when answer differs', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                const next = graph.getNextPage(nodeA, [{key: '1', value: ['No']}]);
                // Fallback to next position
                expect(next!.id).toBe('b');
            });

            test('matches any value in array', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['A', 'B', 'C'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                expect(graph.getNextPage(nodeA, [{key: '1', value: ['B']}])!.id).toBe('target');
            });
        });

        describe('NOEQUAL operator', () => {
            test('matches when answer does NOT equal route value', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.NOEQUAL, ['Bad'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                expect(graph.getNextPage(nodeA, [{key: '1', value: ['Good']}])!.id).toBe('c');
            });

            test('does not match when answer equals route value', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.NOEQUAL, ['Bad'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                setGraphWithRoutes(pages);
                const nodeA = graph.getNodeById('a')!;
                // Answer IS "Bad", so NOEQUAL fails → fallback
                expect(graph.getNextPage(nodeA, [{key: '1', value: ['Bad']}])!.id).toBe('b');
            });
        });

        describe('GREATER / LESS / GREATEREQUAL / LESSEQUAL operators', () => {
            const buildNumericGraph = (operator: OperatorType) => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', operator, ['5'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('fallback', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                return new PageGraph(pages);
            };

            test('GREATER: 7 > 5 → matches', () => {
                const g = buildNumericGraph(OperatorType.GREATER);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['7']}])!.id).toBe('target');
            });

            test('GREATER: 5 > 5 → does not match', () => {
                const g = buildNumericGraph(OperatorType.GREATER);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['5']}])!.id).toBe('fallback');
            });

            test('GREATER: 3 > 5 → does not match', () => {
                const g = buildNumericGraph(OperatorType.GREATER);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['3']}])!.id).toBe('fallback');
            });

            test('LESS: 3 < 5 → matches', () => {
                const g = buildNumericGraph(OperatorType.LESS);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['3']}])!.id).toBe('target');
            });

            test('LESS: 5 < 5 → does not match', () => {
                const g = buildNumericGraph(OperatorType.LESS);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['5']}])!.id).toBe('fallback');
            });

            test('GREATEREQUAL: 5 >= 5 → matches', () => {
                const g = buildNumericGraph(OperatorType.GREATEREQUAL);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['5']}])!.id).toBe('target');
            });

            test('GREATEREQUAL: 4 >= 5 → does not match', () => {
                const g = buildNumericGraph(OperatorType.GREATEREQUAL);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['4']}])!.id).toBe('fallback');
            });

            test('LESSEQUAL: 5 <= 5 → matches', () => {
                const g = buildNumericGraph(OperatorType.LESSEQUAL);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['5']}])!.id).toBe('target');
            });

            test('LESSEQUAL: 6 <= 5 → does not match', () => {
                const g = buildNumericGraph(OperatorType.LESSEQUAL);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['6']}])!.id).toBe('fallback');
            });
        });

        describe('INQ / NINQ operators', () => {
            test('INQ matches when answer is in the set', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.INQ, ['1', '2', '3'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('fb', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['2']}])!.id).toBe('target');
            });

            test('INQ does not match when answer is not in the set', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.INQ, ['1', '2', '3'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('fb', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['9']}])!.id).toBe('fb');
            });

            test('NINQ matches when answer is NOT in the set', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.NINQ, ['1', '2', '3'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('fb', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['9']}])!.id).toBe('target');
            });

            test('NINQ does not match when answer IS in the set', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.NINQ, ['1', '2', '3'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('fb', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['2']}])!.id).toBe('fb');
            });
        });

        describe('PRECONDITIONAL edges in getNextPage', () => {
            test('PRECONDITIONAL edges are NOT matched by getNextPage (they have no answer)', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('rp', 'ext-ref', OperatorType.EQUAL, ['X'], TransitionType.ALLOW, '', 'a', ConditionType.PRECONDITIONAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                // PRECONDITIONAL won't match because answerValue for 'ext-ref' is empty
                // Falls back to next position
                const next = g.getNextPage(node, [{key: '1', value: ['anything']}]);
                expect(next!.id).toBe('b');
            });
        });

        describe('multiple LOGICAL routes (branching)', () => {
            test('first matching route wins', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, 'b', 'a', ConditionType.LOGICAL),
                        new PageRoute('r2', '1', OperatorType.EQUAL, ['B'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                        new PageRoute('r3', '1', OperatorType.EQUAL, ['C'], TransitionType.PAGE, 'd', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                    new Page('d', 4, 'int', [defaultQuestions(4, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;

                expect(g.getNextPage(node, [{key: '1', value: ['A']}])!.id).toBe('b');
                expect(g.getNextPage(node, [{key: '1', value: ['B']}])!.id).toBe('c');
                expect(g.getNextPage(node, [{key: '1', value: ['C']}])!.id).toBe('d');
            });

            test('no match → fallback to next position', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['Z']}])!.id).toBe('b');
            });
        });

        describe('FINISH transition', () => {
            test('LOGICAL route with FINISH returns undefined', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['quit'], TransitionType.FINISH, '', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: '1', value: ['quit']}])).toBeUndefined();
            });
        });

        describe('empty / missing answers', () => {
            test('empty answer array → fallback to next position', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [])!.id).toBe('b');
            });

            test('answer with wrong key → fallback to next position', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, 'c', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                expect(g.getNextPage(node, [{key: 'wrong-key', value: ['Yes']}])!.id).toBe('b');
            });
        });

        describe('multiplechoice answers (array values)', () => {
            test('EQUAL matches when any answer value is in route values', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.EQUAL, ['Option B'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('fb', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                // User selected multiple options, one matches
                expect(g.getNextPage(node, [{key: '1', value: ['Option A', 'Option B', 'Option C']}])!.id).toBe('target');
            });

            test('NOEQUAL fails when any answer value IS in route values', () => {
                const q = defaultQuestions(1, false);
                const pages = [
                    new Page('a', 1, 'int', [q], [
                        new PageRoute('r1', '1', OperatorType.NOEQUAL, ['Option B'], TransitionType.PAGE, 'target', 'a', ConditionType.LOGICAL),
                    ]),
                    new Page('fb', 2, 'int', [defaultQuestions(2, false)], []),
                    new Page('target', 3, 'int', [defaultQuestions(3, false)], []),
                ];
                const g = new PageGraph(pages);
                const node = g.getNodeById('a')!;
                // Option B is in the answer → NOEQUAL should not match
                expect(g.getNextPage(node, [{key: '1', value: ['Option A', 'Option B']}])!.id).toBe('fb');
            });
        });
    });

    describe('findDepth', () => {
        test('returns 0 for non-existent node', () => {
            graph = new PageGraph([]);
            expect(graph.findDepth('non-existent')).toBe(0);
        });

        test('returns correct depth for first node (starts at 0)', () => {
            const pages = [
                new Page('a', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
            ];
            setGraphWithRoutes(pages);
            // findDepth starts at 0, so a→b→c gives max_depth=2
            expect(graph.findDepth('a')).toBe(2);
        });

        test('returns 0 depth for last node (no successors)', () => {
            const pages = [
                new Page('a', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
            ];
            setGraphWithRoutes(pages);
            // c has no successors → depth stays at 0
            expect(graph.findDepth('c')).toBe(0);
        });

        test('returns correct depth for middle node', () => {
            const pages = [
                new Page('a', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('b', 2, 'int', [defaultQuestions(2, false)], []),
                new Page('c', 3, 'int', [defaultQuestions(3, false)], []),
            ];
            setGraphWithRoutes(pages);
            // b→c gives max_depth=1
            expect(graph.findDepth('b')).toBe(1);
        });
    });

    describe('Matas-like survey: pages with preconditionals in depth calculation', () => {
        test('Survey with many preconditional pages calculates depth correctly', () => {
            // Simulate a simplified Matas survey:
            // Page 1 (pos 1): purchase location (no preconditions)
            // Page 2 (pos 2): category (no preconditions)
            // Page 3 (pos 3): Matas.dk purpose (precondition: location=Matas.dk)
            // Page 4 (pos 4): App purpose (precondition: location=App)
            // Page 5 (pos 5): Store purpose (precondition: location=Store)
            // Page 6 (pos 6): Final question (no preconditions)

            const pages = [
                new Page('p1', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('p2', 2, 'int', [defaultQuestions(2, false)], []),
                new Page('p3', 3, 'int', [defaultQuestions(3, false)], [
                    new PageRoute('rp3', '1', OperatorType.EQUAL, ['Matas.dk'], TransitionType.ALLOW, '', 'p3', ConditionType.PRECONDITIONAL),
                ]),
                new Page('p4', 4, 'int', [defaultQuestions(4, false)], [
                    new PageRoute('rp4', '1', OperatorType.EQUAL, ['App'], TransitionType.ALLOW, '', 'p4', ConditionType.PRECONDITIONAL),
                ]),
                new Page('p5', 5, 'int', [defaultQuestions(5, false)], [
                    new PageRoute('rp5', '1', OperatorType.EQUAL, ['Store'], TransitionType.ALLOW, '', 'p5', ConditionType.PRECONDITIONAL),
                ]),
                new Page('p6', 6, 'int', [defaultQuestions(6, false)], []),
            ];
            setGraphWithRoutes(pages);
            // Linear path 1→2→3→4→5→6 = 6 (preconditionals are excluded from DFS branching)
            expect(graph.findMaxDepth()).toBe(6);
        });

        test('Survey with 2 preconditional routes per page', () => {
            const pages = [
                new Page('p1', 1, 'int', [defaultQuestions(1, false)], []),
                new Page('p2', 2, 'int', [defaultQuestions(2, false)], []),
                new Page('p3', 3, 'int', [defaultQuestions(3, false)], [
                    new PageRoute('rp3a', '1', OperatorType.EQUAL, ['Matas.dk'], TransitionType.ALLOW, '', 'p3', ConditionType.PRECONDITIONAL),
                    new PageRoute('rp3b', '2', OperatorType.EQUAL, ['Hudpleje'], TransitionType.ALLOW, '', 'p3', ConditionType.PRECONDITIONAL),
                ]),
                new Page('p4', 4, 'int', [defaultQuestions(4, false)], []),
            ];
            setGraphWithRoutes(pages);
            // Linear: 1→2→3→4 = 4 (both preconditionals on p3 are ignored in DFS)
            expect(graph.findMaxDepth()).toBe(4);
        });
    });
});
